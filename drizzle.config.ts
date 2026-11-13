import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// load .env.local the same way Next.js does
loadEnvConfig(process.cwd());

const databaseUrl =
	process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL is not set. Add it to .env.local (see .env.example).",
	);
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/lib/db/schema/index.ts",
	out: "./drizzle",
	dbCredentials: { url: databaseUrl },
	strict: true,
	verbose: true,
});
