### Task 7: `app.js` — load from JSON, render category, rebuild the finder

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `tools.json` from Task 6
- Produces: nothing later tasks depend on

This is one task because it is one atomic change: the moment data arrives from `tools.json`, every `t.tags` read is `undefined` and throws. Splitting it would leave a broken page between commits. There is no JS test runner in this project and adding one would violate the no-dependencies constraint, so verification is a scripted set of browser checks with exact expected values.

- [ ] **Step 1: Replace the array literal with a loader**

Replace lines 4–64 — the `// ─── 1. Catalog data …` comment through the `];` that closes `LTI_TOOLS` — with:

```js
  // ─── 1. Catalog data ───────────────────────────────────────────
  // Generated from the Google Sheet by scripts/sync_catalog.py.
  // Don't hand-edit tools.json — edit the sheet and re-run the script.
  let LTI_TOOLS = [];

  async function loadTools() {
    const res = await fetch('tools.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`tools.json: HTTP ${res.status}`);
    LTI_TOOLS = await res.json();
  }
```

Leave `AVAIL_LABEL` exactly as it is. It still carries `contract`, `migrating` and `standalone_mig`, which the sheet no longer produces; they are harmless display-layer entries.

- [ ] **Step 2: Merge the two discussion goals and drop question 03**

In `QUESTIONS`, replace the eight `goals` options with seven — `discussion` absorbs `annotation`:

```js
      options: [
        { v: "polling",     t: "Respond live",          s: "Polls, clickers, real-time questions" },
        { v: "discussion",  t: "Discuss & annotate",    s: "Threaded discussion, Q&A, social annotation" },
        { v: "practice",    t: "Practice problems",     s: "Adaptive or low-stakes homework" },
        { v: "high-stakes", t: "Sit a high-stakes exam",s: "Proctored or secure testing" },
        { v: "writing",     t: "Write & get feedback",  s: "Originality, grading, essays" },
        { v: "video",       t: "Engage with video",     s: "Lecture capture, captioned media" },
        { v: "lab",         t: "Run a lab or simulation", s: "Virtual labs, science protocols" },
      ],
```

Then delete the entire third question object — the one with `key: "discipline"`, from `{` after the `lms` object's closing `},` through its own `},`. `QUESTIONS` now holds two entries.

- [ ] **Step 3: Score goals on category**

Immediately above `function scoreTools`, add:

```js
  // Which sheet categories satisfy each finder goal. This is UI configuration,
  // not tool data — the sheet stays the only per-tool source. A category that
  // appears here nowhere simply never matches a goal; those tools still show in
  // the catalog and still score on LMS and Title II.
  const GOAL_CATEGORIES = {
    polling: [
      "Engagement & Classroom Response Systems",
      "Student Engagement & Classroom Management",
      "Engagement & Participation Tracking",
    ],
    discussion: ["Collaboration & Communication"],
    practice: ["Assessment & Testing", "Content Delivery & Digital Textbooks"],
    "high-stakes": [
      "Assessment Security & Academic Integrity",
      "Assessment & Testing",
      "Academic Integrity & Plagiarism Prevention",
    ],
    writing: ["Academic Integrity & Plagiarism Prevention", "Assessment & Grading Tools"],
    video: ["Media & Content Creation", "Multimedia Collaboration & Visual Tools"],
    lab: ["Specialized Academic Platforms", "Safety & Compliance"],
  };
```

Then replace the whole of `scoreTools` with:

