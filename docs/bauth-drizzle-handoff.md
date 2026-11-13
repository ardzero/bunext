# Bunext Auth + Drizzle: implementation handoff (v0.1)

You are implementing the `auth + drizzle` variant of the Bunext template. This file replaces any earlier plan on this; where they disagree, this file wins. Read `AGENTS.md` first and follow its code rules (early returns, no `useEffect` unless unavoidable, Tailwind only, `handle*` event names, `const` arrow functions, never replace `globals.css`).

## 1. Goal

A project scaffolded with `bun create bunext my-app --better-auth-drizzle` has working email/password, magic-link, Google and Discord sign-in, a Postgres database through Drizzle, and two roles (`user`, `admin`). A fresh clone runs on email/password alone; everything else switches on through env vars.

The base must stay small and product-neutral. If something is not listed in section 5, do not build it.

## 2. Current state of the repo (verified)

- Branch `bauth-drizzle` exists and is currently identical to `main` apart from trivial diffs. It contains **no auth code, no forms, no dashboard**. Everything is built from scratch.
- `.github/workflows/sync-bauth-drizzle.yml` merges `main` into `bauth-drizzle` automatically. Never rebase the branch. Keep changes to files that also exist on `main` small, to limit merge conflicts.
- `packages/create-bunext/cli.ts` has a `--better-auth-drizzle` flag and a matching prompt, but they only write `bunext.config.json`. The CLI always clones the default branch (line 286). Cloning the auth branch is not implemented.
- The CLI removes an explicit list of paths (`PATHS_TO_REMOVE`). `scripts/`, `recipes/`, `drizzle/` and `.env.example` survive scaffolding.
- `.gitignore` contains `.env*`, which also ignores `.env.example`.
- `next.config.ts` sets `compiler.removeConsole` in production, which strips `console.warn` from server code too.
- `src/lib/utils/user.ts` is a stub (`admin | tester | user`, hard-coded `getUser()`), used by `src/lib/utils/featureFlags.ts`.
- `nuqs` 2.10.3 is installed and `NuqsAdapter` wraps the app in `src/components/providers/root-provider.tsx`.
- `src/components/ui` follows current shadcn conventions: small parts, `data-slot` attributes, `className` merged through `cn`, native props spread, `cva` for variants. Read `card.tsx`, `field.tsx`, `input-group.tsx` and `button.tsx` before writing auth components.
- There is no test runner and no CI for typecheck, lint or build.
- Docker is not available on the dev machine. Bun 1.4.4 and Node 26 are.
- Pushing changes under `packages/create-bunext/**` to `main` triggers an npm publish if the version is new.

## 3. Decisions (all final)

| Topic | Decision |
|---|---|
| Auth library | Better Auth, latest stable release (no beta), pinned to an exact version |
| ORM | Drizzle ORM + drizzle-kit, pinned exact |
| Database | Postgres only. Neon is the documented default, not a dependency |
| Driver | `postgres` (postgres.js) with `prepare: false`, in one file. No driver switch |
| Roles | Better Auth admin plugin, roles `user` (default) and `admin`, defined in `roles.ts` |
| Account linking | On. A signed-in user can link Google or Discord; automatic linking only when the provider reports a verified email |
| Email verification | Required only when a real mailer is configured. Without one, sign-up works unverified and production logs a warning |
| Magic link | Better Auth magic-link plugin, offered on the sign-in page as an alternative to the password. Available in development (console mailer) and in production only when a real mailer is configured; otherwise the option is not rendered. An unknown email creates an account, as with social sign-in |
| Mail | `mailer.ts` interface, console mailer for dev, Resend adapter enabled by `RESEND_API_KEY` |
| Route protection | `proxy.ts` does a cookie-presence check only. Real checks happen in server code through `requireSession()` and `requireRole()` |
| Providers | One env-gated list in `providers.ts`, shared by server config and UI |
| Base URL | `BETTER_AUTH_URL`; on Vercel previews fall back to `https://${VERCEL_URL}` |
| Rate limiting | Stored in the database |
| CLI flag | Keep `--better-auth-drizzle`. `-y` keeps the base template |
| Tests | `bun test` |
| Auth UI | Built on the existing shadcn primitives in `src/components/ui`. Behavior follows Clerk's prebuilt components; component API follows shadcn's composition style. See M5 |
| URL state | `returnTo` is read and sanitized on the server. `nuqs` is available for client URL state (for example the active account section) but is never the source of a redirect target |

