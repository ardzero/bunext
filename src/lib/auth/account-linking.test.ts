import { afterAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";

// Integration test against DATABASE_URL (run `bun run setup` first).
const hasDatabase = Boolean(process.env.DATABASE_URL);
const createdEmails: string[] = [];

const loadDeps = async () => {
	const [{ auth }, { db }, { user }, { stripUnprovenAccessBeforeLink }] =
		await Promise.all([
			import("./auth"),
			import("@/lib/db"),
			import("@/lib/db/schema"),
			import("./link-hooks"),
		]);
	return { auth, db, user, stripUnprovenAccessBeforeLink };
};

// a user with a password account and one session, like a password sign-up
const createPasswordUser = async (emailVerified: boolean) => {
	const { auth } = await loadDeps();
	const context = await auth.$context;
	const email = `link-test-${crypto.randomUUID()}@example.com`;
	createdEmails.push(email);

	const user = await context.internalAdapter.createUser(
		{ email, name: "Link Test", emailVerified },
		{ method: "email-password" },
	);
	await context.internalAdapter.linkAccount({
		userId: user.id,
		providerId: "credential",
		accountId: user.id,
		password: "not-a-real-hash",
	});
	await context.internalAdapter.createSession(user.id);
	return { context, user };
};

// the ctx Better Auth hands to a database hook; `session` stands in for the
// caller's cookie so getSessionFromCtx resolves without a request
const hookContext = (
	context: Awaited<ReturnType<typeof createPasswordUser>>["context"],
	session: { user: { id: string } } | null,
) => ({ context: { ...context, session } }) as never;

const snapshot = async (
	context: Awaited<ReturnType<typeof createPasswordUser>>["context"],
	userId: string,
) => ({
	user: await context.internalAdapter.findUserById(userId),
	accounts: await context.internalAdapter.findAccounts(userId),
	sessions: await context.internalAdapter.listSessions(userId),
});

describe("account linking policy", () => {
	test("links implicitly without trusting any provider blindly", async () => {
		const { auth } = await loadDeps();
		const linking = auth.options.account?.accountLinking;

		expect(linking?.enabled).toBe(true);
		expect(linking?.trustedProviders).toEqual([]);
		expect(linking?.requireLocalEmailVerified).toBe(false);
	});

	test("runs the unproven-access cleanup before every account create", async () => {
		const { auth, stripUnprovenAccessBeforeLink } = await loadDeps();

		expect(auth.options.databaseHooks?.account?.create?.before).toBe(
			stripUnprovenAccessBeforeLink,
		);
	});
});

describe.skipIf(!hasDatabase)("stripUnprovenAccessBeforeLink", () => {
	afterAll(async () => {
		const { db, user } = await loadDeps();
		await db.delete(user).where(inArray(user.email, createdEmails));
	});

	test("an unverified account loses its password and sessions, then becomes verified", async () => {
		const { stripUnprovenAccessBeforeLink } = await loadDeps();
		const { context, user } = await createPasswordUser(false);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "google", userId: user.id },
			hookContext(context, null),
		);

		const after = await snapshot(context, user.id);
		expect(after.user?.emailVerified).toBe(true);
		expect(after.accounts).toEqual([]);
		expect(after.sessions).toEqual([]);
	});

	test("a verified account is left alone", async () => {
		const { stripUnprovenAccessBeforeLink } = await loadDeps();
		const { context, user } = await createPasswordUser(true);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "google", userId: user.id },
			hookContext(context, null),
		);

		const after = await snapshot(context, user.id);
		expect(after.accounts).toHaveLength(1);
		expect(after.sessions).toHaveLength(1);
	});

	test("a signed-in user connecting a provider keeps everything", async () => {
		const { stripUnprovenAccessBeforeLink } = await loadDeps();
		const { context, user } = await createPasswordUser(false);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "discord", userId: user.id },
			hookContext(context, { user: { id: user.id } }),
		);

		const after = await snapshot(context, user.id);
		expect(after.user?.emailVerified).toBe(false);
		expect(after.accounts).toHaveLength(1);
		expect(after.sessions).toHaveLength(1);
	});

	test("a session for a different user does not protect the account", async () => {
		const { stripUnprovenAccessBeforeLink } = await loadDeps();
		const { context, user } = await createPasswordUser(false);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "google", userId: user.id },
			hookContext(context, { user: { id: "someone-else" } }),
		);

		expect((await snapshot(context, user.id)).accounts).toEqual([]);
	});

	test("a brand-new user without accounts is not marked verified", async () => {
		const { auth, stripUnprovenAccessBeforeLink } = await loadDeps();
		const context = await auth.$context;
		const email = `link-test-${crypto.randomUUID()}@example.com`;
		createdEmails.push(email);
		const user = await context.internalAdapter.createUser(
			{ email, name: "Link Test", emailVerified: false },
			{ method: "oauth" },
		);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "discord", userId: user.id },
			hookContext(context, null),
		);

		expect((await snapshot(context, user.id)).user?.emailVerified).toBe(false);
	});

	test("credential accounts and calls without a request context are ignored", async () => {
		const { stripUnprovenAccessBeforeLink } = await loadDeps();
		const { context, user } = await createPasswordUser(false);

		await stripUnprovenAccessBeforeLink(
			{ providerId: "credential", userId: user.id },
			hookContext(context, null),
		);
		await stripUnprovenAccessBeforeLink(
			{ providerId: "google", userId: user.id },
			null,
		);

		const after = await snapshot(context, user.id);
		expect(after.accounts).toHaveLength(1);
		expect(after.sessions).toHaveLength(1);
	});
});