```js
  function scoreTools({ goals = [], lms = null }) {
    const requireA11y = true;
    const weights = { goal: 3, lms: 4, a11y: 5 };
    return LTI_TOOLS.map(tool => {
      let score = 0;
      const reasons = [];

      goals.forEach(g => {
        const categories = GOAL_CATEGORIES[g] || [];
        if (categories.includes(tool.category)) { score += weights.goal; reasons.push(g); }
      });

      if (lms === "canvas" && tool.cv === "yes") { score += weights.lms; reasons.push("Canvas-ready"); }
      else if (lms === "blackboard" && tool.bb === "yes") { score += weights.lms; reasons.push("Blackboard-ready"); }
      else if (lms === "canvas" && tool.cv !== "yes") { score -= weights.lms; }
      else if (lms === "blackboard" && tool.bb !== "yes") { score -= weights.lms; }

      if (requireA11y && tool.t2 === "yes") { score += weights.a11y; reasons.push("Title II compliant"); }
      if (requireA11y && tool.t2 !== "yes") { score -= weights.a11y * 2; }

      if (tool.bb === "retired" && tool.cv === "retired") score -= 10;

      const max =
        goals.length * weights.goal +
        (lms ? weights.lms : 0) +
        (requireA11y ? weights.a11y : 0);

      const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
      return { ...tool, score, pct, reasons: [...new Set(reasons)] };
    }).sort((a, b) => b.score - a.score);
  }
```

The `stakes`, `size` and `discipline` parameters and their branches are gone — nothing ever passed them, since they appear in neither `QUESTIONS` nor `state.answers`.

- [ ] **Step 4: Render category instead of tags**

Three replacements.

In the result card (was `app.js:309`):

```js
            <div class="result-tag-list">${esc(t.category)}</div>
```

In the catalog row (was `app.js:403`):

```js
            <div class="catalog-tags">${esc(t.category)}</div>
```

And the walkthrough link (was `app.js:396-398`) — using the sheet's own link text, and escaping the URL now that it comes from an external source:

```js
      const videoLink = t.video
        ? '<a href="' + esc(t.video) + '" target="_blank" rel="noopener" class="catalog-video-link">&#9654; '
          + esc(t.videoTitle || 'Watch walkthrough') + '</a>'
        : '';
```

- [ ] **Step 5: Remove `discipline` from the state and URL plumbing**

Six edits in section 3 and section 5:

```js
    answers: {
      goals: [],
      lms: null,
    },
```

```js
  function resetAnswers() {
    state.answers = { goals: [], lms: null };
    state.step = 0;
  }
```

```js
  const VALID = {
    goals: new Set(['polling','discussion','practice','high-stakes','writing','video','lab']),
    lms: new Set(['canvas','blackboard']),
  };
```

```js
  function emptyAnswers() {
    return { goals: [], lms: null };
  }

  function hasAnyAnswer(a) {
    return (a.goals && a.goals.length > 0) || a.lms !== null;
  }

  function firstUnansweredStep(a) {
    if (!a.goals || a.goals.length === 0) return 0;
    if (a.lms === null) return 1;
    return QUESTIONS.length - 1;
  }
```

In `syncHash`, delete the line `if (a.discipline) parts.push('discipline=' + a.discipline);`
In `readHash`, delete the line `if (params.discipline && VALID.discipline.has(params.discipline)) answers.discipline = params.discipline;`
In `querySummary`, delete the line `if (a.discipline) bits.push(a.discipline);`

Older shared links carrying `discipline=stem` or `goals=annotation` still work — `readHash` already filters against `VALID` and ignores unknown params.

- [ ] **Step 6: Load the data before the first render**

In the `DOMContentLoaded` handler, make the callback `async` and load before anything reads `LTI_TOOLS`:

```js
  document.addEventListener('DOMContentLoaded', async () => {
    main = document.querySelector('main');

    try {
      await loadTools();
    } catch (err) {
      console.error('Could not load tools.json', err);
      document.getElementById('catalog-tbody').innerHTML =
        '<tr><td colspan="5">Catalog failed to load. Please refresh the page.</td></tr>';
      return;
    }

    // Populate hero count from data
    document.getElementById('hero-count').textContent =
      `The 2026 catalog · ${LTI_TOOLS.length} integrations`;
```

Leave the rest of the handler unchanged.

- [ ] **Step 7: Check for leftovers**

Run: `grep -n "\.tags\b\|discipline\|weights\.stakes\|weights\.size\|stakes ===\|size ===" app.js`
Expected: **no matches at all.** Any hit is a missed edit — fix it before continuing.

