#!/usr/bin/env bash
# One-time setup of a course repo for publishing to the hub "learn".
#
#   setup-course.sh <course-dir> [--title T] [--description D] [--path P]
#                   [--language en|de] [--topic T] [--yes] [--no-publish]
#
# 1. Writes course.json (missing values are asked for, with defaults read from index.html)
#    and commits it in the course repo.
# 2. If the course repo has a GitHub remote: installs .github/workflows/publish-learn.yml,
#    commits it, and sets the secret HUB_DEPLOY_KEY from ~/.config/learn-hub/hub_deploy_key.
#    Pushing the course repo stays up to you.
# 3. Publishes the course once with tools/publish.sh (unless --no-publish).
# Running it again is safe: an existing course.json is kept.
set -euo pipefail

tools=$(cd "$(dirname "$0")" && pwd)
key="${LEARN_HUB_KEY:-$HOME/.config/learn-hub/hub_deploy_key}"
usage() { sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

course= title= desc= path= lang= topic= yes=0 publish=1
while [ $# -gt 0 ]; do
  case "$1" in
    --title) title="$2"; shift 2;;
    --description) desc="$2"; shift 2;;
    --path) path="$2"; shift 2;;
    --language) lang="$2"; shift 2;;
    --topic) topic="$2"; shift 2;;
    --yes) yes=1; shift;;
    --no-publish) publish=0; shift;;
    -h|--help) usage;;
    *) [ -z "$course" ] || usage; course="$1"; shift;;
  esac
done
[ -n "$course" ] || usage
course=$(cd "$course" && pwd)
[ -f "$course/index.html" ] || { echo "$course has no index.html: a course needs a home page first"; exit 1; }
git -C "$course" rev-parse --git-dir >/dev/null 2>&1 || { echo "$course is not a git repo (git init and commit first)"; exit 1; }

ask() {  # ask <var> <prompt> <default>
  local cur="${!1}"
  [ -n "$cur" ] && return
  if [ "$yes" = 1 ] || [ ! -t 0 ]; then printf -v "$1" '%s' "$3"; return; fi
  read -r -p "$2 [$3]: " cur
  printf -v "$1" '%s' "${cur:-$3}"
}

# --- 1. course.json --------------------------------------------------------
if [ -f "$course/course.json" ]; then
  echo "course.json exists, keeping it."
else
  guess=$(python3 - "$course/index.html" "$(basename "$course")" <<'PY'
import html, re, sys
src = open(sys.argv[1], encoding="utf-8").read()
def grab(rx):
    m = re.search(rx, src, re.S)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).split()) if m else ""
title = grab(r"<title>(.*?)</title>")
lede = grab(r'class="lede"[^>]*>(.*?)</p>')
lang = grab(r'<html[^>]*lang="([a-z]+)')
slug = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", sys.argv[2]).lower()
slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
print(title); print(lede); print(lang or "en"); print(slug)
PY
)
  { read -r g_title; read -r g_desc; read -r g_lang; read -r g_slug; } <<<"$guess"
  ask title "Title" "$g_title"
  ask desc "Short description" "$g_desc"
  ask lang "Language (en/de)" "$g_lang"
  ask topic "Topic (landing page group, e.g. AUTOSAR, Astronomy)" "Other"
  t_slug=$(tr '[:upper:]' '[:lower:]' <<<"$topic" | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')
  ask path "Folder in the hub" "$t_slug/$g_slug"

  python3 - "$course/course.json" "$title" "$desc" "$path" "$lang" "$topic" <<'PY'
import json, sys
f, title, desc, path, lang, topic = sys.argv[1:]
json.dump({"title": title, "description": desc, "path": path, "language": lang, "topic": topic},
          open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(f, "a").write("\n")
PY
  echo "Wrote course.json:"
  cat "$course/course.json"
fi
if [ -n "$(git -C "$course" status --porcelain -- course.json)" ]; then
  git -C "$course" add course.json
  git -C "$course" commit -q -m "Add course.json for publishing to the learn hub" -- course.json
  echo "Committed course.json."
fi

# --- 2. GitHub Action (only with a GitHub remote) -------------------------
remote=$(git -C "$course" remote get-url origin 2>/dev/null || true)
if [[ "$remote" == *github.com* ]]; then
  repo=$(sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##' <<<"$remote")
  branch=$(git -C "$course" branch --show-current)
  wf="$course/.github/workflows/publish-learn.yml"
  mkdir -p "$(dirname "$wf")"
  sed "s/__BRANCH__/$branch/" "$tools/templates/publish-learn.yml" > "$wf"
  git -C "$course" add .github/workflows/publish-learn.yml
  if ! git -C "$course" diff --cached --quiet; then
    git -C "$course" commit -q -m "Publish to the learn hub on push"
    echo "Installed and committed .github/workflows/publish-learn.yml (branch $branch)."
  fi
  if [ -f "$key" ]; then
    gh secret set HUB_DEPLOY_KEY -R "$repo" < "$key"
    echo "Set secret HUB_DEPLOY_KEY on $repo."
  else
    echo "Warning: $key not found; set HUB_DEPLOY_KEY on $repo yourself."
  fi
  echo "Push $repo to activate the action: git -C '$course' push"
else
  echo "No GitHub remote: publish with $tools/publish.sh '$course'."
  echo "After adding a GitHub remote, run this script again to install the action."
fi

# --- 3. first publish -----------------------------------------------------
if [ "$publish" = 1 ]; then
  bash "$tools/publish.sh" "$course"
fi
