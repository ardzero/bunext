import { readFile } from "node:fs/promises";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori from "satori";

const getRenderer = async () => {
	const [font, wasm] = await Promise.all([
		readFile(
			new URL(
				"@fontsource/geist/files/geist-latin-400-normal.woff",
				import.meta.url,
			),
		),
		readFile(new URL("@resvg/resvg-wasm/index_bg.wasm", import.meta.url)),
	]);
	await initWasm(wasm);
	return font;
};

let renderer: ReturnType<typeof getRenderer> | undefined;

// Image metadata
export const size = {
	width: 1200,
	height: 630,
};

// Image generation
export async function GenerateImage(params: {
	title: string;
	description?: string;
}) {
	renderer ??= getRenderer();
	const font = await renderer;
	const svg = await satori(
		<div
			style={{
				fontSize: 160,
				background: "black",
				width: "100%",
				height: "100%",
				display: "flex",
				textAlign: "center",
				alignItems: "center",
				justifyContent: "center",
				color: "white",
				fontFamily: "sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					textAlign: "center",
					alignItems: "center",
					justifyContent: "center",
					gap: 4,
				}}
			>
				<span style={{ fontWeight: 600 }}>{params.title}</span>
				<span style={{ fontSize: 40, fontWeight: 300 }}>
					{params.description}
				</span>
			</div>
		</div>,
		{ ...size, fonts: [{ name: "Geist", data: font, weight: 400 }] },
	);
	const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size.width } });
	try {
		const png = resvg.render();
		try {
			return new Response(Uint8Array.from(png.asPng()), {
				headers: {
					"content-type": "image/png",
					"cache-control":
						process.env.NODE_ENV === "development"
							? "no-cache, no-store"
							: "public, immutable, no-transform, max-age=31536000",
				},
			});
		} finally {
			png.free();
		}
	} finally {
		resvg.free();
	}
}
