# UIC LTI Catalog — Project Documentation

## Overview

A static website listing all LTI tools and apps approved for use at the University of Illinois Chicago (UIC). Instructors can use the **Find My Tool** guided finder to get personalized recommendations, or browse the full catalog table directly.

**Live site:** https://olgaberezina1.github.io/UIC-LTI-Catalog
**GitHub repo:** https://github.com/olgaberezina1/UIC-LTI-Catalog

---

## Tech Stack

- **Pure static HTML/CSS/JS** — no build step, no framework, no dependencies (the page itself; the sync script needs openpyxl — see "How to Update Tool Data")
- **Hosted on GitHub Pages** (auto-deploys on push to `main`)
- **Fonts:** Google Fonts — Source Serif 4, Source Sans 3, JetBrains Mono

---

## File Structure

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

---

## How the App Works

Everything runs inside a single IIFE in `app.js`. There are three main screens:

| Screen | ID | Shown when |
|---|---|---|
| Hero | `screen-hero` | Page load |
| Finder | `screen-finder` | User clicks "Find My Tool →" |
| Results | `screen-results` | User completes the finder |
| Catalog | `catalog` | Always visible below |

The `data-screen` attribute on `<main>` controls which screen is visible via CSS.

---

## Tool Data (`tools.json`)

Each tool is an object with these properties:

| Property | Type | Description |
|---|---|---|
| `name` | string | Tool display name |
| `desc` | string | Description shown in catalog and result cards |
| `bb` | string | Blackboard availability status code |
| `cv` | string | Canvas availability status code |
| `t2` | string | Title II compliance status code |
| `category` | string | Sheet category — shown under the tool name and used for finder scoring |
| `video` | string *(optional)* | Panopto walkthrough URL — renders a walkthrough link in the catalog, labelled from `videoTitle` if present, else "Watch walkthrough" |
| `videoTitle` | string *(optional)* | Link text from the sheet, used as the walkthrough link's label |

### Availability Status Codes (`AVAIL_LABEL`)

| Code | Displayed as |
|---|---|
| `yes` | Yes |
| `no` | No |
| `unlicensed` | Not licensed, unavailable. |
| `retired` | Retired |
| `pending` | Waiting for vendor response |
| `research` | Researching |
| `request` | Available per request |
| `progress` | In progress |
| `contract` | Contract not yet approved |
| `migrating` | Migrating — Aug 15 |
| `standalone` | Standalone |
| `standalone_mig` | Standalone — migrating Aug 15 |
| `na` | N/A |
| `—` | — |

---

## Find My Tool

The finder walks the user through 2 questions:

1. **What do you want students to do?** (multi-select) — matched against each
   tool's category via the `GOAL_CATEGORIES` map in `app.js`
2. **Which LMS?** — Canvas or Blackboard

Tools are scored against answers via `scoreTools()`. Title II compliance is always required (hardcoded `requireA11y = true`). Top 3
results are shown as cards; additional matches appear as runners-up.

There is no discipline question. The sheet's categories can't express
discipline — its two health-sciences tools sit in categories holding 16 tools
between them — so the question was removed rather than answered badly.

---

## Catalog Table

- Searchable by keyword
- Filterable by platform (Canvas / Blackboard / All)
- Filterable by Title II compliance
- Columns: Tool | What it's for | Canvas | Blackboard | Title II
- Tools with a `video` property show a walkthrough link below the description — the label comes from `videoTitle` if present, or falls back to "Watch walkthrough"

---

## Header Navigation

| Link | Destination |
|---|---|
| Catalog | `#catalog` (same page anchor) |
| learning.uic.edu | https://learning.uic.edu |
| Feedback Form | https://docs.google.com/forms/d/1a5LmlcUrOMYU3LlBpGpJJcSiSXZE8-M37oSub6J0ogk/viewform |

---

## Hero Section

- **Find My Tool →** button launches the finder
- **Browse all** button scrolls to the catalog
- Below the buttons: "Can't find the tool you're looking for? [Request an LTI here!](https://learning.uic.edu/services/lti-integration-and-development/lti-requests/)"

---

## How to Update Tool Data

Tool data lives in the **Google Sheet**, not in this repo. `tools.json` is
generated from it — never edit `tools.json` by hand, your change will be
overwritten on the next sync.

The script needs Python 3 with **openpyxl** installed (`python3 -m pip install openpyxl`, or a venv).

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
sharing can't empty the site. Before it commits and pushes, it also checks
that the local repo is on `main` and up to date with `origin/main`, refusing
to run otherwise.

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

---

## Key Design Decisions

- **Title II always required** — the finder hardcodes `requireA11y = true`; there is no question for it
- **The sheet is the source of truth** — `tools.json` is generated; the repo
  holds no hand-maintained tool data
- **Unpublished rows are filtered at sync time** — a row is dropped when its
  name is blank, its description is blank, or both availability columns are
  `Excluded` or `Retired`
- **No hand-maintained tags** — the finder scores on the sheet's `Category`
  through the `GOAL_CATEGORIES` map, which is UI configuration rather than
  per-tool data
- **Local preview needs a server** — `fetch()` is blocked on `file://`
- **No build process** — changes to any file are live immediately after GitHub Pages propagates (usually 1–3 minutes)
