"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { PROVIDER_IDS } from "@/lib/auth/provider-ids";
import {
	fetchProviderImage,
	findProviderAvatar,
	saveProviderAvatar,
} from "@/lib/auth/provider-avatars";
import { requireSession } from "@/lib/auth/session";

type ProviderAvatarResult = { error: string } | { error?: undefined };

const isProviderId = (value: string): value is (typeof PROVIDER_IDS)[number] =>
	(PROVIDER_IDS as readonly string[]).includes(value);

// the signed-in user's account row for a provider, if connected
const findConnectedAccount = async (
	requestHeaders: Headers,
	providerId: string,
) => {
	const accounts = await auth.api.listUserAccounts({ headers: requestHeaders });
	return accounts.find((item) => item.providerId === providerId) ?? null;
};

// Make a connected provider's saved picture the profile picture.
export const selectProviderAvatar = async (
	providerId: string,
): Promise<ProviderAvatarResult> => {
	const { user } = await requireSession();
	if (!isProviderId(providerId)) return { error: "Unknown provider." };

	const requestHeaders = await headers();
	const account = await findConnectedAccount(requestHeaders, providerId);
	if (!account) return { error: "This provider isn't connected." };

	const avatar = await findProviderAvatar(user.id, providerId);
	if (!avatar) return { error: "No picture saved for this provider." };

	await auth.api.updateUser({
		headers: requestHeaders,
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
	const account = await findConnectedAccount(requestHeaders, providerId);
	if (!account) return { error: "This provider isn't connected." };

	const context = await auth.$context;
	const provider = context.socialProviders.find(
		(item) => item.id === providerId,
	);
	if (!provider) return { error: "This provider isn't available." };

	// refreshes the access token first when it has expired
	const imageUrl = await auth.api
		.getAccessToken({
			headers: requestHeaders,
			body: { accountId: account.id },
		})
		.then((tokens) => fetchProviderImage(provider, tokens))
		.catch(() => undefined);
	if (imageUrl === undefined) {
		return {
			error: "Couldn't reach the provider. Reconnect it and try again.",
		};
	}
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
