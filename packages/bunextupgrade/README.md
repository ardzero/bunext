# bunextupgrade

CLI to upgrade an existing [Bunext](https://github.com/ardzero/bunext) project to the latest template. Run from your project root.

## Install

```bash
bunx bunextupgrade
```

Or install globally:

```bash
bun install -g bunextupgrade
```

## Usage

From the root of a Bunext project:

```bash
bunx bunextupgrade
# or
bunextupgrade
```

**Requirements:** The directory must be a valid Bunext project (has `.git`, `public/`, and `src/lib/data/siteData.ts`). Otherwise you'll see: *"This isn't a valid Bunext project"*.

**What it does:** Clones the latest Bunext template, then keeps your:

- **Public assets** — `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`, favicon (any type), and ogImage (any type)
- **Site data** — The `siteData` object from `src/lib/data/siteData.ts` (name, baseUrl, ogImage, etc.)
- **Git history** — `.git` is left untouched

Everything else is replaced with the new template.

## Options

| Option | Description |
|--------|-------------|
| `-h`, `--help` | Show usage |
| `-v`, `--version` | Show version |

## Develop

```bash
bun install
bun run build
node dist/cli.js
```
