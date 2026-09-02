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
Expected: PASS — 13 tests

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

