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

