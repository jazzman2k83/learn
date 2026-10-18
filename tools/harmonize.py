#!/usr/bin/env python3
"""Give one published course the hub's common frame. Runs on the hub copy only.

Usage: harmonize.py <hub-dir> <course-path>      e.g. harmonize.py . autosar/com

The course repos stay as they are; publish.sh calls this after every copy, so each new
version gets the same treatment. Running it twice changes nothing.

1. CSS (files and inline <style>): every "@media (prefers-color-scheme: dark)" block that
   does not already know about data-theme is made toggle-aware. The system setting still
   applies unless the visitor chose "light", and a copy of the rules also applies when
   they chose "dark" (screen only, so printing keeps the course's own print colours).
2. HTML: assets/hub.js goes first in <head> (one theme choice for the whole hub, see
   there), assets/hub-course.css after it, and a top bar with "All courses", the course
   title and the theme toggle goes first in <body>. The course's own toggle is hidden.
Only the standard library is used.
"""
import html
import json
import os
import pathlib
import re
import sys

MARK = "<!-- learn-hub -->"
DARK_MEDIA = re.compile(r"@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{", re.I)
FORCED = ':root[data-theme="dark"]'
SYSTEM = ':root:not([data-theme="light"])'

LABELS = {
    "de": ("Alle Kurse", "Kursnavigation"),
    "en": ("All courses", "Course navigation"),
}


# --- CSS ----------------------------------------------------------------------
def block_end(css, start):
    """Index just past the '}' that closes the block whose '{' is at css[start - 1]."""
    depth, i = 1, start
    while i < len(css):
        if css.startswith("/*", i):
            i = css.find("*/", i + 2)
            if i < 0:
                return len(css)
            i += 2
            continue
        ch = css[i]
        if ch in "\"'":
            j = i + 1
            while j < len(css) and css[j] != ch:
                j += 2 if css[j] == "\\" else 1
            i = j + 1
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return len(css)


def scope_selector(sel, scope):
    """':root' -> ':root[data-theme="dark"]', 'html .x' -> 'html[...] .x', '.x' -> ':root[...] .x'."""
    sel = sel.strip()
    attr = scope[len(":root"):]
    if sel.startswith(":root"):
        return scope + sel[len(":root"):]
    if re.match(r"html\b", sel):
        return "html" + attr + sel[4:]
    return scope + " " + sel


def scope_rules(body, scope):
    """Prefix every selector of the rules in body; nested at-rules are scoped inside."""
    out, i = [], 0
    while i < len(body):
        brace = body.find("{", i)
        if brace < 0:
            out.append(body[i:])
            break
        head = body[i:brace]
        end = block_end(body, brace + 1)
        inner = body[brace + 1:end - 1]
        lead = head[: len(head) - len(head.lstrip())]
        prelude = head.strip()
        # comments before the selector stay in front of it
        while prelude.startswith("/*") and "*/" in prelude:
            cut = prelude.index("*/") + 2
            lead += prelude[:cut] + " "
            prelude = prelude[cut:].strip()
        if prelude.startswith("@"):
            out.append(f"{lead}{prelude} {{{scope_rules(inner, scope)}}}")
        else:
            sels = ", ".join(scope_selector(s, scope) for s in prelude.split(","))
            out.append(f"{lead}{sels} {{{inner}}}")
        i = end
    return "".join(out)


def harmonize_css(css):
    out, i = [], 0
    for m in DARK_MEDIA.finditer(css):
        if m.start() < i:
            continue
        end = block_end(css, m.end())
        body = css[m.end():end - 1]
        out.append(css[i:m.start()])
        if "data-theme" in body:
            out.append(css[m.start():end])  # already toggle-aware
        else:
            out.append(m.group(0) + scope_rules(body, SYSTEM) + "}\n")
            out.append("/* learn-hub: the same rules when the visitor chose dark */\n")
            out.append("@media screen {" + scope_rules(body, FORCED) + "}")
        i = end
    out.append(css[i:])
    return "".join(out)


# --- HTML ---------------------------------------------------------------------
STYLE = re.compile(r"(<style\b[^>]*>)(.*?)(</style>)", re.I | re.S)
HEAD = re.compile(r"<head\b[^>]*>", re.I)
BODY = re.compile(r"<body\b[^>]*>", re.I)


def harmonize_html(page, up, course_href, title, lang):
    page = STYLE.sub(lambda m: m.group(1) + harmonize_css(m.group(2)) + m.group(3), page)
    if MARK in page:
        return page
    head, body = HEAD.search(page), BODY.search(page)
    if not head or not body:
        return page
    all_courses, nav_label = LABELS.get(lang, LABELS["en"])
    head_tags = (f'\n{MARK}<script src="{up}assets/hub.js"></script>'
                 f'<link rel="stylesheet" href="{up}assets/hub-course.css">')
    bar = (f'\n<nav class="learn-bar" aria-label="{nav_label}">'
           f'<a class="learn-home" href="{up}index.html">&larr; {all_courses}</a>'
           f'<a class="learn-course" href="{course_href}">{html.escape(title)}</a>'
           f'<button type="button" class="learn-theme" data-learn-theme>&#9790;</button></nav>')
    return (page[:head.end()] + head_tags + page[head.end():body.end()]
            + bar + page[body.end():])


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    hub = pathlib.Path(sys.argv[1]).resolve()
    course = hub / sys.argv[2]
    meta = json.loads((course / "course.json").read_text(encoding="utf-8"))
    lang = str(meta.get("language", "en")).lower()[:2]
    title = meta.get("title", sys.argv[2])

    changed = 0
    for f in sorted(course.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in (".css", ".html", ".htm"):
            continue
        text = f.read_text(encoding="utf-8")
        if f.suffix.lower() == ".css":
            new = harmonize_css(text)
        else:
            up = os.path.relpath(hub, f.parent).replace(os.sep, "/") + "/"
            course_href = os.path.relpath(course / "index.html", f.parent).replace(os.sep, "/")
            new = harmonize_html(text, up, course_href, title, lang)
        if new != text:
            f.write_text(new, encoding="utf-8")
            changed += 1
    print(f"harmonize {sys.argv[2]}: {changed} files")


if __name__ == "__main__":
    main()
