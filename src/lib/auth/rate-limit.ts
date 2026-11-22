import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailRateLimit } from "@/lib/db/schema";

export type RateLimitRule = {
	// seconds
	window: number;
	max: number;
};

// Endpoints that send mail to the address in the request body. Better Auth's
// own limits count per IP, so rotating IPs could still flood one inbox.
// `/sign-in/email` is not here: it only sends mail when it resends verification
// (`sendOnSignIn`), which is counted in the sender, so password attempts never
// use up the mail quota.
export const MAIL_SENDING_PATHS = [
	"/sign-up/email",
	"/sign-in/magic-link",
	"/request-password-reset",
	"/send-verification-email",
];

// shared by all mail sent to one address: emails per address per window
export const EMAIL_RATE_LIMIT: RateLimitRule = { window: 60 * 15, max: 5 };

// Password attempts have their own buckets, so guessing a password can't block
// recovery mail and recovery mail can't block sign-in.
// Per address and client IP: a few tries for one client.
export const SIGN_IN_CLIENT_RATE_LIMIT: RateLimitRule = {
	window: 60 * 15,
	max: 5,
};
// Per address across all IPs: caps guessing spread over many IPs. Loose, since
// anyone who hits it locks the owner out of password sign-in until it ends
// (magic links and password reset keep working).
export const SIGN_IN_ADDRESS_RATE_LIMIT: RateLimitRule = {
	window: 60 * 15,
	max: 20,
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailRateLimitKey = (email: string) =>
	`email:${normalizeEmail(email)}`;

export const signInRateLimitKeys = (email: string, ip: string) => ({
	client: `sign-in-client:${ip}:${normalizeEmail(email)}`,
	address: `sign-in-address:${normalizeEmail(email)}`,
});

// Counts one request for `key` and returns whether it is within the limit.
// One atomic upsert, so concurrent requests cannot both slip under the cap.
export const consumeRateLimit = async (
	key: string,
	{ window, max }: RateLimitRule,
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
