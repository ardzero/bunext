[![Bunext](https://bunext.ardzero.com/ogImage.jpg)](https://bunext.ardzero.com/)

# Bunext

An opinionated Next.js 16 app template with Tailwind CSS, Shadcn, and Tailwind-motion, along with built-in utilities. [Live deployment](https://bunext.ardzero.com/)
Repo: [Github Repo](https://github.com/ardzero/bunext)

## Getting Started

Create a new project using:

```bash
bun create bunext@latest
```

Or with npm:

```bash
npm create bunext@latest
```

### Quick Setup Options

```bash
# Interactive mode (recommended for first time)
bun create bunext my-app

# Skip all prompts, use defaults
bun create bunext my-app -y

# Open in editor after creation
bun create bunext my-app --cursor
bun create bunext my-app --vscode

# Skip dependency installation
bun create bunext my-app --no-install

# Combine options
bun create bunext my-app -y --cursor
```

Run with `--help` flag to see all available options:

```bash
bun create bunext --help
```

## Usage (run locally)

> Requires `bun` or `nodejs` installed and up to date

Go to the `root` folder where `package.json` exists.

> Skip this if you used `bun create bunext` with dependency installation (default)

```bash
# Using bun
bun install

# Using npm
npm install
```

### Then

```bash
# Using bun
bun run dev

# Using npm
npm run dev
```

#### Command list

| Command           | Action                                        |
| :---------------- | :-------------------------------------------- |
| `bun run dev`     | Starts local dev server at `localhost:3000`   |
| `bun run build`   | Build your production app to `./.next/`       |
| `bun run start`   | Start the production server (run after build) |
| `bun run preview` | Build and start production server locally     |
| `bun run lint`    | Run ESLint                                    |
| `bun run format`  | Run Prettier to format code                   |

> Just replace `bun` with `npm` if you're using npm

## Features

- Next.js 16 App Directory
- Tailwind v4 CSS
- [Shadcn](https://ui.shadcn.com/) components
- Custom util components like `metadata, JsonLD, Img, Icons, ogImageGen, featureFlag, clink (conditional link), code-block etc`
- Custom font optimization using [Next font](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)
- Icons using [lucide-react](https://lucide.dev/)
- Next theme provider (dark and light mode)
- URL state management using [nuqs](https://nuqs.47ng.com/)
- Tailwind CSS only animations using [tailwindcss-motion](https://docs.rombo.co/tailwind)
- Configured with [react motion](https://motion.dev/docs/react) for advance animations.
- Feature flags
- Metadata generator for SEO (including apple-touch-icon)
- Custom Image components with lazy loading and auto generated placeholder (works with or without `next/image`)
- [Prettier](https://prettier.io/) configured with tailwind plugin for formatting classes
- Utilities like `qrCode gen, string shortner, uniqueCode gen, img placeholder, email validation, hashing etc`

## Config

- For generating colors use [realtime-colors](https://www.realtimecolors.com/) or [shadcnstudio](https://shadcnstudio.com/) and paste it in `src/styles/globals.css`
- Add fonts in `src/styles/tailwind/fonts.ts`
- To configure feature flags go to `src/lib/utils/featureflags.ts`
- To configure Metadata go to `src/lib/data/siteData.ts`
- Advance Metadata config in `src/lib/config/siteConfig.ts`
- For base styles (scrollbar style, selection highlighting etc) go to `src/styles/globals.css`

## Roadmap

- [x] Add next themes
- [x] Feature flags
- [x] Add sample server actions
- [x] Add syntax highlighting for code blocks
- [x] Add react motion
- [ ] Add a feature full branch with drizzle orm, analytics, auth

## Socials

- Website: [ardastroid.com](https://ardastroid.com)
- Email: [hello@ardastroid.com](mailto:hello@ardastroid.com)
- GitHub: [@ardzero](https://github.com/ardzero)

## License

MIT License

Copyright (c) 2026 Farhan Ashhab Nur / [@ardzero](https://github.com/ardzero)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