This pattern targets the reads being removed, not every occurrence of the words. Three things
survive on purpose and must NOT be deleted: the CSS class names `catalog-tags` and
`result-tag-list` (kept so `styles.css` needs no change), and the `high-stakes` goal value in
both `QUESTIONS` and `GOAL_CATEGORIES`.

- [ ] **Step 8: Verify without a browser**

Browser automation is unavailable in this session, so verification is static plus a served-file
check. A human does the visual pass before Task 8 pushes anything.

Create `scripts/verify_app.py` — a throwaway checker, deleted in the last step of this task:

```python
#!/usr/bin/env python3
"""One-off checks on app.js after the tools.json migration. Deleted once green."""

import json
import re
import sys

app = open("app.js", encoding="utf-8").read()
tools = json.load(open("tools.json", encoding="utf-8"))
categories = {t["category"] for t in tools}
failures = []

# 1. Every GOAL_CATEGORIES string must be a real category. A typo here silently
#    scores zero matches, which is the likeliest way this task goes wrong.
block = re.search(r"const GOAL_CATEGORIES = \{(.*?)\n  \};", app, re.S)
if not block:
    failures.append("GOAL_CATEGORIES not found")
else:
    # Category names all contain a space; the goal keys ("high-stakes") do not,
    # which is what keeps the keys out of this set.
    referenced = set(re.findall(r'"([^"]*\s[^"]*)"', block.group(1)))
    unknown = referenced - categories
    if unknown:
        failures.append(f"GOAL_CATEGORIES names categories absent from tools.json: {sorted(unknown)}")
    print(f"GOAL_CATEGORIES references {len(referenced)} categories, all present")

# 2. The finder must be down to two questions.
questions = re.search(r"const QUESTIONS = \[(.*?)\n  \];", app, re.S)
count = len(re.findall(r'^\s+key: "', questions.group(1), re.M)) if questions else 0
if count != 2:
    failures.append(f"expected 2 finder questions, found {count}")
print(f"finder questions: {count}")

# 3. No reads of the removed fields survive. The CSS class names catalog-tags and
#    result-tag-list, and the high-stakes goal value, are kept on purpose.
for pattern in (r"\.tags\b", r"discipline", r"weights\.stakes", r"weights\.size"):
    hits = re.findall(pattern, app)
    if hits:
        failures.append(f"{len(hits)} leftover match(es) for {pattern}")

# 4. The literal is gone and the fetch is in.
if "const LTI_TOOLS = [" in app:
    failures.append("the LTI_TOOLS array literal is still present")
if "fetch('tools.json'" not in app:
    failures.append("no fetch of tools.json")

for failure in failures:
    print(f"FAIL: {failure}")
print("\nall checks passed" if not failures else f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)
```

Run all three checks; every one must pass:

```bash
node --check app.js && echo "syntax OK"
python3 scripts/verify_app.py
python3 -m http.server 8000 &
sleep 1
for f in index.html app.js tools.json; do
  curl -s -o /dev/null -w "$f %{http_code}\n" "http://localhost:8000/$f"
done
kill %1
```

Expected: `syntax OK`; `all checks passed`; and `200` for all three files.

Then delete the checker — it has served its purpose and is not part of the deliverable:

```bash
rm scripts/verify_app.py
```

**Report to the controller that the visual pass is still outstanding.** These checks cannot see
rendering: that the category line looks right under the tool name, that the walkthrough link
label reads "▶ How to Embed Panopto Videos", that the console is free of
`Cannot read properties of undefined (reading 'slice')`, or that the two-question finder returns
sensible results for "Sit a high-stakes exam" + Canvas. A human confirms those before Task 8's push.

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "$(cat <<'EOF'
Load catalog from tools.json and score the finder on category

Replaces the embedded LTI_TOOLS literal with a fetch of the generated
tools.json. Catalog rows and result cards show the sheet's Category in
place of hand-maintained tags, and Find My Tool drops its discipline
question, which category data cannot answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PsMcmYYReBHKYZNcUmvgPr
EOF
)"
```

---

