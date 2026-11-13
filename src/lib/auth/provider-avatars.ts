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
