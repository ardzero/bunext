import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createAuthMiddleware } from "better-auth/api";
import { requireDeletionPassword } from "./delete-account";

const origin = "http://localhost:3000";
const password = "correct-horse-battery-staple";

const createFixture = async (hasPassword = true, stale = false) => {
	const auth = betterAuth({
		baseURL: origin,
		secret: "account-deletion-regression-test-secret-12345",
		database: memoryAdapter({
			user: [],
			session: [],
			account: [],
			verification: [],
		}),
		emailAndPassword: { enabled: true },
		user: { deleteUser: { enabled: true } },
		hooks: { before: createAuthMiddleware(requireDeletionPassword) },
	});
	const context = await auth.$context;
	const user = await context.internalAdapter.createUser(
		{
			name: "Deletion Test",
			email: `${crypto.randomUUID()}@example.com`,
			emailVerified: true,
		},
		{ method: hasPassword ? "email-password" : "social" },
	);
	if (hasPassword) {
		await context.internalAdapter.createAccount({
			userId: user.id,
			accountId: user.id,
			providerId: "credential",
			password: await context.password.hash(password),
		});
	}
	const session = await context.internalAdapter.createSession(user.id);
	const otherSession = await context.internalAdapter.createSession(user.id);
	if (stale) {
		await context.internalAdapter.updateSession(session.token, {
			createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
		});
	}
	// Use the real signed session cookie instead of bypassing authentication.
	const signature = createHmac("sha256", context.secret)
		.update(session.token)
		.digest("base64");
	const cookie = `better-auth.session_token=${encodeURIComponent(`${session.token}.${signature}`)}`;
	const remove = (body: Record<string, unknown>, authenticated = true) =>
		auth.handler(
			new Request(`${origin}/api/auth/delete-user`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					origin,
					...(authenticated ? { cookie } : {}),
				},
				body: JSON.stringify(body),
			}),
		);
	return { context, user, session, otherSession, remove };
};

describe("account deletion", () => {
	test("rejects unauthenticated requests", async () => {
		const fixture = await createFixture();
		expect((await fixture.remove({}, false)).status).toBe(401);
	});

	test("requires a password on the server even with a fresh session", async () => {
		const { remove, context, user } = await createFixture();
		for (const body of [{}, { password: "" }]) {
			const response = await remove(body);
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({
				code: "PASSWORD_REQUIRED",
			});
		}
		expect(await context.internalAdapter.findUserById(user.id)).not.toBeNull();
	});

	test("rejects an incorrect password without deleting the account", async () => {
		const { remove, context, user } = await createFixture();
		const response = await remove({ password: "incorrect-password" });
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: "INVALID_PASSWORD" });
		expect(await context.internalAdapter.findUserById(user.id)).not.toBeNull();
	});

	test("deletes the user, accounts and all sessions and expires the cookie", async () => {
		const { remove, context, user, session, otherSession } =
			await createFixture();
		const response = await remove({ password });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			message: "User deleted",
		});
		expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
		expect(await context.internalAdapter.findUserById(user.id)).toBeNull();
		expect(await context.internalAdapter.findAccounts(user.id)).toEqual([]);
		expect(await context.internalAdapter.findSession(session.token)).toBeNull();
		expect(
			await context.internalAdapter.findSession(otherSession.token),
		).toBeNull();
	});

	test("permits passwordless deletion with a fresh session", async () => {
		const { remove, context, user } = await createFixture(false);
		expect((await remove({})).status).toBe(200);
		expect(await context.internalAdapter.findUserById(user.id)).toBeNull();
	});

	test("rejects passwordless deletion with a stale session", async () => {
		const { remove, context, user } = await createFixture(false, true);
		const response = await remove({});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: "SESSION_EXPIRED" });
		expect(await context.internalAdapter.findUserById(user.id)).not.toBeNull();
	});
});
