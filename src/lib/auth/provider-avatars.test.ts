import { afterAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";

// Integration test against DATABASE_URL (run `bun run setup` first).
const hasDatabase = Boolean(process.env.DATABASE_URL);
const createdEmails: string[] = [];

const loadDeps = async () => {
	const [{ auth }, { db }, schema, avatars, hooks] = await Promise.all([
		import("./auth"),
		import("@/lib/db"),
		import("@/lib/db/schema"),
		import("./provider-avatars"),
		import("./link-hooks"),
	]);
	return { auth, db, schema, ...avatars, ...hooks };
};

const createUser = async (image: string | null) => {
	const { auth } = await loadDeps();
	const context = await auth.$context;
	const email = `avatar-test-${crypto.randomUUID()}@example.com`;
	createdEmails.push(email);
	const user = await context.internalAdapter.createUser(
		{ email, name: "Avatar Test", emailVerified: true, image },
		{ method: "oauth" },
	);
	return { context, user };
};

// the ctx Better Auth hands to a database hook, with a provider stub
const hookContext = (
	context: Awaited<ReturnType<typeof createUser>>["context"],
	getUserInfo: () => Promise<unknown>,
) =>
	({
		context: {
			...context,
			socialProviders: [{ id: "google", getUserInfo }],
		},
	}) as never;

const newAccount = (userId: string, providerId = "google") => ({
	userId,
	providerId,
	accessToken: "token",
});

describe.skipIf(!hasDatabase)("provider avatars", () => {
	afterAll(async () => {
		const { db, schema } = await loadDeps();
		await db
			.delete(schema.user)
			.where(inArray(schema.user.email, createdEmails));
	});

	test("saving twice keeps one row per provider with the latest picture", async () => {
		const { saveProviderAvatar, listProviderAvatars } = await loadDeps();
		const { user } = await createUser(null);

		await saveProviderAvatar({
			userId: user.id,
			providerId: "google",
			imageUrl: "https://img.test/old.png",
		});
		await saveProviderAvatar({
			userId: user.id,
			providerId: "google",
			imageUrl: "https://img.test/new.png",
		});

		expect(await listProviderAvatars(user.id)).toEqual([
			{ providerId: "google", imageUrl: "https://img.test/new.png" },
		]);
	});

	test("linking a provider saves its picture and fills an empty profile picture", async () => {
		const { captureProviderAvatarAfterLink, listProviderAvatars } =
			await loadDeps();
		const { context, user } = await createUser(null);
		const imageUrl = "https://img.test/google.png";

		await captureProviderAvatarAfterLink(
			newAccount(user.id),
			hookContext(context, async () => ({ user: { image: imageUrl } })),
		);

		expect(await listProviderAvatars(user.id)).toEqual([
			{ providerId: "google", imageUrl },
		]);
		expect((await context.internalAdapter.findUserById(user.id))?.image).toBe(
			imageUrl,
		);
	});

	test("linking a second provider keeps the current picture but saves the new one", async () => {
		const { captureProviderAvatarAfterLink, listProviderAvatars } =
			await loadDeps();
		const current = "https://img.test/current.png";
		const { context, user } = await createUser(current);

		await captureProviderAvatarAfterLink(
			newAccount(user.id),
			hookContext(context, async () => ({
				user: { image: "https://img.test/google.png" },
			})),
		);

		expect((await context.internalAdapter.findUserById(user.id))?.image).toBe(
			current,
		);
		expect(await listProviderAvatars(user.id)).toHaveLength(1);
	});

	test("a failing provider or a credential account never throws or saves anything", async () => {
		const { captureProviderAvatarAfterLink, listProviderAvatars } =
			await loadDeps();
		const { context, user } = await createUser(null);

		await captureProviderAvatarAfterLink(
			newAccount(user.id),
			hookContext(context, async () => {
				throw new Error("provider down");
			}),
		);
		await captureProviderAvatarAfterLink(
			newAccount(user.id, "credential"),
			hookContext(context, async () => ({
				user: { image: "https://img.test/x.png" },
			})),
		);

		expect(await listProviderAvatars(user.id)).toEqual([]);
	});
});
