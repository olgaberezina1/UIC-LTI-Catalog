# Final-review fix wave — report

Base: 226d83f on `main`. All work committed locally on `main`; nothing pushed (controller pushes).

## A. scripts/sync_catalog.py + scripts/test_sync_catalog.py

**A1. Description lint (non-fatal warning).**
- `scripts/sync_catalog.py:119-138` — new `lint_description(tool)`: splits `desc` on `\n`,
  computes the last non-empty stripped line, and warns when the description contains a newline
  OR that last line equals `tool["videoTitle"]` case-insensitively/stripped. Message:
  `"<name>: description carries a trailing line '<last line>' — clean the sheet's Description cell"`.
  Never mutates `tool["desc"]`.
- `scripts/sync_catalog.py:160-162` — wired into `build_catalog()`, called once per tool actually
  kept (after dedupe), appending to the existing `warnings` list.
- Tests: `scripts/test_sync_catalog.py:224-260` —
  `test_warns_when_description_contains_a_newline` (newline trigger, asserts the description
  itself is unchanged), `test_warns_when_last_line_matches_video_title_even_without_a_newline`
  (last-line-equals-videoTitle trigger, no newline present), `test_no_warning_for_a_clean_description`
  (clean case).

**A2. Video URL must be https.**
- `scripts/sync_catalog.py:102-110` — in `row_to_tool()`, when the hyperlink cell is non-empty
  and does not start with `https://`, raises `SyncError(f"{name}: walkthrough video URL {url!r}
  is not https — fix the sheet's hyperlink")` before setting `tool["video"]`.
- Tests: `scripts/test_sync_catalog.py:135-168` — `test_accepts_an_https_video_url`,
  `test_rejects_a_plain_http_video_url_naming_the_tool`,
  `test_rejects_a_javascript_video_url_naming_the_tool` (both http:// and javascript: abort;
  existing https case in `test_adds_video_and_title_when_hyperlinked` still passes).