`prepare: false` means the driver sends plain queries instead of prepared statements. Pooled connections (Neon's pooler, Supabase's transaction pooler) hand each query to a different backend connection, and prepared statements break there. Turning them off makes one driver config work on every Postgres provider.

**Cut from v0.1, do not build:** impersonation, a `DB_DRIVER` override, custom user fields added to the auth schema (for example locale; the display name on the account page is Better Auth's built-in `name`), the Expo plugin and `MOBILE_SCHEME`, wildcard allowed-hosts for previews, `bun run doctor`, recipes, a database prompt in the CLI, a `--setup` CLI flag, payments, organizations, Sign in with Apple, CI workflows.

## 4. What the human provides

Only one thing is needed before you start milestone 2: a `DATABASE_URL` for an empty Neon database in `.env.local`. If it is missing when you reach milestone 2, stop and ask for it.

Google and Discord keys are optional. If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` or `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` are present in `.env.local`, test those flows; if not, verify only that the buttons are hidden and the config builds, and say so in your report.

You do not deploy, publish, push or create provider apps. Those are in section 8.

## 5. Milestones

Work on a branch `feat/auth-base` created from `bauth-drizzle`. Commit at the end of each milestone. Do not push. Do not touch `packages/` on this branch.

Every milestone ends with `bun run typecheck`, `bun run lint`, `bun run build` and `bun test` passing.

### M0: Pins and doc check

- Find the latest stable versions of `better-auth`, `drizzle-orm`, `drizzle-kit`, `postgres`, `zod` and `resend`. Read the Better Auth docs **for that exact version** before writing config.
- Confirm against those docs: the Next.js 16 integration (`nextCookies()` last, `getSessionCookie` for `proxy.ts`), the admin plugin's role option and schema, account-linking options, `emailAndPassword.requireEmailVerification`, database rate-limit storage, the schema generate command, and the env var names.
- Confirm the magic-link plugin for the pinned version: server and client plugin setup, whether it needs schema changes, token expiry and single use, how new users are created (including the name field), and the error codes returned on an expired or reused link.
- Confirm the client calls the account page needs exist in the pinned version: update user, change password with other-session revocation, list and unlink accounts, list and revoke sessions.
- Write the pinned versions and any corrected assumption into a short `Pinned versions` section at the bottom of this file.

If the docs contradict a decision in section 3, stop and report rather than improvising.

### M1: Foundation

- Add the dependencies with exact versions.
- Scripts: `db:generate`, `db:migrate`, `db:studio`, `auth:generate`, `setup`, `seed:admin`, `test`.
- `.gitignore`: add `!.env.example`.
- `.env.example` with every variable from section 6, commented.
- `src/lib/env.ts`: zod-validated server env. In production, throw if `BETTER_AUTH_SECRET` is missing or shorter than 32 characters. Mark it server-only.
- `next.config.ts`: change `removeConsole` to keep `error` and `warn`.
- Commit `bunext.config.json` containing `{ "betterAuthDrizzle": true }` so tooling can detect the variant.

### M2: Database

- `src/lib/db/index.ts`: the only file that imports the driver. Reads `DATABASE_URL`, creates the postgres.js client with `prepare: false`, wraps it in Drizzle, and keeps a `globalThis` singleton in development.
- `src/lib/db/schema/auth.ts` (generated in M3), `schema/app.ts` (domain tables; holds `provider_avatar`, see Profile pictures below), `schema/index.ts`.
- `drizzle.config.ts`: uses `DATABASE_URL_UNPOOLED`, falling back to `DATABASE_URL`.
- No provider-specific features in the schema.

Done when: `bun run db:migrate` runs cleanly against the provided database.

### M3: Auth core

- `src/lib/auth/providers.ts`: list of `{ id, label, clientId, clientSecret }` built from env; an entry is enabled only when both values are set. Export a client-safe list of enabled `{ id, label }` for the UI.
- `src/lib/auth/mailer.ts`: `sendMail({ to, subject, html })` interface; Resend when `RESEND_API_KEY` and `MAIL_FROM` are set, console otherwise. Export `hasRealMailer`. In production without a real mailer, log one `console.warn` at startup.
- `src/lib/auth/auth.ts`: Drizzle adapter; email/password with `requireEmailVerification: hasRealMailer`; verification and reset emails through the mailer; social providers from `providers.ts`; account linking; admin plugin with roles from `roles.ts`; magic-link plugin sending through the mailer, registered only when `magicLinkEnabled` (export this flag: `hasRealMailer` or not production); database rate limiting, with a stricter rule on the magic-link and password-reset request endpoints; base URL and trusted origins per section 3; `nextCookies()` last.
- `src/lib/auth/auth-client.ts` (with the magic-link client plugin), `src/app/api/auth/[...all]/route.ts`.
- `src/lib/auth/session.ts` (server-only): `getSession()` wrapped in React `cache`, and `requireSession()` which redirects to `/sign-in?returnTo=…` when there is no session.
- Generate `schema/auth.ts` with the Better Auth CLI, then `db:generate` and `db:migrate`. Commit the migration. Never hand-edit generated auth tables.

Done when: sign-up, sign-in, session read and sign-out work through the API on localhost.

### M4: Roles and safe redirects

- `src/lib/auth/roles.ts`: the role list, the `Role` type, the default role, and `requireRole(...roles)` built on `requireSession()`; it calls `forbidden()` or redirects when the role does not match (pick whichever the pinned Next.js version supports without experimental flags).
- The role must not be settable from sign-up or any client input. Verify how the pinned admin plugin guards this and add a test.
- Delete `src/lib/utils/user.ts`. Update `featureFlags.ts` to take its role type from `roles.ts`; remove `tester` from the sample flag. Fix every other import.
- `src/lib/auth/safe-redirect.ts`: `safeRedirect(value, fallback = "/dashboard")` returns the value only when it is a relative same-origin path. Reject absolute URLs, `//`, backslashes, encoded variants, control characters and `javascript:`.
- `scripts/seed-admin.ts`: promotes the existing user whose email equals `ADMIN_EMAIL` to `admin`. If no such user exists, print "sign up first" and exit non-zero.

Tests (`bun test`):
- `safe-redirect`: at least ten hostile payloads rejected, three valid paths accepted.
- `providers`: a provider with one missing env var is disabled.
- Integration, against `DATABASE_URL`: a sign-up request carrying `role: "admin"` produces a `user`. Clean up the test user afterwards.

### M5: UI

Route groups, next to the existing `(index)`:

- `src/app/(auth)/`: `sign-in`, `sign-up`, `forgot-password`, `reset-password`, `verify-email`. One shared centered card layout. A signed-in visitor is redirected to `/dashboard`.
- `src/app/(app)/layout.tsx`: calls `requireSession()`, renders a simple header with the `UserButton`.
- `src/app/(app)/dashboard/page.tsx`: shows the session user. Placeholder content only.
- `src/app/(app)/admin/page.tsx`: calls `requireRole("admin")`; lists users read-only.
- `src/app/(app)/account/page.tsx`: composes the account sections listed below.
- `src/components/auth/`: the components specified below.
- `src/proxy.ts`: redirects to `/sign-in` when the session cookie is absent on `/dashboard`, `/admin`, `/account`. No database access.
- Add a "Sign in" link to the existing home page, shown through `SignedOut`, and the `UserButton` through `SignedIn`.

#### Two references

**Behavior: Clerk's prebuilt components.** Before building, read Clerk's docs for `<SignIn />`, `<SignUp />`, `<UserButton />`, `<UserProfile />`, `<SignedIn>`, `<SignedOut>`, `<Protect>` and `<SignOutButton>`, and try the hosted demo if reachable. Use them to decide what each component is responsible for, which states it has, and how flows hand over to each other. Do not copy Clerk's visual design, its `appearance` prop, or its single-config-object API. Features Clerk has that are cut here: passkeys, MFA, phone, username, email one-time codes, organizations, legal consent, "last used" badges, account deletion.

**API: shadcn's composition style.** Each feature is a set of small named parts that compose, like `Card` + `CardHeader` + `CardContent`. Concretely:
- One concern per part. No component takes a config object or boolean flags that switch whole sections on and off; the page decides what to render by composing parts.
- Every part accepts `className` (merged with `cn`) and spreads the remaining native props onto its root element. Type props as `React.ComponentProps<...>` plus the few extras.
- Every part sets a `data-slot="…"` attribute. Variants use `cva`.
- Polymorphism uses `asChild` with `Slot`, as `button.tsx` in this repo does; do not introduce a second pattern.
- Reuse the existing `Card`, `Field*`, `InputGroup*`, `Button`, `Separator`, `DropdownMenu*`, `Badge` parts rather than re-wrapping them. Add `avatar` through the shadcn CLI. Add nothing else unless a listed responsibility needs it.
- Named exports at the bottom of the file, as in `src/components/ui`. Declarations follow `AGENTS.md` (`const` arrow functions).
- Client boundaries stay small: only parts that hold state or call the auth client are client components.

#### Components and what each one handles

Auth entry (`src/components/auth/`):

| Part | Handles |
|---|---|
| `SocialButtons`, `SocialButton` | `SocialButtons` renders one `SocialButton` per enabled provider and renders nothing when the list is empty (the "or" separator disappears with it). `SocialButton` takes `provider` and `redirectTo`, shows the provider icon and label, starts the OAuth flow, shows its own pending state and disables its siblings while pending |
| `PasswordInput` | Built on `InputGroup`; show/hide toggle with an accessible label; passes through `autoComplete` |
| `SignInForm` | Email and password fields; "Forgot password?" link; inline field errors; a form-level error for wrong credentials that does not reveal whether the email exists; pending state; redirect to `redirectTo` on success; when the account is unverified, shows the "check your email" state with a resend action |
| `MagicLinkForm` | Email field only; requests a sign-in link carrying `redirectTo` as the callback; then shows a "check your email" state with the address, a resend action with a cooldown, and a way back to change the email. Shows the same confirmation whether or not the account exists |
| `SignUpForm` | Name, email, password; password rules shown before submit, not only on error; duplicate-email error; on success either redirects (verification off) or switches to the "check your email" state with resend (verification on) |
| `ForgotPasswordForm` | Email field; always shows the same confirmation whether or not the account exists |
| `ResetPasswordForm` | Reads the token from the URL; new password plus confirm; handles a missing, expired or already-used token with a link back to forgot-password; on success goes to sign-in with a confirmation |
| `VerifyEmailStatus` | Success, expired/invalid, and resend states for the verification link landing page |
| `AuthError` | Maps Better Auth and OAuth callback error codes (for example a provider email that belongs to an unlinked account, or access denied) to readable messages. Used by the forms and by the sign-in page for errors arriving in the query string |

The sign-in and sign-up pages compose these inside a `Card`: header (title, description), `SocialButtons`, separator, the form, and a footer link to the other page. On sign-in, when `magicLinkEnabled` is true, the page also renders a switch between `SignInForm` and `MagicLinkForm` ("Email me a sign-in link" / "Use password instead"); the page passes the flag down, the forms do not read env. Keep the chosen method in the URL with `nuqs` so a refresh or the back button keeps it. An expired or reused magic link lands on sign-in with the error shown through `AuthError` and the magic-link form preselected. The footer link carries `returnTo` across, so switching between sign-in and sign-up does not lose the destination.

Session-aware parts:

| Part | Handles |
|---|---|
| `SignedIn`, `SignedOut` | Server components that render children based on `getSession()` |
| `RoleGate` | Server component; `role` (one or several) and optional `fallback`. For showing or hiding UI only; it does not replace `requireRole()` |
| `SignOutButton` | Signs out, then redirects to `/`; pending state; polymorphic so it can render as a menu item |
| `UserAvatar` | Provider image when present, initials fallback |
| `UserButton` | Avatar trigger opening a menu with name and email, role badge, "Account", "Admin" (admins only), theme toggle if the feature flag allows it, and sign out. Fully keyboard operable |

Account page sections (each a `Card`, composed by the page):

| Part | Handles |
|---|---|
| `ProfileForm` | Update display name; email shown read-only with a verified/unverified badge |
| `ChangePasswordForm` | Current, new and confirm password; signs out other sessions on success; rendered only when the user has a password credential (users who only ever signed in with a provider or a magic link see a short note instead) |
| `ProfilePicture` | One row per connected provider with its saved picture; "Use" makes it the profile picture, "Refresh" ("Fetch" when none is saved) pulls the latest one from the provider. Server actions in `src/actions/provider-avatar.ts` |
| `ConnectedAccounts` | One row per enabled provider with linked state and link/unlink actions; refuses to unlink the last remaining sign-in method; shows link errors through `AuthError` |
| `ActiveSessions` | Lists sessions with device and last-active, marks the current one, revokes others individually |

#### Rules for all of them

- `returnTo`: the server page reads it from `searchParams`, passes it through `safeRedirect()`, and hands the result down as the `redirectTo` prop. It is used for the post-login redirect, the social `callbackURL`, and the cross-link between sign-in and sign-up. Client code never reads a redirect target from the URL itself.
- Client parts call the auth client inside `useTransition`; validate with zod before submitting; field errors render inline through `FieldError`, form-level errors render inside the form, and confirmations of completed actions use the `sonner` toaster.
- Every part has UI for idle, pending, error and success. Pending disables the submit control and shows the existing spinner.
- Accessibility: labelled inputs, `autocomplete` values (`name`, `email`, `current-password`, `new-password`), errors linked with `aria-describedby` and announced, focus moved to the first invalid field on a failed submit, visible focus rings.
- Theme tokens only, so light and dark both work. Layout holds from 320px wide.
- Account mutations (password, unlink, revoke session) are re-checked on the server with a fresh session read, not the cookie cache.

Done when: the checks in section 7 pass in a browser.

### M6: Setup script and docs

- `scripts/setup.ts` (`bun run setup`), safe to re-run: create `.env.local` from `.env.example` if absent; generate `BETTER_AUTH_SECRET` if empty; stop with a clear message if `DATABASE_URL` is empty; test the connection; run migrations; print the Google and Discord redirect URIs for localhost and for `BETTER_AUTH_URL` if set; mention `bun run seed:admin`.
- `project_readme.md` (this becomes the scaffolded project's README): quick start, env table, Google and Discord setup with the exact callback URLs, switching Postgres provider (change the two URLs, run `db:migrate`), Vercel deploy steps including running migrations first, first admin, and how to add a provider or a role.
- `AGENTS.md`: add an auth section. Always use `requireSession()` or `requireRole()` in protected server components, actions and route handlers; never rely on `proxy.ts`; regenerate the auth schema instead of editing it; only `src/lib/db/index.ts` imports the driver.

### M7: CLI (separate branch)

Create `feat/cli-auth-clone` from `main`. Change only `packages/create-bunext`.

- When the auth option is chosen, clone with `--branch bauth-drizzle`.
- Stop writing `bunext.config.json` (the branch now ships it).
- For the auth variant after cleanup: copy `.env.example` to `.env.local` and fill `BETTER_AUTH_SECRET` with 32 random bytes, base64.
- Remove the "coming later" wording from the prompt hint, the flag description and `--help`.
- Auth-specific next steps: add `DATABASE_URL` to `.env.local`, `bun run setup`, `bun run dev`, and where provider setup lives in the README.
- Update the CLI README. Bump the version to `1.2.0`.

Verify by building the CLI and running it locally. Because the published auth branch will not contain your work yet, test the clone path by temporarily pointing `REPO_URL` at the local repository; revert that before committing. Confirm the base variant is unchanged with `-y`.

Do not push this branch. Merging it to `main` publishes to npm, so the human does that, and only after `feat/auth-base` is merged into `bauth-drizzle`.

## 6. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Signing and encryption; must stay stable |
| `BETTER_AUTH_URL` | in production | Canonical base URL |
| `DATABASE_URL` | yes | Runtime connection (pooled where available) |
| `DATABASE_URL_UNPOOLED` | optional | Direct connection for migrations |
| `ADMIN_EMAIL` | optional | Used by `seed:admin` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional | Enables Google |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | optional | Enables Discord |
| `RESEND_API_KEY`, `MAIL_FROM` | optional | Real mailer; turns on required email verification and magic links in production |

Confirm the Better Auth names in M0. Callback URLs are `/api/auth/callback/google` and `/api/auth/callback/discord`.

## 7. Acceptance checks (run locally, report each result)

1. `bun install`, `typecheck`, `lint`, `build` and `bun test` pass on `feat/auth-base`. `bun run build` also passes under Node (`npm run build`).
2. With only `BETTER_AUTH_SECRET` and `DATABASE_URL` set: sign-up, sign-out and sign-in work; no social buttons are shown.
3. `/dashboard` without a session redirects to `/sign-in?returnTo=/dashboard`, and signing in returns there.
4. `/sign-in?returnTo=https://evil.example` lands on `/dashboard` after sign-in.
5. With the session cookie replaced by a garbage value, `/dashboard` still redirects (this proves the server check, not the proxy, protects it).
6. A `user` is refused on `/admin`; after `bun run seed:admin`, the same account gets in.
7. Forgot-password and reset work end to end using the link printed by the console mailer.
8. `NODE_ENV=production bun run start` without `BETTER_AUTH_SECRET` fails with a clear error; with it but without a mailer, it starts and logs the warning.
9. If social keys were provided: sign-in works and a user whose email matches an existing account is signed in to it and the provider is connected automatically; a signed-in email user can also link the provider on `/account`. If not, state that this was not tested.
9a. Switching from sign-in to sign-up and back keeps `returnTo`. Wrong-password and unknown-email attempts show the same message. An expired or reused reset link shows the recovery state, not a crash.
9b. On `/account`: switching and refreshing the profile picture per provider, name update, password change and revoking another session work; the last sign-in method cannot be unlinked.
9c. Every auth form is usable by keyboard alone and renders correctly in light and dark at 320px width.
9d. Magic link: requesting one prints the link through the console mailer; opening it signs in and lands on `returnTo`; opening it a second time shows the expired-link state. With `NODE_ENV=production` and no real mailer, the option is not rendered.
10. `bun run setup` works on a copy of the project with no `.env.local`, and is harmless when run twice.
11. The locally built CLI scaffolds both variants; each passes install, typecheck, lint and build.

Report honestly. A check that could not be run is reported as not run, with the reason.

## 8. Human checklist (after the handoff, not for the agent)

1. Review and merge `feat/auth-base` into `bauth-drizzle`; push.
2. Create Google and Discord OAuth apps; register the localhost and production callback URLs.
3. Deploy the branch to Vercel, set env vars, run `bun run db:migrate` against production, verify email/password, magic link (needs `RESEND_API_KEY` and `MAIL_FROM`), Google and Discord sign-in.
4. Merge `feat/cli-auth-clone` into `main` (this publishes `create-bunext@1.2.0` and the wrapper).
5. Scaffold once from the published CLI as a final check.

## 9. Follow-ups (not in this handoff)

- `bunextupgrade` overwrites a project with the base template; teach it to read `bunext.config.json` and use the matching branch.
- CI: typecheck, lint, build and tests on both branches; CLI smoke test for both variants.
- Move the CLI from the branch name to tags so old CLI versions keep working.
- `bun run doctor`, the timed 30-minute drill, shared team dev OAuth apps.
- Preview-deployment social login, wildcard preview hosts.
- Expo plugin, impersonation, extra user fields, recipes (role sets, organizations, payments), Sign in with Apple.

## Pinned versions

Checked on 2026-11-13 against the installed packages (source and type definitions).

| Package | Version |
|---|---|
| `better-auth` | 1.7.23 |
| `auth` (Better Auth CLI, dev) | 1.7.23 |
| `drizzle-orm` | 0.45.4 |
| `drizzle-kit` (dev) | 0.31.11 |
| `postgres` | 4.1.1 |
| `zod` | 4.6.7 |
| `resend` | 6.38.0 |
| `server-only` | 0.0.1 |

Corrected assumptions:

- The Better Auth CLI is now the `auth` package (`@better-auth/cli` stopped at 1.4). It refuses configs that import `server-only`, so `auth:generate` runs it through `bun --conditions=react-server`.
- `bun test` does not load `.env.local` (`NODE_ENV=test`), so the `test` script passes `--env-file=.env.local`. Scripts that import server code also run with `--conditions=react-server`.
- `forgetPassword` was renamed to `requestPasswordReset`. `unlinkAccount` takes `{ accountId }`, which is the account row id from `listAccounts()` (not the provider id), needs a fresh session, and refuses the last account unless `allowUnlinkingAll` is set.
- An expired, reused or invalid magic link redirects with `?error=INVALID_TOKEN`; there is no separate expired code. Tokens are single use, expire after 5 minutes by default (set to 10 here), use the `verification` table (no schema change), and new users get `name: ""` and `emailVerified: true`.
- The admin plugin marks `role` as `input: false`. A sign-up carrying `role` is **rejected** with `400 FIELD_NOT_ALLOWED` rather than silently ignored. The test asserts that rejection, and that a plain sign-up gets `user`.
- `forbidden()` still requires `experimental.authInterrupts` in Next.js 16.4, so `requireRole()` redirects to `/dashboard`.
- `requireRole()` lives in `session.ts` next to `requireSession()`. `roles.ts` keeps the role list, `Role`, the default role and helpers. Putting `requireRole` in `roles.ts` would create an import cycle (`auth.ts` → `roles.ts` → `session.ts` → `auth.ts`) that crashes when a page imports `roles.ts` first. It also keeps `roles.ts` client-safe.
- Implicit OAuth linking: signing in with a provider whose verified email matches an existing account signs in to that account and connects the provider automatically. `trustedProviders` stays empty, so any provider links only when it reports the email as verified (otherwise `account_not_linked`). `requireLocalEmailVerified` is `false`, so the local account may be unverified. In that case `stripUnprovenAccessBeforeLink` (`src/lib/auth/link-hooks.ts`, wired as `databaseHooks.account.create.before`) calls `revokeUnprovenAccountAccess` first. It is not limited to the redirect callback, so id-token sign-in and plugins are covered too: it deletes the unverified account's password and other links, signs out its sessions and marks the email verified, so a pre-hijacker's credentials don't survive. Linking from `/account` (a signed-in user) is untouched; that exemption relies on the session cookie reaching the callback, which holds for redirect-based providers like Google and Discord but not necessarily for `form_post` providers such as Apple. Without a mailer the removed password cannot be restored with "Forgot password?" (the user keeps access via the provider).
- Magic link on an **unverified** user runs Better Auth's `revokeUnprovenAccountAccess`: it deletes that user's existing accounts (including the password) and sessions, then marks the email verified. This is deliberate protection against account pre-hijacking. Without a real mailer, password sign-ups stay unverified, so in development a password sign-up followed by a magic link removes the password. The account page then shows the "no password" note, and "Forgot password?" sets a new one. Verified users are not affected.
- Tests never send real email: with `NODE_ENV=test` the console mailer is always used.
- Rate limiting is enabled only in production by default (`rateLimit.enabled` defaults to `isProduction`).
- Better Auth reads `BETTER_AUTH_SECRET` (or `AUTH_SECRET`) and `BETTER_AUTH_URL`. The names in section 6 are correct.

### Profile pictures

- Better Auth keeps one `user.image`. `provider_avatar` (`src/lib/db/schema/app.ts`, migration `drizzle/0001_*`) stores the latest picture per user and provider: unique on (`user_id`, `provider_id`), cascades with the user.
- Hooks in `src/lib/auth/link-hooks.ts`, wired in `databaseHooks.account`:
  - `create.after` (`captureProviderAvatarAfterLink`): new sign-up or link saves the provider's picture, and fills `user.image` only when it is empty. A connected user keeps their current picture.
  - `update.after` (`captureMissingProviderAvatarAfterUpdate`): a sign-in with an already-linked provider saves the picture when none is stored yet (accounts linked before this table existed). Otherwise it does nothing; refreshing is manual.
  - `delete.after` (`forgetProviderAvatarAfterUnlink`): unlinking a provider deletes its saved picture.
  - All three swallow and log errors, so a provider or database failure never breaks sign-in. They do add one provider request (capped at 5 seconds) to a sign-in that captures a picture.
- `fetchProviderImage` (`src/lib/auth/provider-avatars.ts`) asks Google's userinfo endpoint directly, because Better Auth's Google provider only decodes the stored ID token and would keep returning the picture from sign-in time. Other providers use their own `getUserInfo`.
- Refresh gets a valid access token through `getAccessToken` (refreshing it when possible). Without a usable token (for example Google without a refresh token after an hour) the provider rejects it and the user is asked to reconnect the provider.
- Pictures are stored as the provider's image URL, not copied. If OAuth token encryption (`encryptOAuthTokens`) is ever turned on, the hooks must decrypt the access token first.

