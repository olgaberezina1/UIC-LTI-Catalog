# SDD ledger — plan: docs/superpowers/plans/2026-09-01-catalog-sheet-sync.md

Spec: docs/superpowers/specs/2026-09-01-catalog-sheet-sync-design.md (read — binding authority)
Branch: main (user gave explicit consent; worktree declined because Task 6's script
hardcodes `git push origin main` and would misfire from a feature branch)
Start commit: 71da779

## Pre-flight scan

### Cross-task pairs (shared file or interface)

| Pair | Produces → consumes | Finding |
|---|---|---|
| T1→T2 | `cell`, `map_status`, `COL_*`, `VIDEO_URL_KEY`, `SyncError` → `row_to_tool` | clean |
| T1→T3 | `should_keep`, `MIN_TOOLS`, `SHEET_TAB`, `SyncError` → `build_catalog` | clean |
| T2→T3 | `row_to_tool(row) -> dict` → `build_catalog` | clean |
| T1→T5 | `SHEET_URL`, `SHEET_TAB`, `TOOLS_JSON`, `REPO_ROOT`, `COL_*` → I/O layer | clean |
| T3→T5 | `build_catalog(rows) -> (tools, warnings)` → `main` unpacks 2-tuple | clean |
| T4→T5 | `diff_catalogs(old, new) -> list[str]` → `main`, `commit_and_push(summary)` | clean |
| T1→T5 | T1 writes `import os`; T5 Step 1 replaces that block wholesale | clean — T5 states the replacement explicitly |
| T5→T6 | CLI `sync_catalog.py [--dry-run]` → T6 runs it | clean |
| T2→T6→T7 | schema `name/desc/category/bb/cv/t2/video?/videoTitle?` → T7 reads `t.category`, `t.video`, `t.videoTitle` | clean |
| T7→T8 | 2-question finder, `GOAL_CATEGORIES`, server-required preview → documented | clean |
| T1–T4 | all append to one test file; helpers `row()` (T1), `full_row()` (T2), `tool()` (T4) | clean — no name collisions; T3 uses T2's `full_row`, appended earlier |

### Per-task self-consistency

| Task | Check | Finding |
|---|---|---|
| T1 | 8 tests claimed vs 8 written; test constants vs impl constants | clean |
| T2 | 13 cumulative vs 8+5; `full_row` fields vs `row_to_tool` reads | clean |
| T3 | 17 cumulative vs 13+4; guard test uses `MIN_TOOLS-1` | clean |
| T4 | 22 cumulative vs 17+5; asserted diff strings vs `DIFF_FIELDS` order | clean |
| T5 | expected console output vs `main()` print order (warnings → count → summary) | clean |
| T6 | expects 58 tools, matching T5's dry-run expectation; sort order `Acadly, ACS…, Aleks` | clean |
| T7 | line range 4–64 vs actual literal bounds; counter `01 / 02` vs `` `0${step+1} / 0${total}` `` | clean |
| T7 | Step 7 leftover-grep vs strings that must survive | **DEFECT — ruled below** |
| T8 | documented values (40, xlsx, 2 questions) vs T1/T5/T7 | clean |

## Rulings

Ruling: Fixed Task 7 Step 7's grep from `"tags\|discipline\|stakes\|\bsize\b"` to
`"\.tags\b\|discipline\|weights\.stakes\|weights\.size\|stakes ===\|size ==="`, and named the
three strings that must survive (CSS classes `catalog-tags` / `result-tag-list`, and the
`high-stakes` goal value) — the original pattern matches `class="catalog-tags"` and
`"high-stakes"`, both of which the plan deliberately keeps, so a correct implementation would
have failed its own verification step and invited a wrong "fix" deleting the CSS hooks.
Cost if wrong: the grep misses a stray `tags` read that the Task 7 browser checks would then
have to catch.

Ruling: Added `.superpowers/` to `.gitignore` alongside `docs/superpowers/`. The skill requires
this workspace to be git-ignored, and it was not; without it the ledger and review packages show
as untracked files that a careless `git add` could commit.
Cost if wrong: none meaningful — it is scratch state, and the entry is one line to remove.

Ruling: Batched Tasks 1-4 into ONE implementer dispatch. They are four sequential TDD cycles
appending to the same two files, and the plan supplies the complete code for each — transcription
plus testing, the shape the skill says to batch. Four dispatches plus four review packages for
~250 lines of one module is disproportionate. The review package still shows all four commits
separately, so per-cycle scrutiny survives.
Cost if wrong: one review covers ~250 lines instead of four covering ~60 each, so a defect in an
inner cycle gets less individual attention.

