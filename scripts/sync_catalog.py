#!/usr/bin/env python3
"""Sync the UIC LTI Catalog from its Google Sheet into tools.json."""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

import openpyxl

SHEET_ID = "1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"
SHEET_TAB = "Published"

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_JSON = os.path.join(REPO_ROOT, "tools.json")

MIN_TOOLS = 40

COL_NAME = "Tool Name1"
COL_DESC = "Description"
COL_CATEGORY = "Category"
COL_BB = "Available in Blackboard"
COL_CV = "Available in Canvas"
COL_T2 = "Title II Compliant"
COL_VIDEO = "UIC Walkthrough Video"

# read_rows() stashes each walkthrough cell's hyperlink target under this key,
# because the visible cell text is a title like "Piazza Introduction".
VIDEO_URL_KEY = "_video_url"

# Sheet wording -> the status codes AVAIL_LABEL already renders (app.js:66).
STATUS_MAP = {
    "Yes": "yes",
    "No": "no",
    "NA": "na",
    "Standalone": "standalone",
    "Retired": "retired",
    "Waiting for vendor response": "pending",
    "In Progress": "progress",
    "Available Per Request": "request",
    "Not licensed, unavailable.": "unlicensed",
    "": "—",
    "Status": "—",
}

# A row dead in both columns is not published. "Excluded" is the sheet's own
# opt-out flag; blank means nobody has filled the row in yet.
DROP_STATUSES = {"Excluded", "Retired", ""}


class SyncError(Exception):
    """Raised when the sheet holds something the script must not guess about."""


def cell(row, key):
    """A sheet cell as a stripped string. Cells come back as None when empty."""
    return str(row.get(key) or "").strip()


def map_status(value, tool, column):
    """Turn one availability cell into its status code."""
    key = str(value or "").strip()
    if key not in STATUS_MAP:
        raise SyncError(
            f"{tool}: unrecognized {column} value {key!r}. "
            f"Fix the sheet, or add the value to STATUS_MAP "
            f"(and to AVAIL_LABEL in app.js if it needs a new label)."
        )
    return STATUS_MAP[key]


def should_keep(row):
    """True when a row belongs in the published catalog."""
    if not cell(row, COL_NAME):
        return False
    return not (
        cell(row, COL_BB) in DROP_STATUSES and cell(row, COL_CV) in DROP_STATUSES
    )


def row_to_tool(row):
    """Convert one kept sheet row into a catalog entry."""
    name = cell(row, COL_NAME)
    tool = {
        "name": name,
        "desc": cell(row, COL_DESC),
        "category": cell(row, COL_CATEGORY),
        "bb": map_status(row.get(COL_BB), name, COL_BB),
        "cv": map_status(row.get(COL_CV), name, COL_CV),
        "t2": map_status(row.get(COL_T2), name, COL_T2),
    }
    url = cell(row, VIDEO_URL_KEY)
    if url:
        tool["video"] = url
        tool["videoTitle"] = cell(row, COL_VIDEO)
    return tool


def build_catalog(rows):
    """Filter, convert, de-duplicate and sort every sheet row.

    Returns (tools, warnings). Warnings are non-fatal notes for the operator.
    """
    tools = []
    warnings = []
    seen = set()

    for row in rows:
        if not should_keep(row):
            continue
        tool = row_to_tool(row)
        if tool["name"] in seen:
            warnings.append(f"duplicate row for {tool['name']} — keeping the first")
            continue
        seen.add(tool["name"])
        tools.append(tool)

    tools.sort(key=lambda t: t["name"].lower())

    if len(tools) < MIN_TOOLS:
        raise SyncError(
            f"only {len(tools)} tools survived filtering, minimum is {MIN_TOOLS}. "
            f"The {SHEET_TAB!r} tab may have been renamed, restructured or unshared. "
            f"Refusing to empty the catalog."
        )
    return tools, warnings


DIFF_FIELDS = ("desc", "category", "bb", "cv", "t2", "video", "videoTitle")


