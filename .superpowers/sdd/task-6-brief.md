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