## Progress

Task 1-4: dispatched (batch, haiku) — BASE b7a5d3c

Ruling: Replaced Task 7's nine browser checks with a static harness (scripts/verify_app.py:
GOAL_CATEGORIES strings validated against tools.json categories, finder question count, leftover
field reads, literal removed / fetch present) plus `node --check` and a served-file curl; and moved
the visual confirmation to a hard gate in Task 8 Step 6, before the only push that changes the live
site. The Chrome extension is not connected in this session (verified via tabs_context_mcp), so no
agent can run browser checks; leaving them in the brief would have had an implementer either fake
them or stall. The harness covers the task's likeliest failure — a mistyped category string in
GOAL_CATEGORIES scoring zero matches silently.
Cost if wrong: a purely visual regression (bad wrapping, wrong link label) reaches the human at the
Task 8 gate instead of being caught inside Task 7 — one task later, still before any push.

Ruling: Fixed two regex bugs in the Task 7 harness before dispatch — category extraction matched
the quoted goal KEY "high-stakes" as if it were a category name (guaranteed false failure), and the
question counter required 4-space indentation where app.js uses 6 (would have reported 0 questions).
Categories are now matched by requiring internal whitespace, which the keys lack.
Cost if wrong: none observed; both were verified against the real app.js structure.
Task 1-4: implementer DONE (a840150, dd0a37c, f94e750, 7bc8ccd; 22/22 passing) — review dispatched (sonnet)

Ruling: Added `__pycache__/` to .gitignore as controller housekeeping (commit after 7bc8ccd).
Running the new test suite created scripts/__pycache__/, which no brief mentioned and which must
never be committed. Doing it here rather than routing it through the fix loop, since it is repo
hygiene outside every task's scope and touches no reviewed code.
Cost if wrong: none — one .gitignore line.
Task 1-4: reviewer ✅ spec compliant, quality Approved, 0 Critical/Important
Task 1-4: both ⚠️ items resolved by controller — all 4 commits carry Co-Authored-By AND
  Claude-Session trailers; per-commit `git show --stat` shows only the 2 intended files each
Task 1-4: minor (deferred): implementer report's line/function counts are wrong (153/206 actual
  vs 168/204 claimed) — scratch-file bookkeeping, no code impact
Task 1-4: minor (deferred): dedupe in build_catalog is case-sensitive while the sort is
  case-insensitive, so "Packback"/"packback" would both survive — latent, inherited from the
  plan's own code, no such row exists in the sheet today
Task 1-4: complete (commits b7a5d3c..7bc8ccd, review clean)
Task 5: dispatched (sonnet) — BASE 8b8e1a7

Task 5: implementer DONE_WITH_CONCERNS (0762594) — dry run gave 57 tools, brief predicted 58.
Ruling: The implementer was right and my spec was wrong. Investigated against a fresh sheet
download: the rule "both availability columns in {Excluded, Retired, blank}" drops **Virtual
Machine**, which IS in today's catalog — it has a full description, category, vendor UIC, support
doc and Title II Yes, and is blank in both availability columns only because it is a campus
computing resource, not an LMS integration. The other blank/blank row, Coursera, is a bare name
with every other cell empty and is NOT in today's catalog. Availability cannot separate them.
Corrected the rule to key on content instead: drop when name is blank, when DESCRIPTION is blank,
or when both availability columns are Excluded/Retired (blank removed from DROP_STATUSES).
Verified against the live sheet: yields exactly today's 58 — zero dropped, zero added.
Amended spec and plan; test count 22 -> 24 (two new should_keep cases, and the `row()` helper now
carries a description so the existing cases still test what they claim).
Cost if wrong: if a real tool ever has a genuinely empty Description cell it silently vanishes from
the catalog — mitigated because MIN_TOOLS=40 catches any large-scale loss and the change summary
prints every removal by name.
Task 5: fix round 1/5 (57-vs-58 resolved; 24/24 passing, dry run reports 58, nothing written;
  commits 0762594..78cfd08) — review dispatched (sonnet, covers both commits)
Task 5: review verdict "Needs fixes" — 1 Important (read_rows required-column tuple omits
  COL_DESC, which should_keep now gates on; a renamed Description column would drop every row and
  report the vague MIN_TOOLS message instead of the precise missing-column one). Caused by my own
  row-selection ruling not extending the validation tuple.
