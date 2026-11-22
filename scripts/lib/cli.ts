// Terminal helpers shared by the setup scripts.
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "node:path";
import postgres from "postgres";

export const step = (message: string) => console.info(`\n› ${message}`);
export const done = (message: string) => console.info(`  ✓ ${message}`);
export const note = (message: string) => console.info(`  • ${message}`);

export const fail = (message: string): never => {
	console.error(`\n✗ ${message}\n`);
	process.exit(1);
};

// asks in a terminal; in CI or piped runs every answer is empty
export const canPrompt = Boolean(process.stdin.isTTY);
export const ask = (question: string) =>
	canPrompt ? (prompt(`  ${question}`) ?? "").trim() : "";

export const isPostgresUrl = (value: string) =>
	/^postgres(ql)?:\/\//.test(value);

// a value for BETTER_AUTH_SECRET
export const generateSecret = () => randomBytes(32).toString("base64");

// connects with a single short-lived connection and closes it afterwards
export const withDatabase = async <T>(
	databaseUrl: string,
	run: (sql: postgres.Sql) => Promise<T>,
) => {
	const sql = postgres(databaseUrl, {
		prepare: false,
		max: 1,
		connect_timeout: 10,
		onnotice: () => {},
	});
	try {
		return await run(sql);
	} finally {
		await sql.end({ timeout: 5 });
	}
};

// applies the migrations in ./drizzle
export const migrateDatabase = (sql: postgres.Sql) =>
	migrate(drizzle(sql), {
		migrationsFolder: join(process.cwd(), "drizzle"),
	});
