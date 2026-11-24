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

subject=$(printf "%s\n" "${VERCEL_GIT_COMMIT_MESSAGE:-}" | head -n1)
prev=${VERCEL_GIT_PREVIOUS_SHA:-}

printf '%s\n' "$subject" | grep -qF '[skip deploy]' && exit 0

case ${VERCEL_GIT_COMMIT_REF:-} in
  renovate/*|dependabot/*) exit 0 ;;
esac

is_automation_bot() {
  case $1 in
    *renovate*|github-actions\[bot\]) return 0 ;;
    *) return 1 ;;
  esac
}

# Dependabot security fixes do not reliably have a marker.
[ "${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-}" = 'dependabot[bot]' ] && exit 1

if is_automation_bot "${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-}"; then
  [ -n "$prev" ] && git merge-base --is-ancestor "$prev" HEAD || exit 1
  last_deploy=$(git log -1 --format=%ct "$prev") || exit 1
  now=$(date +%s) || exit 1
  case $last_deploy in ''|*[!0-9]*) exit 1 ;; esac
  [ "$((now - last_deploy))" -le 604800 ] || exit 1

  # A skipped or failed deployment may have left a security fix in the range.
  commits=$(git log --format=%H "$prev..HEAD") || exit 1
  for commit in $commits; do
    email=$(git show -s --format=%ae "$commit") || exit 1
    case $email in
      *@users.noreply.github.com) login=${email%@users.noreply.github.com} ;;
      *) exit 1 ;;
    esac
    case $login in
      *+*)
        case ${login%%+*} in ''|*[!0-9]*) exit 1 ;; esac
        login=${login#*+}
        ;;
    esac
    is_automation_bot "$login" || exit 1

    message=$(git show -s --format=%B "$commit") || exit 1
    printf '%s\n' "$message" | grep -qiE '\[security\]|vulnerab|lock[ -]file maintenance'
    [ "$?" -eq 1 ] || exit 1
  done
  exit 0
fi

# Compare the entire push to the last deployment. Build if the SHA cannot be diffed.
[ -n "$prev" ] && git diff --quiet "$prev" HEAD -- . ':!*.md' ':!docs/' ':!.github/' ':!.agents/' ':!.vscode/' "$@" && exit 0
exit 1
