// Shared by `bun run seed:admin` and `bun run setup`. Takes the database as an
// argument because setup runs before the env is complete and can't import @/lib/db.
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { hasRole } from "@/lib/auth/roles";
import { user } from "@/lib/db/schema";

export type PromoteAdminResult = { promoted: boolean; message: string };

type PromoteAdminOptions = {
	email: string;
	// With a real mailer every owner can verify their address, so an unverified
	// account may belong to someone who signed up with ADMIN_EMAIL first.
	requireVerified: boolean;
};

// a real mailer is configured (the same check as the app's env validation)
export const hasMailerConfig = (source: Partial<Record<string, string>>) =>
	Boolean(source.RESEND_API_KEY && source.MAIL_FROM);

const dateFormatter = new Intl.DateTimeFormat("en", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const promoteAdmin = async <TSchema extends Record<string, unknown>>(
	db: PostgresJsDatabase<TSchema>,
	{ email, requireVerified }: PromoteAdminOptions,
): Promise<PromoteAdminResult> => {
	const adminEmail = email.trim().toLowerCase();
	const [existingUser] = await db
		.select({
			id: user.id,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
		})
		.from(user)
		.where(eq(user.email, adminEmail))
		.limit(1);

	if (!existingUser) {
		return {
			promoted: false,
			message: `No user with email ${adminEmail}. Sign up first, then run bun run seed:admin.`,
		};
	}

	// shown every time so you can tell whether the account is the one you made
	const account = `${adminEmail} (signed up ${dateFormatter.format(existingUser.createdAt)})`;

	if (hasRole(existingUser.role, "admin")) {
		return { promoted: true, message: `${account} is already an admin.` };
	}

	if (!existingUser.emailVerified && requireVerified) {
		return {
			promoted: false,
			message: `${account} has not verified its email, so it was not promoted: anyone can sign up with an address they don't own. Verify the address, then run bun run seed:admin again.`,
		};
	}

	await db
		.update(user)
		.set({ role: "admin" })
		.where(eq(user.id, existingUser.id));

	const unverifiedWarning = existingUser.emailVerified
		? ""
		: " Its email is not verified (no mailer is configured): make sure this account is yours.";
	return {
		promoted: true,
		message: `${account} is now an admin.${unverifiedWarning}`,
	};
};
