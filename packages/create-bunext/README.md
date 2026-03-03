[![Bunext](https://bunext.ardzero.com/ogImage.jpg)](https://bunext.ardzero.com/)

# create-bunext

A CLI tool to scaffold the A CLI tool to scaffold the **Bunext** Next.js 16 starter kit configured with Tailwind CSS, Shadcn UI, Tailwind Motion, React Motion, and a bunch of utilities pre-configured.

## Quick Start

```bash
# Recommended (Bun)
bun create bunext my-app

# Or with npm
npm create bunext@latest my-app
```

## CLI Usage

### Interactive Mode

Run without extra flags for a guided setup:

```bash
bun create bunext
```

The CLI will guide you through:

1. **Project name & directory** (with validation and safety checks)
2. **Install dependencies?** (yes/no)
3. **Initialize git repository?** (yes/no)
4. **Connect to a remote repository?** (GitHub/GitLab, optional)
5. **Open in editor?** (Cursor / VS Code / Skip)

You can also target the **current directory**:

```bash
bun create bunext .
```

> The current directory must be empty (ignoring dotfiles); otherwise the CLI will abort with a clear message.

### Quick Setup

```bash
# Use defaults (install deps, init git, ask for editor)
bun create bunext my-app -y

# Open in editor after creation
bun create bunext my-app --cursor
bun create bunext my-app --vscode

# Skip steps
bun create bunext my-app --no-install
bun create bunext my-app --no-git

# Use current directory (must be empty)
bun create bunext . -y

# Combine options
bun create bunext my-app -y --cursor
```

### Available Flags

| Flag                         | Description                                                |
| :--------------------------- | :--------------------------------------------------------- |
| `-y`, `--yes`                | Skip all prompts and use defaults (install deps, init git) |
| `--install` / `--no-install` | Install or skip installing dependencies                    |
| `--git` / `--no-git`         | Initialize or skip git repository                          |
| `--cursor`                   | Open project in Cursor after creation                      |
| `--vscode`                   | Open project in VS Code after creation                     |
| `-h`, `--help`               | Show help message with examples                            |
| `-v`, `--version`            | Show CLI version                                           |

> For the full help output:

```bash
bun create bunext --help
```

## CLI Features

- 🎨 **Nice terminal UX** – Uses `@clack/prompts` and `picocolors` for clean, interactive output with spinners.
- 💬 **Interactive prompts** – Guided flow for project name, install, git init, remote setup, and editor.
- ⚡ **Fast mode** – `-y` / `--yes` to skip all prompts and use sane defaults.
- 🧹 **Template cleanup** – Clones `ardzero/bunext`, then removes CLI-only bits (`packages`, `create-bunext`, docs, workflows).
  json` name.
- 🛡️ **Graceful error handling** – Friendly messages for network issues, permission problems, git config issues, etc.
- 🔗 **Git & remote integration** – Can init git, add a remote (GitHub/GitLab), and optionally push on first run.
- 🎯 **Editor integration** – One-click open in Cursor or VS Code (via `cursor` / `code` CLIs).

## Troubleshooting

### Network Issues (Cloning or Installing)

If cloning the template fails (e.g. cannot reach GitHub):

```bash
# Check connection and retry
bun create bunext my-app
```

If dependency installation is the problem, you can skip it:

```bash
# Create without installing dependencies
bun create bunext my-app --no-install

# Then install manually later
cd my-app

# Using Bun
bun install

# Or npm
npm install
```

On install failures, the CLI will offer to continue without installing and print the exact command you can run later.

### Git Issues

If git isn’t configured or installed, the CLI will warn and continue without blocking.

```bash
# Configure git if not already done
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Or skip git initialization
bun create bunext my-app --no-git
```

If you choose to connect a remote and it fails (auth, repo not found, etc.), the CLI shows the exact `git` commands you can run manually later.

### Editor Not Opening

Make sure the CLI launchers are installed:

- **VS Code**: Install the `code` command via Command Palette → “Shell Command: Install 'code' command in PATH”
- **Cursor**: Install the `cursor` command from Cursor settings

If the editor CLI isn’t found, the tool will just print how to `cd` into the project and open it manually.

### Current Directory Not Empty

When using:

```bash
bun create bunext .
```

The current directory must be empty (excluding dotfiles). If not, the CLI cancels with:

> "Current directory is not empty. Please use an empty directory or specify a new project name."

Create an empty folder first or use a project name instead:

```bash
mkdir my-app && cd my-app
bun create bunext .
# or
cd ..
bun create bunext my-app
```

## What’s Included (Bunext Template)

The generated project is the **Bunext** starter, which includes:

- **Next.js 16** App Router
- **Tailwind CSS v4**
- **Shadcn UI** components
- **Tailwind Motion** for animation primitives
- **React Motion** (`motion.dev`) preconfigured for advanced animations
- **Dark / light theme support** via Next theme provider
- **Custom utility components** like `metadata`, `JsonLD`, `Img`, `Icons`, `ogImageGen`, `featureFlag`, `clink` (conditional link), `code-block`, etc.
- **Font optimization** using Next.js fonts
- **Lucide React** icon set
- **URL state with nuqs** for query param state management
- **SEO helpers** – metadata generator (including Apple touch icons)
- **Custom Image utilities** with lazy loading and generated placeholders (with or without `next/image`)
- **Prettier** with Tailwind plugin for class sorting
- Handy utilities like QR code gen, string shortener, unique code gen, image placeholders, email validation, hashing, and more

For full template documentation and live preview, see: [`https://github.com/ardzero/bunext`](https://github.com/ardzero/bunext/)

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
