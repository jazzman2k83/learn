#!/usr/bin/env bash
# Remove a course from the hub: unpublish.sh <path> [--no-push]   e.g. unpublish.sh autosar/com
set -euo pipefail
hub="${LEARN_HUB:-$(cd "$(dirname "$0")/.." && pwd)}"
path="${1:?usage: unpublish.sh <path> [--no-push]}"
[ -f "$hub/$path/course.json" ] || { echo "No published course at $hub/$path"; exit 1; }

cd "$hub"
git rm -rq -- "$path"
python3 tools/build-index.py .
git add index.html
git commit -q -m "Unpublish $path"
echo "Committed: Unpublish $path"
if [ "${2:-}" != --no-push ] && git remote get-url origin >/dev/null 2>&1; then
  git pull -q --rebase origin "$(git branch --show-current)"
  git push -q origin "$(git branch --show-current)"
  echo "Pushed."
fi
