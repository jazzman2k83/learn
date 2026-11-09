#!/usr/bin/env python3
"""Read a course's CHANGES.md and write its "What's new" page. Runs on the hub copy only.

Usage: changes.py <hub-dir> <course-path>      e.g. changes.py . autosar/com

Writes <course-path>/changes.html from <course-path>/CHANGES.md (publish.sh copies it from
the course repo). tools/build-index.py imports parse() and the helpers for the landing page.

CHANGES.md format, newest entry first (see README.md):

    # Changes

    ## 2026-11-08
    - New: [Lesson 18 – The whole call sequence](lessons/0018-the-whole-call-sequence.html)
    - Changed: Lesson 14 links to the new lesson 18.

Each entry is "## YYYY-MM-DD" followed by "- " bullets (a bullet may wrap onto indented
lines). A bullet may start with a kind: New / Changed / Fixed / Removed, or in German
Neu / Geändert / Korrigiert / Entfernt. Inline [text](link) and `code` are rendered.
Links are relative to the course folder. Anything else is an error, so a typo shows at publish.
       changes.py --check <export-dir> <publish-state.json> <source-sha> <0|1>

The --check form is publish.sh's guard: see check(). Only the standard library is used.
"""
import datetime
import hashlib
import html
import json
import pathlib
import re
import sys

KINDS = {
    "new": "new", "changed": "changed", "fixed": "fixed", "removed": "removed",
    "neu": "new", "geändert": "changed", "korrigiert": "fixed", "entfernt": "removed",
}
KIND_LABEL = {
    "en": {"new": "New", "changed": "Changed", "fixed": "Fixed", "removed": "Removed"},
    "de": {"new": "Neu", "changed": "Geändert", "fixed": "Korrigiert", "removed": "Entfernt"},
}
MONTHS = {
    "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "de": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
           "September", "Oktober", "November", "Dezember"],
}
TEXT = {
    "en": {"title": "What's new", "lede": "Changes to this course, newest first.",
           "back": "Back to the course"},
    "de": {"title": "Neuigkeiten", "lede": "Änderungen an diesem Kurs, die neuesten zuerst.",
           "back": "Zurück zum Kurs"},
}

