"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { passwordSchema } from "@/components/auth/schemas";
import { auth } from "@/lib/auth/auth";
import { consumeRateLimit, type RateLimitRule } from "@/lib/auth/rate-limit";
import { requireSession } from "@/lib/auth/session";

// `error` is a Better Auth error code, read with getAuthErrorMessage
type SetPasswordResult = { error: string } | { error?: undefined };

// Server actions skip Better Auth's HTTP rate limiter, and every attempt hashes
// the password, so cap attempts per user.
const SET_PASSWORD_RATE_LIMIT: RateLimitRule = { window: 60 * 15, max: 5 };

// Same check as Better Auth's freshSessionMiddleware: an old, possibly stolen
// session must not be able to add a lasting way to sign in.
const isSessionFresh = async (createdAt: Date) => {
	const { sessionConfig } = await auth.$context;
	if (sessionConfig.freshAge === 0) return true;
	return Date.now() - createdAt.getTime() < sessionConfig.freshAge * 1000;
};

// Add a password to an account that signs in with a provider or an email link.
// Better Auth only exposes setPassword on the server.
export const setPassword = async (
	newPassword: string,
): Promise<SetPasswordResult> => {
	const { user, session } = await requireSession();
	// server actions can be called directly with any value
	if (!passwordSchema.safeParse(newPassword).success) {
		return { error: "INVALID_PASSWORD_FORMAT" };
	}
	if (!(await isSessionFresh(new Date(session.createdAt)))) {
		return { error: "SESSION_NOT_FRESH" };
	}

	const isWithinLimit = await consumeRateLimit(
		`set-password:${user.id}`,
		SET_PASSWORD_RATE_LIMIT,
	);
	if (!isWithinLimit) return { error: "TOO_MANY_REQUESTS" };

	const requestHeaders = await headers();
	// Better Auth hashes before it checks this, so check first
	const accounts = await auth.api.listUserAccounts({ headers: requestHeaders });
	if (accounts.some((account) => account.providerId === "credential")) {
		return { error: "PASSWORD_ALREADY_SET" };
	}

	try {
		await auth.api.setPassword({
			headers: requestHeaders,
			body: { newPassword },
		});
	} catch (error) {
		if (error instanceof APIError) {
			return { error: String(error.body?.code ?? "") };
		}
		throw error;
	}

	revalidatePath("/account");
	return {};
};
