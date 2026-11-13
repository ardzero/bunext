// Edge-safe constants shared by proxy.ts and server helpers (no db imports).
export const SIGN_IN_PATH = "/sign-in";

// set by proxy.ts so server code knows the current path for `returnTo`
export const PATHNAME_HEADER = "x-bunext-pathname";

export const signInPath = (returnTo?: string | null) =>
	returnTo
		? `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(returnTo)}`
		: SIGN_IN_PATH;
