[![?{project-name}](?{repo-link}/blob/main/public/?{og-image-path})](?{repo-link})

# ?{project-name}

An Nextjs website built on top of the [bunext](https://bunext.ardzero.com/) starter kit.

### Project Repo: [?{project-name}](?{repo-link})

## Quick start

> Requires [Bun](https://bun.sh) and an empty Postgres database ([Neon](https://neon.tech) works out of the box).

```bash
bun install
# creates .env.local (if missing) and generates BETTER_AUTH_SECRET
bun run setup
# add DATABASE_URL to .env.local, then run setup again: it tests the connection and migrates
bun run setup
bun run dev
```

Open [localhost:3000](http://localhost:3000), create an account, and you're in. Email and password sign-in works with nothing else configured. In development, auth emails (verification, password reset, magic link) are printed to the terminal.

#### Command list

| Command                 | Action                                                             |
| :---------------------- | :----------------------------------------------------------------- |
| `bun run dev`           | Start the dev server at `localhost:3000`                           |
| `bun run build`         | Production build                                                   |
| `bun run start`         | Serve the production build                                         |
| `bun run setup`         | Create `.env.local`, generate the secret, check the DB, migrate    |
| `bun run db:generate`   | Create a migration from schema changes in `src/lib/db/schema`      |
| `bun run db:migrate`    | Apply pending migrations                                           |
| `bun run db:studio`     | Browse the database with Drizzle Studio                            |
| `bun run auth:generate` | Regenerate `src/lib/db/schema/auth.ts` after changing auth plugins |
| `bun run seed:admin`    | Promote the user with `ADMIN_EMAIL` to admin                       |
| `bun test`              | Run the tests (`bun run test` loads `.env.local`)                  |
| `bun run typecheck`     | Type-check                                                         |
| `bun run lint`          | Lint                                                               |

## Environment variables

Set them in `.env.local` locally and in your host's settings in production. `.env.example` lists them all.

| Variable                                     | Required      | Purpose                                                                                                                |
| :------------------------------------------- | :------------ | :--------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                         | yes           | Signs sessions. 32+ characters, keep it stable (`openssl rand -base64 32`)                                             |
| `BETTER_AUTH_URL`                            | in production | Canonical URL, e.g. `https://example.com`. Vercel previews fall back to `https://$VERCEL_URL`                          |
| `DATABASE_URL`                               | yes           | Runtime connection, pooled where available                                                                             |
| `DATABASE_URL_UNPOOLED`                      | no            | Direct connection for migrations; falls back to `DATABASE_URL`                                                         |
| `ADMIN_EMAIL`                                | no            | Used by `bun run seed:admin`                                                                                           |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | no            | Enables Google sign-in                                                                                                 |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | no            | Enables Discord sign-in                                                                                                |
| `RESEND_API_KEY`, `MAIL_FROM`                | no            | Sends real email through [Resend](https://resend.com). Turns on required email verification and production magic links |

When a user whose email isn't verified yet signs in with a magic link, Better Auth removes the sign-in methods they added before proving the address (password, linked providers) and signs out their other sessions. This prevents account pre-hijacking. They can set a password again with "Forgot password?".

Without a mailer, production still works: sign-up doesn't require verification, magic links are hidden, and the server logs a warning at startup.

## Authentication

Built with [Better Auth](https://www.better-auth.com) and [Drizzle](https://orm.drizzle.team) on Postgres.

- Email and password, magic links, Google and Discord (each provider is enabled only when both of its keys are set)
- Roles `user` (default) and `admin`, with an admin user list at `/admin`
- Account page at `/account`: profile, password, connected accounts, active sessions
- Protected area under `src/app/(app)`; auth pages under `src/app/(auth)`

### Protecting pages and actions

`src/proxy.ts` only checks that a session cookie exists, so it can redirect quickly. **Always** check on the server:

```tsx
import { requireRole, requireSession } from "@/lib/auth/session";

const Page = async () => {
	const { user } = await requireSession(); // redirects to /sign-in when signed out
	// ...
};

const AdminPage = async () => {
	await requireRole("admin"); // redirects to /dashboard for other roles
	// ...
};
```

To show or hide UI, use `<SignedIn>`, `<SignedOut>` and `<RoleGate role="admin">` from `src/components/auth`.

### Google

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** (application type: Web application).
2. Authorized JavaScript origins: `http://localhost:3000` and your production URL.
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
4. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then restart the dev server.

### Discord

1. In the [Discord developer portal](https://discord.com/developers/applications), create an application and open **OAuth2**.
2. Add the redirects:
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://<your-domain>/api/auth/callback/discord`
3. Copy the client ID and secret into `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`, then restart the dev server.

`bun run setup` prints these callback URLs for localhost and for `BETTER_AUTH_URL`.

### First admin

1. Sign up with the address you want to be admin.
2. Set `ADMIN_EMAIL` to that address in `.env.local`.
3. Run `bun run seed:admin`, then reload.

### Adding a provider

1. Add its id to `PROVIDER_IDS` in `src/lib/auth/provider-ids.ts`.
2. Add an entry with its env vars in `src/lib/auth/providers.ts` and the vars to `src/lib/env.ts` and `.env.example`.
3. Add its icon to `PROVIDER_ICONS` in `src/components/auth/social-buttons.tsx`.

Any [provider Better Auth supports](https://www.better-auth.com/docs/concepts/oauth) works the same way. The buttons appear automatically once the keys are set.

### Adding a role

1. Add it to `ROLES` in `src/lib/auth/roles.ts`.
2. Give it admin-plugin permissions in `rolePermissions` in `src/lib/auth/auth.ts`, for example `editor: accessControl.newRole({ user: ["list"] })`. TypeScript flags the missing entry.
3. Use it with `requireRole("editor")` or `<RoleGate role="editor">`. Assign it with `auth.api.setRole()` from server code.

### Switching Postgres provider

The app only needs a Postgres connection string. Point `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`, if your provider gives you a direct URL) at the new database, then run `bun run db:migrate`. The driver runs with `prepare: false`, so transaction poolers (Neon, Supabase, PgBouncer) work as they are.

### Database changes

- Your tables go in `src/lib/db/schema/app.ts`. Run `bun run db:generate`, then `bun run db:migrate`, and commit the files in `drizzle/`.
- Never edit `src/lib/db/schema/auth.ts` by hand. After changing auth plugins, run `bun run auth:generate`, then `bun run db:generate`.

## Deploying to Vercel

1. Push the repository and import it in Vercel.
2. Add the environment variables: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your production URL), `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and any optional ones. The Neon integration in the Vercel Marketplace can set the database URLs for you.
3. **Run migrations against the production database before the first deploy** (and after every schema change):

   ```bash
   DATABASE_URL_UNPOOLED="<production direct url>" bun run db:migrate
   ```

4. Deploy, then register the production callback URLs with Google and Discord.
5. For production email (verification and magic links), verify a domain in Resend and set `RESEND_API_KEY` and `MAIL_FROM`.

## Tech Stack

- [Nextjs 16](https://nextjs.org/)
- [Better Auth](https://www.better-auth.com/) + [Drizzle ORM](https://orm.drizzle.team/) on Postgres
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Shadcn](https://ui.shadcn.com/) components
- Tailwind CSS animations using [tailwindcss-motion](https://docs.rombo.co/tailwind)
- [Motion react](https://motion.dev/docs/react) (animation lib)
- [Prettier](https://prettier.io/) for formating with [tailwind plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) configure
- [Eslint](https://eslint.org/) for linting with prettier plugin

## Config

- Data `src/lib/data/*`
- Metadata config `src/lib/data/siteData.ts`
- Types `src/types/*`

## Socials

- Website: [ardastroid.com](https://ardastroid.com)
- Email: [hello@ardastroid.com](mailto:hello@ardastroid.com)
- GitHub: [@ardzero](https://github.com/ardzero)

## License

MIT License

Copyright (c) 2026 Ard Astroid / Farhan Ashhab Nur

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
