# Catalog Sheet Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the catalog's 58 tools out of the `LTI_TOOLS` array literal in `app.js` into a generated `tools.json`, produced by a script that reads the source Google Sheet directly.

**Architecture:** A standalone Python script downloads the sheet as xlsx (the only export format that preserves hyperlink targets), filters and maps rows, writes `tools.json`, then commits and pushes it. `app.js` fetches that file at startup. The per-tool `tags` field disappears; the sheet's `Category` takes over both the UI label and the Find My Tool goal scoring, and the finder's discipline question is removed because Category cannot express it.

**Tech Stack:** Python 3.13 with stdlib plus openpyxl 3.1.5 (already installed); vanilla browser JS in a single IIFE; no build step, no package manager, no framework.

**Spec:** `docs/superpowers/specs/2026-09-01-catalog-sheet-sync-design.md`

## Global Constraints

- **No new dependencies.** Python: stdlib plus openpyxl only. Browser: no libraries, no bundler, no `package.json`. The site stays hand-written static files.
- **Sheet:** ID `1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY`, tab `Published`, downloaded from `https://docs.google.com/spreadsheets/d/<ID>/export?format=xlsx`. Public — no credentials.
- **`tools.json` is generated.** Never hand-edit it. It lives at the repo root and is committed.
- **Status codes** must be exactly the keys already in `AVAIL_LABEL` (`app.js:66`): `yes`, `no`, `na`, `standalone`, `retired`, `pending`, `progress`, `request`, `unlicensed`, `—`.
- **Unknown sheet values abort the run.** Never guess, never silently fall back — that is precisely how the earlier attempt (`47cc0c7`) failed unnoticed.
- **The script stages only `tools.json`.** Never `git add -A`; the working tree routinely holds untracked `.DS_Store` files.
- **`MIN_TOOLS = 40`** — refuse to write a catalog smaller than this.
- **`app.js` stays one IIFE** with its existing numbered section comments.
- **Commit trailer** on every commit:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
  ```
- **Pushing happens twice, and only twice.** Task 6 pushes (the script does it), and Task 8's last step pushes the remainder. Tasks 1–5 and 7 commit without pushing.

## File Structure

| File | Responsibility |
|---|---|
| `scripts/sync_catalog.py` *(create)* | Everything sheet→JSON: constants, pure transforms, xlsx reading, download, diff, git. Pure functions are separated from I/O so they can be tested without fixtures. |
| `scripts/test_sync_catalog.py` *(create)* | `unittest` cases for the pure transforms. Run with `cd scripts && python3 -m unittest test_sync_catalog -v`. |
| `tools.json` *(create)* | Generated catalog data, repo root, committed. |
| `app.js` *(modify)* | Loses the array literal and all `tags` reads; gains `loadTools()`, `GOAL_CATEGORIES`, category rendering. |
| `PROJECT.md` *(modify)* | Documents the new update workflow and schema. |

`index.html` and `styles.css` are **not** touched. The finder renders from `QUESTIONS` into `#question-slot`, so dropping a question needs no markup change, and `.catalog-tags` / `.result-tag-list` are reused as-is for the category line.

---

### Task 1: Script constants, status mapping, row filtering

**Files:**
- Create: `scripts/sync_catalog.py`
- Test: `scripts/test_sync_catalog.py`

**Interfaces:**
- Consumes: nothing
- Produces: `SyncError`; `STATUS_MAP`, `DROP_STATUSES`, `MIN_TOOLS`, `SHEET_URL`, `SHEET_TAB`, `TOOLS_JSON`, `REPO_ROOT`, and the `COL_*` / `VIDEO_URL_KEY` column-name constants; `map_status(value, tool, column) -> str`; `should_keep(row: dict) -> bool`

- [ ] **Step 1: Write the failing test**

Create `scripts/test_sync_catalog.py`:

