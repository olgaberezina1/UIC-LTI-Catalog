### Task 8: Update `PROJECT.md`

**Files:**
- Modify: `PROJECT.md`

**Interfaces:**
- Consumes: the finished implementation
- Produces: nothing

- [ ] **Step 1: Update the file structure section**

Replace the tree with:

```
UIC-LTI-Catalog/
├── index.html     — page structure and markup
├── styles.css     — all styling
├── app.js         — all logic (single file, IIFE)
├── tools.json     — catalog data, generated from the Google Sheet
└── scripts/
    ├── sync_catalog.py       — regenerates tools.json from the sheet
    └── test_sync_catalog.py  — unit tests for the sync script
```

- [ ] **Step 2: Rewrite "How to Update Tool Data"**

Replace that whole section with:

```markdown
## How to Update Tool Data

Tool data lives in the **Google Sheet**, not in this repo. `tools.json` is
generated from it — never edit `tools.json` by hand, your change will be
overwritten on the next sync.

1. Edit the [source sheet](https://docs.google.com/spreadsheets/d/1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY/edit), **Published** tab
2. Preview what would change: `python3 scripts/sync_catalog.py --dry-run`
3. Apply it: `python3 scripts/sync_catalog.py` — writes `tools.json`, commits and pushes
4. GitHub Pages redeploys in 1–3 minutes

The script downloads the sheet as **xlsx**, not CSV: CSV export flattens the
walkthrough cells to their link text and loses the Panopto URLs.

It stops rather than guess. An availability value it doesn't recognize aborts
the run naming the tool and column — add it to `STATUS_MAP` (and to
`AVAIL_LABEL` in `app.js` if it needs a new label), or fix the sheet. It also
refuses to write a catalog of fewer than 40 tools, so a renamed tab or revoked
sharing can't empty the site.

A row is published unless its name is blank, its description is blank, or
**both** availability columns are `Excluded` or `Retired`. Blank availability on
its own does not unpublish a row — Virtual Machine has none because it isn't an
LMS integration.

### Local preview

`fetch()` doesn't work on `file://`, so opening `index.html` directly no longer
shows a catalog. Serve it instead:

    python3 -m http.server 8000    # then http://localhost:8000

### Running the script's tests

    cd scripts && python3 -m unittest test_sync_catalog -v
```

- [ ] **Step 3: Update the tool data schema table**

In the Tool Data section, retitle it to reference `tools.json` rather than the `LTI_TOOLS` array, drop the `tags` row, and add:

```markdown
| `category` | string | Sheet category — shown under the tool name and used for finder scoring |
| `videoTitle` | string *(optional)* | Link text from the sheet, used as the walkthrough link's label |
```

Delete the **Tools with Panopto Walkthrough Videos** table — that list now comes from the sheet, and a hand-maintained copy will drift.

- [ ] **Step 4: Update the finder and design-decisions sections**

In **Find My Tool**, change the walkthrough to two questions:

```markdown
The finder walks the user through 2 questions:

1. **What do you want students to do?** (multi-select) — matched against each
   tool's category via the `GOAL_CATEGORIES` map in `app.js`
2. **Which LMS?** — Canvas or Blackboard

Title II compliance is always required (hardcoded `requireA11y = true`). Top 3
results are shown as cards; additional matches appear as runners-up.

There is no discipline question. The sheet's categories can't express
discipline — its two health-sciences tools sit in categories holding 16 tools
between them — so the question was removed rather than answered badly.
```

In **Key Design Decisions**, replace the "Retired tools removed from catalog"
bullet with:

```markdown
- **The sheet is the source of truth** — `tools.json` is generated; the repo
  holds no hand-maintained tool data
- **Unpublished rows are filtered at sync time** — a row is dropped when it has
  no description, or when both availability columns are `Excluded` or `Retired`
- **No hand-maintained tags** — the finder scores on the sheet's `Category`
  through the `GOAL_CATEGORIES` map, which is UI configuration rather than
  per-tool data
- **Local preview needs a server** — `fetch()` is blocked on `file://`
```

- [ ] **Step 5: Commit**

```bash
git add PROJECT.md
git commit -m "$(cat <<'EOF'
Document the sheet-driven catalog workflow

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

- [ ] **Step 6: Stop — the visual pass happens here**

Everything from Tasks 1–5, 7 and 8 is committed locally and unpushed. This is the last moment
before the live site changes, and Task 7's checks could not see rendering.

Do not push. Report to the controller that the branch is ready and the visual pass is
outstanding. The controller runs `python3 -m http.server 8000`, hands the URL to the human, and
gets confirmation of four things browser-less checks cannot establish:

1. The category line under each tool name reads as intended (e.g. Acadly shows
   `STUDENT ENGAGEMENT & CLASSROOM MANAGEMENT`) and doesn't wrap badly in the Tool column
2. The Panopto row's link reads "▶ How to Embed Panopto Videos" and opens the viewer
3. The console is clean — in particular no `Cannot read properties of undefined (reading 'slice')`
4. The finder runs two questions, and "Sit a high-stakes exam" + Canvas returns results drawn
   from ExamSoft Enterprise, Respondus LockDown Browser, Turnitin, iThenticate, Gradescope

Only after the human confirms does the push happen:

```bash
git log --oneline origin/main..main
git push origin main
```

Then confirm the live site at https://olgaberezina1.github.io/UIC-LTI-Catalog — 58 tools with
category lines, and a two-question finder.

---

## Verification summary

| What | How |
|---|---|
| Script logic | `cd scripts && python3 -m unittest test_sync_catalog -v` — 24 tests |
| Sheet parsing | `python3 scripts/sync_catalog.py --dry-run` — 58 tools, Packback warning |
| Generated data | 58 entries, 10 with `video`, every one with `category`, none with `tags` |
| Expected first-run diff | ClassRanked `bb no→yes` / `cv contract→yes`; 7 descriptions lose their appended link text (Canvas Studio, Gradescope, Lucid, McGraw Hill Connect, Panopto, Piazza, Zoom) |
| Page | Local server: 58 rows, category lines, walkthrough links, clean console, 2-question finder, sensible high-stakes results, URL restore |
| Live site | 58 tools and a 2-question finder after the final push |