DATE = re.compile(r"^##\s+(\d{4}-\d{2}-\d{2})\s*$")
BULLET = re.compile(r"^[-*]\s+(.*)$")
KIND = re.compile(r"^([A-Za-zÄÖÜäöü]+):\s*(.*)$")
INLINE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`")


class ChangesError(ValueError):
    pass


def lang_of(meta):
    lang = str(meta.get("language", "en")).lower()[:2]
    return lang if lang in TEXT else "en"


def parse(text):
    """[(date, [(kind or None, text), ...]), ...], newest first."""
    entries, item = [], None
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.rstrip()
        if not line.strip():
            item = None
            continue
        if line.startswith("# ") and not entries:
            continue  # the file's title
        m = DATE.match(line)
        if m:
            try:
                day = datetime.date.fromisoformat(m.group(1))
            except ValueError:
                raise ChangesError(f"line {n}: '{m.group(1)}' is not a valid date")
            entries.append((day, []))
            item = None
            continue
        m = BULLET.match(line)
        if m and entries:
            entries[-1][1].append([m.group(1)])
            item = entries[-1][1][-1]
            continue
        if item is not None and raw[:1] in (" ", "\t"):
            item.append(line.strip())  # continuation of the bullet above
            continue
        raise ChangesError(f"line {n}: expected '## YYYY-MM-DD' or '- item', got: {line!r}")

    out = []
    for day, items in entries:
        if not items:
            raise ChangesError(f"entry {day} has no items")
        parsed = []
        for parts in items:
            body = " ".join(parts)
            kind = None
            m = KIND.match(body)
            if m and m.group(1).lower() in KINDS:
                kind, body = KINDS[m.group(1).lower()], m.group(2)
            parsed.append((kind, body))
        out.append((day, parsed))
    out.sort(key=lambda e: e[0], reverse=True)
    return out


def inline(text, base=""):
    """Escape text, render [text](link) and `code`. base is put before relative links."""
    out, i = [], 0
    for m in INLINE.finditer(text):
        out.append(html.escape(text[i:m.start()]))
        if m.group(3) is not None:
            out.append(f"<code>{html.escape(m.group(3))}</code>")
        else:
            href = m.group(2)
            if not re.match(r"[a-z][a-z0-9+.-]*:|#|/", href):
                href = base + href
            out.append(f'<a href="{html.escape(href)}">{html.escape(m.group(1))}</a>')
        i = m.end()
    out.append(html.escape(text[i:]))
    return "".join(out)


def item_html(kind, body, lang, base=""):
    tag = (f'<span class="change-kind change-{kind}">{KIND_LABEL[lang][kind]}</span> '
           if kind else "")
    return f"<li>{tag}{inline(body, base)}</li>"


def plain(text):
    """Text without markup: [text](link) -> text, `code` -> code."""
    return INLINE.sub(lambda m: m.group(1) if m.group(1) is not None else m.group(3), text)


def fmt_date(day, lang, short=False):
    if short and lang == "en":
        return f"{day.day} {MONTHS['en'][day.month - 1]}" + ("" if day.year == datetime.date.today().year else f" {day.year}")
    if lang == "de":
        return f"{day.day}. {MONTHS['de'][day.month - 1]} {day.year}"
    return f"{day.day} {MONTHS['en'][day.month - 1]} {day.year}"


def load(course_dir):
    """Parsed entries of a hub course folder, or [] if it has no CHANGES.md."""
    f = pathlib.Path(course_dir) / "CHANGES.md"
    if not f.is_file():
        return []
    try:
        return parse(f.read_text(encoding="utf-8"))
    except ChangesError as e:
        raise ChangesError(f"{f}: {e}") from None


PAGE = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}: {heading}</title>
<link rel="stylesheet" href="{up}assets/hub.css">
</head>
<body>
<!-- Generated by tools/changes.py from CHANGES.md. Do not edit. -->
<main class="changes-page">
<h1>{heading}</h1>
<p class="lede">{lede}</p>
{entries}
<p><a href="index.html">&larr; {back}</a></p>
</main>
</body>
</html>
"""


def render_page(meta, entries, up):
    lang = lang_of(meta)
    t = TEXT[lang]
    blocks = []
    for day, items in entries:
        lis = "\n".join(item_html(k, b, lang) for k, b in items)
        blocks.append(f'<section class="change-entry"><h2><time datetime="{day.isoformat()}">'
                      f'{fmt_date(day, lang)}</time></h2>\n<ul>\n{lis}\n</ul></section>')
    return (PAGE.replace("{lang}", lang).replace("{title}", html.escape(meta.get("title", "")))
            .replace("{heading}", t["title"]).replace("{lede}", t["lede"])
            .replace("{back}", t["back"]).replace("{up}", up)
            .replace("{entries}", "\n".join(blocks)))


def check(export_dir, state_file, source, skip):
    """Stop when the published files changed since the last publish but CHANGES.md did not.

    export_dir is the fresh export (before it replaces the hub copy); state_file is the
    hub copy's publish-state.json from the last publish. Returns the new state as JSON.
    course.json and CHANGES.md don't count as content.
    """
    export_dir = pathlib.Path(export_dir)
    h = hashlib.sha256()
    for f in sorted(p for p in export_dir.rglob("*") if p.is_file()):
        rel = f.relative_to(export_dir).as_posix()
        if rel in ("course.json", "CHANGES.md"):
            continue
        h.update(rel.encode() + b"\0" + hashlib.sha256(f.read_bytes()).digest())
    ch = export_dir / "CHANGES.md"
    if ch.is_file():
        try:
            parse(ch.read_text(encoding="utf-8"))
        except ChangesError as e:
            sys.exit(f"CHANGES.md: {e}")
    new = {"source": source, "content": h.hexdigest(),
           "changes": hashlib.sha256(ch.read_bytes()).hexdigest() if ch.is_file() else None}
    state_file = pathlib.Path(state_file)
    old = json.loads(state_file.read_text(encoding="utf-8")) if state_file.is_file() else None
    if old and old.get("content") != new["content"] and not skip:
        if new["changes"] is None:
            sys.exit("The course has no CHANGES.md. Add one (format: see the hub's README.md) "
                     "and commit it.")
        if new["changes"] == old.get("changes"):
            sys.exit(f"The published files changed since the last publish (source "
                     f"{old.get('source')}),\nbut CHANGES.md has no new entry. Add one for "
                     "learners and commit it.\nFor a change learners need not hear about, use "
                     "--no-changes-entry or put\n[skip changes] in the course's last commit message.")
    return json.dumps(new)


def main():
    if len(sys.argv) == 6 and sys.argv[1] == "--check":
        # changes.py --check <export-dir> <old publish-state.json> <source sha> <0|1 skip>
        print(check(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] == "1"))
        return
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    hub = pathlib.Path(sys.argv[1]).resolve()
    course = hub / sys.argv[2]
    page = course / "changes.html"
    meta = json.loads((course / "course.json").read_text(encoding="utf-8"))
    try:
        entries = load(course)
    except ChangesError as e:
        sys.exit(f"CHANGES.md: {e}")
    if not entries:
        page.unlink(missing_ok=True)
        print(f"changes {sys.argv[2]}: no CHANGES.md, no page")
        return
    up = "../" * len(pathlib.PurePosixPath(sys.argv[2]).parts)
    page.write_text(render_page(meta, entries, up), encoding="utf-8")
    print(f"changes {sys.argv[2]}: {len(entries)} entries")


if __name__ == "__main__":
    main()