```python
import unittest

import sync_catalog as sc


class MapStatusTest(unittest.TestCase):
    def test_maps_every_value_the_sheet_currently_uses(self):
        cases = {
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
        for raw, code in cases.items():
            self.assertEqual(sc.map_status(raw, "Some Tool", "Available in Canvas"), code)

    def test_treats_none_as_em_dash(self):
        self.assertEqual(sc.map_status(None, "Some Tool", "Title II Compliant"), "—")

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(sc.map_status("  Yes  ", "Some Tool", "Available in Canvas"), "yes")

    def test_raises_on_unknown_value_naming_tool_and_column(self):
        with self.assertRaises(sc.SyncError) as ctx:
            sc.map_status("Maybe?", "Packback", "Available in Canvas")
        message = str(ctx.exception)
        self.assertIn("Packback", message)
        self.assertIn("Available in Canvas", message)
        self.assertIn("Maybe?", message)


def row(name="Acadly", bb="Yes", cv="Yes", desc="A tool."):
    return {sc.COL_NAME: name, sc.COL_DESC: desc, sc.COL_BB: bb, sc.COL_CV: cv}


class ShouldKeepTest(unittest.TestCase):
    def test_keeps_a_live_row(self):
        self.assertTrue(sc.should_keep(row()))

    def test_keeps_a_row_live_in_only_one_lms(self):
        self.assertTrue(sc.should_keep(row(bb="Excluded", cv="Yes")))
        self.assertTrue(sc.should_keep(row(bb="Yes", cv="Retired")))

    def test_drops_rows_dead_in_both(self):
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Excluded")))
        self.assertFalse(sc.should_keep(row(bb="Retired", cv="Retired")))
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Retired")))

    def test_keeps_a_described_row_with_no_availability_recorded(self):
        # Virtual Machine: a campus computing resource, not an LMS integration,
        # so both availability columns are blank. It is in the catalog today.
        self.assertTrue(sc.should_keep(row(name="Virtual Machine", bb="", cv="")))

    def test_drops_a_placeholder_row_with_no_description(self):
        # Coursera: a bare name with every other cell empty.
        self.assertFalse(sc.should_keep(row(name="Coursera", desc="", bb="", cv="")))

    def test_drops_rows_without_a_name(self):
        self.assertFalse(sc.should_keep(row(name="")))
        self.assertFalse(sc.should_keep(row(name="   ")))
        self.assertFalse(sc.should_keep(row(name=None)))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'sync_catalog'`

- [ ] **Step 3: Write minimal implementation**

Create `scripts/sync_catalog.py`:

```python
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
# opt-out flag. Blank is deliberately NOT here: Virtual Machine is blank in both
# columns because it is a campus computing resource rather than an LMS
# integration, and it belongs in the catalog. Content-free rows are caught by the
# description check in should_keep() instead.
DROP_STATUSES = {"Excluded", "Retired"}


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
    # A name with nothing behind it is a placeholder, not a tool.
    if not cell(row, COL_DESC):
        return False
    return not (
        cell(row, COL_BB) in DROP_STATUSES and cell(row, COL_CV) in DROP_STATUSES
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 10 tests

- [ ] **Step 5: Commit**

```bash
git add scripts/sync_catalog.py scripts/test_sync_catalog.py
git commit -m "$(cat <<'EOF'
Add catalog sync script skeleton with status mapping

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 2: Row to tool conversion

**Files:**
- Modify: `scripts/sync_catalog.py`
- Test: `scripts/test_sync_catalog.py`

**Interfaces:**
- Consumes: `cell`, `map_status`, `COL_*`, `VIDEO_URL_KEY` from Task 1
- Produces: `row_to_tool(row: dict) -> dict` returning keys `name`, `desc`, `category`, `bb`, `cv`, `t2`, and `video` + `videoTitle` only when the walkthrough cell carries a hyperlink

- [ ] **Step 1: Write the failing test**

Append to `scripts/test_sync_catalog.py`, above the `if __name__` block:

```python
def full_row(**overrides):
    base = {
        sc.COL_NAME: "Panopto",
        sc.COL_DESC: "A comprehensive video platform for education.",
        sc.COL_CATEGORY: "Media & Content Creation",
        sc.COL_BB: "Yes",
        sc.COL_CV: "Yes",
        sc.COL_T2: "Yes",
        sc.COL_VIDEO: None,
        sc.VIDEO_URL_KEY: "",
    }
    base.update(overrides)
    return base


class RowToToolTest(unittest.TestCase):
    def test_maps_the_plain_fields(self):
        self.assertEqual(
            sc.row_to_tool(full_row()),
            {
                "name": "Panopto",
                "desc": "A comprehensive video platform for education.",
                "category": "Media & Content Creation",
                "bb": "yes",
                "cv": "yes",
                "t2": "yes",
            },
        )

    def test_omits_video_keys_when_there_is_no_hyperlink(self):
        tool = sc.row_to_tool(full_row(**{sc.COL_VIDEO: "Watch this"}))
        self.assertNotIn("video", tool)
        self.assertNotIn("videoTitle", tool)

    def test_adds_video_and_title_when_hyperlinked(self):
        tool = sc.row_to_tool(
            full_row(
                **{
                    sc.COL_VIDEO: "How to Embed Panopto Videos",
                    sc.VIDEO_URL_KEY: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c",
                }
            )
        )
        self.assertEqual(
            tool["video"],
            "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c",
        )
        self.assertEqual(tool["videoTitle"], "How to Embed Panopto Videos")

    def test_strips_whitespace_and_tolerates_empty_cells(self):
        tool = sc.row_to_tool(
            full_row(**{sc.COL_NAME: "  Ally  ", sc.COL_DESC: None, sc.COL_T2: ""})
        )
        self.assertEqual(tool["name"], "Ally")
        self.assertEqual(tool["desc"], "")
        self.assertEqual(tool["t2"], "—")

    def test_propagates_a_bad_status_with_the_tool_name(self):
        with self.assertRaises(sc.SyncError) as ctx:
            sc.row_to_tool(full_row(**{sc.COL_NAME: "Labflow", sc.COL_CV: "Sort of"}))
        self.assertIn("Labflow", str(ctx.exception))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: FAIL — `AttributeError: module 'sync_catalog' has no attribute 'row_to_tool'`

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/sync_catalog.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 15 tests

- [ ] **Step 5: Commit**

```bash
git add scripts/sync_catalog.py scripts/test_sync_catalog.py
git commit -m "$(cat <<'EOF'
Convert sheet rows into catalog entries

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 3: Catalog assembly — dedupe, sort, minimum-size guard

