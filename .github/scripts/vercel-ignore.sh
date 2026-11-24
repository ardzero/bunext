#!/bin/sh
# Vercel Ignored Build Step. Exit 0 skips the build and exit 1 builds.
# Configure Vercel to run: sh .github/scripts/vercel-ignore.sh
msg=$VERCEL_GIT_COMMIT_MESSAGE
prev=$VERCEL_GIT_PREVIOUS_SHA

# npm publish commits and explicit opt-outs
echo "$msg" | grep -qE '^pack:|\[skip deploy\]' && exit 0

# Renovate previews and main -> bauth-drizzle syncs
case $VERCEL_GIT_COMMIT_REF in renovate/*|sync/*|bauth-drizzle) exit 0 ;; esac

# Bot commits deploy only for security fixes. Renovate uses "[SECURITY]"
# in the PR title and "-vulnerability" in the PR branch name.
case $VERCEL_GIT_COMMIT_AUTHOR_LOGIN in
  *\[bot\]|renovate-bot) echo "$msg" | grep -qiE '\[security\]|vulnerab' || exit 0 ;;
esac

# Compare the cumulative change since the previous deployment.
# Missing or unreachable previous SHAs fall back to building.
[ -n "$prev" ] && git diff --quiet "$prev" HEAD -- . ':!*.md' ':!docs/' ':!.github/' ':!.agents/' ':!.vscode/' ':!packages/' && exit 0
exit 1
