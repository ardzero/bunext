"use server";

import { imageSize } from "image-size";
import { readImageBuffer } from "@/lib/utils/read-image-buffer";

export async function getImageDimensions(
	src: string,
): Promise<{ width: number; height: number } | null> {
	try {
		const { width, height } = imageSize(await readImageBuffer(src));
		if (width == null || height == null) return null;
		return { width, height };
	} catch {
		return null;
	}
}
