# Final-review fix wave — brief

Repo: /Users/oleh/Projects/UIC-LTI-Catalog (branch main, BASE 226d83f). Spec:
docs/superpowers/specs/2026-09-01-catalog-sheet-sync-design.md. Plan:
docs/superpowers/plans/2026-09-01-catalog-sheet-sync.md. Read the spec's "The sync script" and
"Row selection" sections before touching scripts/sync_catalog.py; its philosophy is **fail loud,
never guess, never silently fall back**. Keep pure transforms (dict in → dict out) separate from
I/O, as the file already does.

Hard rules:
- **Never run `python3 scripts/sync_catalog.py` without `--dry-run`.** The real run commits and
  pushes to origin/main.
- **Never push.** Commit locally only. The controller pushes.
- Stage files by name; never `git add -A`.
- No new dependencies (stdlib + openpyxl only; browser JS stays library-free, one IIFE).
- Python on this machine: the system python has no openpyxl and pip is blocked. Use
  `/private/tmp/claude-501/-Users-oleh-Projects-UIC-LTI-Catalog/42fd7193-e626-4693-8abb-0082ed76709c/scratchpad/venv/bin/python`
  for every `python` invocation (tests and dry runs).
- Commit trailer on every commit (two lines, exactly):
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01XvrfihxwiW1Hx7MSsBVkmF
  ```
- Group the work into a few coherent commits (e.g. script guards+tests / app.js / docs). Each
  commit message says what and why.

## A. scripts/sync_catalog.py + scripts/test_sync_catalog.py

A1. **Description lint (non-fatal warning).** In `build_catalog`, for each kept tool emit a warning
(into the existing warnings list) when the description contains a newline, or when its last
non-empty line equals `videoTitle` (case-insensitive, stripped). Message shape:
`"<name>: description carries a trailing line '<last line>' — clean the sheet's Description cell"`.
Do NOT strip or alter the description: the sheet is the source of truth and the script never edits
content. Test both triggers and the clean case.

A2. **Video URL must be https.** In `row_to_tool`, when a video hyperlink is present, raise
`SyncError` naming the tool unless the URL starts with `https://`. Test: an `http://` and a
`javascript:` URL both abort; the existing https case still passes.

A3. **`read_rows` opens the workbook with `data_only=True`** so formula cells yield their cached
value, not formula text. Verify with the live dry run (see Verification) that hyperlinks still come
through: 58 tools, 10 with video.

A4. **Move `import openpyxl` inside `read_rows`** so the pure-function tests import and run without
openpyxl. In the test file, import openpyxl under try/except and `skipUnless` the read_rows tests
(A5) on it, so the module still imports cleanly when openpyxl is absent.

A5. **Test `read_rows`.** Build a workbook in memory with `openpyxl.Workbook()`: a sheet named per
`SHEET_TAB`, the seven required headers (use the `COL_*` constants), one blank header column, two
data rows, one cell with `.hyperlink` set. Save to a temp path and assert: rows come back as dicts
keyed by header; the blank header is skipped; the hyperlink target appears under `VIDEO_URL_KEY`;
a workbook missing the tab raises `SyncError`; a workbook missing the Description header raises
`SyncError` naming that column.

A6. **Git pre-flight, on the real (non-dry-run) path only, before `write_tools`:**
  - current branch (`git rev-parse --abbrev-ref HEAD`) must be `main`, else
    `SyncError("on branch '<x>' — the script publishes from main; switch branches first")`;
  - `git fetch origin main`, then `origin/main` must be an ancestor of `HEAD`
    (`git merge-base --is-ancestor origin/main HEAD`), else
    `SyncError("local main is behind origin/main — pull first")`.
  Keep these in small helper(s) in the I/O layer next to the existing `git()` helper. `--dry-run`
  performs no git operations at all (unchanged).

A7. **Recovery hint on failure after the write.** If commit or push fails after `write_tools`
ran, the error path must also print one line:
`tools.json is written locally — inspect with 'git status', then 'git push origin main' once it is committed`.
Structure it so the hint is printed for any exception raised after the write (not just SyncError).

