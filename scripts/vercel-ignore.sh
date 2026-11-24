#!/bin/sh
# Vercel Ignored Build Step. Exit 0 skips the build and exit 1 builds.

# The template repository has additional maintenance-only skip rules.
# Older scaffolders may leave the hook behind, but remove this package directory.
if [ "${1:-}" = --repository ]; then
  shift
else
  set --
  if [ -d packages/create-bunext ] && [ -f .github/scripts/vercel-ignore.sh ]; then
    exec sh .github/scripts/vercel-ignore.sh
  fi
fi

msg=${VERCEL_GIT_COMMIT_MESSAGE:-}
prev=${VERCEL_GIT_PREVIOUS_SHA:-}

printf '%s\n' "$msg" | grep -qF '[skip deploy]' && exit 0

case ${VERCEL_GIT_COMMIT_REF:-} in
  renovate/*|dependabot/*) exit 0 ;;
esac

case ${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-} in
  # Dependabot uses the same commit title for routine and security updates.
  dependabot\[bot\]) exit 1 ;;
  *\[bot\]|renovate-bot)
    printf '%s\n' "$msg" | grep -qiE '\[security\]|vulnerab' && exit 1
    exit 0
    ;;
esac

# Compare the entire push to the last deployment. Build if the SHA cannot be diffed.
[ -n "$prev" ] && git diff --quiet "$prev" HEAD -- . ':!*.md' ':!docs/' ':!.github/' ':!.agents/' ':!.vscode/' "$@" && exit 0
exit 1
