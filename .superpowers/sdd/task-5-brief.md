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