**Files:**
- Modify: `scripts/sync_catalog.py`
- Test: `scripts/test_sync_catalog.py`

**Interfaces:**
- Consumes: `should_keep`, `row_to_tool`, `MIN_TOOLS`, `SyncError` from Tasks 1–2
- Produces: `build_catalog(rows: list[dict]) -> tuple[list[dict], list[str]]` returning `(tools, warnings)`, sorted case-insensitively by `name`

- [ ] **Step 1: Write the failing test**

Append to `scripts/test_sync_catalog.py`, above the `if __name__` block:

```python
class BuildCatalogTest(unittest.TestCase):
    def many_rows(self, count, prefix="Tool"):
        return [full_row(**{sc.COL_NAME: f"{prefix} {i:03d}"}) for i in range(count)]

    def test_drops_unpublished_rows(self):
        rows = self.many_rows(sc.MIN_TOOLS)
        rows.append(full_row(**{sc.COL_NAME: "Kortex", sc.COL_BB: "Retired", sc.COL_CV: "Retired"}))
        rows.append(full_row(**{sc.COL_NAME: "", sc.COL_BB: "Yes", sc.COL_CV: "Yes"}))
        tools, _ = sc.build_catalog(rows)
        names = [t["name"] for t in tools]
        self.assertEqual(len(names), sc.MIN_TOOLS)
        self.assertNotIn("Kortex", names)

    def test_keeps_the_first_of_a_duplicate_and_warns(self):
        rows = self.many_rows(sc.MIN_TOOLS)
        rows.append(full_row(**{sc.COL_NAME: "Packback", sc.COL_CV: "Yes"}))
        rows.append(full_row(**{sc.COL_NAME: "Packback", sc.COL_CV: "No"}))
        tools, warnings = sc.build_catalog(rows)
        packback = [t for t in tools if t["name"] == "Packback"]
        self.assertEqual(len(packback), 1)
        self.assertEqual(packback[0]["cv"], "yes")
        self.assertEqual(len(warnings), 1)
        self.assertIn("Packback", warnings[0])

    def test_sorts_case_insensitively_by_name(self):
        rows = self.many_rows(sc.MIN_TOOLS, prefix="Zed")
        rows.append(full_row(**{sc.COL_NAME: "ACS Lab Safety UIC"}))
        rows.append(full_row(**{sc.COL_NAME: "Acadly"}))
        rows.append(full_row(**{sc.COL_NAME: "ATI Testing"}))
        tools, _ = sc.build_catalog(rows)
        self.assertEqual(
            [t["name"] for t in tools[:3]],
            ["Acadly", "ACS Lab Safety UIC", "ATI Testing"],
        )

    def test_refuses_to_build_a_suspiciously_small_catalog(self):
        with self.assertRaises(sc.SyncError) as ctx:
            sc.build_catalog(self.many_rows(sc.MIN_TOOLS - 1))
        self.assertIn(str(sc.MIN_TOOLS), str(ctx.exception))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: FAIL — `AttributeError: module 'sync_catalog' has no attribute 'build_catalog'`

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/sync_catalog.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 19 tests

- [ ] **Step 5: Commit**

```bash
git add scripts/sync_catalog.py scripts/test_sync_catalog.py
git commit -m "$(cat <<'EOF'
Assemble, dedupe and sort the catalog

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 4: Change summary

**Files:**
- Modify: `scripts/sync_catalog.py`
- Test: `scripts/test_sync_catalog.py`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `DIFF_FIELDS` tuple; `diff_catalogs(old: list[dict], new: list[dict]) -> list[str]`, one human-readable line per change, empty when identical

- [ ] **Step 1: Write the failing test**

Append to `scripts/test_sync_catalog.py`, above the `if __name__` block:

