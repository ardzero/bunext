import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerAvatar } from "@/lib/db/schema";

// Insert or replace the picture a provider reported for a user.
export const saveProviderAvatar = async (avatar: {
	userId: string;
	providerId: string;
	imageUrl: string;
}) =>
	db
		.insert(providerAvatar)
		.values(avatar)
		.onConflictDoUpdate({
			target: [providerAvatar.userId, providerAvatar.providerId],
			set: { imageUrl: avatar.imageUrl, updatedAt: new Date() },
		});

export const findProviderAvatar = async (
	userId: string,
	providerId: string,
) => {
	const [row] = await db
		.select()
		.from(providerAvatar)
		.where(
			and(
				eq(providerAvatar.userId, userId),
				eq(providerAvatar.providerId, providerId),
			),
		);
	return row ?? null;
};

export const listProviderAvatars = async (userId: string) =>
	db
		.select({
			providerId: providerAvatar.providerId,
			imageUrl: providerAvatar.imageUrl,
		})
		.from(providerAvatar)
		.where(eq(providerAvatar.userId, userId));

export const deleteProviderAvatar = async (
	userId: string,
	providerId: string,
) =>
	db
		.delete(providerAvatar)
		.where(
			and(
				eq(providerAvatar.userId, userId),
				eq(providerAvatar.providerId, providerId),
			),
		);

type ProviderTokens = { accessToken: string; idToken?: string };

// the part of a Better Auth social provider this file uses
type ProfileProvider = {
	id: string;
	getUserInfo: (
		tokens: ProviderTokens,
	) => Promise<{ user: { image?: string | null } } | null>;
};

const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// sign-in awaits the avatar hooks, so a slow provider must not hold it up
const PROVIDER_TIMEOUT_MS = 5000;

const withTimeout = <T>(promise: Promise<T>) => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error("Provider request timed out")),
			PROVIDER_TIMEOUT_MS,
		);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Better Auth's Google provider only decodes the stored ID token, which keeps
// returning the picture from sign-in time. Ask Google for the current one.
const fetchGoogleImage = async (accessToken: string) => {
	const response = await fetch(GOOGLE_USERINFO_URL, {
		headers: { authorization: `Bearer ${accessToken}` },
		cache: "no-store",
		signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
	});
	// an expired or revoked token is a failure, not "no picture"
	if (!response.ok) {
		throw new Error(`Google userinfo responded ${response.status}`);
	}
	const profile = (await response.json()) as { picture?: string };
	return profile.picture ?? null;
};

// The provider's current profile picture, or null when it has none. Throws
// when the provider can't be reached or rejects the token.
export const fetchProviderImage = async (
	provider: ProfileProvider,
	tokens: ProviderTokens,
) => {
	if (provider.id === "google") return fetchGoogleImage(tokens.accessToken);

	const info = await withTimeout(provider.getUserInfo(tokens));
	return info?.user.image ?? null;
};
