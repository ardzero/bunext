#!/bin/sh
# Bunext-only rules. Exit 0 skips the build and exit 1 builds.

printf '%s\n' "${VERCEL_GIT_COMMIT_MESSAGE:-}" | grep -q '^pack:' && exit 0

case ${VERCEL_GIT_COMMIT_REF:-} in
  sync/*|bauth-drizzle) exit 0 ;;
esac

exec sh scripts/vercel-ignore.sh --repository ':!packages/'
