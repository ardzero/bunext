import "server-only";

import { readImageBuffer } from "@/lib/utils/read-image-buffer";

export async function getPlaceholderImage(src: string) {
	try {
		const { default: sharp } = await import("sharp");
		const source = await readImageBuffer(src);
		const thumbnail = await sharp(source).resize(20).png().toBuffer();
		return `data:image/png;base64,${thumbnail.toString("base64")}`;
	} catch {
		return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";
	}
}