Task 5: both ⚠️ items resolved by controller — both commits carry Co-Authored-By AND
  Claude-Session trailers; the live dry-run numbers were independently verified by me against a
  fresh sheet download before the fix was dispatched
Task 5: minor (deferred): non-SyncError exceptions (URLError, BadZipFile, socket timeout) print raw
  tracebacks instead of the script's "error: ..." format
Task 5: minor (deferred): write_tools writes tools.json in place rather than temp-then-os.replace
Task 5: minor (deferred): git() subprocess.run has no timeout, so a credential-prompt hang blocks
  indefinitely — matters only if this is ever scheduled unattended
Task 5: fix round 2/5 dispatched (COL_DESC validation)
Task 5: re-review — COL_DESC finding ADDRESSED (sync_catalog.py:197), no new breakage
Task 5: complete (commits 8b8e1a7..102e8bc, review clean after 2 fix rounds)

Ruling: Running Task 6 in the controller rather than dispatching an implementer. It contains no
code to write — it runs `sync_catalog.py` once and verifies the output — and it performs the
session's first push to a shared branch, which I keep under direct control rather than handing to
a subagent. The generated tools.json is fully determined by the script reviewed twice above, and
the final whole-branch review sees it regardless.
Cost if wrong: tools.json gets one fewer review seat than a dispatched task would have had.
Task 6: complete (commit e56d901, pushed) — script ran for real; tools.json has 58 tools, 10 with
  video, all with category, none with tags, sorted Acadly/ACS/Aleks. Commit touched only tools.json.
  Verified against the old app.js data: identical 58 names; only ClassRanked changed (bb no->yes,
  cv contract->yes); 7 descriptions lost their appended link text; all 10 Panopto URLs byte-identical.
  Virtual Machine preserved (bb/cv "—", t2 yes); Coursera correctly absent.
Task 7: dispatched (sonnet) — BASE e56d901
Task 7: implementer DONE_WITH_CONCERNS (cb4b5e2) — my verify_app.py harness was buggy again.
Ruling: The harness bug is mine, not the implementer's, and its workaround was sound. Requiring
whitespace INSIDE the match (r'"([^"]*\s[^"]*)"') breaks left-to-right quote pairing: "high-stakes"
has no whitespace, so the engine skips its opening quote and pairs its CLOSING quote with the next
opening one, capturing garbage like ': [\n      '. Correct approach is to pair quotes first
(r'"([^"]*)"(\s*:)?') and separate keys from values by the trailing colon. I re-verified Task 7's
critical property myself with the corrected check: all 15 GOAL_CATEGORIES references exist in
tools.json, 2 finder questions, 7 goal options, 0 leftover .tags/discipline/weights.stakes/
weights.size, literal removed, fetch present, CSS hooks kept, node --check clean, only app.js
touched, verify_app.py deleted.
Cost if wrong: none — the property the harness was meant to prove is now proven directly.
Task 7: reviewer ✅ spec compliant, quality Approved, 0 Critical/Important. Traced init ordering
  (no consumer can see the empty array), URL-state consistency, and old-link degradation; confirmed
  the href escaping is a real improvement over the pre-diff code.
Task 7: ⚠️ visual rendering — deferred by design to the human pass at Task 8 Step 6
Task 7: minor (deferred): fetch-failure path returns before any addEventListener, so on a failed
  load every button is inert for the page's life — plan-mandated, my Step 6 snippet verbatim
Task 7: minor (deferred): pre-existing hashchange listener (outside the diff) can overwrite the
  "Catalog failed to load" row with an empty table, losing the only explanation shown
Task 7: minor (deferred): stale section comment "2. Scoring (verbatim port from data.js)" — the
  claim is more misleading now that scoreTools has diverged
Task 7: minor (deferred): GOAL_CATEGORIES coarseness — `video` catches Lucid but not Zoom;
  `writing` misses Gradescope. Accepted information loss from tags -> category, disclosed in spec.
Task 7: complete (commits e56d901..cb4b5e2, review clean)
Task 8: dispatched (haiku) — BASE cb4b5e2
Task 8: implementer DONE (15bbf73), nothing pushed by the task as required — review dispatched (sonnet)

Ruling: Pushed cb4b5e2..15bbf73 to origin/main on the user's explicit one-word instruction ("push"),
before the Task 8 doc review returned and before the final whole-branch review ran. The user did not
report back on the visual pass; I did not re-ask, because a direct instruction from them overrides my
sequencing preference. Risk accepted knowingly: the only site-visible commit (cb4b5e2) had already
passed a full task review plus my own independent verification, and 15bbf73 is documentation with no
runtime effect, so the outstanding reviews can only produce follow-up commits, not a broken site.
Cost if wrong: any finding from the two pending reviews lands as a follow-up commit on a live site
rather than being fixed before deploy.

