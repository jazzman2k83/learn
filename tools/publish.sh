#!/usr/bin/env bash
# Publish one course into the hub repo "learn" (GitHub Pages).
#
#   publish.sh <course-dir> [--hub <hub-dir>] [--no-push]
#
# Reads <course-dir>/course.json, copies the published paths from the course's committed
# HEAD (never uncommitted or private files) to <hub>/<path>/, gives it the hub's common
# bar and theme toggle (tools/harmonize.py), rebuilds the landing page,
# commits in the hub and pushes. Used both locally and by the course's GitHub Action.
# Default hub: $LEARN_HUB, else the folder this script lives in (tools/..).
set -euo pipefail

usage() { sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

course= hub="${LEARN_HUB:-$(cd "$(dirname "$0")/.." && pwd)}" push=1
while [ $# -gt 0 ]; do
  case "$1" in
    --hub) hub="$2"; shift 2;;
    --no-push) push=0; shift;;
    -h|--help) usage;;
    *) [ -z "$course" ] || usage; course="$1"; shift;;
  esac
done
[ -n "$course" ] || usage
course=$(cd "$course" && pwd)
hub=$(cd "$hub" && pwd)
[ -f "$course/course.json" ] || { echo "No course.json in $course (run tools/setup-course.sh first)"; exit 1; }
[ -d "$hub/.git" ] || { echo "Hub $hub is not a git repo"; exit 1; }

# --- read course.json ------------------------------------------------------
read_meta() {
  python3 - "$course/course.json" <<'PY'
import json, re, sys
c = json.load(open(sys.argv[1], encoding="utf-8"))
for key in ("title", "path"):
    if not c.get(key):
        sys.exit(f"course.json: '{key}' is missing")
path = c["path"]
if not re.fullmatch(r"[a-z0-9-]+(/[a-z0-9-]+)*", path):
    sys.exit(f"course.json: path '{path}' must be lowercase words separated by '/', e.g. autosar/com")
if path.split("/")[0] in ("tools", "assets"):
    sys.exit(f"course.json: path '{path}' would overwrite the hub's own files")
publish = c.get("publish") or ["index.html", "lessons", "reference", "assets", "config"]
for p in publish:
    if p.startswith("/") or ".." in p.split("/"):
        sys.exit(f"course.json: publish entry '{p}' must be a path inside the course")
print(path)
print("\n".join(publish))
PY
}
meta=$(read_meta)
path=$(head -1 <<<"$meta")
mapfile -t wanted < <(tail -n +2 <<<"$meta")

dest="$hub/$path"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# --- export the published paths -------------------------------------------
if git -C "$course" rev-parse --verify -q HEAD >/dev/null; then
  sha=$(git -C "$course" rev-parse --short HEAD)
  paths=()
  for p in "${wanted[@]}"; do
    if [ -n "$(git -C "$course" ls-tree HEAD -- "$p")" ]; then paths+=("$p"); fi
  done
  [ ${#paths[@]} -gt 0 ] || { echo "None of the publish paths are committed: ${wanted[*]}"; exit 1; }
  if [ -n "$(git -C "$course" status --porcelain -- "${paths[@]}" course.json)" ]; then
    echo "Warning: uncommitted changes in the published files are NOT published:"
    git -C "$course" status --short -- "${paths[@]}" course.json | sed 's/^/  /'
  fi
  git -C "$course" archive HEAD -- "${paths[@]}" | tar -x -C "$tmp"
  git -C "$course" show HEAD:course.json > "$tmp/course.json" 2>/dev/null \
    || { echo "Warning: course.json is not committed; using the working copy"; cp "$course/course.json" "$tmp/"; }
else
  sha=local
  echo "Warning: $course has no commits; copying the working tree"
  for p in "${wanted[@]}"; do [ -e "$course/$p" ] && cp -r "$course/$p" "$tmp/"; done
  cp "$course/course.json" "$tmp/"
fi

# --- replace the course folder in the hub ---------------------------------
rm -rf "$dest"
mkdir -p "$dest"
cp -r "$tmp/." "$dest/"
python3 "$hub/tools/harmonize.py" "$hub" "$path"
python3 "$hub/tools/build-index.py" "$hub"

# --- commit and push ------------------------------------------------------
cd "$hub"
git add -A -- "$path" index.html
if git diff --cached --quiet; then
  echo "Nothing changed for $path."
else
  git commit -q -m "Publish $path (source $sha)"
  echo "Committed: Publish $path (source $sha)"
fi

if [ "$push" = 1 ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    branch=$(git branch --show-current)
    # Retry: another course may publish at the same moment.
    for try in 1 2 3; do
      git pull -q --rebase origin "$branch" && git push -q origin "$branch" && break
      [ "$try" = 3 ] && { echo "Push failed"; exit 1; }
      sleep 5
    done
    url=$(git remote get-url origin)
    if [[ "$url" == *github.com* ]]; then
      owner_repo=$(sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##' <<<"$url")
      echo "Pushed. Live in about a minute: https://${owner_repo%%/*}.github.io/${owner_repo#*/}/$path/"
    else
      echo "Pushed to $url."
    fi
  else
    echo "Hub has no remote 'origin'; committed locally only."
  fi
fi
