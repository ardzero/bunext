// Domain tables go here. Auth tables live in ./auth.ts and are generated
// by `bun run auth:generate`; never edit those by hand.
//
// import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
// import { user } from "./auth";
//
// export const note = pgTable("note", {
// 	id: text("id").primaryKey(),
// 	userId: text("user_id")
// 		.notNull()
// 		.references(() => user.id, { onDelete: "cascade" }),
// 	body: text("body").notNull(),
// 	createdAt: timestamp("created_at").defaultNow().notNull(),
// });

export {};
