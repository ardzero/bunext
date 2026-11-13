// One-time project setup. Safe to run again at any time.
// Usage: bun run setup
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env.local");
const ENV_EXAMPLE_FILE = join(ROOT, ".env.example");
const LOCAL_URL = "http://localhost:3000";
const OAUTH_PROVIDERS = ["google", "discord"];

const step = (message: string) => console.info(`\n› ${message}`);
const done = (message: string) => console.info(`  ✓ ${message}`);

const fail = (message: string): never => {
	console.error(`\n✗ ${message}\n`);
	process.exit(1);
};

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
					value.replace(/^(['"])(.*)\1$/, "$2"),
				];
			}),
	) as Record<string, string>;

// sets a value in place, or appends it when the key is missing
const setEnvValue = (content: string, key: string, value: string) => {
	const pattern = new RegExp(`^${key}=.*$`, "m");
	return pattern.test(content)
		? content.replace(pattern, `${key}=${value}`)
		: `${content.trimEnd()}\n${key}=${value}\n`;
};

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

	const secret = randomBytes(32).toString("base64");
	writeFileSync(ENV_FILE, setEnvValue(content, "BETTER_AUTH_SECRET", secret));
	done("generated BETTER_AUTH_SECRET");
};

// connects (direct URL when available), then applies the migrations in ./drizzle
const setupDatabase = async (env: Record<string, string>) => {
	step("Database");
	const databaseUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
	if (!databaseUrl) {
		fail(
			"DATABASE_URL is empty. Create a Postgres database (for example on https://neon.tech), add its connection string to .env.local, then run `bun run setup` again.",
		);
	}

	const sql = postgres(databaseUrl, {
		prepare: false,
		max: 1,
		connect_timeout: 10,
		onnotice: () => {},
	});
	try {
		const [{ version }] = await sql<{ version: string }[]>`select version()`;
		done(`connected: ${version.split(" on ")[0]}`);
		await migrate(drizzle(sql), { migrationsFolder: join(ROOT, "drizzle") });
		done("migrations applied");
	} catch (error) {
		fail(`Database setup failed: ${(error as Error).message}`);
	} finally {
		await sql.end({ timeout: 5 });
	}
};

const printNextSteps = (env: Record<string, string>) => {
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

	console.info(`
Setup complete.
  bun run dev          start the app on ${LOCAL_URL}
  bun run seed:admin   after signing up, promote ADMIN_EMAIL to admin
`);
};

const setup = async () => {
	ensureEnvFile();
	ensureSecret();
	const env = parseEnv(readFileSync(ENV_FILE, "utf8"));
	await setupDatabase(env);
	printNextSteps(env);
};

await setup();
