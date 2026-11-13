import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { PATHNAME_HEADER, signInPath } from "./paths";
import { hasRole, type Role } from "./roles";

// One session read per request. Cookie cache is off, so this always hits the database.
export const getSession = cache(async () =>
	auth.api.getSession({ headers: await headers() }),
);

const getCurrentPath = async () => (await headers()).get(PATHNAME_HEADER);

// Use in every protected server component, action and route handler.
// `returnTo` defaults to the current page.
export const requireSession = async (returnTo?: string) => {
	const session = await getSession();
	if (session) return session;

	redirect(signInPath(returnTo ?? (await getCurrentPath())));
};

// For guest-only pages (sign-in, sign-up, forgot-password).
export const redirectIfSignedIn = async (redirectTo: string) => {
	const session = await getSession();
	if (session) redirect(redirectTo);
};

// Redirects to /dashboard when the signed-in user has none of the given roles.
export const requireRole = async (...roles: [Role, ...Role[]]) => {
	const session = await requireSession();
	if (hasRole(session.user.role, roles)) return session;

	redirect("/dashboard");
};