```python
def tool(name="Acadly", **overrides):
    base = {"name": name, "desc": "d", "category": "c", "bb": "yes", "cv": "yes", "t2": "yes"}
    base.update(overrides)
    return base


class DiffCatalogsTest(unittest.TestCase):
    def test_reports_nothing_when_identical(self):
        self.assertEqual(sc.diff_catalogs([tool()], [tool()]), [])

    def test_reports_additions_and_removals(self):
        lines = sc.diff_catalogs([tool("Kortex")], [tool("ATI Testing")])
        self.assertIn("+ ATI Testing", lines)
        self.assertIn("- Kortex", lines)

    def test_reports_a_changed_status_with_both_values(self):
        lines = sc.diff_catalogs(
            [tool("ClassRanked", bb="no", cv="contract")],
            [tool("ClassRanked", bb="yes", cv="yes")],
        )
        self.assertEqual(lines, ["ClassRanked: bb no->yes, cv contract->yes"])

    def test_summarises_description_changes_without_quoting_them(self):
        lines = sc.diff_catalogs(
            [tool("Gradescope", desc="An AI-assisted grading platform. Gradescope Linking Assignments")],
            [tool("Gradescope", desc="An AI-assisted grading platform.")],
        )
        self.assertEqual(lines, ["Gradescope: desc changed"])

    def test_reports_a_newly_added_video(self):
        lines = sc.diff_catalogs(
            [tool("Panopto")],
            [tool("Panopto", video="https://example.test/v", videoTitle="Intro")],
        )
        self.assertEqual(len(lines), 1)
        self.assertIn("video", lines[0])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: FAIL — `AttributeError: module 'sync_catalog' has no attribute 'diff_catalogs'`

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/sync_catalog.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 24 tests

- [ ] **Step 5: Commit**

```bash
git add scripts/sync_catalog.py scripts/test_sync_catalog.py
git commit -m "$(cat <<'EOF'
Summarize catalog changes for review

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 5: Download, xlsx reading, CLI and git

**Files:**
- Modify: `scripts/sync_catalog.py`

**Interfaces:**
- Consumes: everything from Tasks 1–4
- Produces: `download_xlsx(dest)`, `read_rows(path) -> list[dict]`, `git(*args) -> str`, `commit_and_push(summary)`, `main(argv=None) -> int`; CLI `python3 scripts/sync_catalog.py [--dry-run]`

This task has no unit tests — every function is I/O against a live sheet and a live repo. It is verified by running `--dry-run` against the real sheet and checking the output against the exact diff the spec predicts.

- [ ] **Step 1: Add the imports**

Change the import block at the top of `scripts/sync_catalog.py` from `import os` to:

```python
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

import openpyxl
```

- [ ] **Step 2: Add download and xlsx reading**

Append to `scripts/sync_catalog.py`:

```python
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
```

- [ ] **Step 3: Add the git helpers and `main`**

Append to `scripts/sync_catalog.py`:

```python
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
```

- [ ] **Step 4: Confirm the unit tests still pass**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 24 tests, unchanged by the new I/O code

- [ ] **Step 5: Verify against the live sheet**

Run: `python3 scripts/sync_catalog.py --dry-run`

Expected output — `tools.json` does not exist yet, so every tool reads as an addition:

```
warning: duplicate row for Packback — keeping the first
58 tools in the sheet
  + ACS Lab Safety UIC
  + ATI Testing
  ... 58 "+" lines total ...

dry run — nothing written
```

Three things must hold, and the task is not done until they do:
1. **Exactly 58 tools** — if the count differs, the row-selection rule is wrong
2. **The Packback duplicate warning appears**
3. **Nothing was written** — `git status --short` shows no `tools.json`

- [ ] **Step 6: Commit**

