import "server-only";
import type { ProviderId } from "./provider-ids";

export type { ProviderId };

export type ProviderConfig = {
	id: ProviderId;
	label: string;
	clientId: string | undefined;
	clientSecret: string | undefined;
};

// the client-safe shape handed to UI components
export type EnabledProvider = {
	id: ProviderId;
	label: string;
};

type EnabledProviderConfig = ProviderConfig & {
	clientId: string;
	clientSecret: string;
};

// Every supported provider. An entry is enabled only when both values are set.
// Reads process.env directly so it stays independent of the database settings.
export const getProviderConfigs = (
	source: Partial<Record<string, string>> = process.env,
): ProviderConfig[] => [
	{
		id: "google",
		label: "Google",
		clientId: source.GOOGLE_CLIENT_ID,
		clientSecret: source.GOOGLE_CLIENT_SECRET,
	},
	{
		id: "discord",
		label: "Discord",
		clientId: source.DISCORD_CLIENT_ID,
		clientSecret: source.DISCORD_CLIENT_SECRET,
	},
];

const isEnabled = (
	provider: ProviderConfig,
): provider is EnabledProviderConfig =>
	Boolean(provider.clientId && provider.clientSecret);

export const getEnabledProviderConfigs = (
	source?: Partial<Record<string, string>>,
) => getProviderConfigs(source).filter(isEnabled);

export const enabledProviderConfigs = getEnabledProviderConfigs();

export const enabledProviders: EnabledProvider[] = enabledProviderConfigs.map(
	({ id, label }) => ({ id, label }),
);
