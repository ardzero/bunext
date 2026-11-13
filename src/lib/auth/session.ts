import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { hasRole, type Role } from "./roles";

// set by src/proxy.ts on every page request so server code knows the current path
export const PATHNAME_HEADER = "x-bunext-pathname";

// One session read per request. Cookie cache is off, so this always hits the database.
export const getSession = cache(async () =>
	auth.api.getSession({ headers: await headers() }),
);

const getCurrentPath = async () => (await headers()).get(PATHNAME_HEADER);

export const signInPath = (returnTo?: string | null) =>
	returnTo
		? `/sign-in?returnTo=${encodeURIComponent(returnTo)}`
		: "/sign-in";

// Use in every protected server component, action and route handler.
// `returnTo` defaults to the current page.
export const requireSession = async (returnTo?: string) => {
	const session = await getSession();
	if (session) return session;

	redirect(signInPath(returnTo ?? (await getCurrentPath())));
};

// Redirects to /dashboard when the signed-in user has none of the given roles.
export const requireRole = async (...roles: [Role, ...Role[]]) => {
	const session = await requireSession();
	if (hasRole(session.user.role, roles)) return session;

	redirect("/dashboard");
};
