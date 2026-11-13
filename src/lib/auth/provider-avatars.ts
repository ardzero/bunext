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

// Better Auth's Google provider only decodes the stored ID token, which keeps
// returning the picture from sign-in time. Ask Google for the current one.
const fetchGoogleImage = async (accessToken: string) => {
	const response = await fetch(GOOGLE_USERINFO_URL, {
		headers: { authorization: `Bearer ${accessToken}` },
		cache: "no-store",
	});
	if (!response.ok) return null;
	const profile = (await response.json()) as { picture?: string };
	return profile.picture ?? null;
};

// The provider's current profile picture, or null when it has none.
export const fetchProviderImage = async (
	provider: ProfileProvider,
	tokens: ProviderTokens,
) => {
	if (provider.id === "google") return fetchGoogleImage(tokens.accessToken);

	const info = await provider.getUserInfo(tokens);
	return info?.user.image ?? null;
};
