import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailRateLimit } from "@/lib/db/schema";

export type EmailRateLimitRule = {
	// seconds
	window: number;
	max: number;
};

// Endpoints that send mail to the address in the request body. Better Auth's
// own limits count per IP, so rotating IPs could still flood one inbox.
// `/sign-in/email` resends verification to unverified accounts (`sendOnSignIn`).
export const MAIL_SENDING_PATHS = [
	"/sign-up/email",
	"/sign-in/email",
	"/sign-in/magic-link",
	"/request-password-reset",
	"/send-verification-email",
];

// shared by all the paths above: emails per address per window
export const EMAIL_RATE_LIMIT: EmailRateLimitRule = { window: 60 * 15, max: 5 };

export const emailRateLimitKey = (email: string) =>
	`email:${email.trim().toLowerCase()}`;

// Counts one request for `key` and returns whether it is within the limit.
// One atomic upsert, so concurrent requests cannot both slip under the cap.
export const consumeEmailRateLimit = async (
	key: string,
	{ window, max }: EmailRateLimitRule = EMAIL_RATE_LIMIT,
	now = Date.now(),
) => {
	const windowStart = now - window * 1000;
	const isExpired = sql`${emailRateLimit.windowStart} < ${windowStart}`;

	const [row] = await db
		.insert(emailRateLimit)
		.values({ key, count: 1, windowStart: now })
		.onConflictDoUpdate({
			target: emailRateLimit.key,
			set: {
				count: sql`case when ${isExpired} then 1 else ${emailRateLimit.count} + 1 end`,
				windowStart: sql`case when ${isExpired} then ${now} else ${emailRateLimit.windowStart} end`,
			},
		})
		.returning({ count: emailRateLimit.count });

	return row.count <= max;
};
