# Auth template sync

Resolve conflicts on `sync/main-into-bauth-drizzle`, preserving template updates and auth changes, then merge its PR into `bauth-drizzle`; never commit resolutions to `main` or publish from sync/auth branches.
Automation preserves open PR resolution work and picks up later `main` updates on the next sync after merging; it runs on main pushes, after publishing, daily, or manually.

# Dependency updates (Renovate)

Self-hosted Renovate runs free on GitHub Actions (`.github/workflows/renovate.yml`, config in `.github/renovate.json5`) every 6 hours, right after CI finishes on a Renovate PR, and when you tick a box in the Dependency Dashboard issue.

- `main` gets every dependency. Other branches get only the dependencies they alone have; shared updates reach them through the auth template sync.
- Minor and patch updates (patch only for `0.x`) automerge once CI passes. Majors open a PR and wait for you.
- Next.js majors are never automerged: the PR is labeled `nextjs-major`, assigned to `ardzero` and requests their review, so GitHub notifies you.
- New releases wait 3 days before Renovate proposes them; security fixes skip the wait.

## One-time setup

Renovate uses a free GitHub App rather than `GITHUB_TOKEN`: PRs opened with `GITHUB_TOKEN` don't trigger CI, and a personal token would act as you, so you'd get no notifications.

1. Create an app at <https://github.com/settings/apps/new>: any name (e.g. `bunext-renovate`), homepage set to the repo URL, **Webhook → Active** unchecked.
2. Repository permissions: Administration **read**, Checks **read & write**, Commit statuses **read & write**, Contents **read & write**, Dependabot alerts **read**, Issues **read & write**, Pull requests **read & write**, Workflows **read & write** (Metadata read is added automatically). "Where can this app be installed": only this account.
3. On the app page, copy the **Client ID** and generate a **private key** (`.pem`).
4. **Install App** → only `ardzero/bunext`.
5. In the repo, open Settings → Secrets and variables → Actions: add the variable `RENOVATE_APP_CLIENT_ID` (the Client ID) and the secret `RENOVATE_APP_PRIVATE_KEY` (the whole `.pem` content).
6. Actions → Renovate → **Run workflow**. The Dependency Dashboard issue appears after the first run.

## Adding another template branch

1. `.github/renovate.json5`: add the branch to `baseBranchPatterns`, and copy the `bauth-drizzle` branch-only rule with the new branch name and the dependencies only that branch has. Until then, it gets no updates.
2. `.github/workflows/ci.yml`: add the branch to `pull_request.branches` and `push.branches`.
3. When `bauth-drizzle` gains or drops a dependency `main` doesn't have, update its list in `.github/renovate.json5`.
