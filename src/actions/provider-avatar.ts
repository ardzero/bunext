"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { PROVIDER_IDS } from "@/lib/auth/provider-ids";
import {
	findProviderAvatar,
	saveProviderAvatar,
} from "@/lib/auth/provider-avatars";
import { requireSession } from "@/lib/auth/session";

type ProviderAvatarResult = { error: string } | { error?: undefined };

const isProviderId = (value: string): value is (typeof PROVIDER_IDS)[number] =>
	(PROVIDER_IDS as readonly string[]).includes(value);

// Make a connected provider's saved picture the profile picture.
export const selectProviderAvatar = async (
	providerId: string,
): Promise<ProviderAvatarResult> => {
	const { user } = await requireSession();
	if (!isProviderId(providerId)) return { error: "Unknown provider." };

	const avatar = await findProviderAvatar(user.id, providerId);
	if (!avatar) return { error: "No picture saved for this provider." };

	await auth.api.updateUser({
		headers: await headers(),
		body: { image: avatar.imageUrl },
	});
	revalidatePath("/account");
	return {};
};

// Pull the latest picture from the provider. When that provider's picture is
// the one in use, the profile picture follows it.
export const refreshProviderAvatar = async (
	providerId: string,
): Promise<ProviderAvatarResult> => {
	const { user } = await requireSession();
	if (!isProviderId(providerId)) return { error: "Unknown provider." };

	const requestHeaders = await headers();
	const accounts = await auth.api.listUserAccounts({ headers: requestHeaders });
	const account = accounts.find((item) => item.providerId === providerId);
	if (!account) return { error: "This provider isn't connected." };

	const info = await auth.api
		.accountInfo({ headers: requestHeaders, query: { accountId: account.id } })
		.catch(() => null);
	if (!info) {
		return {
			error: "Couldn't reach the provider. Reconnect it and try again.",
		};
	}

	const imageUrl = info.user.image;
	if (!imageUrl) return { error: "The provider has no profile picture." };

	const previous = await findProviderAvatar(user.id, providerId);
	await saveProviderAvatar({ userId: user.id, providerId, imageUrl });

	const isInUse = !user.image || user.image === previous?.imageUrl;
	if (isInUse && user.image !== imageUrl) {
		await auth.api.updateUser({
			headers: requestHeaders,
			body: { image: imageUrl },
		});
	}
	revalidatePath("/account");
	return {};
};
