import { GenerateImage } from "@/components/utils/ogImageGenerator";

export const runtime = "edge";

export const alt = "Bunext";
export const contentType = "image/png";

export const size = {
	width: 1200,
	height: 630,
};

// Image generation
export default async function Image() {
	return await GenerateImage({
		title: "Bunext",
		description: "Docs/Component Examples for Bunext",
	});
}
