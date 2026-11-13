import { describe, expect, test } from "bun:test";
import { getEnabledProviderConfigs } from "./providers";

describe("providers", () => {
	test("a provider with a missing env var is disabled", () => {
		const enabled = getEnabledProviderConfigs({
			GOOGLE_CLIENT_ID: "google-id",
			DISCORD_CLIENT_ID: "discord-id",
			DISCORD_CLIENT_SECRET: "discord-secret",
		});
		expect(enabled.map((provider) => provider.id)).toEqual(["discord"]);
	});

	test("no provider is enabled without env vars", () => {
		expect(getEnabledProviderConfigs({})).toEqual([]);
	});

	test("a provider with both values is enabled", () => {
		const enabled = getEnabledProviderConfigs({
			GOOGLE_CLIENT_ID: "google-id",
			GOOGLE_CLIENT_SECRET: "google-secret",
		});
		expect(enabled).toEqual([
			{
				id: "google",
				label: "Google",
				clientId: "google-id",
				clientSecret: "google-secret",
			},
		]);
	});
});
