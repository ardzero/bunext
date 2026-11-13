[![?{project-name}](?{repo-link}/blob/main/public/?{og-image-path})](?{repo-link})

# ?{project-name}

An Nextjs website built on top of the [bunext](https://bunext.ardzero.com/) starter kit.

### Project Repo: [?{project-name}](?{repo-link})

## Quick start

> Requires [Bun](https://bun.sh) and an empty Postgres database ([Neon](https://neon.tech) works out of the box).

```bash
bun install
# creates .env.local, generates BETTER_AUTH_SECRET, asks for DATABASE_URL and
# your admin email, tests the connection and migrates. Safe to run again.
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
| `bun run setup:vercel`  | Push the secret, database and mail settings to Vercel; migrate     |
| `bun run db:generate`   | Create a migration from schema changes in `src/lib/db/schema`      |
| `bun run db:migrate`    | Apply pending migrations                                           |
| `bun run db:studio`     | Browse the database with Drizzle Studio                            |
| `bun run auth:generate` | Regenerate `src/lib/db/schema/auth.ts` after changing auth plugins |
| `bun run seed:admin`    | Promote the user with `ADMIN_EMAIL` to admin                       |
| `bun run test`          | Run the tests (loads `.env.local`; bare `bun test` does not work)  |
| `bun run typecheck`     | Type-check                                                         |
| `bun run lint`          | Lint                                                               |

## Environment variables

Set them in `.env.local` locally and in your host's settings in production. `.env.example` lists them all.

| Variable                                     | Required      | Purpose                                                                                                                                                                                                  |
| :------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                         | yes           | Signs sessions and encrypts stored provider tokens. 32+ characters, keep it stable (`openssl rand -base64 32`); changing it signs everyone out and users must reconnect their providers                  |
| `BETTER_AUTH_URL`                            | in production | Canonical URL, e.g. `https://example.com`; must be https in production (http only for localhost). On Vercel it can be left out: production uses the project's production domain, previews the branch URL |
| `DATABASE_URL`                               | yes           | Runtime connection, pooled where available                                                                                                                                                               |
| `DATABASE_URL_UNPOOLED`                      | no            | Direct connection for migrations; falls back to `DATABASE_URL`                                                                                                                                           |
| `ADMIN_EMAIL`                                | no            | Used by `bun run setup` and `bun run seed:admin`                                                                                                                                                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | no            | Enables Google sign-in                                                                                                                                                                                   |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | no            | Enables Discord sign-in                                                                                                                                                                                  |
| `RESEND_API_KEY`, `MAIL_FROM`                | in production | Sends real email through [Resend](https://resend.com). Turns on required email verification, password reset and magic links in production                                                                |
| `ALLOW_NO_MAILER`                            | no            | `true` lets production start without the two above (see below)                                                                                                                                           |

When a user whose email isn't verified yet signs in with a magic link, Better Auth removes the sign-in methods they added before proving the address (password, linked providers) and signs out their other sessions. This prevents account pre-hijacking. They can set a password again with "Forgot password?".

Each connected provider's profile picture is saved (`provider_avatar` table). A new user gets their provider's picture; a user who already has one keeps it and can switch on the account page. Upgrading an existing install needs `bun run db:migrate` for this table.

Production refuses to start without a mailer, unless `ALLOW_NO_MAILER=true`. With it, no email is ever sent or logged: sign-up doesn't require verification (so the sign-up form reveals whether an address is registered), and password reset and magic links are turned off. In development, emails are printed to the terminal.

Security defaults: magic-link tokens are stored hashed, mail is limited to 5 emails per address per 15 minutes in production (on top of Better Auth's per-IP limits; anyone can use up an address's quota, which delays that user's own emails for up to 15 minutes), and password sign-in has separate limits that never touch the mail quota: 5 attempts per address and IP and 20 per address across all IPs, per 15 minutes. Hitting the per-address cap blocks password sign-in for that address until the window ends, while magic links and password reset keep working. Provider access and refresh tokens are encrypted at rest with `BETTER_AUTH_SECRET`, and Better Auth's browser-facing token endpoints (`/get-access-token`, `/refresh-token`, `/account-info`) are turned off; server code reads tokens with `auth.api.getAccessToken`. Every response carries anti-framing, `nosniff`, referrer and (in production) HSTS headers (without `includeSubDomains`; add it once every subdomain serves HTTPS) from `next.config.ts`. Signing in with a provider whose email matches an existing account links it only when both the provider and the account have verified that email; otherwise the user signs in another way and connects the provider from `/account`.

## Authentication

Built with [Better Auth](https://www.better-auth.com) and [Drizzle](https://orm.drizzle.team) on Postgres.

- Email and password, magic links, Google and Discord (each provider is enabled only when both of its keys are set)
- Roles `user` (default) and `admin`, with an admin user list at `/admin`. Through Better Auth's admin API, admins can list and view users, ban or unban them and revoke their sessions; impersonation, role changes, deleting users and setting their password or email are not granted (see `adminAc` in `src/lib/auth/auth.ts`)
- Account page at `/account`: profile, profile picture (pick one from any connected provider, or refresh it), password, connected accounts, active sessions
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

1. Sign up with the address you want to be admin. `bun run setup` asks for it and saves it as `ADMIN_EMAIL`; otherwise set it in `.env.local`.
2. Run `bun run seed:admin` (or `bun run setup` again), then reload.

With a mailer configured, an account whose email isn't verified is refused, since anyone can sign up with an address they don't own. The account's sign-up date is always printed so you can check it's yours.

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

Preview deployments run as production, so they need the same variables as production; without them every request returns a 500.

1. Push the repository and import it in Vercel.
2. Run `bun run setup:vercel` (or answer yes at the end of `bun run setup`). For Preview and Production it sets a separate `BETTER_AUTH_SECRET`, asks for the database URL (use a separate database or Neon branch for previews) and migrates it, and asks for Resend settings (Enter sets `ALLOW_NO_MAILER=true`). It never overwrites a variable that's already set. Needs the [Vercel CLI](https://vercel.com/docs/cli).
   To set them by hand instead, add `BETTER_AUTH_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `RESEND_API_KEY` and `MAIL_FROM` (or `ALLOW_NO_MAILER=true`) to **both** Preview and Production. The Neon integration in the Vercel Marketplace can set the database URLs for you. `BETTER_AUTH_URL` is optional on Vercel; set it (https) if your canonical domain isn't the project's production domain.
3. **Run migrations against the production database before the first deploy** (and after every schema change; `setup:vercel` does it for databases you enter there):

   ```bash
   DATABASE_URL_UNPOOLED="<production direct url>" bun run db:migrate
   ```

4. Deploy, then register the production callback URLs with Google and Discord.
5. For production email (verification, password reset and magic links), verify a domain in Resend before setting `RESEND_API_KEY` and `MAIL_FROM`.

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
