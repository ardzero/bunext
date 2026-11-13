import { afterAll, describe, expect, spyOn, test } from "bun:test";
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
			socialProviders: [{ id: "discord", getUserInfo }],
		},
	}) as never;

const newAccount = (userId: string, providerId = "discord") => ({
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
			{ providerId: "discord", imageUrl },
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

	test("a sign-in on an already-linked provider fills a missing picture once", async () => {
		const {
			captureMissingProviderAvatarAfterUpdate,
			saveProviderAvatar,
			listProviderAvatars,
		} = await loadDeps();
		const { context, user } = await createUser(null);
		const first = "https://img.test/first.png";

		await captureMissingProviderAvatarAfterUpdate(
			newAccount(user.id),
			hookContext(context, async () => ({ user: { image: first } })),
		);
		expect(await listProviderAvatars(user.id)).toEqual([
			{ providerId: "discord", imageUrl: first },
		]);

		// a saved picture is left for the manual refresh
		await saveProviderAvatar({
			userId: user.id,
			providerId: "discord",
			imageUrl: "https://img.test/chosen.png",
		});
		await captureMissingProviderAvatarAfterUpdate(
			newAccount(user.id),
			hookContext(context, async () => ({ user: { image: first } })),
		);
		expect(await listProviderAvatars(user.id)).toEqual([
			{ providerId: "discord", imageUrl: "https://img.test/chosen.png" },
		]);
	});

	test("disconnecting a provider forgets its picture", async () => {
		const {
			forgetProviderAvatarAfterUnlink,
			saveProviderAvatar,
			listProviderAvatars,
		} = await loadDeps();
		const { context, user } = await createUser(null);
		await saveProviderAvatar({
			userId: user.id,
			providerId: "discord",
			imageUrl: "https://img.test/discord.png",
		});

		await forgetProviderAvatarAfterUnlink(
			newAccount(user.id),
			hookContext(context, async () => null),
		);

		expect(await listProviderAvatars(user.id)).toEqual([]);
	});

	test("a failing avatar lookup on sign-in is swallowed", async () => {
		const { captureMissingProviderAvatarAfterUpdate } = await loadDeps();
		const { context, user } = await createUser(null);

		// a user id the provider_avatar query rejects (not a string)
		await expect(
			captureMissingProviderAvatarAfterUpdate(
				{ ...newAccount(user.id), userId: { bad: true } as never },
				hookContext(context, async () => null),
			),
		).resolves.toBeUndefined();
	});
});

describe("fetchProviderImage", () => {
	test("asks Google for the current picture instead of the stored ID token", async () => {
		const { fetchProviderImage } = await import("./provider-avatars");
		const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json({ picture: "https://img.test/latest.png" }),
		);
		const getUserInfo = async () => ({
			user: { image: "https://img.test/stale.png" },
		});

		const imageUrl = await fetchProviderImage(
			{ id: "google", getUserInfo },
			{ accessToken: "token", idToken: "stale" },
		);

		expect(imageUrl).toBe("https://img.test/latest.png");
		expect(fetchSpy.mock.calls[0]?.[0]).toContain("googleapis.com");
		fetchSpy.mockRestore();
	});

	test("uses the provider's own user info for everyone else", async () => {
		const { fetchProviderImage } = await import("./provider-avatars");

		const imageUrl = await fetchProviderImage(
			{
				id: "discord",
				getUserInfo: async () => ({
					user: { image: "https://img.test/discord.png" },
				}),
			},
			{ accessToken: "token" },
		);

		expect(imageUrl).toBe("https://img.test/discord.png");
	});
});
