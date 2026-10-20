(function () {
  'use strict';

  // ─── 1. Catalog data ───────────────────────────────────────────
  // Generated from the Google Sheet by scripts/sync_catalog.py.
  // Don't hand-edit tools.json — edit the sheet and re-run the script.
  let LTI_TOOLS = [];

  async function loadTools() {
    const res = await fetch('tools.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`tools.json: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('tools.json is not an array');
    LTI_TOOLS = data;
  }

  const AVAIL_LABEL = {
    yes: "Yes",
    no: "No",
    unlicensed: "Not licensed, unavailable.",
    retired: "Retired",
    pending: "Waiting for vendor response",
    research: "Researching",
    request: "Available per request",
    progress: "In progress",
    contract: "Contract not yet approved",
    migrating: "Migrating — Aug 15",
    standalone: "Standalone",
    standalone_mig: "Standalone — migrating Aug 15",
    na: "N/A",
    "—": "—",
  };

  // ─── Finder taxonomy ───────────────────────────────────────────
  // Category -> sub-category -> tools. This is UI configuration, not tool data:
  // the sheet behind tools.json has no sub-categories, so this tree is
  // maintained by hand. Tool names must match tools.json exactly —
  // checkTaxonomy() warns on drift at startup.
  //
  // Seeded from "Find My Tool LTIs Categories.xlsx", which covered 44 of the 60
  // tools, then extended so every tool is reachable. It diverges from that
  // spreadsheet in three ways, recorded here so the next edit knows what is
  // deliberate:
  //   1. Two typos corrected — "Sepecific", and a missing space in "&Credentials".
  //   2. The other 16 tools placed into existing sub-categories.
  //   3. Three containers added for tools the spreadsheet had nowhere to put:
  //      "Health Sciences" (ATI Testing), and the "Access & Compliance" category
  //      for the two campus services that aren't courseware at all — ACS Lab
  //      Safety UIC and the campus Virtual Machine.
  const FINDER_TAXONOMY = [
    { name: "Engagement & Participation", subcategories: [
      { name: "Attendance Tracking", tools: [
        "Acadly",
        "iClicker",
        "Canvas Attendance",
        "Photo Roster",
        "Top hat",
      ] },
      { name: "Survey & Polling", tools: [
        "Acadly",
        "Turning Technologies (PointSolutions)",
        "iClicker",
        "Poll Everywhere",
        "Top hat",
      ] },
    ] },
    { name: "Content Creation & Interactive Learning", subcategories: [
      { name: "Video Recording & Hosting", tools: ["Panopto", "Echo360", "Canvas Studio"] },
      { name: "Interactive Course Content", tools: ["Soft Chalk Cloud", "Acadly", "SCORM"] },
    ] },
    { name: "Collaboration & Communication", subcategories: [
      { name: "Interactive Whiteboard & Visual Workspace", tools: ["Lucid"] },
      { name: "Discussion & Annotation", tools: [
        "Canvas Studio",
        "Panopto",
        "Perusall",
        "Piazza",
        "Packback",
      ] },
      { name: "Video Conferencing", tools: ["Zoom"] },
    ] },
    { name: "Courseware & Publisher Content", subcategories: [
      { name: "e-Textbooks & Course Materials", tools: [
        "Follett My Materials",
        "Elsevier (Evolve)",
        "Cengage Gateway",
        "SAGE Vantage",
        "Wiley (WileyPLUS)",
        "Zybooks",
        "Pearson Access",
        "Redshelf",
        "Runestone",
      ] },
      { name: "Integrated Learning Platforms", tools: [
        "Lingco",
        "Alexander Street",
        "McGraw Hill Connect",
        "MNV Gateway (Macmillan Achieve)",
      ] },
    ] },
    { name: "Assessment & Grading", subcategories: [
      { name: "Grading", tools: [
        "Gradescope",
        "ILP Grading",
        "PrairieLearn",
        "Canvas Moderated Grading",
      ] },
      { name: "Quizzes", tools: ["InQuizitive (W.W. Norton)"] },
      { name: "Secure & Proctored Testing", tools: [
        "ExamSoft Enterprise",
        "Respondus LockDown Browser",
      ] },
    ] },
    { name: "Learning Analytics & Credentials", subcategories: [
      { name: "Course Analytics", tools: [
        "Canvas Intelligent Insights",
        "ClassRanked",
        "Anthology Course Evaluations",
      ] },
      { name: "Digital Badges & Credentials", tools: ["Parchment Digital Badges"] },
    ] },
    { name: "Professional Development", subcategories: [
      { name: "Skills Training", tools: ["LinkedIn Learning", "Coursera"] },
    ] },
    { name: "Academic Integrity", subcategories: [
      { name: "Plagiarism & Similarity Checking", tools: ["iThenticate", "TurnitIn"] },
    ] },
    { name: "Discipline-Specific Courseware", subcategories: [
      { name: "STEM", tools: [
        "Aleks",
        "Labflow",
        "The Expertta (Expert TA)",
        "Zybooks",
        "Apollo Codio",
        "Holscience",
        "Matlab",
        "MyOpenMath",
        "OpenOChem",
        "Runestone",
      ] },
      { name: "Business", tools: ["Stukent", "myBusinessCourse"] },
      { name: "Health Sciences", tools: ["ATI Testing"] },
    ] },
    { name: "Accessibility", subcategories: [
      { name: "Accessibility", tools: ["Panorama", "Ally"] },
    ] },
    { name: "Access & Compliance", subcategories: [
      { name: "Lab Safety & Compliance", tools: ["ACS Lab Safety UIC"] },
      { name: "Computing Access", tools: ["Virtual Machine"] },
    ] },
  ];

  // Chosen when someone wants a whole category rather than one sub-category.
  // A real value, not null, so "no preference" stays distinct from "unanswered".
  const ANY_SUBCATEGORY = "__any__";

  function categoryByName(name) {
    return FINDER_TAXONOMY.find(c => c.name === name) || null;
  }

  // The sub-category question applies only where a category has more than one.
  // Three categories have a single sub-category, which would be a dead step.
  function subcategoriesFor(categoryName) {
    const cat = categoryByName(categoryName);
    return cat && cat.subcategories.length > 1 ? cat.subcategories : [];
  }

  // The tools in the narrowest scope chosen so far.
  function toolsInScope(categoryName, subcategoryName) {
    const cat = categoryByName(categoryName);
    if (!cat) return new Set();
    const picked = (subcategoryName && subcategoryName !== ANY_SUBCATEGORY)
      ? cat.subcategories.filter(s => s.name === subcategoryName)
      : cat.subcategories;
    return new Set(picked.flatMap(s => s.tools));
  }

  // Warn if the taxonomy names a tool the catalog no longer has — the two are
  // maintained separately, so they drift silently otherwise.
  function checkTaxonomy() {
    const known = new Set(LTI_TOOLS.map(t => t.name));
    const unknown = [...new Set(FINDER_TAXONOMY.flatMap(
      c => c.subcategories.flatMap(s => s.tools)))].filter(n => !known.has(n));
    if (unknown.length) {
      console.warn('Finder taxonomy names tools absent from tools.json:', unknown);
    }
  }

  // ─── Question content ──────────────────────────────────────────
  // The finder runs 1 or 2 questions: the sub-category step appears only for
  // categories that have more than one. Build the list from the answers so far
  // instead of indexing a fixed array.
  function activeQuestions() {
    const questions = [{
      key: "category",
      label: "Category",
      prompt: "What do you want students to do?",
      sub: "Pick the area closest to what you have in mind.",
      multi: false,
      // Three across: 11 categories in 4 rows rather than 6.
      columns: 3,
      options: FINDER_TAXONOMY.map(cat => ({ v: cat.name, t: cat.name })),
    }];

    const subcategories = subcategoriesFor(state.answers.category);
    if (subcategories.length) {
      questions.push({
        key: "subcategory",
        label: "Narrow it down",
        prompt: `Which part of ${state.answers.category}?`,
        multi: false,
        columns: 2,
        options: subcategories.map(s => ({ v: s.name, t: s.name })).concat([
          { v: ANY_SUBCATEGORY, t: "No preference", s: "Show the whole category" },
        ]),
      });
    }

    return questions;
  }

  // Tiny HTML-escape helper for any interpolated text. Tool data is external —
  // fetched from tools.json, generated from a spreadsheet — so escaping is required.
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ─── 2. Matching ─────────────────────────────────────────────
  // The chosen category (narrowed by sub-category, when one was asked) names its
  // tools explicitly in FINDER_TAXONOMY, so a tool matches by name rather than by
  // its tools.json category.
  //
  // Results are not ranked. Every tool in the chosen scope is an equally valid
  // answer, so they are listed alphabetically and nothing implies one is a better
  // pick than another. Title II status and LMS availability are shown on every
  // card rather than used to order them — the catalog has its own filters for
  // narrowing on either.

  function matchTools({ category = null, subcategory = null }) {
    const inScope = toolsInScope(category, subcategory);
    const scopeLabel =
      subcategory && subcategory !== ANY_SUBCATEGORY ? subcategory : category;

    return LTI_TOOLS
      .filter(tool => inScope.has(tool.name))
      .map(tool => {
        const reasons = [scopeLabel];
        if (tool.t2 === "yes") reasons.push("Title II compliant");
        return { ...tool, reasons };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ─── 3. State ──────────────────────────────────────────────────
  const state = {
    screen: 'hero',
    step: 0,
    answers: {
      category: null,
      subcategory: null,
    },
    catalog: {
      search: '',
      lms: 'all',
      onlyA11y: false,
      page: 0,
    },
  };

  // How many catalog rows per page.
  const CATALOG_PAGE_SIZE = 30;

  // ─── 4. DOM cache (filled on init) ─────────────────────────────
  let main;

  // ─── 5. Render dispatcher ──────────────────────────────────────
  function render() {
    main.dataset.screen = state.screen;
    if (state.screen === 'finder') renderFinder();
    if (state.screen === 'results') renderResults();
    renderCatalog();
  }

  function renderFinder() {
    const questions = activeQuestions();
    if (state.step >= questions.length) state.step = questions.length - 1;
    const q = questions[state.step];
    const total = questions.length;
    const value = state.answers[q.key];
    const isLast = state.step === total - 1;
    const isMulti = !!q.multi;
    const canContinue = isMulti
      ? Array.isArray(value) && value.length > 0
      : value !== undefined && value !== null;

    // Progress bars
    const progress = document.getElementById('progress');
    progress.innerHTML = questions.map((_, i) => {
      const cls = i < state.step ? 'is-past' : i === state.step ? 'is-current' : '';
      return `<div class="${cls}"></div>`;
    }).join('');

    // Eyebrow + counter
    document.getElementById('q-eyebrow').textContent =
      `Question 0${state.step + 1} — ${q.label}`;
    document.getElementById('q-counter').textContent =
      `0${state.step + 1} / 0${total}`;

    // Question prompt + options
    const slot = document.getElementById('question-slot');
    slot.innerHTML = `
      <h1 class="q-prompt serif">${esc(q.prompt)}</h1>
      ${q.sub ? `<p class="q-sub">${esc(q.sub)}</p>` : ''}
      <div class="options ${q.columns ? 'cols-' + q.columns : ''}">
        ${q.options.map(opt => {
          const selected = isMulti
            ? Array.isArray(value) && value.includes(opt.v)
            : value === opt.v;
          const dataValue = opt.v === null ? '__null__'
                         : opt.v === true ? '__true__'
                         : opt.v === false ? '__false__'
                         : String(opt.v);
          return `
            <button class="option-card"
                    data-opt
                    data-key="${esc(q.key)}"
                    data-value="${esc(dataValue)}"
                    data-multi="${isMulti}"
                    data-selected="${selected}">
              <span class="body">
                <div class="opt-title">${esc(opt.t)}</div>
                ${opt.s ? `<div class="opt-sub">${esc(opt.s)}</div>` : ''}
              </span>
              ${selected ? `<span class="tick">${isMulti ? '✓' : '→'}</span>` : ''}
            </button>`;
        }).join('')}
      </div>
    `;

    // Nav: show Continue if multi; otherwise hide it and let auto-advance handle it.
    const showContinue = isMulti;
    const btnContinue = document.getElementById('btn-continue');
    const autoHint = document.getElementById('auto-hint');
    btnContinue.style.display = showContinue ? '' : 'none';
    autoHint.style.display = showContinue ? 'none' : '';
    btnContinue.disabled = !canContinue;
    btnContinue.textContent = isLast ? 'See my matches →' : 'Continue →';

    document.getElementById('btn-back').disabled = state.step === 0;

  }

  function querySummary() {
    const a = state.answers;
    const bits = [];
    if (a.subcategory && a.subcategory !== ANY_SUBCATEGORY) bits.push(a.subcategory);
    else if (a.category) bits.push(a.category);
    return bits.length ? bits.join(' / ') : 'your course';
  }

  function availMarkup(stateVal) {
    const label = AVAIL_LABEL[stateVal] || stateVal || '—';
    let cls = 'yes';
    if (stateVal === 'no' || stateVal === 'unlicensed') cls = 'no';
    else if (stateVal === 'retired') cls = 'retired';
    else if (['pending', 'research', 'request', 'progress', 'na', 'contract', 'migrating', 'standalone', 'standalone_mig'].includes(stateVal)) cls = 'warn';
    else if (stateVal === '—' || !stateVal) cls = '';
    return `<span class="avail ${cls}"><span class="pip"></span>${esc(label)}</span>`;
  }

  function resultCardMarkup(t) {
    return `
      <div class="result-card">
        <div class="result-tags-line">
          <div class="result-name">${esc(t.name)}</div>
          <div class="result-tag-list">${esc(t.category)}</div>
        </div>
        <p class="result-desc">${esc(t.desc)}</p>
        <div class="result-avail-row">
          <span class="avail-lms-label">Canvas</span>${availMarkup(t.cv)}
          <span class="sep">·</span>
          <span class="avail-lms-label">Blackboard</span>${availMarkup(t.bb)}
          <span class="sep">·</span>
          <span class="result-t2">Title II: <strong>${t.t2 === 'yes' ? 'Compliant' : t.t2 === 'no' ? 'No' : '—'}</strong></span>
        </div>
        ${(t.reasons && t.reasons.length) ? `
          <div class="result-why">
            <span class="why-label">Why →</span>
            ${t.reasons.slice(0, 5).map(r => `<span class="tag">${esc(r)}</span>`).join('')}
          </div>` : ''}
      </div>
    `;
  }

  function renderResults() {
    const matches = matchTools(state.answers);

    document.getElementById('results-count').textContent =
      `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;

    document.getElementById('results-summary').innerHTML =
      `Built for <em>${esc(querySummary())}</em>.`;

    document.getElementById('results-top').innerHTML =
      matches.map(t => resultCardMarkup(t)).join('');
  }

  function rowsForCatalog() {
    const c = state.catalog;
    const q = c.search.trim().toLowerCase();
    return LTI_TOOLS.filter(t => {
      if (q && !((t.name + ' ' + t.desc).toLowerCase().includes(q))) return false;
      if (c.lms === 'canvas' && t.cv !== 'yes') return false;
      if (c.lms === 'blackboard' && t.bb !== 'yes') return false;
      if (c.onlyA11y && t.t2 !== 'yes') return false;
      return true;
    });
  }

  function renderCatalog() {
    const rows = rowsForCatalog();

    // Paginate — clamp the current page in case filters shrank the result set.
    const pageCount = Math.max(1, Math.ceil(rows.length / CATALOG_PAGE_SIZE));
    if (state.catalog.page > pageCount - 1) state.catalog.page = pageCount - 1;
    const page = state.catalog.page;
    const pageRows = rows.slice(page * CATALOG_PAGE_SIZE, (page + 1) * CATALOG_PAGE_SIZE);

    document.getElementById('catalog-count').textContent =
      `${rows.length} OF ${LTI_TOOLS.length} SHOWN`;

    // Filter pills
    document.querySelectorAll('#catalog-pills .tag').forEach(btn => {
      btn.classList.toggle('is-on', btn.dataset.lms === state.catalog.lms);
    });

    // Title II checkbox — keep both the visual square and the real <input> in sync.
    const box = document.getElementById('catalog-a11y-box');
    box.classList.toggle('is-on', state.catalog.onlyA11y);
    box.textContent = state.catalog.onlyA11y ? '✓' : '';
    document.getElementById('catalog-a11y-input').checked = state.catalog.onlyA11y;

    // Table body
    document.getElementById('catalog-tbody').innerHTML = pageRows.map(t => {
      const t2cell = t.t2 === 'yes' ? '<span class="avail yes">Yes</span>'
                   : t.t2 === 'no'  ? '<span class="avail no">No</span>'
                   : '<span class="em-dash">—</span>';
      const videoLink = t.video
        ? '<a href="' + esc(t.video) + '" target="_blank" rel="noopener" class="catalog-video-link">&#9654; '
          + esc(t.videoTitle || 'Watch walkthrough') + '</a>'
        : '';
      return `
        <tr>
          <td data-label="Tool">
            <div class="catalog-name">${esc(t.name)}</div>
            <div class="catalog-tags">${esc(t.category)}</div>
          </td>
          <td class="catalog-desc" data-label="What it's for">${esc(t.desc)}${videoLink}</td>
          <td data-label="Canvas">${availMarkup(t.cv)}</td>
          <td data-label="Blackboard">${availMarkup(t.bb)}</td>
          <td data-label="Title II">${t2cell}</td>
        </tr>
      `;
    }).join('');

    renderPager(pageCount, page);
  }

  function renderPager(pageCount, page) {
    const pager = document.getElementById('catalog-pager');
    if (pageCount <= 1) { pager.innerHTML = ''; return; }
    let html = `<button class="pager-btn" data-page="${page - 1}" ${page === 0 ? 'disabled' : ''}>← Prev</button>`;
    for (let i = 0; i < pageCount; i++) {
      html += `<button class="pager-num${i === page ? ' is-on' : ''}" data-page="${i}">${i + 1}</button>`;
    }
    html += `<button class="pager-btn" data-page="${page + 1}" ${page === pageCount - 1 ? 'disabled' : ''}>Next →</button>`;
    pager.innerHTML = html;
  }

  function goToCatalogPage(n) {
    state.catalog.page = n;
    renderCatalog();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── 6. State helpers ──────────────────────────────────────────
  function goToScreen(name) {
    state.screen = name;
    syncHash();
    render();
  }

  function goToStep(n) {
    // step is derived from answers on hash read-back, not encoded — no syncHash().
    state.step = n;
    render();
  }

  function resetAnswers() {
    state.answers = { category: null, subcategory: null };
    state.step = 0;
  }

  // Allowed values for hash validation, straight from the taxonomy.
  const VALID = {
    category: new Set(FINDER_TAXONOMY.map(c => c.name)),
    subcategory: new Set([ANY_SUBCATEGORY].concat(
      FINDER_TAXONOMY.flatMap(c => c.subcategories.map(s => s.name)))),
  };


  function syncHash() {
    const a = state.answers;
    const parts = [];
    if (a.category) parts.push('category=' + a.category);
    if (a.subcategory) parts.push('subcategory=' + a.subcategory);
    if (state.screen === 'results') parts.push('view=results');
    const newHash = parts.length ? '#' + parts.join('&') : '';
    if (location.hash !== newHash) {
      history.replaceState(null, '', location.pathname + location.search + newHash);
    }
  }

  function emptyAnswers() {
    return { category: null, subcategory: null };
  }

  function hasAnyAnswer(a) {
    return a.category !== null || a.subcategory !== null;
  }

  // Walk the questions that actually apply to these answers, since the
  // sub-category step is present for some categories and absent for others.
  function firstUnansweredStep(a) {
    const questions = activeQuestions();
    const at = questions.findIndex(q => a[q.key] === null || a[q.key] === undefined);
    return at === -1 ? questions.length - 1 : at;
  }

  function readHash() {
    const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    if (!raw) return { answers: emptyAnswers(), view: null };

    const params = {};
    raw.split('&').forEach(pair => {
      const i = pair.indexOf('=');
      if (i < 0) return;
      params[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    });

    const answers = emptyAnswers();

    if (params.category && VALID.category.has(params.category)) {
      answers.category = params.category;
    }
    if (params.subcategory && VALID.subcategory.has(params.subcategory)) {
      // Only keep a sub-category that belongs to the category in the same link.
      const owned = subcategoriesFor(answers.category).some(s => s.name === params.subcategory);
      if (owned || params.subcategory === ANY_SUBCATEGORY) {
        answers.subcategory = params.subcategory;
      }
    }
    const view = params.view === 'results' ? 'results' : null;
    return { answers, view };
  }

  function hydrateFromHash() {
    const { answers, view } = readHash();
    state.answers = answers;
    if (view === 'results' && hasAnyAnswer(answers)) {
      state.screen = 'results';
    } else if (hasAnyAnswer(answers)) {
      state.screen = 'finder';
      state.step = firstUnansweredStep(answers);
    } else {
      state.screen = 'hero';
      state.step = 0;
    }
  }

  // Decode the stringified data-value back to its real type
  function decodeOptValue(s) {
    if (s === '__null__') return null;
    if (s === '__true__') return true;
    if (s === '__false__') return false;
    return s;
  }

  // Short pause after a single-select pick so the user sees the selection register
  // before the screen advances. Matches the prototype "feel"; do not tune.
  const AUTO_ADVANCE_DELAY_MS = 220;

  function chooseAnswer(key, value, isMulti) {
    if (isMulti) {
      const cur = Array.isArray(state.answers[key]) ? state.answers[key] : [];
      const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
      state.answers[key] = next;
      syncHash();
      render();
    } else {
      // A different category means its sub-categories differ too.
      if (key === 'category' && state.answers.category !== value) {
        state.answers.subcategory = null;
      }
      state.answers[key] = value;
      syncHash();
      render();
      setTimeout(advance, AUTO_ADVANCE_DELAY_MS);
    }
  }

  function advance() {
    if (state.step === activeQuestions().length - 1) {
      goToScreen('results');
    } else {
      goToStep(state.step + 1);
    }
  }

  // ─── 7. Init ───────────────────────────────────────────────────
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

    // The taxonomy and the catalog are maintained separately; say so if they drift.
    checkTaxonomy();

    // Populate hero count from data
    document.getElementById('hero-count').textContent =
      `The 2026 catalog · ${LTI_TOOLS.length} integrations`;

    // Hero buttons
    document.getElementById('btn-start-finder').addEventListener('click', () => {
      state.step = 0;
      goToScreen('finder');
    });
    document.getElementById('btn-browse').addEventListener('click', () => {
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Finder option click delegation
    document.getElementById('screen-finder').addEventListener('click', (e) => {
      const opt = e.target.closest('[data-opt]');
      if (!opt) return;
      const key = opt.dataset.key;
      const value = decodeOptValue(opt.dataset.value);
      const isMulti = opt.dataset.multi === 'true';
      chooseAnswer(key, value, isMulti);
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      if (state.step > 0) goToStep(state.step - 1);
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
      advance();
    });

    document.getElementById('btn-adjust').addEventListener('click', () => {
      state.step = 0;
      goToScreen('finder');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      resetAnswers();
      goToScreen('hero');
    });

    document.getElementById('catalog-search-input').addEventListener('input', (e) => {
      state.catalog.search = e.target.value;
      state.catalog.page = 0;
      renderCatalog();
    });

    document.getElementById('catalog-pills').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lms]');
      if (!btn) return;
      state.catalog.lms = btn.dataset.lms;
      state.catalog.page = 0;
      renderCatalog();
    });

    // Listen on the real <input>'s change event so clicks anywhere on the wrapping
    // <label> (visual square OR text) toggle the filter consistently.
    document.getElementById('catalog-a11y-input').addEventListener('change', (e) => {
      state.catalog.onlyA11y = e.target.checked;
      state.catalog.page = 0;
      renderCatalog();
    });

    document.getElementById('catalog-pager').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      goToCatalogPage(Number(btn.dataset.page));
    });

    hydrateFromHash();
    render();
  });

  window.addEventListener('hashchange', () => {
    hydrateFromHash();
    render();
  });

})();
