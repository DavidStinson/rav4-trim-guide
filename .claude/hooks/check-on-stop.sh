#!/bin/sh
# Stop hook: before a turn ends with uncommitted changes to the site or the tools, run the quick check.
# On failure, exit 2 so the agent sees the failures and keeps working. It nudges once per stop: when
# the agent is already continuing because of this hook (stop_hook_active), it lets the turn end.
input=$(cat)
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
if git diff --quiet HEAD -- rav4-site tools && [ -z "$(git ls-files --others --exclude-standard rav4-site tools)" ]; then
  exit 0
fi
out=$(npm run --silent check -- --quick --no-shots 2>&1) && exit 0
echo "npm run check failed with uncommitted changes to rav4-site/ or tools/. Fix these, or say why they're expected (a check run red on purpose):" >&2
echo "$out" | grep -v '^pass' | tail -25 >&2
exit 2