def diff_catalogs(old, new):
    """One readable line per difference, for the console and the commit message."""
    old_by = {t["name"]: t for t in old}
    new_by = {t["name"]: t for t in new}
    lines = []

    for name in sorted(set(new_by) - set(old_by), key=str.lower):
        lines.append(f"+ {name}")
    for name in sorted(set(old_by) - set(new_by), key=str.lower):
        lines.append(f"- {name}")

    for name in sorted(set(old_by) & set(new_by), key=str.lower):
        changes = []
        for field in DIFF_FIELDS:
            before = old_by[name].get(field, "")
            after = new_by[name].get(field, "")
            if before == after:
                continue
            if field == "desc":
                changes.append("desc changed")
            else:
                changes.append(f"{field} {before or '(none)'}->{after or '(none)'}")
        if changes:
            lines.append(f"{name}: " + ", ".join(changes))

    return lines


def download_xlsx(dest):
    """Fetch the sheet as xlsx. Only this format preserves hyperlink targets."""
    with urllib.request.urlopen(SHEET_URL, timeout=60) as response:
        payload = response.read()

    # A shared sheet returns a zip container; an unshared one returns a
    # sign-in page with a cheerful 200.
    if not payload.startswith(b"PK"):
        raise SyncError(
            "the sheet did not return a spreadsheet. Check that it is still "
            "shared as 'anyone with the link can view'."
        )

    with open(dest, "wb") as handle:
        handle.write(payload)


def read_rows(path):
    """Read the Published tab into dicts keyed by header, plus the video URL."""
    workbook = openpyxl.load_workbook(path)
    if SHEET_TAB not in workbook.sheetnames:
        raise SyncError(
            f"no {SHEET_TAB!r} tab in the workbook, found {workbook.sheetnames}"
        )

    sheet = workbook[SHEET_TAB]
    headers = [c.value for c in sheet[1]]
    for required in (COL_NAME, COL_BB, COL_CV, COL_T2, COL_CATEGORY, COL_VIDEO):
        if required not in headers:
            raise SyncError(f"expected a {required!r} column, found {headers}")

    video_column = headers.index(COL_VIDEO) + 1
    rows = []
    for number in range(2, sheet.max_row + 1):
        row = {
            header: sheet.cell(row=number, column=index + 1).value
            for index, header in enumerate(headers)
            if header
        }
        link = sheet.cell(row=number, column=video_column).hyperlink
        row[VIDEO_URL_KEY] = link.target if link else ""
        rows.append(row)
    return rows


def git(*args):
    """Run one git command in the repo, raising if it fails."""
    result = subprocess.run(
        ("git",) + args,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SyncError(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
    return result.stdout


def commit_and_push(summary):
    """Commit tools.json alone, then push. Never stages anything else."""
    git("add", "--", TOOLS_JSON)
    message = (
        "Sync catalog from Google Sheet\n\n"
        + "\n".join(summary)
        + "\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>\n"
    )
    git("commit", "-m", message)
    git("push", "origin", "main")


def load_existing():
    if not os.path.exists(TOOLS_JSON):
        return []
    with open(TOOLS_JSON, encoding="utf-8") as handle:
        return json.load(handle)


def write_tools(tools):
    with open(TOOLS_JSON, "w", encoding="utf-8") as handle:
        json.dump(tools, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print the change summary without writing, committing or pushing",
    )
    args = parser.parse_args(argv)

    with tempfile.TemporaryDirectory() as workspace:
        xlsx = os.path.join(workspace, "catalog.xlsx")
        download_xlsx(xlsx)
        rows = read_rows(xlsx)

    tools, warnings = build_catalog(rows)
    for warning in warnings:
        print(f"warning: {warning}")

    summary = diff_catalogs(load_existing(), tools)
    print(f"{len(tools)} tools in the sheet")

    if not summary:
        print("no changes")
        return 0

    for line in summary:
        print(f"  {line}")

    if args.dry_run:
        print("\ndry run — nothing written")
        return 0

    write_tools(tools)
    commit_and_push(summary)
    print(f"\ncommitted and pushed {len(summary)} change(s)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SyncError as error:
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
