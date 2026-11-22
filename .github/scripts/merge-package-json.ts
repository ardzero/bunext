// Three-way merge of package.json, used by the auth template sync to resolve
// conflicts that are only neighbouring dependency lines (e.g. Renovate bumps
// `eslint` on main next to `drizzle-kit` on bauth-drizzle).
//
// usage: bun merge-package-json.ts <base> <ours> <theirs> <output>
// exits 1 when both sides changed the same value differently (a real conflict)

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const DEPENDENCY_SECTIONS = new Set([
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"optionalDependencies",
	"overrides",
	"resolutions",
]);

class MergeConflict extends Error {}

const isObject = (value: Json | undefined): value is JsonObject =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isSame = (a: Json | undefined, b: Json | undefined) =>
	JSON.stringify(a) === JSON.stringify(b);

// `undefined` means the key does not exist on that side
const mergeValue = (
	base: Json | undefined,
	ours: Json | undefined,
	theirs: Json | undefined,
	path: string[],
): Json | undefined => {
	if (isSame(ours, theirs)) return ours;
	if (isSame(base, ours)) return theirs;
	if (isSame(base, theirs)) return ours;
	if (!isObject(ours) || !isObject(theirs)) {
		throw new MergeConflict(path.join("."));
	}

	const baseObject = isObject(base) ? base : {};
	// keep our key order, then add keys only theirs has
	const keys = [
		...Object.keys(ours),
		...Object.keys(theirs).filter((key) => !(key in ours)),
	];
	const merged: JsonObject = {};
	for (const key of keys) {
		const value = mergeValue(baseObject[key], ours[key], theirs[key], [
			...path,
			key,
		]);
		if (value !== undefined) merged[key] = value;
	}
	return merged;
};

const sortDependencySections = (manifest: JsonObject) => {
	for (const section of DEPENDENCY_SECTIONS) {
		const dependencies = manifest[section];
		if (!isObject(dependencies)) continue;
		manifest[section] = Object.fromEntries(
			// plain code-point order, as bun and npm write it
			Object.entries(dependencies).sort(([a], [b]) => (a < b ? -1 : 1)),
		);
	}
	return manifest;
};

const readJson = async (path: string): Promise<JsonObject> =>
	JSON.parse(await Bun.file(path).text());

const main = async () => {
	const [basePath, oursPath, theirsPath, outputPath] = Bun.argv.slice(2);
	if (!basePath || !oursPath || !theirsPath || !outputPath) {
		console.error(
			"usage: bun merge-package-json.ts <base> <ours> <theirs> <output>",
		);
		process.exit(2);
	}

	const [base, ours, theirs] = await Promise.all(
		[basePath, oursPath, theirsPath].map(readJson),
	);

	try {
		const merged = mergeValue(base, ours, theirs, []) as JsonObject;
		await Bun.write(
			outputPath,
			`${JSON.stringify(sortDependencySections(merged), null, "\t")}\n`,
		);
		console.log("package.json merged without conflicts");
	} catch (error) {
		if (!(error instanceof MergeConflict)) throw error;
		console.error(`Both branches changed "${error.message}" differently`);
		process.exit(1);
	}
};

await main();
