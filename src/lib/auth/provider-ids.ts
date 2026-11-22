// Shared by server config and client UI. Add an id here, an entry in
// providers.ts and an icon in social-buttons.tsx to support a new provider.
export const PROVIDER_IDS = ["google", "discord"] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];
