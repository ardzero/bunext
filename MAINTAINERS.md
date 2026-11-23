# Auth template sync

Conflicts only in `package.json`/`bun.lock` (e.g. a Renovate bump next to an auth-only dependency) are resolved automatically: a three-way merge of `package.json` (`.github/scripts/merge-package-json.ts`), then `bun install --lockfile-only`. CI re-checks `bauth-drizzle` after every sync and emails you if it fails. A sync PR opens only when another file conflicts or both branches changed the same value.

Otherwise, resolve conflicts on `sync/main-into-bauth-drizzle`, preserving template updates and auth changes, then merge its PR into `bauth-drizzle`; never commit resolutions to `main` or publish from sync/auth branches.
Automation preserves open PR resolution work and picks up later `main` updates on the next sync after merging; it runs on main pushes, after publishing, daily, or manually.

# Dependency updates (Renovate)

Renovate runs as the **Sora** GitHub App from [`ardzero/sora-renovate`](https://github.com/ardzero/sora-renovate), which holds the runner, its credentials and the shared base preset. This repo only holds its config (`.github/renovate.json5`). The runner checks hourly, so automerges and Dependency Dashboard checkboxes take effect within the hour.

- `main` gets every dependency. Other branches get only the dependencies they alone have; shared updates reach them through the auth template sync.
- Minor and patch updates (patch only for `0.x`) automerge once CI passes, with no weekly schedule. Majors open a PR and wait for you.
- Next.js majors are never automerged: the PR is labeled `nextjs-major`, assigned to `ardzero` and requests their review, so GitHub notifies you.
- New releases wait 3 days before Renovate proposes them; security fixes skip the wait.

There is nothing to set up in this repo. To change the shared settings, or to add another repo to Sora, see the `sora-renovate` README.

## Adding another template branch

1. `.github/renovate.json5`: add the branch to `baseBranchPatterns`, and copy the `bauth-drizzle` branch-only rule with the new branch name and the dependencies only that branch has. Until then, it gets no updates.
2. `.github/workflows/ci.yml`: add the branch to `pull_request.branches` and `push.branches`.
3. When `bauth-drizzle` gains or drops a dependency `main` doesn't have, update its list in `.github/renovate.json5`.
