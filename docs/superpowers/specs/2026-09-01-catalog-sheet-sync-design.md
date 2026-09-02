# Catalog data from the Google Sheet — design

**Date:** 2026-09-01
**Status:** Approved, ready for implementation planning

## Problem

Tool data lives as a 58-entry `LTI_TOOLS` array literal inside `app.js` (lines 5–64).
Every catalog change is a hand edit to that array, transcribed from a spreadsheet that is
already the authoritative source. The transcription is slow and drifts: seven descriptions
currently carry stray link text glued onto the end ("Gradescope Linking Assignments"), and
ClassRanked's availability is two revisions behind the sheet.

Move the data out of `app.js` into a generated `tools.json`, produced by a script that reads
the sheet directly.

## Source of truth

Google Sheet `1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY`, tab **Published** (`gid=1788000122`),
shared as "anyone with the link can view" — no credentials needed.

Downloaded as **xlsx**, not CSV:

```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=xlsx
```

CSV export flattens a hyperlinked cell to its display text, which destroys the ten Panopto
URLs in the *UIC Walkthrough Video* column. The xlsx export preserves `cell.hyperlink.target`,
and openpyxl reads it. This was verified against the live sheet: all ten URLs come back
byte-identical to the ones in `app.js` today.

Columns used: `Tool Name1`, `Description`, `Category`, `Available in Blackboard`,
`Available in Canvas`, `Title II Compliant`, `UIC Walkthrough Video`. The remaining columns
(Vendor/Provider, Support Documentation, Instructor Steps, Instructor Video, Bb to Canvas
Conversion Steps) are ignored.

## `tools.json`

A plain JSON array at the repo root, sorted case-insensitively by `name` — the order the
catalog already displays.

```json
[
  {
    "name": "Acadly",
    "desc": "A comprehensive classroom management platform that combines attendance tracking, live polling, assignments, and communication tools for enhanced student engagement.",
    "category": "Student Engagement & Classroom Management",
    "bb": "yes",
    "cv": "yes",
    "t2": "yes"
  },
  {
    "name": "Panopto",
    "desc": "A comprehensive video platform for education…",
    "category": "Media & Content Creation",
    "bb": "yes",
    "cv": "yes",
    "t2": "yes",
    "video": "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c-3a9e-4339-93b1-b367013674af",
    "videoTitle": "How to Embed Panopto Videos"
  }
]
```

`video` and `videoTitle` are present only on rows whose walkthrough cell is a hyperlink.
`tags` is gone entirely.

## Row selection

Drop a row when:

1. `Tool Name1` is blank, **or**
2. `Description` is blank — a placeholder row somebody typed a name into, **or**
3. *both* `Available in Blackboard` and `Available in Canvas` are `Excluded` or `Retired`

**Blank availability is not a drop signal.** Of the sheet's 112 rows, 39 are Excluded in both
columns and 13 are Retired in both; one more (Coursera) is a bare name with every other cell
empty. That leaves 59 rows and, after de-duplication, exactly the 58 tools the site shows today.

Rule 2 is what separates the two rows that are blank in both availability columns, since rule 3
cannot tell them apart:

- **Coursera** — name only, every other cell empty. A stub, and not on the site today.
- **Virtual Machine** — description, category, vendor `UIC`, support documentation, Title II
  `Yes`. Blank availability because it is not an LMS integration at all but a campus computing
  resource, and it is on the site today as `bb: "—", cv: "—"`.

Treating blank availability as "unpublished" would silently delete Virtual Machine from the live
catalog; treating it as "publish anyway" would add the empty Coursera stub. Keying on whether the
row has content does neither.

Duplicate names collapse to the first occurrence and print a warning. The sheet currently
contains **Packback twice**.

## Status mapping

| Sheet value | Code | Sheet value | Code |
|---|---|---|---|
| `Yes` | `yes` | `Waiting for vendor response` | `pending` |
| `No` | `no` | `In Progress` | `progress` |
| `NA` | `na` | `Available Per Request` | `request` |
| `Standalone` | `standalone` | `Not licensed, unavailable.` | `unlicensed` |
| `Retired` | `retired` | *(blank)*, `Status` | `—` |

`Excluded` never reaches the mapper; those rows are dropped first.

