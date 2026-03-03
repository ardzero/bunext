[![Bunext](https://bunext.ardzero.com/ogImage.jpg)](https://bunext.ardzero.com/)

# @ardly/bunext (bunext-wrapper)

A CLI tool to scaffold the **Bunext** Next.js 16 starter kit configured with Tailwind CSS, Shadcn UI, Tailwind Motion, React Motion, and a bunch of utilities pre-configured.

> **Note:** This is a wrapper package for `create-bunext`. For the best experience, use `bun create bunext` instead.

## Quick Start

```bash
# Recommended (Bun)
bunx @ardly/bunext my-app

# Or with npx
npx @ardly/bunext my-app
```

Global install (optional):

```bash
npm i -g @ardly/bunext
bunext my-app
```

## What This Package Does

- **Single entry point** – Run `bunext` (or `bunx @ardly/bunext`) instead of invoking `create-bunext` directly.
- **No extra config** – Resolves and runs `create-bunext`’s CLI; all flags and behavior are the same.

## CLI Usage

Same as **create-bunext**. Examples:

```bash
# Interactive mode
bunx @ardly/bunext

# Use current directory (must be empty)
bunx @ardly/bunext .

# Quick setup
bunx @ardly/bunext my-app -y
bunx @ardly/bunext my-app --cursor
bunx @ardly/bunext my-app --no-install --no-git
```

### Flags (same as create-bunext)

| Flag                         | Description                                                |
| :--------------------------- | :--------------------------------------------------------- |
| `-y`, `--yes`                | Skip all prompts and use defaults (install deps, init git) |
| `--install` / `--no-install` | Install or skip installing dependencies                    |
| `--git` / `--no-git`         | Initialize or skip git repository                          |
| `--cursor`                   | Open project in Cursor after creation                      |
| `--vscode`                   | Open project in VS Code after creation                     |
| `-h`, `--help`               | Show help message with examples                            |
| `-v`, `--version`            | Show CLI version                                           |

Full help:

```bash
bunx @ardly/bunext --help
```

## Alternative: create-bunext

You can also use **create-bunext** directly (e.g. for `bun create bunext`):

```bash
bun create bunext my-app
npm create bunext@latest my-app
```

For full CLI docs, troubleshooting, and template details, see **[create-bunext](../create-bunext/README.md)**.

## What’s Included (Bunext Template)

The generated project includes:

- **Next.js 16** App Router
- **Tailwind CSS v4**
- **Shadcn UI** components
- **Tailwind Motion** and **React Motion** (`motion.dev`)
- Dark/light theme, font optimization, **Lucide React**
- Utilities: metadata, JsonLD, Img, Icons, ogImageGen, featureFlag, clink, code-block, etc.
- **nuqs** for URL state, SEO helpers, Prettier with Tailwind plugin

Live preview and template repo: [github.com/ardzero/bunext](https://github.com/ardzero/bunext)

## Socials

- Website: [ardastroid.com](https://ardastroid.com)
- Email: [hello@ardastroid.com](mailto:hello@ardastroid.com)
- GitHub: [@ardzero](https://github.com/ardzero)

## License

MIT License

Copyright (c) 2026  
Farhan Ashhab Nur / [@ardzero](https://github.com/ardzero)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
