import "server-only";
import { z } from "zod";

// `next build` evaluates server modules while collecting page data, without
// needing runtime secrets. Runtime requirements are enforced everywhere else.
export const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isProduction = process.env.NODE_ENV === "production";

// treat `KEY=` lines from .env files as unset
const definedEnv = Object.fromEntries(
	Object.entries(process.env).filter(([, value]) => value !== ""),
);

const requiredAtRuntime = (message: string) =>
	isBuildPhase
		? z.string().default("")
		: z.string({ error: message }).min(1, message);

const secretSchema =
	isProduction && !isBuildPhase
		? z
				.string({ error: "BETTER_AUTH_SECRET is required in production." })
				.min(32, "BETTER_AUTH_SECRET must be at least 32 characters.")
		: z.string().optional();

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	BETTER_AUTH_SECRET: secretSchema,
	BETTER_AUTH_URL: z.url().optional(),
	// set by Vercel; used when BETTER_AUTH_URL is not set
	VERCEL_ENV: z.string().optional(),
	VERCEL_URL: z.string().optional(),
	VERCEL_BRANCH_URL: z.string().optional(),
	VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
	DATABASE_URL: requiredAtRuntime(
		"DATABASE_URL is required. Add it to .env.local (see .env.example).",
	),
	DATABASE_URL_UNPOOLED: z.string().optional(),
	ADMIN_EMAIL: z.email().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	DISCORD_CLIENT_ID: z.string().optional(),
	DISCORD_CLIENT_SECRET: z.string().optional(),
	RESEND_API_KEY: z.string().optional(),
	MAIL_FROM: z.string().optional(),
	// lets production start without a mailer (password reset and magic links off)
	ALLOW_NO_MAILER: z.stringbool().default(false),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
	const result = envSchema.safeParse(definedEnv);
	if (result.success) return result.data;

	const issues = result.error.issues
		.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
	throw new Error(`Invalid environment variables:\n${issues}`);
};

export const env = parseEnv();

const toOrigin = (host: string | undefined) =>
	host ? `https://${host}` : undefined;

// Vercel: production uses the project's production domain, previews the
// branch URL (stable per branch), then the per-deployment URL
const vercelBaseURL =
	env.VERCEL_ENV === "production"
		? toOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)
		: toOrigin(env.VERCEL_BRANCH_URL ?? env.VERCEL_URL);

// Canonical origin for links in emails and OAuth callbacks. Never derived from
// the request, so a forged Host header can't redirect those links.
export const baseURL = env.BETTER_AUTH_URL ?? vercelBaseURL;

// a Vercel deployment is also reachable on its branch and deployment URLs
export const trustedOrigins = [
	baseURL,
	toOrigin(env.VERCEL_BRANCH_URL),
	toOrigin(env.VERCEL_URL),
].filter(
	(origin, index, all): origin is string =>
		Boolean(origin) && all.indexOf(origin) === index,
);

const isRuntimeProduction = isProduction && !isBuildPhase;

if (isRuntimeProduction && !baseURL) {
	throw new Error(
		"Invalid environment variables:\n  - BETTER_AUTH_URL: required in production (e.g. https://example.com). On Vercel it falls back to VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL; enable “Automatically expose System Environment Variables”.",
	);
}

if (
	isRuntimeProduction &&
	!(env.RESEND_API_KEY && env.MAIL_FROM) &&
	!env.ALLOW_NO_MAILER
) {
	throw new Error(
		"Invalid environment variables:\n  - RESEND_API_KEY, MAIL_FROM: a mailer is required in production. Set both, or set ALLOW_NO_MAILER=true to run without email (password reset and magic links are turned off, sign-up skips email verification).",
	);
}
