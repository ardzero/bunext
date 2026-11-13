import type { GenericEndpointContext } from "better-auth";
import { getSessionFromCtx } from "better-auth/api";
import { revokeUnprovenAccountAccess } from "better-auth/db";
import {
	deleteProviderAvatar,
	fetchProviderImage,
	findProviderAvatar,
	saveProviderAvatar,
} from "./provider-avatars";

type NewAccount = { providerId: string; userId: string };

// Runs before any account row is created. Implicit OAuth linking (callback,
// id-token sign-in, plugins) attaches a provider to an existing user by email.
// When that user never verified the address, whoever signed up first has no
// proof of owning it, so their password, other links and sessions are removed
// before the verified provider owner takes the account over.
//
// Deliberately not limited to one route: every path that creates a provider
// account without a session for that user is an OAuth sign-in.
export const stripUnprovenAccessBeforeLink = async (
	account: NewAccount,
	ctx: GenericEndpointContext | null,
) => {
	if (!ctx || account.providerId === "credential") return;

	const { internalAdapter } = ctx.context;
	const existingUser = await internalAdapter.findUserById(account.userId);
	if (!existingUser || existingUser.emailVerified) return;

	// a brand-new social sign-up creates the user and account together
	const existingAccounts = await internalAdapter.findAccounts(account.userId);
	if (existingAccounts.length === 0) return;

	// A signed-in user connecting a provider from settings keeps everything.
	// This relies on the session cookie reaching the callback, which holds for
	// redirect-based providers such as Google and Discord.
	const session = await getSessionFromCtx(ctx);
	if (session?.user.id === account.userId) return;

	await revokeUnprovenAccountAccess(ctx, account.userId);
};

type CreatedAccount = NewAccount & {
	accessToken?: string | null;
	idToken?: string | null;
};

// Runs after a provider account is created (new sign-up or auto-link). Keeps
// the provider's picture so the user can switch to it later, and fills
// `user.image` when the user has no picture yet. A failure here must never
// break sign-in, so everything is swallowed.
export const captureProviderAvatarAfterLink = async (
	account: CreatedAccount | null,
	ctx: GenericEndpointContext | null,
) => {
	if (!account || !ctx || account.providerId === "credential") return;

	try {
		const provider = ctx.context.socialProviders.find(
			(item) => item.id === account.providerId,
		);
		if (!provider || !account.accessToken) return;

		const imageUrl = await fetchProviderImage(provider, {
			accessToken: account.accessToken,
			idToken: account.idToken ?? undefined,
		});
		if (!imageUrl) return;

		await saveProviderAvatar({
			userId: account.userId,
			providerId: account.providerId,
			imageUrl,
		});

		const existingUser = await ctx.context.internalAdapter.findUserById(
			account.userId,
		);
		if (existingUser && !existingUser.image) {
			await ctx.context.internalAdapter.updateUser(account.userId, {
				image: imageUrl,
			});
		}
	} catch (error) {
		ctx.context.logger.error("Could not store the provider avatar", error);
	}
};

// Runs after a provider account row is updated, which is what a sign-in with an
// already-linked provider does. Accounts connected before pictures were stored
// have no saved one, so the first sign-in fills it in. Later pictures are
// refreshed on demand, not on every sign-in.
export const captureMissingProviderAvatarAfterUpdate = async (
	account: CreatedAccount | null,
	ctx: GenericEndpointContext | null,
) => {
	if (!account?.userId || account.providerId === "credential") return;

	try {
		const saved = await findProviderAvatar(account.userId, account.providerId);
		if (saved) return;
	} catch (error) {
		ctx?.context.logger.error("Could not read the provider avatar", error);
		return;
	}

	await captureProviderAvatarAfterLink(account, ctx);
};

// Disconnecting a provider forgets its picture, so it can't be selected later
// and a different account linked to the same provider starts fresh.
export const forgetProviderAvatarAfterUnlink = async (
	account: NewAccount | null,
	ctx: GenericEndpointContext | null,
) => {
	if (!account || account.providerId === "credential") return;

	try {
		await deleteProviderAvatar(account.userId, account.providerId);
	} catch (error) {
		ctx?.context.logger.error("Could not remove the provider avatar", error);
	}
};
