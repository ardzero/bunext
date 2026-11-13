// Domain tables go here. Auth tables live in ./auth.ts and are generated
// by `bun run auth:generate`; never edit those by hand.
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

// The latest profile picture each connected provider reported. Better Auth only
// keeps one `user.image`, so this is what lets a user switch between providers.
export const providerAvatar = pgTable(
	"provider_avatar",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		providerId: text("provider_id").notNull(),
		imageUrl: text("image_url").notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		unique("provider_avatar_user_provider").on(table.userId, table.providerId),
	],
);
