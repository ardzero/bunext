// Builders for auth page URLs. `returnTo` values come from safeRedirect() on
// the server; these only carry them between pages and callbacks.
import { DEFAULT_REDIRECT } from "@/lib/auth/safe-redirect";

export type SignInMethod = "password" | "magic-link";

const withQuery = (path: string, query: Record<string, string | undefined>) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value) params.set(key, value);
	}
	const search = params.toString();
	return search ? `${path}?${search}` : path;
};

// keep the default destination out of URLs to keep them short
const returnToParam = (returnTo?: string) =>
	returnTo && returnTo !== DEFAULT_REDIRECT ? returnTo : undefined;

export const signInHref = (returnTo?: string, method?: SignInMethod) =>
	withQuery("/sign-in", {
		returnTo: returnToParam(returnTo),
		method: method === "magic-link" ? method : undefined,
	});

export const signUpHref = (returnTo?: string) =>
	withQuery("/sign-up", { returnTo: returnToParam(returnTo) });

export const verifyEmailHref = (returnTo?: string) =>
	withQuery("/verify-email", { returnTo: returnToParam(returnTo) });

export const RESET_PASSWORD_PATH = "/reset-password";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
