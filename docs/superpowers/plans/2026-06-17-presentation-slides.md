# UIC LTI Catalog — Presentation Slides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained reveal.js HTML slide deck (~12 slides) that showcases the UIC LTI Catalog project and tells the build story — designed in Claude Design, handed to Claude Code, iterated live to production.

**Architecture:** A single static HTML file (`slides/index.html`) using reveal.js loaded from CDN, with an inline `<style>` block that applies the same UIC brand theme as the main site (navy #001E62, cardinal red #D50032, Source Serif 4 / Source Sans 3 fonts from Google Fonts). Each slide is a `<section>`; speaker notes live in `<aside class="notes">`. No build step, no npm, consistent with the parent project's zero-dependency ethos. It deploys on the same GitHub Pages site at `/UIC-LTI-Catalog/slides/`.

**Tech Stack:** HTML, CSS, reveal.js 5.1.0 (cdnjs CDN), reveal.js Notes plugin, Google Fonts.

## Global Constraints

- Single deliverable file: `slides/index.html`. All CSS inline in one `<style>` block; no separate stylesheet, no JS files of our own beyond the inline `Reveal.initialize` call.
- Brand colors, copied verbatim: UIC Navy `#001E62`, Cardinal Red `#D50032`, white `#ffffff`, light panel `#f4f6fa`, muted text `#6b7280`.
- Fonts: `"Source Serif 4"` for headlines, `"Source Sans 3"` for body — loaded from Google Fonts, matching the main site (`index.html` at repo root).
- reveal.js pinned to version `5.1.0` from `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/`.
- Factual accuracy — every number on a slide must match the repo at time of writing: **57 approved tools**, **10 walkthrough videos**, **28 commits total** (1 Claude Design upload + 27 Claude Code commits), **3 source files** (`index.html`, `styles.css`, `app.js`), **0 build steps / 0 dependencies**, finder trimmed from **5 questions to 3**.
- Deck must render offline-of-our-server (CDN only) by opening the file directly in a browser — no local web server required.
- Do NOT modify the main site files (`index.html`, `styles.css`, `app.js`) except the one optional, explicitly-marked link-in-header step in Task 6.

## Facts & Source Material (for slide copy — do not invent beyond this)

- **What it is:** A static catalog of every Learning Technology Integration (LTI) tool approved for UIC's LMS platforms (Canvas + Blackboard), with a "Find My Tool" guided finder and a browsable table showing availability and Title II compliance.
- **Claude Design phase:** The first version was a prototype designed in Claude Design (referenced in code comments as `prototype.jsx` / `QUESTIONS_FULL`). It defined the visual layout, the quiz flow, and the catalog structure. This is git commit `2bc8258 "Add files via upload"`.
- **Handoff to Claude Code:** Ported to a pure static site — `index.html`, `styles.css`, `app.js` — no framework, no build. Single source of truth is the `LTI_TOOLS` array in `app.js`. Deployed on GitHub Pages.
- **How we worked:** 27 conversational commits after the handoff, each a small reviewable change pushed live in minutes. Examples: rename the quiz to "Find My Tool", remove the Title II question, bump header font sizes, redesign the theme.
- **Finder evolution:** Started as a 5-question "quiz" ("Five questions, sixty seconds"). Trimmed to 3 questions (pedagogy/goals, LMS, discipline). Title II question removed and hardcoded as always-required (`requireA11y = true`). Renamed "Take the Quiz" → "Find My Tool". Removed % match display and the "Leader so far" board.
- **Data pipeline problem:** Tool data came from a CSV/XLSX spreadsheet. Exporting to CSV stripped the embedded Panopto hyperlinks (only display text survived). Fix: parsed the `.xlsx` directly with Python (`zipfile` → `xl/worksheets/_rels/sheet1.xml.rels`) to recover all 10 walkthrough-video URLs.
- **Brand redesign:** Retheme to match learning.uic.edu — UIC Navy hero + header, Cardinal Red accents, navy catalog table headers, white body.
- **By the numbers:** 57 tools, 10 videos, 28 commits, ~2 working sessions, 3 files, 0 dependencies.
- **Maintainability:** Updating the catalog = edit the `LTI_TOOLS` array + push. `PROJECT.md` documents the whole system.

---

## File Structure

- `slides/index.html` — the entire deck. Created in Task 1, styled in Task 2, filled with content in Tasks 3–6.
- (Optional, Task 6 only) `index.html` at repo root — add one nav link to the deck.

Verification for this deck is **structural + visual**, not unit tests: after each task, confirm the expected number of `<section>` slides exist via `grep`, then open the file in a browser and eyeball the rendered result. There is no test framework; "Expected" lines below describe what you should see.

---

### Task 1: Scaffold the reveal.js deck with a title slide

**Files:**
- Create: `slides/index.html`

**Interfaces:**
- Produces: a working reveal.js document with the standard `.reveal > .slides > section` structure and an initialized `Reveal` instance. Later tasks add `<section>` slides inside `<div class="slides">` and CSS inside the existing `<style>` block.

- [ ] **Step 1: Create `slides/index.html` with the reveal.js skeleton and title slide**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UIC LTI Catalog — Project Showcase</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&family=Source+Sans+3:ital,wght@0,300..700;1,400..600&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css">

<style>
/* UIC theme goes here — filled in Task 2 */
</style>
</head>
<body>

<div class="reveal">
  <div class="slides">

    <!-- Slide 1 — Title -->
    <section data-slide="title">
      <p class="eyebrow">UIC Learning Technology Solutions</p>
      <h1 class="deck-title">The UIC LTI Catalog</h1>
      <p class="deck-sub">From a Claude Design prototype to a live, faculty-facing catalog.</p>
      <p class="deck-foot">Project showcase &middot; 2026</p>
      <aside class="notes">
        Welcome. This is the story of how the UIC LTI Catalog went from a design-tool
        prototype to a live product on GitHub Pages — and how it was built almost entirely
        through conversation.
      </aside>
    </section>

  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/plugin/notes/notes.min.js"></script>
<script>
  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    transition: 'slide',
    plugins: [ RevealNotes ],
  });