**An unrecognized value aborts the run** with the offending tool name, column, and value.
This is the failure mode that sank the earlier attempt (commit `47cc0c7`): it lowercased
whatever it found, silently produced zero tools, and fell back to stale embedded data with
nothing but a `console.warn` to show for it.

The codes `contract`, `migrating`, and `standalone_mig` remain in `AVAIL_LABEL` even though
the sheet no longer uses them. `AVAIL_LABEL` is display-layer only; leave it alone.

## The sync script

`scripts/sync_catalog.py` — Python 3, stdlib plus openpyxl (already installed; required for
hyperlink extraction).

```
python3 scripts/sync_catalog.py [--dry-run]
```

1. Download the xlsx to a temp file
2. Parse the Published tab; filter, map, de-duplicate, sort
3. Diff against the existing `tools.json` and print a change summary:
   `ClassRanked: cv contract→yes`, `+ ATI Testing`, `− Kortex`
4. Exit 0 without committing when nothing changed
5. Write `tools.json`, `git add tools.json`, commit with the summary in the message, push

Guards, because the script pushes unattended:

- **Abort if the result has fewer than 40 tools.** A renamed tab or revoked sharing must not
  be able to empty the catalog.
- **Abort on an unrecognized status value** (above).
- **Stage only `tools.json`.** Never `git add -A` — the working tree routinely holds
  unrelated untracked files such as `.DS_Store`.
- `--dry-run` prints the summary and writes, commits, and pushes nothing.

## `app.js` changes

All line numbers below refer to `app.js` as it stands before this change; they shift as soon as
the array literal is removed.

**Loading.** Delete the array literal at lines 5–64; declare `let LTI_TOOLS = []`. In the
`DOMContentLoaded` handler (line 560), immediately after `main = document.querySelector('main')`
and before the hero count is written, `await fetch('tools.json')` and assign the result. The
handler becomes `async`. Every existing consumer already reads `LTI_TOOLS` at call time
rather than closing over the literal, so no other call site changes.

If the fetch fails, render an error state in the catalog body rather than throwing — a blank
page with a console error is worse than a visible "Catalog failed to load."

**Category replaces tags in the UI.**

- `app.js:403` — `<div class="catalog-tags">${t.tags.slice(0, 2)…}` becomes `${esc(t.category)}`
- `app.js:309` — `<div class="result-tag-list">${t.tags.slice(0, 3)…}` becomes `${esc(t.category)}`

`.catalog-tags` (`styles.css:488`) is uppercase mono at 10px. Category strings are longer than
the two tags they replace — "Course Management & Instructional Oversight" is 42 characters —
so they will wrap under the tool name in the Tool column. Acceptable; adjust only if it looks
wrong in the browser.

**Walkthrough link.** `app.js:396` uses `videoTitle` as the label when present, falling back to
"Watch walkthrough": `▶ How to Embed Panopto Videos`.

**The finder loses Question 03.** `QUESTIONS` (line 84) drops the `discipline` entry, leaving
two questions: goals, then LMS. `index.html` needs no change — `#progress` and `#question-slot`
render from `QUESTIONS`, and the counter and progress dots derive from its length.

**Goals are scored on category.** `scoreTools` (line 140) replaces `tool.tags.includes(g)` with
a lookup in a new module-level constant:

```js
const GOAL_CATEGORIES = {
  polling:       ["Engagement & Classroom Response Systems",
                  "Student Engagement & Classroom Management",
                  "Engagement & Participation Tracking"],
  discussion:    ["Collaboration & Communication"],
  practice:      ["Assessment & Testing", "Content Delivery & Digital Textbooks"],
  "high-stakes": ["Assessment Security & Academic Integrity", "Assessment & Testing",
                  "Academic Integrity & Plagiarism Prevention"],
  writing:       ["Academic Integrity & Plagiarism Prevention", "Assessment & Grading Tools"],
  video:         ["Media & Content Creation", "Multimedia Collaboration & Visual Tools"],
  lab:           ["Specialized Academic Platforms", "Safety & Compliance"],
};
```

This table is UI configuration, not per-tool data — the sheet remains the only per-tool source.
A category absent from the table simply never matches a goal; such tools still appear in the
catalog and still score on LMS and Title II.

