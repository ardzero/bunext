import type { Font } from "satori";

const notoFamilies: Record<string, string[]> = {
	"ja-JP": ["JP"],
	"ko-KR": ["KR"],
	"zh-CN": ["SC"],
	"zh-TW": ["TC"],
	"zh-HK": ["HK"],
	"th-TH": ["Thai"],
	"bn-IN": ["Bengali"],
	"ar-AR": ["Arabic"],
	"ta-IN": ["Tamil"],
	"ml-IN": ["Malayalam"],
	"he-IL": ["Hebrew"],
	"te-IN": ["Telugu"],
	devanagari: ["Devanagari"],
	kannada: ["Kannada"],
	symbol: ["Symbols", "Symbols 2"],
	math: ["Math"],
	unknown: [""],
};

type OgAsset = string | Font[];
type CachedAsset = string | Font;
const assets = new Map<string, Promise<CachedAsset | undefined>>();
const assetCacheLimit = 128;

const fetchAsset = async (url: URL, headers?: HeadersInit) => {
	const response = await fetch(url, {
		headers,
		redirect: "error",
		signal: AbortSignal.timeout(4000),
	});
	if (!response.ok) throw new Error("Could not load an OG asset.");
	return response;
};

const loadFont = async (
	code: string,
	family: string,
	text: string,
): Promise<Font> => {
	const cssUrl = new URL("https://fonts.googleapis.com/css2");
	cssUrl.searchParams.set("family", family);
	cssUrl.searchParams.set("text", text);
	// Google serves TTF to this user agent. Satori doesn't accept WOFF2.
	const css = await fetchAsset(cssUrl, { "User-Agent": "Mozilla/5.0" });
	const match = (await css.text()).match(
		/src:\s*url\(([^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/,
	);
	if (!match) throw new Error("No supported OG font subset was returned.");
	const fontUrl = new URL(match[1]);
	if (fontUrl.origin !== "https://fonts.gstatic.com")
		throw new Error("Unexpected OG font origin.");

	const response = await fetchAsset(fontUrl);
	const data = await response.arrayBuffer();
	const signature = data.byteLength >= 12 ? new DataView(data).getUint32(0) : 0;
	if (signature !== 0x00010000 && signature !== 0x4f54544f) {
		throw new Error("Invalid OG font subset.");
	}
	return {
		name: `${family} ${text}`,
		data,
		weight: 400,
		style: "normal",
		lang: ["unknown", "symbol", "math"].includes(code) ? undefined : code,
	};
};

const loadEmoji = async (text: string) => {
	const sequence = text.includes("\u200d")
		? text
		: text.replaceAll("\ufe0f", "");
	const icon = Array.from(sequence, (character) =>
		character.codePointAt(0)?.toString(16),
	).join("-");
	const response = await fetchAsset(
		new URL(
			`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${icon}.svg`,
		),
	);
	return `data:image/svg+xml;base64,${Buffer.from(await response.text()).toString("base64")}`;
};

const getCachedAsset = async (
	key: string,
	load: () => Promise<CachedAsset>,
) => {
	let pending = assets.get(key);
	if (!pending) {
		const oldestKey = assets.keys().next().value;
		if (assets.size >= assetCacheLimit && oldestKey !== undefined)
			assets.delete(oldestKey);
		pending = load().catch(() => undefined);
		assets.set(key, pending);
	}
	const asset = await pending;
	if (asset === undefined && assets.get(key) === pending) assets.delete(key);
	return asset;
};

export const clearAdditionalAssets = () => assets.clear();

export const loadAdditionalAsset = async (
	code: string,
	text: string,
): Promise<OgAsset> => {
	if (code === "emoji") {
		const emoji = await getCachedAsset(JSON.stringify([code, text]), () =>
			loadEmoji(text),
		);
		return typeof emoji === "string" ? emoji : [];
	}

	const fonts = await Promise.all(
		code.split("|").flatMap((language) =>
			(notoFamilies[language] ?? []).map((suffix) => {
				const family = suffix ? `Noto Sans ${suffix}` : "Noto Sans";
				return getCachedAsset(JSON.stringify([language, family, text]), () =>
					loadFont(language, family, text),
				);
			}),
		),
	);
	return fonts.filter((font): font is Font => typeof font === "object");
};