</script>

</body>
</html>
```

- [ ] **Step 2: Verify the file has exactly one slide**

Run: `grep -c '<section' /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: `1`

- [ ] **Step 3: Open in a browser and confirm reveal.js loads**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: A single centered slide showing the title "The UIC LTI Catalog". You can press `S` to open speaker-notes view and see the note. No console errors. (Styling is still default reveal.js black — that's fixed in Task 2.)

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Scaffold reveal.js presentation deck with title slide"
```

---

### Task 2: Apply the UIC brand theme

**Files:**
- Modify: `slides/index.html` (replace the empty `<style>` block)

**Interfaces:**
- Consumes: the `.reveal`, `.eyebrow`, `.deck-title`, `.deck-sub`, `.deck-foot` structure from Task 1.
- Produces: theme classes used by all later slides — `.eyebrow`, `.slide-h` (slide headline), `.lead` (lead paragraph), `.bullets` (styled `<ul>`), `.stat-grid` / `.stat` (number tiles), `.two-col` (2-column layout), `.pill` (red accent chip), `.mono`.

- [ ] **Step 1: Replace the `<style>` block contents with the UIC theme**

```css
:root {
  --navy: #001E62;
  --navy-2: #2d3a6b;
  --red: #D50032;
  --red-ink: #a80027;
  --paper: #ffffff;
  --panel: #f4f6fa;
  --muted: #6b7280;
  --line: #dde3f0;
  --serif: "Source Serif 4", Georgia, serif;
  --sans: "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif;
}

.reveal { font-family: var(--sans); font-size: 30px; color: var(--navy); }
.reveal .slides { text-align: left; }
.reveal .slides section { background: var(--paper); }

/* Reveal paints a background layer; make the deck white with a navy title slide. */
.reveal .backgrounds { background: var(--paper); }
.reveal section[data-slide="title"] { color: var(--navy); }

.reveal h1, .reveal h2 { font-family: var(--serif); font-weight: 600; letter-spacing: -0.02em; line-height: 1.04; color: var(--navy); }
.reveal .deck-title { font-size: 2.6em; margin: 0.1em 0 0.15em; }
.reveal .deck-title em, .reveal .slide-h em { font-style: italic; color: var(--red); }
.reveal .deck-sub { font-family: var(--serif); font-size: 1.05em; color: var(--muted); max-width: 20ch; }
.reveal .deck-foot { font-family: var(--sans); font-size: 0.55em; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin-top: 1.4em; }

.reveal .eyebrow { font-size: 0.5em; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin: 0 0 0.4em; }
.reveal .eyebrow::before { content: ""; display: inline-block; width: 0.5em; height: 0.5em; border-radius: 50%; background: var(--red); margin-right: 0.6em; vertical-align: middle; }

.reveal .slide-h { font-size: 1.7em; margin: 0 0 0.5em; }
.reveal .lead { font-family: var(--serif); font-size: 1em; color: var(--navy-2); max-width: 26ch; }

.reveal .bullets { list-style: none; margin: 0.6em 0 0; padding: 0; }
.reveal .bullets li { position: relative; padding-left: 1.4em; margin: 0.5em 0; font-size: 0.82em; color: var(--navy-2); }
.reveal .bullets li::before { content: "\2713"; position: absolute; left: 0; color: var(--red); font-weight: 700; }

.reveal .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2em; align-items: start; }

