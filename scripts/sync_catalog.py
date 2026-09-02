#!/usr/bin/env python3
"""Sync the UIC LTI Catalog from its Google Sheet into tools.json."""

import os

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
