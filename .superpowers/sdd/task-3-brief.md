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

