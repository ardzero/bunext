#!/usr/bin/env node
import { execa } from "execa";
import * as p from "@clack/prompts";
import color from "picocolors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
    existsSync,
    readFileSync,
    rmSync,
    writeFileSync,
    readdirSync,
    copyFileSync,
    mkdirSync,
} from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const argv = yargs(hideBin(process.argv))
    .option("h", { alias: "help", type: "boolean" })
    .option("v", { alias: "version", type: "boolean" })
    .parseSync() as { h?: boolean; v?: boolean };

const REPO_URL = "https://github.com/ardzero/bunext.git";
const TEMP_DIR = ".bunext-upgrade-temp";
const PATHS_TO_REMOVE: string[] = [
    "create-bunext",
    "packages",
    ".github/workflows",
    "src/app/(index)/docs",
    "src/components/docs",
];

const REQUIRED_PATHS = [
    ".git",
    "public",
    "src/lib/data/siteData.ts",
] as const;

const PUBLIC_PRESERVE_NAMES = [
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "site.webmanifest",
] as const;

const TEMPLATE_DEFAULT_FAVICON = "favicon.svg";
const TEMPLATE_DEFAULT_OG_IMAGE = "ogImage.jpg";

function getVersion(): string {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const packageJsonPath = join(__dirname, "../package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        return packageJson.version;
    } catch {
        return "0.1.0";
    }
}

function isBunextProject(cwd: string): { ok: true } | { ok: false; missing: string } {
    for (const path of REQUIRED_PATHS) {
        const full = resolve(cwd, path);
        if (!existsSync(full)) {
            return { ok: false, missing: path };
        }
    }
    return { ok: true };
}

function extractSiteDataBlock(content: string): string | null {
    const start = content.indexOf("export const siteData");
    if (start === -1) return null;
    const assignStart = content.indexOf("= {", start);
    if (assignStart === -1) return null;
    let depth = 1;
    let i = assignStart + 3;
    while (i < content.length && depth > 0) {
        const c = content[i];
        if (c === "{") depth++;
        else if (c === "}") depth--;
        i++;
    }
    if (depth !== 0) return null;
    return content.slice(start, content.indexOf(";", i) + 1);
}

function getFaviconPathFromSiteData(content: string): string | null {
    const m = content.match(/favicon:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
}

function getOgImagePathFromSiteData(content: string): string | null {
    const m = content.match(/ogImage:\s*\{\s*src:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
}

function findPublicFile(publicDir: string, baseName: string, extensions: string[]): string | null {
    for (const ext of extensions) {
        const path = join(publicDir, baseName + ext);
        if (existsSync(path)) return path;
    }
    return null;
}

function copyDirSync(src: string, dest: string, skipGit = false): void {
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (skipGit && entry.name === ".git") continue;
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyDirSync(srcPath, destPath, false);
        } else {
            mkdirSync(dirname(destPath), { recursive: true });
            copyFileSync(srcPath, destPath);
        }
    }
}

function clearDirExcept(dir: string, keep: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === keep) continue;
        const full = join(dir, entry.name);
        rmSync(full, { recursive: true, force: true });
    }
}

async function main(): Promise<void> {
    if (argv.v) {
        console.log(getVersion());
        process.exit(0);
    }
    if (argv.h) {
        console.log("Usage: bunextupgrade");
        console.log("  Upgrade an existing Bunext project to the latest template.");
        console.log("  Run from the project root. Preserves .git, public assets, and siteData.");
        process.exit(0);
    }

    const cwd = process.cwd();
    const check = isBunextProject(cwd);
    if (!check.ok) {
        p.log.error(`This isn't a valid Bunext project (missing: ${check.missing}).`);
        process.exit(1);
    }

    console.clear();
    p.intro(color.bgCyan(color.black(" bunextupgrade ")));

    const s = p.spinner();

    s.start("Cloning latest Bunext template");
    try {
        await execa("git", ["clone", "--depth", "1", REPO_URL, TEMP_DIR], { cwd });
        s.stop("Template cloned");
    } catch (err: unknown) {
        s.stop("Failed to clone");
        const msg = err instanceof Error ? err.message : String(err);
        p.log.error(msg.includes("already exists") ? `Directory "${TEMP_DIR}" already exists. Remove it and try again.` : msg);
        process.exit(1);
    }

    const tempRoot = resolve(cwd, TEMP_DIR);

    s.start("Cleaning template");
    const gitPath = resolve(tempRoot, ".git");
    if (existsSync(gitPath)) rmSync(gitPath, { recursive: true, force: true });
    for (const pathToRemove of PATHS_TO_REMOVE) {
        const full = resolve(tempRoot, pathToRemove);
        if (existsSync(full)) rmSync(full, { recursive: true, force: true });
    }
    s.stop("Template cleaned");

    const oldPublic = resolve(cwd, "public");
    const newPublic = resolve(tempRoot, "public");
    const oldSiteDataPath = resolve(cwd, "src/lib/data/siteData.ts");
    const newSiteDataPath = resolve(tempRoot, "src/lib/data/siteData.ts");
    const oldSiteDataContent = readFileSync(oldSiteDataPath, "utf-8");
    const faviconPath = getFaviconPathFromSiteData(oldSiteDataContent);
    const ogImagePath = getOgImagePathFromSiteData(oldSiteDataContent);

    s.start("Preserving your public assets and site data");

    for (const name of PUBLIC_PRESERVE_NAMES) {
        const src = join(oldPublic, name);
        const dest = join(newPublic, name);
        if (existsSync(src)) {
            mkdirSync(dirname(dest), { recursive: true });
            copyFileSync(src, dest);
        }
    }

    const oldFaviconFile = faviconPath ? join(oldPublic, faviconPath.replace(/^\//, "")) : null;
    if (oldFaviconFile && existsSync(oldFaviconFile)) {
        copyFileSync(oldFaviconFile, join(newPublic, faviconPath!.replace(/^\//, "")));
        if (faviconPath !== "/favicon.svg") {
            const templateFavicon = join(newPublic, TEMPLATE_DEFAULT_FAVICON);
            if (existsSync(templateFavicon)) rmSync(templateFavicon, { force: true });
        }
    }

    const oldOgFile = ogImagePath ? join(oldPublic, ogImagePath.replace(/^\//, "")) : null;
    if (oldOgFile && existsSync(oldOgFile)) {
        copyFileSync(oldOgFile, join(newPublic, ogImagePath!.replace(/^\//, "")));
        if (ogImagePath !== "/ogImage.jpg") {
            const templateOg = join(newPublic, TEMPLATE_DEFAULT_OG_IMAGE);
            if (existsSync(templateOg)) rmSync(templateOg, { force: true });
        }
    }

    const oldBlock = extractSiteDataBlock(oldSiteDataContent);
    if (oldBlock && existsSync(newSiteDataPath)) {
        const newContent = readFileSync(newSiteDataPath, "utf-8");
        const newBlock = extractSiteDataBlock(newContent);
        if (newBlock) {
            const replaced = newContent.replace(newBlock, oldBlock);
            writeFileSync(newSiteDataPath, replaced);
        }
    }

    s.stop("Preserved public assets and site data");

    s.start("Replacing project with upgraded files");
    const entries = readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === TEMP_DIR) continue;
        const full = join(cwd, entry.name);
        rmSync(full, { recursive: true, force: true });
    }
    copyDirSync(tempRoot, cwd, false);
    rmSync(tempRoot, { recursive: true, force: true });
    s.stop("Upgrade complete");

    p.outro(color.green("Project upgraded successfully."));
}

main().catch((err: unknown) => {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
