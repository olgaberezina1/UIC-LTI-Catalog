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
Expected: PASS — 22 tests

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

