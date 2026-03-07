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
import { resolve, dirname, join, basename } from "path";
import { fileURLToPath } from "url";

const argv = yargs(hideBin(process.argv))
    .option("h", { alias: "help", type: "boolean" })
    .version("version", "Show version number", getVersion())
    .parseSync() as { h?: boolean };

const REPO_URL = "https://github.com/ardzero/bunext.git";
const REPO_LINK_PLACEHOLDER_PREFIX = "https://github.com/ardzero/";
const TEMP_DIR = ".bunext-upgrade-temp";
const BACKUP_DIR = ".bunext-upgrade-backup";
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

// const PUBLIC_PRESERVE_NAMES = [
//     "android-chrome-192x192.png",
//     "android-chrome-512x512.png",
//     "site.webmanifest",
// ] as const;
const PUBLIC_EXCLUDE_PREFIX = "loading-dots"; // exclude loading-dots.gif, loading-dots.webp, etc.

const TEMPLATE_DEFAULT_FAVICON = "favicon.svg";
const TEMPLATE_DEFAULT_OG_IMAGE = "ogImage.jpg";

type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

function detectPackageManager(): PackageManager {
    if (typeof (globalThis as unknown as { Bun?: unknown }).Bun !== "undefined") return "bun";
    if (process.env.npm_execpath?.includes("bun")) return "bun";
    if (process.argv[1]?.includes("bunx")) return "bun";
    if (process.env.npm_execpath?.includes("pnpm")) return "pnpm";
    if (process.env.npm_execpath?.includes("yarn")) return "yarn";
    return "npm";
}

async function getRemoteOriginUrl(cwd: string): Promise<string | null> {
    try {
        const { stdout } = await execa("git", ["remote", "get-url", "origin"], { cwd });
        return (stdout?.trim()) || null;
    } catch {
        return null;
    }
}

function getRepoNameFromUrl(url: string): string {
    const trimmed = url.trim().replace(/\.git$/i, "");
    const parts = trimmed.split("/").filter(Boolean);
    return parts[parts.length - 1] || "my-app";
}

function normalizeRepoUrlToHttps(url: string): string {
    const trimmed = url.trim().replace(/\.git$/i, "");
    if (trimmed.startsWith("git@")) {
        const match = trimmed.match(/^git@([^:]+):(.+)$/);
        if (match) return `https://${match[1]}/${match[2]}`;
    }
    return trimmed;
}

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

function slugifyPackageName(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return slug || "my-app";
}

