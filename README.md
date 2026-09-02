# UIC LTI Catalog

A static website listing every LTI tool and app approved for teaching at the
University of Illinois Chicago, with availability in Canvas and Blackboard and
Title II compliance at a glance. Instructors can answer two questions in
**Find My Tool** for ranked recommendations, or search and filter the full
catalog table.

**Live site:** https://olgaberezina1.github.io/UIC-LTI-Catalog
**Slides about the project:** https://olgaberezina1.github.io/UIC-LTI-Catalog/slides/

## What's in the repo

| Path | Purpose |
|---|---|
| `index.html` | Page structure and markup |
| `styles.css` | All styling |
| `app.js` | All page logic, one self-contained script |
| `tools.json` | Catalog data, **generated** from the Google Sheet. Never edit by hand |
| `scripts/sync_catalog.py` | Regenerates `tools.json` from the sheet, commits and pushes it |
| `scripts/test_sync_catalog.py` | Unit tests for the sync script |
| `slides/` | Presentation deck about how the site was built |
| `PROJECT.md` | Detailed documentation: data schema, status codes, finder scoring, design decisions |

No build step, no framework, no package manager. The page itself has no
dependencies.

## How it works

`app.js` fetches `tools.json` when the page loads and renders the catalog
table and the finder from it. Each tool carries a category from the sheet;
the finder scores tools on that category, on the chosen LMS, and on Title II
compliance, then shows the top three with runners-up.

## Updating the catalog

Tool data lives in the
[source Google Sheet](https://docs.google.com/spreadsheets/d/1FGY1itGZgsnpefzKDXtfqH2AZdkVCYlnQxt_IInFqXY/edit),
**Published** tab. The repo holds no hand-maintained tool data.

Requirements: Python 3 with [openpyxl](https://pypi.org/project/openpyxl/)
installed, for example:

```bash
python3 -m pip install openpyxl        # or use a virtualenv
```

Then:

1. Edit the sheet.
2. Preview the change:

   ```bash
   python3 scripts/sync_catalog.py --dry-run
   ```

3. Apply it. This writes `tools.json`, commits it and pushes to `main`:

   ```bash
   python3 scripts/sync_catalog.py
   ```

4. GitHub Pages redeploys within a few minutes.

The script stops rather than guess. It aborts on an availability value it
does not recognise, refuses to write a catalog of fewer than 40 tools, and
refuses to run unless the local checkout is on `main` and up to date with
`origin/main`. It prints a warning for every sheet row that needs attention,
such as a duplicated tool name or a description that ends with its own
walkthrough link title. Details, including the row-publication rule and the
status-code mapping, are in [PROJECT.md](PROJECT.md).

## Local preview

Browsers block `fetch()` on `file://`, so opening `index.html` directly shows
an empty catalog. Serve the folder instead:

```bash
python3 -m http.server 8000        # then open http://localhost:8000
```

## Running the tests

```bash
cd scripts && python3 -m unittest test_sync_catalog -v
```

The tests that read a real workbook are skipped automatically when openpyxl
is not installed; everything else runs on a stock Python 3.

## Deployment

Pushing to `main` deploys to GitHub Pages. The repo also carries a
`.cpanel.yml` that copies the site files, including `tools.json`, to a
cPanel host when that deployment is used.