Live verified after ~40s: app.js and tools.json byte-identical to local; 58 tools, 10 with video,
15 GOAL_CATEGORIES refs all resolving, finder = [goals, lms], 0 leftover .tags/discipline,
Virtual Machine present as "—/—/yes", Panopto label "How to Embed Panopto Videos".
Task 8: review verdict "Needs fixes" — 2 Critical, 1 Important, 3 Minor
Ruling: Reviewer's Critical #1 ("branch was pushed, violating the stop point") is a correct
observation of git state but a false finding against the implementer. The implementer stopped as
instructed and its report was accurate when written; I pushed afterwards on the user's explicit
"push". Not walking it back — the push was authorized and the live site is verified. Told the fix
agent explicitly not to attempt a revert.
Cost if wrong: none — the alternative (reverting an authorized, verified deploy) would be worse.
Ruling: Reviewer's Critical #2 (row-selection rule documented wrongly in two places) is REAL and my
process error: I amended the plan when the rule changed but never regenerated task-8-brief.md, so
the implementer transcribed stale text faithfully. Regenerated the brief and dispatched a fix.
Lesson for the record: amending the plan is not enough — the brief must be regenerated with it.
Cost if wrong: none; the plan was already correct and the brief now matches it.
Task 8: fix round 1/5 dispatched — row rule (2 places), stale "Watch walkthrough" bullet,
  restore "Title II always required" + "No build process" bullets, restore scoreTools() mention,
  complete the AVAIL_LABEL table (adds standalone/contract/migrating/standalone_mig)
Task 8: fix round 1/5 complete (a9981d2) — row rule corrected in both places, videoTitle label
  bullet fixed, scoreTools() mention restored, "Title II always required" + "No build process"
  bullets restored, AVAIL_LABEL table completed with contract/migrating/standalone/standalone_mig

## HANDOFF — session moved to another machine (2026-09-01)

All 8 tasks are implemented and pushed. The live site at
https://olgaberezina1.github.io/UIC-LTI-Catalog is verified serving the new build: app.js and
tools.json byte-identical to local, 58 tools, 10 with video, two-question finder.

STILL OUTSTANDING, in order:

1. **Scoped re-review of Task 8's fix commit a9981d2.** Never ran — the session stopped first.
   Use scripts/review-package with FIX_BASE 15bbf73, and re-review-prompt.md with the five
   findings listed in the Task 8 review (row rule x2, videoTitle bullet, restored bullets,
   scoreTools mention, AVAIL_LABEL table).
2. **Final whole-branch review.** Never ran. MERGE_BASE is d6b17ad (the last commit before this
   work began; 12fe2db is the first commit of it). Dispatch on the most capable model per
   requesting-code-review/code-reviewer.md, and point it at the deferred-minor list below.
3. **The human visual pass never actually happened.** The four checks were offered but the user
   replied only "push". Nobody has confirmed by eye that the category line wraps acceptably, that
   the walkthrough label renders, that the console is clean, or that high-stakes + Canvas returns
   sensible results. Worth doing on the new machine: `python3 -m http.server 8000`.

DEFERRED MINORS awaiting triage at the final review (all recorded above in full):
  - Task 1-4: implementer report line/function counts wrong (scratch file only)
  - Task 1-4: build_catalog dedupe is case-sensitive while the sort is case-insensitive
  - Task 5: non-SyncError exceptions print raw tracebacks instead of "error: ..."
  - Task 5: write_tools writes in place rather than temp-then-os.replace
  - Task 5: git() subprocess.run has no timeout
  - Task 7: fetch-failure path returns before attaching listeners, leaving buttons inert
  - Task 7: hashchange listener can overwrite the "Catalog failed to load" row
  - Task 7: stale comment "2. Scoring (verbatim port from data.js)"
  - Task 7: GOAL_CATEGORIES coarseness (video catches Lucid not Zoom; writing misses Gradescope)
  - Task 8 review: AVAIL_LABEL gap — FIXED in a9981d2, no longer outstanding

NOTE: the review .diff packages are gitignored and did not travel. Regenerate any you need with
scripts/review-package. The flat .superpowers/sdd/*.md files belong to an older, unrelated plan
(Presentation Slides, 2026-06-17) and are committed only because the handoff asked for all .md.