```bash
git add scripts/sync_catalog.py
git commit -m "$(cat <<'EOF'
Add sheet download, xlsx reading and sync CLI

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 6: Generate and land `tools.json`

**Files:**
- Create: `tools.json` (generated — do not write by hand)

**Interfaces:**
- Consumes: the CLI from Task 5
- Produces: `tools.json` at the repo root, the file `app.js` fetches in Task 7

`app.js` still uses its own array at this point, so landing `tools.json` cannot affect the live site — it is a new file nobody reads yet.

**This task pushes**, because the script commits and pushes on its own. Its `git push origin main` sends up the Task 1–5 script commits along with `tools.json`; that is fine, since nothing on the live site references either yet.

- [ ] **Step 1: Generate, commit and push**

Run: `python3 scripts/sync_catalog.py`
Expected: the same 58-tool summary as the dry run, then `committed and pushed 58 change(s)`

- [ ] **Step 2: Verify the generated file**

Run:

```bash
python3 -c "
import json
tools = json.load(open('tools.json'))
print('tools:', len(tools))
print('with video:', sum(1 for t in tools if 'video' in t))
print('without category:', [t['name'] for t in tools if not t['category']])
print('with tags:', [t['name'] for t in tools if 'tags' in t])
print('first three:', [t['name'] for t in tools[:3]])
print('ClassRanked:', [t for t in tools if t['name'] == 'ClassRanked'][0])
"
```

Expected:

```
tools: 58
with video: 10
without category: []
with tags: []
first three: ['Acadly', 'ACS Lab Safety UIC', 'Aleks']
ClassRanked: {... 'bb': 'yes', 'cv': 'yes' ...}
```

- [ ] **Step 3: Confirm the commit is clean**

Run: `git show --stat HEAD`
Expected: exactly one file changed, `tools.json`. If anything else was staged, the `git add` path guard failed — stop and fix Task 5.

---

### Task 7: `app.js` — load from JSON, render category, rebuild the finder

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `tools.json` from Task 6
- Produces: nothing later tasks depend on

This is one task because it is one atomic change: the moment data arrives from `tools.json`, every `t.tags` read is `undefined` and throws. Splitting it would leave a broken page between commits. There is no JS test runner in this project and adding one would violate the no-dependencies constraint, so verification is a scripted set of browser checks with exact expected values.

- [ ] **Step 1: Replace the array literal with a loader**

Replace lines 4–64 — the `// ─── 1. Catalog data …` comment through the `];` that closes `LTI_TOOLS` — with:

```js
  // ─── 1. Catalog data ───────────────────────────────────────────
  // Generated from the Google Sheet by scripts/sync_catalog.py.
  // Don't hand-edit tools.json — edit the sheet and re-run the script.
  let LTI_TOOLS = [];

  async function loadTools() {
    const res = await fetch('tools.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`tools.json: HTTP ${res.status}`);
    LTI_TOOLS = await res.json();
  }
```

Leave `AVAIL_LABEL` exactly as it is. It still carries `contract`, `migrating` and `standalone_mig`, which the sheet no longer produces; they are harmless display-layer entries.

- [ ] **Step 2: Merge the two discussion goals and drop question 03**

In `QUESTIONS`, replace the eight `goals` options with seven — `discussion` absorbs `annotation`:

```js
      options: [
        { v: "polling",     t: "Respond live",          s: "Polls, clickers, real-time questions" },
        { v: "discussion",  t: "Discuss & annotate",    s: "Threaded discussion, Q&A, social annotation" },
        { v: "practice",    t: "Practice problems",     s: "Adaptive or low-stakes homework" },
        { v: "high-stakes", t: "Sit a high-stakes exam",s: "Proctored or secure testing" },
        { v: "writing",     t: "Write & get feedback",  s: "Originality, grading, essays" },
        { v: "video",       t: "Engage with video",     s: "Lecture capture, captioned media" },
        { v: "lab",         t: "Run a lab or simulation", s: "Virtual labs, science protocols" },
      ],
```

Then delete the entire third question object — the one with `key: "discipline"`, from `{` after the `lms` object's closing `},` through its own `},`. `QUESTIONS` now holds two entries.

- [ ] **Step 3: Score goals on category**

Immediately above `function scoreTools`, add:

```js
  // Which sheet categories satisfy each finder goal. This is UI configuration,
  // not tool data — the sheet stays the only per-tool source. A category that
  // appears here nowhere simply never matches a goal; those tools still show in
  // the catalog and still score on LMS and Title II.
  const GOAL_CATEGORIES = {
    polling: [
      "Engagement & Classroom Response Systems",
      "Student Engagement & Classroom Management",
      "Engagement & Participation Tracking",
    ],
    discussion: ["Collaboration & Communication"],
    practice: ["Assessment & Testing", "Content Delivery & Digital Textbooks"],
    "high-stakes": [
      "Assessment Security & Academic Integrity",
      "Assessment & Testing",
      "Academic Integrity & Plagiarism Prevention",
    ],
    writing: ["Academic Integrity & Plagiarism Prevention", "Assessment & Grading Tools"],
    video: ["Media & Content Creation", "Multimedia Collaboration & Visual Tools"],
    lab: ["Specialized Academic Platforms", "Safety & Compliance"],
  };
```

Then replace the whole of `scoreTools` with:

