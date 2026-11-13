import type { GenericEndpointContext } from "better-auth";
import { APIError, getAuthoritativeSessionFromCtx } from "better-auth/api";

// Password accounts must verify their password even when the session is fresh.
// Better Auth verifies the supplied password before it performs the deletion.
export const requireDeletionPassword = async (ctx: GenericEndpointContext) => {
	if (ctx.path !== "/delete-user") return;
	const session = await getAuthoritativeSessionFromCtx(ctx);
	if (!session) throw new APIError("UNAUTHORIZED");

	const account = await ctx.context.internalAdapter.findCredentialAccount(
		session.user.id,
	);
	if (
		!account?.password ||
		(typeof ctx.body?.password === "string" && ctx.body.password.length > 0)
	)
		return;

	throw new APIError("BAD_REQUEST", {
		code: "PASSWORD_REQUIRED",
		message: "Enter your current password to delete your account.",
	});
};
