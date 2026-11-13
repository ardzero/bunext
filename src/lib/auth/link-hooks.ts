import type { GenericEndpointContext } from "better-auth";
import { getSessionFromCtx } from "better-auth/api";
import { revokeUnprovenAccountAccess } from "better-auth/db";

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
