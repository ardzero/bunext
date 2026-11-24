import { readFile } from "node:fs/promises";
import path from "node:path";

export const readImageBuffer = async (src: string) => {
	if (src.startsWith("http")) {
		const response = await fetch(src);
		if (!response.ok) throw new Error("Could not read the remote image.");
		return Buffer.from(await response.arrayBuffer());
	}

	const publicPath = path.resolve("public");
	const sourcePath = path.resolve(
		publicPath,
		src.replace(/^\/(?:public\/)?|^public\//, ""),
	);
	const relativePath = path.relative(publicPath, sourcePath);
	if (
		relativePath === ".." ||
		relativePath.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relativePath)
	) {
		throw new Error("Local images must be inside public.");
	}
	return readFile(sourcePath);
};
