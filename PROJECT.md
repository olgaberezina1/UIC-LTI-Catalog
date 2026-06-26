# UIC LTI Catalog — Project Documentation

## Overview

A static website listing all Learning Technology Integration (LTI) tools approved for use at the University of Illinois Chicago (UIC). Instructors can use the **Find My Tool** guided finder to get personalized recommendations, or browse the full catalog table directly.

**Live site:** https://olgaberezina1.github.io/UIC-LTI-Catalog
**GitHub repo:** https://github.com/olgaberezina1/UIC-LTI-Catalog

---

## Tech Stack

- **Pure static HTML/CSS/JS** — no build step, no framework, no dependencies
- **Hosted on GitHub Pages** (auto-deploys on push to `main`)
- **Fonts:** Google Fonts — Source Serif 4, Source Sans 3, JetBrains Mono

---

## File Structure

```
UIC-LTI-Catalog/
├── index.html     — page structure and markup
├── styles.css     — all styling
└── app.js         — all data and logic (single file, IIFE)
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

## Tool Data (`LTI_TOOLS` array in `app.js`)

Each tool is an object with these properties:

| Property | Type | Description |
|---|---|---|
| `name` | string | Tool display name |
| `desc` | string | Description shown in catalog and result cards |
| `bb` | string | Blackboard availability status code |
| `cv` | string | Canvas availability status code |
| `t2` | string | Title II compliance status code |
| `tags` | array | Keywords used for finder scoring and filtering |
| `video` | string *(optional)* | Panopto walkthrough URL — renders a "Watch walkthrough" link in the catalog |

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
| `na` | N/A |
| `—` | — |

---

## Tools with Panopto Walkthrough Videos

| Tool | Panopto ID |
|---|---|
| Canvas Moderated Grading | `392074dc-b258-4dd5-a318-b3c2015c2f81` |
| Canvas Studio | `010a32e8-b48c-455c-b880-b3680147a91b` |
| Gradescope | `c7451af0-39a4-4167-8c1d-b36b012f039b` |
| iClicker | `8bba0d48-cd9a-4370-96e3-b43201411c63` |
| ILP Grading | `d8c14696-939c-4623-94c3-b3a10166c826` |
| Lucid | `629d8b59-42da-44d9-b857-b3a6016ab679` |
| McGraw Hill Connect | `a87a3cab-ef47-49f0-a177-b369012eac93` |
| Panopto | `4006194c-3a9e-4339-93b1-b367013674af` |
| Piazza | `c3acad21-4a04-4593-a2e2-b36b00fee801` |
| Zoom | `0bf11245-7727-4f25-b10f-b39a01238fc1` |

All URLs follow the pattern: `https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=<ID>`

---

## Find My Tool Finder

The finder walks the user through 3 questions:

1. **What are your goals?** (multi-select) — pedagogy/use case tags
2. **Which LMS?** — Canvas or Blackboard
3. **What discipline?** — subject area tags

Tools are scored against answers via `scoreTools()`. Title II compliance is always required (hardcoded `requireA11y = true`). Top 3 results are shown as cards; additional matches appear as runners-up.

---

## Catalog Table

- Searchable by keyword
- Filterable by platform (Canvas / Blackboard / All)
- Filterable by Title II compliance
- Columns: Tool | What it's for | Canvas | Blackboard | Title II
- Tools with a `video` property show a "▶ Watch walkthrough" link below the description

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

1. Open `app.js`
2. Find the `LTI_TOOLS` array (starts at line 5)
3. Add, edit, or remove tool objects — tools are listed alphabetically by name
4. To add a walkthrough video, add `video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=<ID>"` to the tool object
5. Commit and push to `main` — GitHub Pages deploys automatically

---

## Key Design Decisions

- **Title II always required** — the finder hardcodes `requireA11y = true`; there is no question for it
- **Retired tools removed from catalog** — tools that show "Retired" in both Canvas and Blackboard columns were removed from the catalog to keep the list clean
- **Single source of truth** — all tool data lives in `LTI_TOOLS` in `app.js`; the finder and catalog both read from it
- **No build process** — changes to any file are live immediately after GitHub Pages propagates (usually 1–3 minutes)