A8. **Generated-commit trailer.** The commit the script creates currently carries
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Future syncs are run by a human alone;
replace that trailer with `Generated-By: scripts/sync_catalog.py`. Update any test asserting the
old text.

A9. **Non-SyncError failures print in the script's format.** In `__main__`, also catch
`urllib.error.URLError`, `zipfile.BadZipFile`, `OSError` (and `subprocess.CalledProcessError` if
the git helper can raise it) and print them as `error: <message>` with exit 1. Any other exception
still tracebacks (that is deliberate — unknown failures should be loud).

## B. app.js (one IIFE; keep the numbered section comments)

B1. After `const data = await res.json()` (≈line 12): if `!Array.isArray(data)` throw an Error
("tools.json is not an array") so the existing catch renders the failed-to-load state.

B2. Fix stale comments: ≈line 64–65 "Tool data is trusted, but escape anyway" → say the data is
external (fetched from tools.json, generated from a spreadsheet) so escaping is required;
≈line 72 "2. Scoring (verbatim port from data.js)" → "2. Scoring" with a one-line note that goals
match on category via GOAL_CATEGORIES; ≈line 143 "59 tools → 2 pages" → make it count-neutral;
≈line 157 "Stubs filled in by later tasks" → delete or make true. Comments only; no behaviour
change beyond B1. Confirm with `node --check app.js`.

## C. PROJECT.md

C1. Under "How to Update Tool Data", add one sentence before the numbered steps:
the script needs Python 3 with **openpyxl** (`python3 -m pip install openpyxl`, or a venv). Keep
the Tech Stack "no dependencies" claim true by scoping it to the site itself (the page has none;
the sync script needs openpyxl).
C2. Tool Data schema table, `video` row (≈line 62): it renders a walkthrough link whose label is
`videoTitle` (falls back to "Watch walkthrough") — make it consistent with the Catalog Table bullet.
C3. Key Design Decisions, "Unpublished rows are filtered at sync time" bullet (≈line 174): state the
full rule — dropped when the name is blank, the description is blank, or both availability
columns are `Excluded` or `Retired`. Must match the "How to Update Tool Data" paragraph and
`should_keep()`.
C4. Mention the new pre-flight (must be on main and up to date with origin) in one sentence where
the script's guards are described.

## D. Spec + plan: make the record true

The spec (Problem, and Verification) and the plan (Verification summary, Task 6) claim the seven
descriptions "lose their appended link text". They did not: the text is in the sheet's own
Description cells as a trailing paragraph, and the page renders it as before, now with the same
title repeated as the link label beneath. Add a short dated **Correction** note (2026-09-01) to
the spec's Verification section and the plan's Verification summary saying exactly that, naming
the fix (clean the seven Description cells in the sheet; the script now warns — A1) and leaving
the original text in place struck through or quoted, so the history stays readable.

## E. .gitignore comment

The comment says regenerate review diffs "with scripts/review-package" — no such file in this
repo. Say: "with the superpowers SDD skill's review-package script".

## Verification (all must be in your report with commands and output)

1. `cd scripts && <venv>/bin/python -m unittest test_sync_catalog -v` — all pass (24 existing +
   your new ones; state the count).
2. `<venv>/bin/python scripts/sync_catalog.py --dry-run` — must still report **58 tools**, the
   Packback duplicate warning, and now the A1 description warnings (expect ~7: Canvas Studio,
   Gradescope, Lucid, McGraw Hill Connect, Panopto, Piazza, Zoom). It must write nothing:
   `git status --short` shows only your intended files.
3. `node --check app.js`.
4. `git diff --stat 226d83f..HEAD` — only sync_catalog.py, test_sync_catalog.py, app.js,
   PROJECT.md, the spec, the plan, .gitignore.
5. `git log origin/main..HEAD` shows your commits; `git status -sb` shows ahead, nothing pushed.

## Report

Write the full report to
`/Users/oleh/Projects/UIC-LTI-Catalog/.superpowers/sdd/2026-09-01-catalog-sheet-sync/final-fix-report.md`:
per item A1–E what you changed (file:line), each verification command with its output, and
anything you could not do or disagree with. Return only: status (DONE / DONE_WITH_CONCERNS /
BLOCKED), commit SHAs, one-line test summary, concerns.
