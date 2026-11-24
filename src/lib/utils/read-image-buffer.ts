import { readFile } from "node:fs/promises";
import path from "node:path";

export const readImageBuffer = async (src: string) => {
	if (src.startsWith("http")) {
		const response = await fetch(src);
		return Buffer.from(await response.arrayBuffer());
	}

	return readFile(
		path.join(process.cwd(), "public", src.replace(/^\/?public\//, "")),
	);
};
