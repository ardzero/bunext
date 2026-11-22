export const DEFAULT_REDIRECT = "/dashboard";

// placeholder origin used only to resolve the path; never leaves this file
const PARSE_ORIGIN = "http://safe-redirect.invalid";

// control characters (incl. tab/newline, which URL parsers silently strip)
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;

const decodeFully = (value: string) => {
	let decoded = value;
	// unwrap repeated encodings such as %252F%252F; give up on malformed input
	for (let round = 0; round < 5; round++) {
		const next = decodeURIComponent(decoded);
		if (next === decoded) return decoded;
		decoded = next;
	}
	return null;
};

const isSafeRelativePath = (value: string) => {
	if (!value.startsWith("/")) return false;
	if (CONTROL_CHARACTERS.test(value)) return false;

	let decoded: string | null;
	try {
		decoded = decodeFully(value);
	} catch {
		return false;
	}
	if (decoded === null) return false;
	if (CONTROL_CHARACTERS.test(decoded)) return false;
	// protocol-relative (//evil) and backslash variants (/\evil) in any encoding
	if (decoded.includes("\\")) return false;
	if (decoded.startsWith("//")) return false;

	// the path must not change origin once resolved by a real URL parser
	const resolved = new URL(value, PARSE_ORIGIN);
	return resolved.origin === PARSE_ORIGIN;
};

// Returns `value` only when it is a relative, same-origin path; otherwise `fallback`.
export const safeRedirect = (
	value: string | string[] | null | undefined,
	fallback: string = DEFAULT_REDIRECT,
): string => {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (!candidate) return fallback;

	const trimmed = candidate.trim();
	if (!isSafeRelativePath(trimmed)) return fallback;

	return trimmed;
};