**A3. `read_rows` opens with `data_only=True`.**
- `scripts/sync_catalog.py:227` — `openpyxl.load_workbook(path, data_only=True)`.
- Verified live (Verification #2 below): 58 tools, 10 with `video`, `no changes` against the
  committed `tools.json` — hyperlinks still resolve correctly.

**A4. `import openpyxl` moved inside `read_rows`.**
- `scripts/sync_catalog.py:12` (top-level import) removed; `scripts/sync_catalog.py:225` —
  `import openpyxl` now the first line of `read_rows()`.
- `scripts/test_sync_catalog.py:7-10` — `try: import openpyxl / except ImportError: openpyxl =
  None` so the module still imports cleanly when openpyxl is absent.
- Verified: `python3 -c "import sync_catalog"` succeeds under the system Python (no openpyxl
  installed), and the 30 pure-function tests still pass under it (see Verification #1's
  system-python cross-check below).

**A5. `read_rows` tests.**
- `scripts/test_sync_catalog.py:302-370` — new `ReadRowsTest` class, gated
  `@unittest.skipUnless(openpyxl, "openpyxl is not installed")`:
  - `test_reads_rows_keyed_by_header_skips_blank_and_carries_hyperlink` — builds an in-memory
    workbook via `openpyxl.Workbook()` with the seven `COL_*` headers plus one blank (`None`)
    header column and two data rows, sets `.hyperlink` on one video cell, saves to a temp path,
    and asserts rows come back as header-keyed dicts, the blank header is absent from the dict,
    the hyperlinked row's `VIDEO_URL_KEY` carries the target URL, and the non-hyperlinked row's
    is `""`.
  - `test_raises_when_the_sheet_tab_is_missing` — workbook titled something other than
    `SHEET_TAB` raises `SyncError`.
  - `test_raises_naming_the_missing_description_column` — headers without `COL_DESC` raise
    `SyncError` naming `COL_DESC`.
- Reused the existing `row()`/`full_row()`/`tool()` helpers unchanged for A1/A2 tests; did not
  invent parallel ones.

**A6. Git pre-flight (real path only, before `write_tools`).**
- `scripts/sync_catalog.py:266-279` — `is_ancestor(ancestor, ref)`: a direct `subprocess.run`
  around `git merge-base --is-ancestor` (not routed through the existing `git()` helper, since a
  "no" answer is a normal non-zero exit for this command, not a failure `git()` should turn into
  a `SyncError` about stderr).
- `scripts/sync_catalog.py:281-296` — `ensure_publishable()`: checks
  `git rev-parse --abbrev-ref HEAD` == `main`, else
  `SyncError("on branch '<x>' — the script publishes from main; switch branches first")`; then
  `git fetch origin main` and `is_ancestor("origin/main", "HEAD")`, else
  `SyncError("local main is behind origin/main — pull first")`.
- `scripts/sync_catalog.py:355` — called in `main()` right after the `--dry-run` early return and
  before `write_tools(tools)`, so `--dry-run` performs no git operations at all (unchanged).

**A7. Recovery hint on failure after the write.**
- `scripts/sync_catalog.py:23-26` — `RECOVERY_HINT` constant: `"tools.json is written locally —
  inspect with 'git status', then 'git push origin main' once it is committed"`.
- `scripts/sync_catalog.py:357-365` — `write_tools(tools)` runs, then `commit_and_push(summary)`
  is wrapped in `try/except Exception: print(RECOVERY_HINT, file=sys.stderr); raise` — prints the
  hint for *any* exception type raised after the write, then re-raises unchanged so `__main__`'s
  formatting/exit-code logic (SyncError vs. A9's other types vs. unknown) still applies.

**A8. Generated-commit trailer.**
- `scripts/sync_catalog.py:298-306` — `commit_and_push()`'s commit message trailer changed from
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` to
  `Generated-By: scripts/sync_catalog.py`.
- No existing test asserted the old "Opus" text (confirmed via grep before editing), so there was
  nothing to update there.

**A9. Non-SyncError failures print in the script's format.**
- `scripts/sync_catalog.py:8-11` — added `import urllib.error` and `import zipfile` (stdlib,
  no new dependency).
- `scripts/sync_catalog.py:369-382` — `__main__`'s except clause now catches
  `(SyncError, urllib.error.URLError, zipfile.BadZipFile, OSError,
  subprocess.CalledProcessError)` as one tuple (same `error:` formatting for all, since the
  message construction is identical), exits 1. Any other exception type still tracebacks.

## B. app.js

**B1.** `app.js:9-14` — `loadTools()`: `const data = await res.json();` then
`if (!Array.isArray(data)) throw new Error('tools.json is not an array');` before assigning
`LTI_TOOLS = data;`. The existing `try/catch` around `loadTools()` in the `DOMContentLoaded`
handler (`app.js:502-509`) already renders the failed-to-load state on any thrown error.

**B2.** Four comment fixes, no behavior change:
- `app.js:66-67` — "Tool data is trusted, but escape anyway" → "Tool data is external — fetched
  from tools.json, generated from a spreadsheet — so escaping is required."
- `app.js:74-75` — "─── 2. Scoring (verbatim port from data.js) ───" → "─── 2. Scoring ───" plus a
  new one-line note: "Goals match a tool by its `category`, via GOAL_CATEGORIES below."
- `app.js:147` — "How many catalog rows per page (59 tools → 2 pages)." → "How many catalog rows
  per page." (count-neutral).
- `app.js:160` — deleted the stale "// Stubs filled in by later tasks" line directly above
  `function renderFinder()`, which is fully implemented, not a stub.
- Confirmed with `node --check app.js` → passes (Verification #3 below).

## C. PROJECT.md

**C1.** `PROJECT.md:14` — Tech Stack bullet now reads "...no dependencies (the page itself; the
sync script needs openpyxl — see \"How to Update Tool Data\")". `PROJECT.md:137` — new sentence
before the numbered steps: "The script needs Python 3 with **openpyxl** installed
(`python3 -m pip install openpyxl`, or a venv)."

**C2.** `PROJECT.md:62` — schema table `video` row now reads "...renders a walkthrough link in
the catalog, labelled from `videoTitle` if present, else \"Watch walkthrough\"", matching the
Catalog Table bullet at `PROJECT.md:109`.

**C3.** `PROJECT.md:178-180` — Key Design Decisions row-selection bullet now states the full rule:
"a row is dropped when its name is blank, its description is blank, or both availability columns
are `Excluded` or `Retired`" — matching both `should_keep()` and the "How to Update Tool Data"
paragraph at `PROJECT.md:155-158`.

**C4.** `PROJECT.md:150-153` — added to the guards paragraph: "Before it commits and pushes, it
also checks that the local repo is on `main` and up to date with `origin/main`, refusing to run
otherwise."

## D. Spec + plan correction

**Spec** — `docs/superpowers/specs/2026-09-01-catalog-sheet-sync-design.md:252-266`: struck
through the "Seven descriptions lose their appended link text..." bullet in the Verification
section and added a dated **Correction (2026-09-01)** paragraph explaining the text is a trailing
paragraph in the sheet's own Description cell, preserved verbatim (script never edits content),
now rendered with the videoTitle repeated as the link label beneath, with the real fix (clean the
seven Description cells) and the interim mitigation (A1's non-fatal warning).

**Plan** — `docs/superpowers/plans/2026-09-01-catalog-sheet-sync.md:1345-1355`: struck through the
same claim in the "Expected first-run diff" row of the Verification summary table and added the
matching dated Correction paragraph immediately after the table.

Note: I checked Task 6's own body text (`docs/superpowers/plans/...:808-860`, the "Generate and
land tools.json" section) for the literal "lose their appended link text" claim the brief
attributes to it. It is not there — Task 6's Step 1/2/3 describe running the script and checking
`tools.json` counts, and never states the seven-description claim itself; only the Verification
summary table (which the brief also names) does. I added the correction only where the false
claim actually appears (spec Verification, plan Verification summary) and did not edit Task 6's
body, since there was nothing false in it to correct — the plan correction paragraph explicitly
notes it also covers "the equivalent claim implicit in Task 6's expected diff" for readers who
land there first.

## E. .gitignore

`.gitignore:4-8` — comment now reads "...regenerate them with the superpowers SDD skill's
review-package script." (was "...with scripts/review-package", which does not exist in this repo).

## Commits

Three commits on `main`, none pushed:
1. `40e28d3` — Sync script: description lint, https-only video URLs, git pre-flight, fail-loud
   errors (A1–A9, `scripts/sync_catalog.py` + `scripts/test_sync_catalog.py`)
2. `e8750a3` — app.js: guard against a non-array tools.json and fix stale comments (B1–B2)
3. `5e0e1ab` — Docs: openpyxl dependency, pre-flight guard, schema/rule consistency, correct the
   record (C1–C4, D, E)

## Verification

**1. Tests** — `cd scripts && <venv>/bin/python -m unittest test_sync_catalog -v`

```
----------------------------------------------------------------------
Ran 33 tests in 0.035s

OK
```

33 = 24 existing + 9 new (3 A2 https-URL tests, 3 A1 description-lint tests, 3 A5 read_rows
tests). Also cross-checked under the system `python3` (no openpyxl): 33 tests ran, 30 passed, 3
skipped (`OK (skipped=3)`) — confirming A4's import-inside-`read_rows` fix.

**2. Live dry run** — `<venv>/bin/python scripts/sync_catalog.py --dry-run`

```
warning: Canvas Studio: description carries a trailing line 'Canvas Studio Introduction' — clean the sheet's Description cell
warning: Gradescope: description carries a trailing line 'Gradescope Linking Assignments' — clean the sheet's Description cell
warning: Lucid: description carries a trailing line 'Lucid Integration' — clean the sheet's Description cell
warning: McGraw Hill Connect: description carries a trailing line 'McGraw Integration' — clean the sheet's Description cell
warning: Panopto: description carries a trailing line 'How to Embed Panopto Videos' — clean the sheet's Description cell
warning: duplicate row for Packback — keeping the first
warning: Piazza: description carries a trailing line 'Piazza Introduction' — clean the sheet's Description cell
warning: Zoom: description carries a trailing line 'Zoom Canvas Setup' — clean the sheet's Description cell
58 tools in the sheet
no changes
```

58 tools, the Packback duplicate warning, and exactly the 7 expected description warnings
(Canvas Studio, Gradescope, Lucid, McGraw Hill Connect, Panopto, Piazza, Zoom). "no changes"
confirms `tools.json` (58 tools, 10 with `video`, verified separately with a one-off
`json.load` count) already matches what `data_only=True` parsing produces — hyperlinks still
resolve correctly under A3.

`git status --short` immediately after:

```
 M .superpowers/sdd/2026-09-01-catalog-sheet-sync/progress.md
```

Nothing written by the dry run; the one modified file is a pre-existing uncommitted progress log
from before this task started (not part of this fix wave's deliverables — see Concerns).

**3. `node --check app.js`**

```
$ node --check app.js && echo OK
OK
```

**4. `git diff --stat 226d83f..HEAD`**

```
 .gitignore                                         |   3 +-
 PROJECT.md                                         |  15 +-
 app.js                                             |  14 +-
 .../plans/2026-09-01-catalog-sheet-sync.md         |  10 +-
 .../specs/2026-09-01-catalog-sheet-sync-design.md  |  12 +-
 scripts/sync_catalog.py                            |  98 ++++++++++-
 scripts/test_sync_catalog.py                       | 179 +++++++++++++++++++++
 7 files changed, 310 insertions(+), 21 deletions(-)
```

Exactly the seven files the brief allows — sync_catalog.py, test_sync_catalog.py, app.js,
PROJECT.md, the spec, the plan, .gitignore. No tools.json, index.html, or styles.css changes.

**5. `git log origin/main..HEAD` / `git status -sb`**

```
$ git log --oneline origin/main..HEAD
5e0e1ab Docs: openpyxl dependency, pre-flight guard, schema/rule consistency, correct the record
e8750a3 app.js: guard against a non-array tools.json and fix stale comments
40e28d3 Sync script: description lint, https-only video URLs, git pre-flight, fail-loud errors

$ git status -sb
## main...origin/main [ahead 3]
 M .superpowers/sdd/2026-09-01-catalog-sheet-sync/progress.md
```

Three commits ahead of `origin/main`, nothing pushed.

## Concerns

1. **Pre-existing uncommitted `progress.md` change.** At task start, before I touched anything,
   `.superpowers/sdd/2026-09-01-catalog-sheet-sync/progress.md` already had an uncommitted
   modification (a "RESUMED on new machine" section plus visual-pass/final-review notes, all
   consistent with and predating this brief). It is not one of the seven files the brief lists as
   allowed to change, so I left it untouched — neither staged nor reverted. It still shows in
   `git status` as a working-tree modification. The controller may want to commit or discard it
   separately; I did not fold it into any of my three commits.
2. **D's "Task 6" reference.** As detailed under item D above, Task 6's own body text in the plan
   never actually states the "lose their appended link text" claim — only the Verification
   summary table does. I corrected the claim only where it exists (spec Verification, plan
   Verification summary) rather than editing Task 6's step text, and said so explicitly in the
   plan's correction paragraph so a reader arriving via Task 6 is still pointed to the fix.

Everything else in the brief (A1–A9, B1–B2, C1–C4, E) was completed exactly as specified, with no
other deviations.