```js
  function scoreTools({ goals = [], lms = null }) {
    const requireA11y = true;
    const weights = { goal: 3, lms: 4, a11y: 5 };
    return LTI_TOOLS.map(tool => {
      let score = 0;
      const reasons = [];

      goals.forEach(g => {
        const categories = GOAL_CATEGORIES[g] || [];
        if (categories.includes(tool.category)) { score += weights.goal; reasons.push(g); }
      });

      if (lms === "canvas" && tool.cv === "yes") { score += weights.lms; reasons.push("Canvas-ready"); }
      else if (lms === "blackboard" && tool.bb === "yes") { score += weights.lms; reasons.push("Blackboard-ready"); }
      else if (lms === "canvas" && tool.cv !== "yes") { score -= weights.lms; }
      else if (lms === "blackboard" && tool.bb !== "yes") { score -= weights.lms; }

      if (requireA11y && tool.t2 === "yes") { score += weights.a11y; reasons.push("Title II compliant"); }
      if (requireA11y && tool.t2 !== "yes") { score -= weights.a11y * 2; }

      if (tool.bb === "retired" && tool.cv === "retired") score -= 10;

      const max =
        goals.length * weights.goal +
        (lms ? weights.lms : 0) +
        (requireA11y ? weights.a11y : 0);

      const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
      return { ...tool, score, pct, reasons: [...new Set(reasons)] };
    }).sort((a, b) => b.score - a.score);
  }
```

The `stakes`, `size` and `discipline` parameters and their branches are gone — nothing ever passed them, since they appear in neither `QUESTIONS` nor `state.answers`.

- [ ] **Step 4: Render category instead of tags**

Three replacements.

In the result card (was `app.js:309`):

```js
            <div class="result-tag-list">${esc(t.category)}</div>
```

In the catalog row (was `app.js:403`):

```js
            <div class="catalog-tags">${esc(t.category)}</div>
```

And the walkthrough link (was `app.js:396-398`) — using the sheet's own link text, and escaping the URL now that it comes from an external source:

```js
      const videoLink = t.video
        ? '<a href="' + esc(t.video) + '" target="_blank" rel="noopener" class="catalog-video-link">&#9654; '
          + esc(t.videoTitle || 'Watch walkthrough') + '</a>'
        : '';
```

- [ ] **Step 5: Remove `discipline` from the state and URL plumbing**

Six edits in section 3 and section 5:

```js
    answers: {
      goals: [],
      lms: null,
    },
```

```js
  function resetAnswers() {
    state.answers = { goals: [], lms: null };
    state.step = 0;
  }
```

```js
  const VALID = {
    goals: new Set(['polling','discussion','practice','high-stakes','writing','video','lab']),
    lms: new Set(['canvas','blackboard']),
  };
```

```js
  function emptyAnswers() {
    return { goals: [], lms: null };
  }

  function hasAnyAnswer(a) {
    return (a.goals && a.goals.length > 0) || a.lms !== null;
  }

  function firstUnansweredStep(a) {
    if (!a.goals || a.goals.length === 0) return 0;
    if (a.lms === null) return 1;
    return QUESTIONS.length - 1;
  }
```

In `syncHash`, delete the line `if (a.discipline) parts.push('discipline=' + a.discipline);`
In `readHash`, delete the line `if (params.discipline && VALID.discipline.has(params.discipline)) answers.discipline = params.discipline;`
In `querySummary`, delete the line `if (a.discipline) bits.push(a.discipline);`

Older shared links carrying `discipline=stem` or `goals=annotation` still work — `readHash` already filters against `VALID` and ignores unknown params.

- [ ] **Step 6: Load the data before the first render**

In the `DOMContentLoaded` handler, make the callback `async` and load before anything reads `LTI_TOOLS`:

```js
  document.addEventListener('DOMContentLoaded', async () => {
    main = document.querySelector('main');

    try {
      await loadTools();
    } catch (err) {
      console.error('Could not load tools.json', err);
      document.getElementById('catalog-tbody').innerHTML =
        '<tr><td colspan="5">Catalog failed to load. Please refresh the page.</td></tr>';
      return;
    }

    // Populate hero count from data
    document.getElementById('hero-count').textContent =
      `The 2026 catalog · ${LTI_TOOLS.length} integrations`;
```

Leave the rest of the handler unchanged.

- [ ] **Step 7: Check for leftovers**

Run: `grep -n "\.tags\b\|discipline\|weights\.stakes\|weights\.size\|stakes ===\|size ===" app.js`
Expected: **no matches at all.** Any hit is a missed edit — fix it before continuing.

This pattern targets the reads being removed, not every occurrence of the words. Three things
survive on purpose and must NOT be deleted: the CSS class names `catalog-tags` and
`result-tag-list` (kept so `styles.css` needs no change), and the `high-stakes` goal value in
both `QUESTIONS` and `GOAL_CATEGORIES`.

- [ ] **Step 8: Verify without a browser**

Browser automation is unavailable in this session, so verification is static plus a served-file
check. A human does the visual pass before Task 8 pushes anything.

Create `scripts/verify_app.py` — a throwaway checker, deleted in the last step of this task:

