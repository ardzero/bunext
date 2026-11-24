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
const assets = new Map<string, Promise<OgAsset | undefined>>();
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
	// Include decomposed vowel signs used when the font shapes the text.
	cssUrl.searchParams.set(
		"text",
		[...new Set(text + text.normalize("NFD"))].join(""),
	);
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
	return {
		name: `${family} ${text}`,
		data: await response.arrayBuffer(),
		weight: 400,
		style: "normal",
		lang: ["unknown", "symbol", "math"].includes(code) ? undefined : code,
	};
};

const loadAsset = async (
	code: string,
	text: string,
): Promise<OgAsset | undefined> => {
	if (code === "emoji") {
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
	}

	const fonts = await Promise.allSettled(
		code
			.split("|")
			.flatMap((language) =>
				(notoFamilies[language] ?? []).map((suffix) =>
					loadFont(
						language,
						suffix ? `Noto Sans ${suffix}` : "Noto Sans",
						text,
					),
				),
			),
	);
	const available = fonts.flatMap((font) =>
		font.status === "fulfilled" ? [font.value] : [],
	);
	return available.length ? available : undefined;
};

export const loadAdditionalAsset = async (
	code: string,
	text: string,
): Promise<OgAsset> => {
	const key = JSON.stringify([code, text]);
	let pending = assets.get(key);
	if (!pending) {
		const oldestKey = assets.keys().next().value;
		if (assets.size >= assetCacheLimit && oldestKey !== undefined)
			assets.delete(oldestKey);
		pending = loadAsset(code, text).catch(() => undefined);
		assets.set(key, pending);
	}
	const asset = await pending;
	if (asset === undefined && assets.get(key) === pending) assets.delete(key);
	return asset ?? [];
};
