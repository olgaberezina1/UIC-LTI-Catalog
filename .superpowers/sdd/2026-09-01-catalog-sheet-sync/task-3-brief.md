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
Expected: PASS — 17 tests

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