```python
#!/usr/bin/env python3
"""One-off checks on app.js after the tools.json migration. Deleted once green."""

import json
import re
import sys

app = open("app.js", encoding="utf-8").read()
tools = json.load(open("tools.json", encoding="utf-8"))
categories = {t["category"] for t in tools}
failures = []

# 1. Every GOAL_CATEGORIES string must be a real category. A typo here silently
#    scores zero matches, which is the likeliest way this task goes wrong.
block = re.search(r"const GOAL_CATEGORIES = \{(.*?)\n  \};", app, re.S)
if not block:
    failures.append("GOAL_CATEGORIES not found")
else:
    # Category names all contain a space; the goal keys ("high-stakes") do not,
    # which is what keeps the keys out of this set.
    referenced = set(re.findall(r'"([^"]*\s[^"]*)"', block.group(1)))
    unknown = referenced - categories
    if unknown:
        failures.append(f"GOAL_CATEGORIES names categories absent from tools.json: {sorted(unknown)}")
    print(f"GOAL_CATEGORIES references {len(referenced)} categories, all present")

# 2. The finder must be down to two questions.
questions = re.search(r"const QUESTIONS = \[(.*?)\n  \];", app, re.S)
count = len(re.findall(r'^\s+key: "', questions.group(1), re.M)) if questions else 0
if count != 2:
    failures.append(f"expected 2 finder questions, found {count}")
print(f"finder questions: {count}")

# 3. No reads of the removed fields survive. The CSS class names catalog-tags and
#    result-tag-list, and the high-stakes goal value, are kept on purpose.
for pattern in (r"\.tags\b", r"discipline", r"weights\.stakes", r"weights\.size"):
    hits = re.findall(pattern, app)
    if hits:
        failures.append(f"{len(hits)} leftover match(es) for {pattern}")

# 4. The literal is gone and the fetch is in.
if "const LTI_TOOLS = [" in app:
    failures.append("the LTI_TOOLS array literal is still present")
if "fetch('tools.json'" not in app:
    failures.append("no fetch of tools.json")

for failure in failures:
    print(f"FAIL: {failure}")
print("\nall checks passed" if not failures else f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)
```

Run all three checks; every one must pass:

```bash
node --check app.js && echo "syntax OK"
python3 scripts/verify_app.py
python3 -m http.server 8000 &
sleep 1
for f in index.html app.js tools.json; do
  curl -s -o /dev/null -w "$f %{http_code}\n" "http://localhost:8000/$f"
done
kill %1
```

Expected: `syntax OK`; `all checks passed`; and `200` for all three files.

Then delete the checker — it has served its purpose and is not part of the deliverable:

```bash
rm scripts/verify_app.py
```

**Report to the controller that the visual pass is still outstanding.** These checks cannot see
rendering: that the category line looks right under the tool name, that the walkthrough link
label reads "▶ How to Embed Panopto Videos", that the console is free of
`Cannot read properties of undefined (reading 'slice')`, or that the two-question finder returns
sensible results for "Sit a high-stakes exam" + Canvas. A human confirms those before Task 8's push.

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "$(cat <<'EOF'
Load catalog from tools.json and score the finder on category

Replaces the embedded LTI_TOOLS literal with a fetch of the generated
tools.json. Catalog rows and result cards show the sheet's Category in
place of hand-maintained tags, and Find My Tool drops its discipline
question, which category data cannot answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

### Task 8: Update `PROJECT.md`

**Files:**
- Modify: `PROJECT.md`

**Interfaces:**
- Consumes: the finished implementation
- Produces: nothing

- [ ] **Step 1: Update the file structure section**

Replace the tree with:

```
UIC-LTI-Catalog/
├── index.html     — page structure and markup
├── styles.css     — all styling
├── app.js         — all logic (single file, IIFE)
├── tools.json     — catalog data, generated from the Google Sheet
└── scripts/
    ├── sync_catalog.py       — regenerates tools.json from the sheet
    └── test_sync_catalog.py  — unit tests for the sync script
```

- [ ] **Step 2: Rewrite "How to Update Tool Data"**

Replace that whole section with:

```markdown
## How to Update Tool Data

Tool data lives in the **Google Sheet**, not in this repo. `tools.json` is
generated from it — never edit `tools.json` by hand, your change will be
overwritten on the next sync.

1. Edit the [source sheet](https://docs.google.com/spreadsheets/d/1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY/edit), **Published** tab
2. Preview what would change: `python3 scripts/sync_catalog.py --dry-run`
3. Apply it: `python3 scripts/sync_catalog.py` — writes `tools.json`, commits and pushes
4. GitHub Pages redeploys in 1–3 minutes

The script downloads the sheet as **xlsx**, not CSV: CSV export flattens the
walkthrough cells to their link text and loses the Panopto URLs.

It stops rather than guess. An availability value it doesn't recognize aborts
the run naming the tool and column — add it to `STATUS_MAP` (and to
`AVAIL_LABEL` in `app.js` if it needs a new label), or fix the sheet. It also
refuses to write a catalog of fewer than 40 tools, so a renamed tab or revoked
sharing can't empty the site.

A row is published unless its name is blank, its description is blank, or
**both** availability columns are `Excluded` or `Retired`. Blank availability on
its own does not unpublish a row — Virtual Machine has none because it isn't an
LMS integration.

### Local preview

`fetch()` doesn't work on `file://`, so opening `index.html` directly no longer
shows a catalog. Serve it instead:

    python3 -m http.server 8000    # then http://localhost:8000

