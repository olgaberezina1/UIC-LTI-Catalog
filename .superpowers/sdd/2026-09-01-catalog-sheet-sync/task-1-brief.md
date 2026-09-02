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


def row(name="Acadly", bb="Yes", cv="Yes"):
    return {sc.COL_NAME: name, sc.COL_BB: bb, sc.COL_CV: cv}


class ShouldKeepTest(unittest.TestCase):
    def test_keeps_a_live_row(self):
        self.assertTrue(sc.should_keep(row()))

    def test_keeps_a_row_live_in_only_one_lms(self):
        self.assertTrue(sc.should_keep(row(bb="Excluded", cv="Yes")))
        self.assertTrue(sc.should_keep(row(bb="Yes", cv="Retired")))

    def test_drops_rows_dead_in_both(self):
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Excluded")))
        self.assertFalse(sc.should_keep(row(bb="Retired", cv="Retired")))
        self.assertFalse(sc.should_keep(row(bb="", cv="")))
        self.assertFalse(sc.should_keep(row(bb="Excluded", cv="Retired")))

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd scripts && python3 -m unittest test_sync_catalog -v`
Expected: PASS — 8 tests

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

