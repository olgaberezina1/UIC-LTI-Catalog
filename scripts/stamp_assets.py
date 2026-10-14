#!/usr/bin/env python3
"""Stamp index.html's asset links with a content hash, so caches can't mix versions.

GitHub Pages serves every file with `Cache-Control: max-age=600`, so a browser
holds index.html, app.js and styles.css for up to ten minutes each, and
independently. Without a version on the links, a visitor can end up running a
fresh index.html against a nine-minute-old app.js — or, as happened in practice,
see old markup after a deploy and conclude the change didn't ship.

A content hash fixes the mixing: index.html asks for `app.js?v=<hash of app.js>`,
so whenever a visitor does get the new index.html, the assets it names are
fetched fresh rather than served from cache. It does not make updates instant —
index.html itself can still be up to ten minutes stale — but what the visitor
runs is always internally consistent.

tools.json is deliberately not stamped: app.js fetches it with
`cache: 'no-cache'`, which already revalidates on every load.

    python3 scripts/stamp_assets.py            # rewrite index.html
    python3 scripts/stamp_assets.py --check     # exit 1 if stale, change nothing
"""

import argparse
import hashlib
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(REPO_ROOT, "index.html")

# The assets index.html references directly. tools.json is absent on purpose.
STAMPED_ASSETS = ("styles.css", "app.js")

VERSION_LENGTH = 10


class StampError(Exception):
    """Raised when index.html or an asset isn't where this script expects."""


def asset_version(path):
    """A short content hash — changes exactly when the file's bytes change."""
    try:
        with open(path, "rb") as handle:
            digest = hashlib.sha256(handle.read()).hexdigest()
    except FileNotFoundError:
        raise StampError(f"{path} not found — cannot stamp it into index.html.")
    return digest[:VERSION_LENGTH]


def asset_versions(root=None):
    base = root or REPO_ROOT
    return {name: asset_version(os.path.join(base, name)) for name in STAMPED_ASSETS}


def stamp(html, versions):
    """Rewrite each asset reference to carry its version. Returns (html, changes).

    `changes` lists one "name: old -> new" string per reference that moved, so
    both the CLI and --check can report precisely what is out of date.
    """
    changes = []

    for name, version in versions.items():
        # Matches href="app.js", href="app.js?v=abc", src="app.js?v=abc" alike.
        pattern = re.compile(
            r'((?:href|src)=")' + re.escape(name) + r'(?:\?v=([^"]*))?(")'
        )
        found = pattern.search(html)
        if not found:
            raise StampError(
                f"no reference to {name!r} found in index.html. It was renamed, "
                f"inlined or removed; this script cannot stamp what it cannot find."
            )
        if found.group(2) != version:
            changes.append(f"{name}: {found.group(2) or '(unstamped)'} -> {version}")
        html = pattern.sub(rf"\g<1>{name}?v={version}\g<3>", html, count=1)

    return html, changes


def read_index(path=None):
    index_path = path or INDEX_HTML
    try:
        with open(index_path, encoding="utf-8") as handle:
            return handle.read()
    except FileNotFoundError:
        raise StampError(f"{index_path} not found.")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="report whether index.html is current without rewriting it",
    )
    args = parser.parse_args(argv)

    html = read_index()
    stamped, changes = stamp(html, asset_versions())

    if not changes:
        print("index.html asset versions are current")
        return 0

    for change in changes:
        print(f"  {change}")

    if args.check:
        print(
            f"\n{len(changes)} stale asset version(s). "
            "Run scripts/stamp_assets.py before committing.",
            file=sys.stderr,
        )
        return 1

    with open(INDEX_HTML, "w", encoding="utf-8") as handle:
        handle.write(stamped)
    print(f"\nstamped {len(changes)} asset version(s) into index.html")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (StampError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
