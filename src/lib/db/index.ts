import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// The only file that imports the database driver.
// `prepare: false` sends plain queries, so the same config works behind
// transaction poolers (Neon pooler, Supabase, PgBouncer) and direct connections.
const createClient = () => postgres(env.DATABASE_URL, { prepare: false });

// reuse one client across hot reloads in development
const globalForDb = globalThis as unknown as {
	postgresClient?: ReturnType<typeof createClient>;
};

const client = globalForDb.postgresClient ?? createClient();
if (env.NODE_ENV !== "production") globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });
export type Database = typeof db;
