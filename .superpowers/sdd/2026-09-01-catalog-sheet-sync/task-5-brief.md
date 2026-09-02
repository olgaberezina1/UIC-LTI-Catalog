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
Expected: PASS — 22 tests, unchanged by the new I/O code

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