**Goal options merge from eight to seven.** "Discuss together" (`discussion`) and "Annotate
readings" (`annotation`) both map to the single 4-tool "Collaboration & Communication" category
and would return identical results. They become one option:

```js
{ v: "discussion", t: "Discuss & annotate", s: "Threaded discussion, Q&A, social annotation" }
```

**Dead scoring branches go.** `scoreTools` accepts `stakes` and `size` and scores them against
tags, but nothing has ever passed either — they are absent from `QUESTIONS` and from
`state.answers`. Remove both parameters, their branches, their weights, and their `max` terms,
along with the `discipline` branch.

**`discipline` comes out of the URL-state plumbing**, all in section 5:

| Line | Change |
|---|---|
| 186–188 | `state.answers` drops `discipline` |
| 447 | `resetAnswers()` drops `discipline` |
| 453 | `VALID.goals` drops `annotation` |
| 455 | `VALID.discipline` deleted |
| 463 | `syncHash()` stops serializing `discipline` |
| 472 | `emptyAnswers()` drops `discipline` |
| 476–478 | `hasAnyAnswer()` drops the `discipline` check |
| 482–485 | `firstUnansweredStep()` returns `QUESTIONS.length - 1` after `lms` |
| 505 | `readHash()` stops parsing `discipline` |
| 285 | `querySummary()` drops the `discipline` bit |

Previously shared links carrying `discipline=stem` or `goals=annotation` degrade gracefully —
`readHash` already filters values against `VALID` and ignores unknown params.

## Local development

`fetch()` is blocked on `file://` origins, so opening `index.html` by double-clicking will no
longer show a catalog. Local preview becomes:

```
python3 -m http.server 8000    # then open http://localhost:8000
```

GitHub Pages is unaffected — it serves over http.

## `PROJECT.md` updates

- Rewrite **How to Update Tool Data**: edit the Google Sheet, run `python3 scripts/sync_catalog.py`,
  review the printed summary
- Tool Data table: remove `tags`, add `category`, add `videoTitle`
- File Structure: add `tools.json` and `scripts/sync_catalog.py`
- Find My Tool section: two questions, not three
- Key Design Decisions: replace "Retired tools removed from catalog" with the row-selection rule,
  and note that local preview now needs a server
- Drop the "Tools with Panopto Walkthrough Videos" table — that list is now generated from the sheet

## Verification

**Script.** `--dry-run` against the live sheet must report exactly 58 tools and this diff
against today's data, and nothing else:

- ClassRanked: `bb no→yes`, `cv contract→yes`
- ~~Seven descriptions lose their appended link text (Canvas Studio, Gradescope, Lucid,
  McGraw Hill Connect, Panopto, Piazza, Zoom)~~ — see **Correction (2026-09-01)** below
- `category` added to all 58; `video`/`videoTitle` on the same ten tools as today
- `tags` removed from all 58
- A duplicate-name warning for Packback

**Correction (2026-09-01):** the struck-through bullet above was wrong. The seven descriptions
did not lose their appended link text — that text is a trailing paragraph inside the sheet's own
Description cell, and the sync preserves it verbatim (the script never edits content; the sheet is
the source of truth). The page renders the description as before, now with the same title
repeated as the walkthrough link's label directly beneath it. The actual fix is to clean the seven
Description cells in the sheet; in the meantime the sync script flags them with a non-fatal
warning so the operator notices before publishing (final fix wave, item A1).

**Page**, served locally: catalog shows 58 rows and the hero count reads 58; a category line
sits under each tool name; Panopto's row links to the Panopto URL labelled "How to Embed Panopto
Videos"; the finder runs two questions and returns three ranked results; picking "Sit a
high-stakes exam" surfaces ExamSoft/Respondus/Turnitin rather than arbitrary tools; a results
URL still restores its answers on reload.

## Out of scope

- The scheduled GitHub Action — the script is written so it can be dropped into CI later, but
  auto-publishing without a review step is deliberately not part of this change
- Reinstating a discipline question, whether via a new sheet column or otherwise
- Consolidating the sheet's 25 categories, several of which are near-duplicates
  ("Analytics & Evaluation" vs "Analytics & Insights")
- Fixing the sheet's own data problems: the duplicate Packback row, and the ~30 Excluded/Retired
  rows whose Description and Category cells are transposed
