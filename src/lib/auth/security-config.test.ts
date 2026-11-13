import { afterAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";

// Integration test against DATABASE_URL (run `bun run setup` first).
const hasDatabase = Boolean(process.env.DATABASE_URL);

const loadAuth = async () => (await import("./auth")).auth;

describe.skipIf(!hasDatabase)("auth security config", () => {
	test("implicit linking requires a verified local email", async () => {
		const linking = (await loadAuth()).options.account?.accountLinking;
		// left unset, so Better Auth's default (true) applies
		expect(Object.keys(linking ?? {})).not.toContain(
			"requireLocalEmailVerified",
		);
		expect(linking?.trustedProviders).toEqual([]);
	});

	test("admins can list and ban users but not impersonate or change roles", async () => {
		const { userHasPermission } = (await loadAuth()).api;
		const canAdmin = async (permissions: Record<string, string[]>) =>
			(await userHasPermission({ body: { role: "admin", permissions } }))
				.success;

		expect(await canAdmin({ user: ["list", "get", "ban"] })).toBe(true);
		expect(await canAdmin({ session: ["list", "revoke"] })).toBe(true);
		for (const action of [
			"impersonate",
			"set-role",
			"delete",
			"set-password",
			"set-email",
			"create",
		]) {
			expect(await canAdmin({ user: [action] })).toBe(false);
		}
	});
});

describe.skipIf(!hasDatabase)("consumeEmailRateLimit", () => {
	const key = `email:rate-test-${crypto.randomUUID()}@example.com`;
	const rule = { window: 60, max: 2 };

	afterAll(async () => {
		const [{ db }, { emailRateLimit }] = await Promise.all([
			import("@/lib/db"),
			import("@/lib/db/schema"),
		]);
		await db.delete(emailRateLimit).where(inArray(emailRateLimit.key, [key]));
	});

	test("allows `max` requests per window, then refuses until it ends", async () => {
		const { consumeEmailRateLimit } = await import("./email-rate-limit");
		const start = Date.now();

		expect(await consumeEmailRateLimit(key, rule, start)).toBe(true);
		expect(await consumeEmailRateLimit(key, rule, start + 1000)).toBe(true);
		expect(await consumeEmailRateLimit(key, rule, start + 2000)).toBe(false);
		// a new window starts once the first one is over
		expect(await consumeEmailRateLimit(key, rule, start + 61_000)).toBe(true);
	});
});

describe("renderActionEmail", () => {
	test("escapes every value", async () => {
		const { renderActionEmail } = await import("./mailer");
		const html = renderActionEmail({
			heading: "<script>x</script>",
			body: "a & b",
			actionLabel: "Go",
			actionUrl: 'https://example.com/?a=1&b="2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("a &amp; b");
		expect(html).toContain(
			'href="https://example.com/?a=1&amp;b=&quot;2&quot;"',
		);
	});
});

describe.skipIf(!hasDatabase)("promoteAdmin", () => {
	const email = `admin-test-${crypto.randomUUID()}@example.com`;

	const loadDeps = async () => {
		const [{ db }, { user }, { promoteAdmin }] = await Promise.all([
			import("@/lib/db"),
			import("@/lib/db/schema"),
			import("../../../scripts/lib/promote-admin"),
		]);
		return { db, user, promoteAdmin };
	};

	afterAll(async () => {
		const { db, user } = await loadDeps();
		await db.delete(user).where(inArray(user.email, [email]));
	});

	test("refuses an unverified account when a mailer is configured", async () => {
		const { db, promoteAdmin } = await loadDeps();
		const context = await (await loadAuth()).$context;
		await context.internalAdapter.createUser(
			{ email, name: "Admin Test", emailVerified: false },
			{ method: "email-password" },
		);

		const refused = await promoteAdmin(db, { email, requireVerified: true });
		expect(refused.promoted).toBe(false);

		const promoted = await promoteAdmin(db, { email, requireVerified: false });
		expect(promoted.promoted).toBe(true);
		expect(promoted.message).toContain("not verified");
	});
});
