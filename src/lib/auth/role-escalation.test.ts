import { afterAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";

// Integration test against DATABASE_URL (run `bun run setup` first).
const hasDatabase = Boolean(process.env.DATABASE_URL);
const escalationEmail = `role-test-${crypto.randomUUID()}@example.com`;
const plainEmail = `role-test-${crypto.randomUUID()}@example.com`;
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const loadDeps = async () => {
	const [{ auth }, { db }, { user }] = await Promise.all([
		import("./auth"),
		import("@/lib/db"),
		import("@/lib/db/schema"),
	]);
	return { auth, db, user };
};

const signUpRequest = (body: Record<string, unknown>) =>
	new Request(`${origin}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { "content-type": "application/json", origin },
		body: JSON.stringify({
			name: "Role Test",
			password: "correct-horse-battery-staple",
			...body,
		}),
	});

const findRoles = async (email: string) => {
	const { db, user } = await loadDeps();
	return db
		.select({ role: user.role })
		.from(user)
		.where(inArray(user.email, [email]));
};

describe.skipIf(!hasDatabase)("role escalation", () => {
	afterAll(async () => {
		const { db, user } = await loadDeps();
		await db
			.delete(user)
			.where(inArray(user.email, [escalationEmail, plainEmail]));
	});

	test("a sign-up request carrying role: admin never creates an admin", async () => {
		const { auth } = await loadDeps();
		const response = await auth.handler(
			signUpRequest({ email: escalationEmail, role: "admin" }),
		);

		// the admin plugin marks `role` as `input: false` and rejects the request
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ code: "FIELD_NOT_ALLOWED" });
		expect(await findRoles(escalationEmail)).toEqual([]);
	});

	test("a plain sign-up gets the default user role", async () => {
		const { auth } = await loadDeps();
		const response = await auth.handler(signUpRequest({ email: plainEmail }));

		expect(response.ok).toBe(true);
		expect(await findRoles(plainEmail)).toEqual([{ role: "user" }]);
	});
});
