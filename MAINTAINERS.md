# Auth template sync

Resolve conflicts on `sync/main-into-bauth-drizzle`, preserving template updates and auth changes, then merge its PR into `bauth-drizzle`; never commit resolutions to `main` or publish from sync/auth branches.
Automation preserves open PR resolution work and picks up later `main` updates on the next sync after merging; it runs on main pushes, after publishing, daily, or manually.