.reveal .pill { display: inline-block; padding: 0.15em 0.7em; border-radius: 999px; background: var(--red); color: #fff; font-size: 0.5em; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; vertical-align: middle; }
.reveal .mono { font-family: ui-monospace, Menlo, monospace; font-size: 0.72em; background: var(--panel); border: 1px solid var(--line); padding: 0.1em 0.4em; border-radius: 4px; color: var(--navy); }

.reveal .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8em; margin-top: 0.6em; }
.reveal .stat { background: var(--panel); border: 1px solid var(--line); border-top: 4px solid var(--red); padding: 0.7em 0.8em; }
.reveal .stat .num { font-family: var(--serif); font-size: 1.8em; font-weight: 700; color: var(--navy); line-height: 1; }
.reveal .stat .lbl { font-size: 0.5em; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 0.4em; }

/* Title slide gets a full navy background instead of white. */
.reveal section[data-slide="title"] { padding-left: 0.4em; }
.reveal .slide-navy { color: #fff; }

.reveal a { color: var(--red); }
.reveal .slides section .fragment.visible { }
```

- [ ] **Step 2: Give the title slide a navy background**

Update the Slide 1 opening tag (from Task 1) to add a background color attribute. Change:

```html
    <section data-slide="title">
```
to:
```html
    <section data-slide="title" data-background-color="#001E62" class="slide-navy">
```

And because the title text must now read on navy, add these rules to the end of the `<style>` block:

```css
.reveal section.slide-navy h1,
.reveal section.slide-navy .deck-title { color: #fff; }
.reveal section.slide-navy .deck-sub { color: rgba(255,255,255,0.8); }
.reveal section.slide-navy .deck-foot,
.reveal section.slide-navy .eyebrow { color: rgba(255,255,255,0.65); }
.reveal section.slide-navy .deck-title em { color: #ff8099; }
```

- [ ] **Step 3: Verify in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Title slide now has a navy background with white serif title and a red dot before the eyebrow. Fonts are Source Serif 4 (title) and Source Sans 3 (eyebrow/footer).

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Add UIC brand theme to presentation deck"
```

---

### Task 3: Product slides (what it is + at a glance)

**Files:**
- Modify: `slides/index.html` (add 2 slides after the title slide)

**Interfaces:**
- Consumes: `.eyebrow`, `.slide-h`, `.lead`, `.bullets`, `.two-col`, `.stat-grid`/`.stat` from Task 2.

- [ ] **Step 1: Insert Slides 2 and 3 immediately after the title `</section>`**

```html
    <!-- Slide 2 — What it is -->
    <section data-slide="what">
      <p class="eyebrow">The problem</p>
      <h2 class="slide-h">One place for every approved <em>teaching tool</em>.</h2>
      <div class="two-col">
        <p class="lead">Faculty needed a single source of truth: which LTI tools are approved, where they work, and whether they meet accessibility rules.</p>
        <ul class="bullets">
          <li>Approved for Canvas &amp; Blackboard</li>
          <li>Title II compliance status, at a glance</li>
          <li>A guided finder and a browsable catalog</li>
          <li>No sign-in, updated each term</li>
        </ul>
      </div>
      <aside class="notes">
        Before this, that information was scattered. The catalog puts it in one place —
        a browsable table plus a guided "Find My Tool" finder.
      </aside>
    </section>

    <!-- Slide 3 — At a glance -->
    <section data-slide="glance">
      <p class="eyebrow">The product</p>
      <h2 class="slide-h">What faculty get.</h2>
      <div class="stat-grid">
        <div class="stat"><div class="num">57</div><div class="lbl">Approved tools</div></div>
        <div class="stat"><div class="num">2</div><div class="lbl">LMS platforms</div></div>
        <div class="stat"><div class="num">10</div><div class="lbl">Walkthrough videos</div></div>
      </div>
      <ul class="bullets">
        <li><strong>Find My Tool</strong> — a 3-question guided finder that returns a shortlist</li>
        <li><strong>Browse all</strong> — searchable, filterable catalog table</li>
        <li>Canvas &amp; Blackboard availability per tool, plus Title II status</li>
      </ul>
      <aside class="notes">
        Two ways in: the finder for people who don't know what they want, and the full
        catalog for people who do. 57 tools, 10 with Panopto walkthrough videos.
      </aside>
    </section>
```

- [ ] **Step 2: Verify slide count is now 3**

Run: `grep -c '<section' /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: `3`

- [ ] **Step 3: Verify in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Press right-arrow twice. Slide 2 shows a two-column problem statement; Slide 3 shows three red-topped stat tiles (57 / 2 / 10) above a checklist.

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Add product-overview slides to deck"
```

---

### Task 4: Build-story slides (Claude Design → handoff → how we worked → finder evolution)

**Files:**
- Modify: `slides/index.html` (add 4 slides after Slide 3)

**Interfaces:**
- Consumes: `.eyebrow`, `.slide-h`, `.lead`, `.bullets`, `.two-col`, `.mono`, `.pill` from Task 2.

- [ ] **Step 1: Insert Slides 4–7 after Slide 3's `</section>`**

```html
    <!-- Slide 4 — Where it started -->
    <section data-slide="design">
      <p class="eyebrow">Chapter 1 &middot; Claude Design</p>
      <h2 class="slide-h">It started as a <em>prototype</em>.</h2>
      <div class="two-col">
        <p class="lead">The first version was designed in Claude Design — an interactive prototype that defined the look and the flow.</p>
        <ul class="bullets">
          <li>Visual layout and typography</li>
          <li>The quiz flow <span class="mono">QUESTIONS_FULL</span></li>
          <li>The catalog table structure</li>
          <li>Shipped as <span class="mono">prototype.jsx</span></li>
        </ul>
      </div>
      <aside class="notes">
        Everything visual — the layout, the quiz, the table — was generated in Claude Design
        first. In git this is the very first commit: "Add files via upload."
      </aside>
    </section>

    <!-- Slide 5 — The handoff -->
    <section data-slide="handoff">
      <p class="eyebrow">Chapter 2 &middot; Claude Code</p>
      <h2 class="slide-h">Then it was handed to <em>Claude Code</em>.</h2>
      <div class="two-col">
        <p class="lead">The prototype was ported to a pure static site — no framework, no build, no dependencies.</p>
        <ul class="bullets">
          <li>Three files: <span class="mono">index.html</span>, <span class="mono">styles.css</span>, <span class="mono">app.js</span></li>
          <li>One source of truth: the <span class="mono">LTI_TOOLS</span> array</li>
          <li>Deployed on GitHub Pages</li>
        </ul>
      </div>
      <aside class="notes">
        The design became a real, deployable site. Critically, all tool data lives in one
        array in app.js — that decision makes the whole thing maintainable.
      </aside>
    </section>

    <!-- Slide 6 — How we worked -->
    <section data-slide="how">
      <p class="eyebrow">The workflow</p>
      <h2 class="slide-h">Built through <em>conversation</em>.</h2>
      <p class="lead">27 small, reviewable commits after the handoff — each one described in plain English, committed, and pushed live in minutes.</p>
      <ul class="bullets">
        <li>&ldquo;Rename the quiz to Find My Tool&rdquo; <span class="pill">shipped</span></li>
        <li>&ldquo;Remove the Title II question&rdquo; <span class="pill">shipped</span></li>
        <li>&ldquo;Make the column headers bigger&rdquo; <span class="pill">shipped</span></li>
        <li>&ldquo;Match the UIC brand&rdquo; <span class="pill">shipped</span></li>
      </ul>
      <aside class="notes">
        No tickets, no branches to babysit. A sentence of intent became a commit. This is
        what most of the two sessions looked like.
      </aside>
    </section>

    <!-- Slide 7 — Evolving the finder -->
    <section data-slide="finder">
      <p class="eyebrow">Design decisions</p>
      <h2 class="slide-h">The finder got <em>simpler</em>.</h2>
      <div class="two-col">
        <div>
          <p class="lead">It began as a five-question quiz. We cut it to the three questions that actually change the answer.</p>
        </div>
        <ul class="bullets">
          <li>5 questions &rarr; 3 (pedagogy, LMS, discipline)</li>
          <li>Title II dropped — now always required</li>
          <li>&ldquo;Take the Quiz&rdquo; &rarr; &ldquo;Find My Tool&rdquo;</li>
          <li>Removed the % match and the leaderboard</li>
        </ul>
      </div>
      <aside class="notes">
        Every removed question was a question that didn't change the recommendation. Title II
        is non-negotiable, so it became a constant instead of a prompt.
      </aside>
    </section>
```

- [ ] **Step 2: Verify slide count is now 7**

Run: `grep -c '<section' /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: `7`

- [ ] **Step 3: Verify in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Slides 4–7 read as a narrative: Claude Design → handoff → conversational workflow (with red "shipped" pills) → finder simplification.

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Add build-story slides to deck"
```

---

### Task 5: Data, redesign, and by-the-numbers slides

**Files:**
- Modify: `slides/index.html` (add 3 slides after Slide 7)

**Interfaces:**
- Consumes: `.eyebrow`, `.slide-h`, `.lead`, `.bullets`, `.two-col`, `.mono`, `.stat-grid`/`.stat` from Task 2.

- [ ] **Step 1: Insert Slides 8–10 after Slide 7's `</section>`**

```html
    <!-- Slide 8 — Real data, real problems -->
    <section data-slide="data">
      <p class="eyebrow">The hard part</p>
      <h2 class="slide-h">Rescuing the <em>video links</em>.</h2>
      <div class="two-col">
        <p class="lead">Tool data came from a spreadsheet. Exporting to CSV silently stripped every embedded Panopto hyperlink — only the display text survived.</p>
        <ul class="bullets">
          <li>Parsed the <span class="mono">.xlsx</span> directly with Python</li>
          <li>Read <span class="mono">zipfile</span> &rarr; <span class="mono">sheet1.xml.rels</span></li>
          <li>Recovered all 10 walkthrough URLs</li>
        </ul>
      </div>
      <aside class="notes">
        This was the one genuinely tricky engineering moment. An .xlsx is a zip of XML;
        the hyperlinks live in a relationships file. We read that directly to get the URLs back.
      </aside>
    </section>

    <!-- Slide 9 — Brand redesign -->
    <section data-slide="brand">
      <p class="eyebrow">The finish</p>
      <h2 class="slide-h">Made it look like <em>UIC</em>.</h2>
      <div class="two-col">
        <p class="lead">A retheme to match learning.uic.edu — the same navy, cardinal red, and clean white you're looking at right now.</p>
        <ul class="bullets">
          <li>UIC Navy <span class="mono">#001E62</span> hero &amp; header</li>
          <li>Cardinal Red <span class="mono">#D50032</span> accents</li>
          <li>Navy catalog table headers, white body</li>
        </ul>
      </div>
      <aside class="notes">
        The prototype had a dark editorial look. The final pass aligned it with the official
        UIC brand so it feels like it belongs on the university's site. This deck uses the same palette.
      </aside>
    </section>

    <!-- Slide 10 — By the numbers -->
    <section data-slide="numbers">
      <p class="eyebrow">By the numbers</p>
      <h2 class="slide-h">The whole build.</h2>
      <div class="stat-grid">
        <div class="stat"><div class="num">28</div><div class="lbl">Commits</div></div>
        <div class="stat"><div class="num">3</div><div class="lbl">Source files</div></div>
        <div class="stat"><div class="num">0</div><div class="lbl">Dependencies</div></div>
        <div class="stat"><div class="num">57</div><div class="lbl">Tools cataloged</div></div>
        <div class="stat"><div class="num">10</div><div class="lbl">Videos linked</div></div>
        <div class="stat"><div class="num">~2</div><div class="lbl">Work sessions</div></div>
      </div>
      <aside class="notes">
        Zero build steps, zero dependencies, three files. That simplicity is the point —
        anyone can maintain it.
      </aside>
    </section>
```

- [ ] **Step 2: Verify slide count is now 10**

Run: `grep -c '<section' /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: `10`

- [ ] **Step 3: Verify in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Slide 8 (data problem), Slide 9 (brand colors with mono hex chips), Slide 10 (a 3×2 grid of six stat tiles).

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Add data-pipeline, redesign, and metrics slides to deck"
```

---

### Task 6: Closing slides, final polish, and deploy

**Files:**
- Modify: `slides/index.html` (add 2 closing slides; verify navigation)
- Modify (optional, clearly marked): `index.html` at repo root (add one nav link)

**Interfaces:**
- Consumes: all theme classes from Task 2.

- [ ] **Step 1: Insert Slides 11 and 12 after Slide 10's `</section>`**

```html
    <!-- Slide 11 — Live & maintainable -->
    <section data-slide="live">
      <p class="eyebrow">In production</p>
      <h2 class="slide-h">Live, and easy to <em>keep</em> alive.</h2>
      <div class="two-col">
        <p class="lead">The catalog is live on GitHub Pages. Updating it is a one-line change.</p>
        <ul class="bullets">
          <li>Edit the <span class="mono">LTI_TOOLS</span> array, then push</li>
          <li>GitHub Pages redeploys automatically</li>
          <li><span class="mono">PROJECT.md</span> documents the whole system</li>
        </ul>
      </div>
      <aside class="notes">
        The handoff to the next maintainer is real: one documented array, one push. No pipeline
        to understand.
      </aside>
    </section>

    <!-- Slide 12 — Closing -->
    <section data-slide="close" data-background-color="#001E62" class="slide-navy">
      <p class="eyebrow">Recap</p>
      <h1 class="deck-title">Designed, built, and <em>shipped</em>.</h1>
      <p class="deck-sub">Claude Design &rarr; Claude Code &rarr; live for faculty.</p>
      <ul class="bullets" style="margin-top:0.8em;">
        <li>Next: usage analytics &amp; more walkthrough videos</li>
        <li>Next: periodic data refresh from the spreadsheet</li>
      </ul>
      <p class="deck-foot">olgaberezina1.github.io/UIC-LTI-Catalog</p>
      <aside class="notes">
        To recap: a prototype designed in Claude Design, rebuilt and iterated live in Claude Code,
        now serving faculty. Thank you — questions?
      </aside>
    </section>
```

Because the closing slide reuses `.slide-navy`, its bullets need to read on navy. Add to the end of the `<style>` block:

```css
.reveal section.slide-navy .bullets li { color: rgba(255,255,255,0.85); }
.reveal section.slide-navy .mono { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); color: #fff; }
```

- [ ] **Step 2: Verify final slide count is 12**

Run: `grep -c '<section' /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: `12`

- [ ] **Step 3: Full click-through in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Arrow through all 12 slides start to finish. The slide-number indicator (bottom, `c/t` format) reads `12` on the last slide. Press `S` — the speaker-notes window opens with notes for the current slide. First and last slides are navy; the middle ten are white. No console errors, no horizontal overflow.

- [ ] **Step 4: (Optional) Link the deck from the main site header**

Only do this step if you want the deck reachable from the live catalog. In `/Users/olgaberezina/Projects/UIC-LTI-Catalog/index.html`, find the nav block:

```html
  <nav class="nav">
    <a href="#catalog">Catalog</a>
    <a href="https://learning.uic.edu" target="_blank" rel="noopener">learning.uic.edu</a>
    <a href="https://docs.google.com/forms/d/1a5LmlcUrOMYU3LlBpGpJJcSiSXZE8-M37oSub6J0ogk/viewform" target="_blank" rel="noopener">Feedback Form</a>
  </nav>
```

and add one link before `</nav>`:

```html
    <a href="slides/">Showcase</a>
```

- [ ] **Step 5: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html index.html
git commit -m "Add closing slides and finalize presentation deck"
```

- [ ] **Step 6: Push and confirm it deploys**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git push
```
Expected: After GitHub Pages propagates (1–3 min), the deck is live at `https://olgaberezina1.github.io/UIC-LTI-Catalog/slides/`.

---

## Self-Review

**1. Spec coverage** — Audience/goal (project showcase): title + closing frame it as a showcase ✓. Format (reveal.js HTML, UIC-themed, GitHub Pages): Tasks 1–2 + deploy in Task 6 ✓. Focus (build story): Slides 4–10 are the Claude Design → Claude Code → data → redesign → numbers arc ✓. Length (~10–12): exactly 12 slides ✓.

**2. Placeholder scan** — Every slide's full HTML (headline, body, bullets, speaker notes) is written out; no "TBD"/"add content here". The only intentionally-optional item is Task 6 Step 4, explicitly marked optional. The empty `<style>` in Task 1 is filled in Task 2 Step 1. ✓

**3. Type/name consistency** — CSS classes defined in Task 2 (`.eyebrow`, `.slide-h`, `.lead`, `.bullets`, `.two-col`, `.stat-grid`, `.stat`, `.pill`, `.mono`, `.slide-navy`, `.deck-title`, `.deck-sub`, `.deck-foot`) are exactly the classes used in Tasks 1 and 3–6. reveal.js version `5.1.0` is identical across CSS link, JS script, and notes plugin. Numbers (57, 10, 28, 3, 0) match the Global Constraints and the repo. ✓
