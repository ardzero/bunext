// One-time project setup. Safe to run again at any time.
// Usage: bun run setup
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import {
	ask,
	done,
	fail,
	generateSecret,
	isPostgresUrl,
	migrateDatabase,
	note,
	step,
	withDatabase,
} from "./lib/cli";
import { hasMailerConfig, promoteAdmin } from "./lib/promote-admin";
import { setupVercel } from "./lib/vercel";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env.local");
const ENV_EXAMPLE_FILE = join(ROOT, ".env.example");
const LOCAL_URL = "http://localhost:3000";
const OAUTH_PROVIDERS = ["google", "discord"];

// reads KEY=value lines; ignores comments and blank lines
const parseEnv = (content: string) =>
	Object.fromEntries(
		content
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("#") && line.includes("="))
			.map((line) => {
				const separatorIndex = line.indexOf("=");
				const value = line.slice(separatorIndex + 1).trim();
				return [
					line.slice(0, separatorIndex).trim(),
					value.replace(/^(['"])(.*)\1$/, "$2").replaceAll("\\$", "$"),
				];
			}),
	) as Record<string, string>;

// .env files expand `$NAME`, so a literal `$` (e.g. in a password) is escaped;
// values with spaces, `#`, quotes or backslashes are quoted so they aren't cut
const formatEnvValue = (value: string) => {
	const escaped = value.replaceAll("$", "\\$");
	return /[\s#'"\\]/.test(escaped) ? `"${escaped}"` : escaped;
};

// sets a value in place, or appends it when the key is missing
const setEnvValue = (content: string, key: string, value: string) => {
	const line = `${key}=${formatEnvValue(value)}`;
	const pattern = new RegExp(`^${key}=.*$`, "m");
	// a replacer function, so `$` in the value (e.g. a password) stays literal
	return pattern.test(content)
		? content.replace(pattern, () => line)
		: `${content.trimEnd()}\n${line}\n`;
};

const saveEnvValue = (key: string, value: string) =>
	writeFileSync(
		ENV_FILE,
		setEnvValue(readFileSync(ENV_FILE, "utf8"), key, value),
	);

const ensureEnvFile = () => {
	step("Environment file");
	if (existsSync(ENV_FILE)) return done(".env.local exists");
	if (!existsSync(ENV_EXAMPLE_FILE)) fail(".env.example is missing.");

	copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
	done("created .env.local from .env.example");
};

const ensureSecret = () => {
	step("Auth secret");
	const content = readFileSync(ENV_FILE, "utf8");
	if (parseEnv(content).BETTER_AUTH_SECRET)
		return done("BETTER_AUTH_SECRET is set");

	writeFileSync(
		ENV_FILE,
		setEnvValue(content, "BETTER_AUTH_SECRET", generateSecret()),
	);
	done("generated BETTER_AUTH_SECRET");
};

const ensureDatabaseUrl = () => {
	step("Database URL");
	if (parseEnv(readFileSync(ENV_FILE, "utf8")).DATABASE_URL)
		return done("DATABASE_URL is set");

	const databaseUrl = ask(
		"Postgres connection string (create a free database on https://neon.tech):",
	);
	if (!databaseUrl) {
		fail(
			"DATABASE_URL is empty. Create a Postgres database (for example on https://neon.tech), add its connection string to .env.local, then run `bun run setup` again.",
		);
	}
	if (!isPostgresUrl(databaseUrl)) {
		fail("That is not a Postgres URL; it should start with postgres://.");
	}
	saveEnvValue("DATABASE_URL", databaseUrl);
	done("saved DATABASE_URL to .env.local");
};

const ensureAdminEmail = () => {
	step("First admin");
	if (parseEnv(readFileSync(ENV_FILE, "utf8")).ADMIN_EMAIL)
		return done("ADMIN_EMAIL is set");

	const adminEmail = ask("Your email, to make it the admin (Enter to skip):");
	if (!adminEmail) return note("skipped; set ADMIN_EMAIL later");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
		return note("not a valid email; skipped. Set ADMIN_EMAIL in .env.local");
	}
	saveEnvValue("ADMIN_EMAIL", adminEmail);
	done("saved ADMIN_EMAIL to .env.local");
};

// promotes ADMIN_EMAIL when that user has already signed up
const setupAdmin = async (
	sql: postgres.Sql,
	env: Record<string, string>,
): Promise<boolean> => {
	if (!env.ADMIN_EMAIL) return false;

	const { promoted, message } = await promoteAdmin(drizzle(sql), {
		email: env.ADMIN_EMAIL,
		requireVerified: hasMailerConfig(env),
	});
	if (promoted) done(message);
	else note(message);
	return promoted;
};

// connects (direct URL when available), applies the migrations in ./drizzle,
// then promotes the admin; returns whether the admin is set up
const setupDatabase = async (env: Record<string, string>) => {
	step("Database");
	const databaseUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
	if (!databaseUrl) fail("DATABASE_URL is empty.");

	try {
		return await withDatabase(databaseUrl, async (sql) => {
			const [{ version }] = await sql<{ version: string }[]>`select version()`;
			done(`connected: ${version.split(" on ")[0]}`);
			await migrateDatabase(sql);
			done("migrations applied");
			return setupAdmin(sql, env);
		});
	} catch (error) {
		return fail(`Database setup failed: ${(error as Error).message}`);
	}
};

const printNextSteps = (env: Record<string, string>, adminReady: boolean) => {
	const origins = [LOCAL_URL, env.BETTER_AUTH_URL]
		.filter(Boolean)
		.filter((origin, index, all) => all.indexOf(origin) === index);

	step("OAuth redirect URIs (register these with each provider)");
	for (const provider of OAUTH_PROVIDERS) {
		for (const origin of origins) {
			console.info(
				`  ${provider.padEnd(8)} ${origin}/api/auth/callback/${provider}`,
			);
		}
	}

	const adminStep = adminReady
		? ""
		: "\n  bun run seed:admin   after signing up, promote ADMIN_EMAIL to admin";
	console.info(`
Setup complete.
  bun run dev          start the app on ${LOCAL_URL}${adminStep}
`);
};

const setup = async () => {
	ensureEnvFile();
	ensureSecret();
	ensureDatabaseUrl();
	ensureAdminEmail();
	const env = parseEnv(readFileSync(ENV_FILE, "utf8"));
	const adminReady = await setupDatabase(env);
	await setupVercel({ askFirst: true });
	printNextSteps(env, adminReady);
};

await setup();