function applyProjectReadme(
    projectRoot: string,
    nameForPackage: string,
    repoUrl: string | null,
    ogImagePath: string | null,
): void {
    const repoLink = repoUrl ? normalizeRepoUrlToHttps(repoUrl) : `${REPO_LINK_PLACEHOLDER_PREFIX}${slugifyPackageName(nameForPackage)}`;
    const ogImageSegment = ogImagePath ? ogImagePath.replace(/^\//, "") : TEMPLATE_DEFAULT_OG_IMAGE;
    const projectReadmePath = resolve(projectRoot, "project_readme.md");
    const readmePath = resolve(projectRoot, "README.md");
    if (!existsSync(projectReadmePath)) return;
    let content = readFileSync(projectReadmePath, "utf-8");
    content = content
        .replace(/\?\{project-name\}/g, nameForPackage)
        .replace(/\?\{repo-link\}/g, repoLink)
        .replace(/\?\{og-image-path\}/g, ogImageSegment);
    writeFileSync(readmePath, content);
    rmSync(projectReadmePath, { force: true });
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

function extractSiteDataBlock(content: string): { block: string; start: number; end: number } | null {
    const start = content.indexOf("export const siteData");
    if (start === -1) return null;
    const braceStart = content.indexOf("{", start);
    if (braceStart === -1) return null;
    let depth = 1;
    let i = braceStart + 1;
    while (i < content.length && depth > 0) {
        const c = content[i];
        if (c === "{") depth++;
        else if (c === "}") depth--;
        i++;
    }
    if (depth !== 0) return null;
    const semi = content.indexOf(";", i);
    const end = semi === -1 ? i : semi + 1;
    return { block: content.slice(start, end), start, end };
}

function getFaviconPathFromSiteData(content: string): string | null {
    const m = content.match(/favicon:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
}

function getOgImagePathFromSiteData(content: string): string | null {
    const m = content.match(/ogImage:\s*\{\s*src:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
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

function createBackup(cwd: string): void {
    const backupPath = resolve(cwd, BACKUP_DIR);
    if (existsSync(backupPath)) rmSync(backupPath, { recursive: true, force: true });
    mkdirSync(backupPath, { recursive: true });
    const entries = readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === TEMP_DIR || entry.name === BACKUP_DIR) continue;
        const srcPath = join(cwd, entry.name);
        const destPath = join(backupPath, entry.name);
        if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyDirSync(srcPath, destPath, false);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

function undoUpgrade(cwd: string): void {
    const backupPath = resolve(cwd, BACKUP_DIR);
    if (!existsSync(backupPath)) {
        p.log.error("No backup found. Cannot undo.");
        return;
    }
    const entries = readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === BACKUP_DIR) continue;
        const full = join(cwd, entry.name);
        rmSync(full, { recursive: true, force: true });
    }
    const backupEntries = readdirSync(backupPath, { withFileTypes: true });
    for (const entry of backupEntries) {
        const srcPath = join(backupPath, entry.name);
        const destPath = join(cwd, entry.name);
        if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyDirSync(srcPath, destPath, false);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
    rmSync(backupPath, { recursive: true, force: true });
    p.log.success("Reverted to pre-upgrade state.");
}

function addToGitignore(cwd: string, entry: string): void {
    const gitignorePath = resolve(cwd, ".gitignore");
    const content = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf-8") : "";
    const line = entry.startsWith("/") ? entry : `/${entry}`;
    if (content.includes(entry) || content.includes(line)) return;
    const suffix = content.endsWith("\n") ? "" : "\n";
    writeFileSync(gitignorePath, content + suffix + entry + "\n");
}

function addToTsconfigExclude(cwd: string, entry: string): void {
    const tsconfigPath = resolve(cwd, "tsconfig.json");
    if (!existsSync(tsconfigPath)) return;
    const content = readFileSync(tsconfigPath, "utf-8");
    const tsconfig = JSON.parse(content) as { exclude?: string[] };
    const exclude = tsconfig.exclude ?? [];
    if (exclude.includes(entry)) return;
    tsconfig.exclude = [...exclude, entry];
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, "\t"));
}

async function offerUndo(cwd: string, context: "error" | "success"): Promise<boolean> {
    const message =
        context === "error"
            ? "Do you want to undo all changes and restore your project?"
            : "Do you want to undo the upgrade and restore your previous project?";
    const response = await p.confirm({ message, initialValue: false });
    if (p.isCancel(response)) process.exit(0);
    if (response) {
        const spinner = p.spinner();
        spinner.start("Reverting…");
        undoUpgrade(cwd);
        spinner.stop("Reverted.");
        return true;
    }
    return false;
}

async function main(): Promise<void> {
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
    let nameForPackage = "my-app";
    try {
        const pkgPath = resolve(cwd, "package.json");
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
            if (typeof pkg.name === "string") nameForPackage = pkg.name;
        }
    } catch {
        // ignore
    }

    const oldSiteDataPath = resolve(cwd, "src/lib/data/siteData.ts");
    let ogImagePathForReadme: string | null = null;
    if (existsSync(oldSiteDataPath)) {
        const oldSiteDataContent = readFileSync(oldSiteDataPath, "utf-8");
        ogImagePathForReadme = getOgImagePathFromSiteData(oldSiteDataContent);
    }

    const remoteUrl = await getRemoteOriginUrl(cwd);
    const remoteRepoName = remoteUrl ? getRepoNameFromUrl(remoteUrl) : null;
    const nameChoice = await p.select({
        message: "Project name for README / repo link",
        options: [
            {
                value: "remote",
                label: remoteRepoName ? `Use remote repo name (${remoteRepoName})` : "Use remote repo name (no remote configured)",
            },
            { value: "custom", label: "Enter a custom name" },
        ],
        initialValue: remoteRepoName ? "remote" : "custom",
    });
    if (p.isCancel(nameChoice)) {
        p.cancel("Operation cancelled");
        process.exit(0);
    }
    if (nameChoice === "remote" && remoteRepoName) {
        nameForPackage = remoteRepoName;
    } else {
        const customName = await p.text({
            message: "Package / project name",
            initialValue: nameForPackage,
            validate: (v) => {
                if (!v?.trim()) return "Name is required";
                return undefined;
            },
        });
        if (p.isCancel(customName)) {
            p.cancel("Operation cancelled");
            process.exit(0);
        }
        nameForPackage = (customName as string).trim();
    }

    applyProjectReadme(tempRoot, nameForPackage, remoteUrl, ogImagePathForReadme);
    s.stop("Template cleaned");

    const oldPublic = resolve(cwd, "public");
    const newPublic = resolve(tempRoot, "public");
    const newSiteDataPath = resolve(tempRoot, "src/lib/data/siteData.ts");
    const oldSiteDataContent = readFileSync(oldSiteDataPath, "utf-8");
    const faviconPath = getFaviconPathFromSiteData(oldSiteDataContent);
    const ogImagePath = getOgImagePathFromSiteData(oldSiteDataContent);

    s.start("Preserving your public assets and site data");

    mkdirSync(newPublic, { recursive: true });
    const oldPublicEntries = readdirSync(oldPublic, { withFileTypes: true });
    for (const entry of oldPublicEntries) {
        if (entry.name.startsWith(PUBLIC_EXCLUDE_PREFIX)) continue;
        const src = join(oldPublic, entry.name);
        const dest = join(newPublic, entry.name);
        if (entry.isDirectory()) {
            mkdirSync(dest, { recursive: true });
            copyDirSync(src, dest, false);
        } else {
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

    const oldBlockResult = extractSiteDataBlock(oldSiteDataContent);
    if (oldBlockResult && existsSync(newSiteDataPath)) {
        const newContent = readFileSync(newSiteDataPath, "utf-8");
        const newBlockResult = extractSiteDataBlock(newContent);
        if (newBlockResult) {
            const replaced =
                newContent.slice(0, newBlockResult.start) +
                oldBlockResult.block +
                newContent.slice(newBlockResult.end);
            writeFileSync(newSiteDataPath, replaced);
        }
    }

    s.stop("Preserved public assets and site data");

    let templateVersion = getVersion();
    try {
        const templatePkgPath = resolve(tempRoot, "package.json");
        if (existsSync(templatePkgPath)) {
            const templatePkg = JSON.parse(readFileSync(templatePkgPath, "utf-8"));
            if (typeof templatePkg.version === "string") templateVersion = templatePkg.version;
        }
    } catch {
        // keep getVersion() fallback
    }

    s.start("Creating backup");
    createBackup(cwd);
    s.stop("Backup created");

    s.start("Replacing project with upgraded files");
    try {
        const entries = readdirSync(cwd, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === ".git" || entry.name === TEMP_DIR || entry.name === BACKUP_DIR) continue;
            const full = join(cwd, entry.name);
            rmSync(full, { recursive: true, force: true });
        }
        copyDirSync(tempRoot, cwd, false);
        rmSync(tempRoot, { recursive: true, force: true });
    } catch (err: unknown) {
        s.stop("Replace failed");
        const msg = err instanceof Error ? err.message : String(err);
        p.log.error(msg);
        await offerUndo(cwd, "error");
        process.exit(1);
    }
    s.stop("Upgrade complete");

    const packageManager = detectPackageManager();
    s.start(`Installing dependencies (${packageManager})`);
    try {
        await execa(packageManager, ["install"], { cwd });
        s.stop("Dependencies installed");
    } catch (err: unknown) {
        s.stop("Install failed");
        const msg = err instanceof Error ? err.message : String(err);
        p.log.error(msg);
        await offerUndo(cwd, "error");
        process.exit(1);
    }

    const commitMessage = `upgraded and refresh to the bunext template version ${templateVersion}`;
    const nextChoice = await p.select({
        message: "What would you like to do next?",
        options: [
            { value: "undo", label: "Undo upgrade and restore previous state" },
            { value: "commit", label: `Commit and push (${commitMessage})` },
        ],
        initialValue: "commit",
    });
    if (p.isCancel(nextChoice)) process.exit(0);

    if (nextChoice === "undo") {
        const spinner = p.spinner();
        spinner.start("Reverting…");
        undoUpgrade(cwd);
        spinner.stop("Reverted.");
        p.outro(color.yellow("Upgrade reverted. Your project is back to its previous state."));
        return;
    }

    const backupPath = resolve(cwd, BACKUP_DIR);
    const hasBackup = existsSync(backupPath);

    if (hasBackup) {
        const keepBackup = await p.confirm({
            message: `Keep the backup folder (${BACKUP_DIR})?`,
            initialValue: false,
        });
        if (p.isCancel(keepBackup)) process.exit(0);
        if (!keepBackup) {
            rmSync(backupPath, { recursive: true, force: true });
        } else {
            const ignoreWhenCommit = await p.confirm({
                message: "Ignore backup when committing? (add to .gitignore, keep locally)",
                initialValue: true,
            });
            if (p.isCancel(ignoreWhenCommit)) process.exit(0);
            if (ignoreWhenCommit) {
                addToGitignore(cwd, BACKUP_DIR);
            } else {
                addToTsconfigExclude(cwd, BACKUP_DIR);
            }
        }
    }

    s.start("Committing and pushing");
    try {
        await execa("git", ["add", "-A"], { cwd });
        await execa("git", ["commit", "-m", commitMessage], { cwd });
        await execa("git", ["push"], { cwd });
        s.stop("Committed and pushed");
    } catch (err: unknown) {
        s.stop("Commit or push failed");
        const msg = err instanceof Error ? err.message : String(err);
        p.log.error(msg);
        p.outro(color.yellow("Upgrade completed locally. Fix git state and push manually if needed."));
        return;
    }
    p.outro(color.green("Project upgraded successfully and pushed to remote."));
}

main().catch((err: unknown) => {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
