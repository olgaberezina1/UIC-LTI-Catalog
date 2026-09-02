# Task 7 Report — `app.js` migration to `tools.json`

## Status: DONE_WITH_CONCERNS

One concern below (a bug in the brief's own throwaway checker script, not in `app.js`) — see "Step 8 detail" for full analysis. All actual requirements are independently verified as met.

## What changed, section by section

**Section 1 (catalog data).** Replaced the 58-entry `const LTI_TOOLS = [...]` array literal (with its per-tool `tags` arrays) with `let LTI_TOOLS = []` plus an `async function loadTools()` that fetches `tools.json` (`cache: 'no-cache'`) and throws on a non-OK response. `AVAIL_LABEL` left untouched, exactly as instructed.

**Question content (`QUESTIONS`).** Merged the `discussion` and `annotation` goal options into a single `discussion` option ("Discuss & annotate"), bringing the goals list from 8 to 7 options. Deleted the entire third question object (`key: "discipline"`). `QUESTIONS` now holds 2 entries (goals, lms).

**Section 2 (scoring).** Added `GOAL_CATEGORIES`, a hand-written map from each of the 7 goal values to the sheet `category` strings that satisfy it (15 category references across 7 goals, some categories shared across goals). Replaced `scoreTools` to accept only `{ goals, lms }` (dropped the never-used `stakes`, `discipline`, `size` params), score goals by checking `GOAL_CATEGORIES[g].includes(tool.category)` instead of `tool.tags.includes(g)`, and removed the corresponding stakes/discipline/size weight and max-score contributions.

**Rendering.** Three tag→category swaps:
- Result card: `<div class="result-tag-list">${esc(t.category)}</div>`
- Catalog row: `<div class="catalog-tags">${esc(t.category)}</div>`
- Walkthrough link: now escapes `t.video` (external/sheet-sourced URL) and uses `t.videoTitle || 'Watch walkthrough'` as the link text, also escaped.

**State/URL plumbing (`discipline` removal).** Removed `discipline` from: `state.answers` initializer, `resetAnswers()`, `VALID.goals` (dropped `'annotation'`) and removed `VALID.discipline` entirely, `syncHash()` (dropped the `discipline` hash-part line), `emptyAnswers()`, `hasAnyAnswer()`, `firstUnansweredStep()` (dropped the `discipline === null` branch, `lms === null` branch now returns `QUESTIONS.length - 1` directly after), `readHash()` (dropped the `params.discipline` line), and `querySummary()` (dropped the `a.discipline` bit).

**Init (`DOMContentLoaded`).** Made the listener `async`, awaits `loadTools()` first inside a try/catch that renders a "Catalog failed to load" row into `#catalog-tbody` and returns early on failure. Rest of the handler unchanged.

## Step 8 verification — complete output

**Check 1 — `node --check app.js`:**
```
syntax OK
```

**Check 2 — `python3 scripts/verify_app.py`:**
```
GOAL_CATEGORIES references 12 categories, all present
finder questions: 2
FAIL: GOAL_CATEGORIES names categories absent from tools.json: [',\n      ', ',\n    ],\n    writing: [', ', ', ': [\n      ', '],\n    lab: [', '],\n    video: [']

1 failure(s)
```
Exit code 1 (failing) — see "Step 8 detail" below for why this is a bug in the checker, not in `app.js`.

**Check 3 — served-file curl:**
```
index.html 200
app.js 200
tools.json 200
```
All three files returned HTTP 200.

## Step 8 detail: the checker's own regex bug

The checker's category-extraction regex is `r'"([^"]*\s[^"]*)"'`, applied to the raw text of the `GOAL_CATEGORIES` block. This works for plain string literals, but `GOAL_CATEGORIES` (as specified verbatim by the brief) has one quoted object key with no internal whitespace: `"high-stakes": [`. Because that key's own quote-pair contains no whitespace character, the match attempt at that quote pair fails outright, and the regex engine's next attempt starts from the *closing* quote of `"high-stakes"` — pairing it with the *next* string's opening quote instead. From there the pairing parity is permanently shifted: the pattern goes on to (successfully) match the *gaps between* real strings — e.g. `': [\n      '`, `',\n      '`, `'],\n    lab: ['` — as if they were quoted category values, alongside a handful of real ones.

I confirmed this two ways, independent of the checker:
1. Before writing any code, I cross-referenced all 15 category strings from the brief's required `GOAL_CATEGORIES` snippet against `tools.json`'s 25 actual category values — all 15 matched exactly.
2. After the failure, I re-extracted the strings with a JSON-string-aware regex (`r'"((?:[^"\\]|\\.)*)"'`, which correctly treats `"high-stakes"` as its own complete token rather than letting it desync the pairing) and got 13 unique category strings (some goals share a category), all present in `tools.json`'s category set, none unknown.

I traced the failure to the exact mechanism (documented above) and reproduced it in isolation against the brief's literal `GOAL_CATEGORIES` snippet, unmodified, confirming this is not an artifact of my transcription. Per the task's instruction ("If you believe something in it is wrong, report it rather than silently improving it"), I did not alter `verify_app.py`'s regex or reformat `GOAL_CATEGORIES` to dodge it — both were transcribed exactly as the brief specifies. I ran the checker as given, it failed, and I report that failure and its cause here rather than suppressing it.

Checks 2 (finder questions: 2) and 3–4 (no leftover `.tags`/`discipline`/`weights.stakes`/`weights.size`; no `LTI_TOOLS` literal; `fetch('tools.json'` present) inside the same script all passed cleanly — only the `GOAL_CATEGORIES` regex extraction produced the false failure.

`scripts/verify_app.py` was deleted after running all checks, per Step 8's instruction (it is scratch, not a deliverable), regardless of the false failure documented above.

## Files changed

Exactly one: `app.js`.

```
git diff --stat HEAD~1
 app.js | 164 ++++++++--------------------------------------------------------
 1 file changed, 56 insertions(+), 108 deletions(-)
```

`scripts/verify_app.py` was created and then deleted within this task; it is not part of the final diff (confirmed via `git status --short`, which shows only pre-existing unrelated untracked files: `.DS_Store`, `docs/`).

## Self-review findings

- **Completeness:** All 9 steps done in order. All `discipline` removal sites from the brief's checklist confirmed present and handled: `state.answers`, `resetAnswers`, `VALID`, `syncHash`, `emptyAnswers`, `hasAnyAnswer`, `firstUnansweredStep`, `readHash`, `querySummary`. Verified via `grep -n "discipline" app.js` → no matches.
- **Quality:** Code transcribed verbatim from the brief; comment density and idiom match the surrounding sections (numbered section comments preserved, e.g. `// ─── 1. Catalog data ───`).
- **Discipline (scope):** `index.html` and `styles.css` untouched (not read or written). No script file modified except the throwaway `scripts/verify_app.py`, created and deleted within this task as instructed. `git status --short` confirms no unexpected changes.
- **Verification:** All three Step 8 commands were run exactly as specified. Two passed cleanly (`node --check`, curl checks). The third (`verify_app.py`) exited non-zero due to a bug in the checker's own regex, analyzed and independently cross-checked above — the actual property it aims to verify (every `GOAL_CATEGORIES` string is a real `tools.json` category) is genuinely satisfied. `scripts/verify_app.py` is deleted; confirmed via `ls scripts/` (only `sync_catalog.py`, `test_sync_catalog.py`, `__pycache__` remain).
- Preserved-on-purpose strings verified present: `catalog-tags` and `result-tag-list` CSS classes (now holding category text), and `high-stakes` in both `QUESTIONS` and `GOAL_CATEGORIES`.

## Human visual pass — still outstanding

Per the brief and the task instructions, no browser automation was available or attempted. A human still needs to confirm, before Task 8 pushes anything:
- The category line renders correctly under each tool name in both the catalog table and result cards.
- The walkthrough link label reads correctly, e.g. "▶ How to Embed Panopto Videos" for Panopto.
- The browser console is free of `Cannot read properties of undefined (reading 'slice')` or any other runtime error.
- The two-question finder ("Sit a high-stakes exam" + Canvas, and other combinations) returns sensible, well-ordered results.

## Concerns

1. **`scripts/verify_app.py`'s Step 2 check has a regex bug** triggered by the required quoted `"high-stakes"` key in `GOAL_CATEGORIES` (documented in detail above). This caused Step 8 Check 2 to report a false failure. I verified independently (twice, by two different methods) that the actual requirement — every `GOAL_CATEGORIES` category string exists in `tools.json` — is satisfied. I did not modify the checker or reformat the required code to work around it, per the brief's instruction to report rather than silently improve. The checker has since been deleted per Step 8's instructions, so this is a one-time finding for the controller's awareness, not a live defect.
2. No other concerns. Commit is local only, not pushed, per instructions.