### Running the script's tests

    cd scripts && python3 -m unittest test_sync_catalog -v
```

- [ ] **Step 3: Update the tool data schema table**

In the Tool Data section, retitle it to reference `tools.json` rather than the `LTI_TOOLS` array, drop the `tags` row, and add:

```markdown
| `category` | string | Sheet category — shown under the tool name and used for finder scoring |
| `videoTitle` | string *(optional)* | Link text from the sheet, used as the walkthrough link's label |
```

Delete the **Tools with Panopto Walkthrough Videos** table — that list now comes from the sheet, and a hand-maintained copy will drift.

- [ ] **Step 4: Update the finder and design-decisions sections**

In **Find My Tool**, change the walkthrough to two questions:

```markdown
The finder walks the user through 2 questions:

1. **What do you want students to do?** (multi-select) — matched against each
   tool's category via the `GOAL_CATEGORIES` map in `app.js`
2. **Which LMS?** — Canvas or Blackboard

Title II compliance is always required (hardcoded `requireA11y = true`). Top 3
results are shown as cards; additional matches appear as runners-up.

There is no discipline question. The sheet's categories can't express
discipline — its two health-sciences tools sit in categories holding 16 tools
between them — so the question was removed rather than answered badly.
```

In **Key Design Decisions**, replace the "Retired tools removed from catalog"
bullet with:

```markdown
- **The sheet is the source of truth** — `tools.json` is generated; the repo
  holds no hand-maintained tool data
- **Unpublished rows are filtered at sync time** — a row is dropped when it has
  no description, or when both availability columns are `Excluded` or `Retired`
- **No hand-maintained tags** — the finder scores on the sheet's `Category`
  through the `GOAL_CATEGORIES` map, which is UI configuration rather than
  per-tool data
- **Local preview needs a server** — `fetch()` is blocked on `file://`
```

- [ ] **Step 5: Commit**

```bash
git add PROJECT.md
git commit -m "$(cat <<'EOF'
Document the sheet-driven catalog workflow

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

- [ ] **Step 6: Stop — the visual pass happens here**

Everything from Tasks 1–5, 7 and 8 is committed locally and unpushed. This is the last moment
before the live site changes, and Task 7's checks could not see rendering.

Do not push. Report to the controller that the branch is ready and the visual pass is
outstanding. The controller runs `python3 -m http.server 8000`, hands the URL to the human, and
gets confirmation of four things browser-less checks cannot establish:

1. The category line under each tool name reads as intended (e.g. Acadly shows
   `STUDENT ENGAGEMENT & CLASSROOM MANAGEMENT`) and doesn't wrap badly in the Tool column
2. The Panopto row's link reads "▶ How to Embed Panopto Videos" and opens the viewer
3. The console is clean — in particular no `Cannot read properties of undefined (reading 'slice')`
4. The finder runs two questions, and "Sit a high-stakes exam" + Canvas returns results drawn
   from ExamSoft Enterprise, Respondus LockDown Browser, Turnitin, iThenticate, Gradescope

Only after the human confirms does the push happen:

```bash
git log --oneline origin/main..main
git push origin main
```

Then confirm the live site at https://olgaberezina1.github.io/UIC-LTI-Catalog — 58 tools with
category lines, and a two-question finder.

---

## Verification summary

| What | How |
|---|---|
| Script logic | `cd scripts && python3 -m unittest test_sync_catalog -v` — 24 tests |
| Sheet parsing | `python3 scripts/sync_catalog.py --dry-run` — 58 tools, Packback warning |
| Generated data | 58 entries, 10 with `video`, every one with `category`, none with `tags` |
| Expected first-run diff | ClassRanked `bb no→yes` / `cv contract→yes`; 7 descriptions lose their appended link text (Canvas Studio, Gradescope, Lucid, McGraw Hill Connect, Panopto, Piazza, Zoom) |
| Page | Local server: 58 rows, category lines, walkthrough links, clean console, 2-question finder, sensible high-stakes results, URL restore |
| Live site | 58 tools and a 2-question finder after the final push |
