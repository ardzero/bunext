// Role definitions. Client-safe: no server imports here, so UI can use them too.
// `requireRole()` lives in ./session.ts next to `requireSession()`.
export const ROLES = ["user", "admin"] as const;

export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "user";
export const ADMIN_ROLES: Role[] = ["admin"];

export const isRole = (value: unknown): value is Role =>
	typeof value === "string" && (ROLES as readonly string[]).includes(value);

// the admin plugin stores multiple roles as a comma separated string
export const parseRoles = (value: string | null | undefined): Role[] =>
	(value ?? DEFAULT_ROLE)
		.split(",")
		.map((role) => role.trim())
		.filter(isRole);

export const hasRole = (
	value: string | null | undefined,
	allowed: Role | readonly Role[],
) => {
	const allowedRoles: readonly Role[] = Array.isArray(allowed)
		? allowed
		: [allowed as Role];
	return parseRoles(value).some((role) => allowedRoles.includes(role));
};
