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
	VERCEL_URL: z.string().optional(),
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

// canonical origin; Vercel previews fall back to the deployment URL
export const baseURL =
	env.BETTER_AUTH_URL ??
	(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined);
