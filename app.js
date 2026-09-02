(function () {
  'use strict';

  // ─── 1. Catalog data ───────────────────────────────────────────
  // Generated from the Google Sheet by scripts/sync_catalog.py.
  // Don't hand-edit tools.json — edit the sheet and re-run the script.
  let LTI_TOOLS = [];

  async function loadTools() {
    const res = await fetch('tools.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`tools.json: HTTP ${res.status}`);
    LTI_TOOLS = await res.json();
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

  // ─── Question content (ported from prototype.jsx QUESTIONS_FULL) ──
  const QUESTIONS = [
    {
      key: "goals",
      eyebrow: "Question 01 — Pedagogy",
      prompt: "What do you want students to do?",
      sub: "Pick all that apply — we'll weight them in your match.",
      multi: true,
      columns: 2,
      options: [
        { v: "polling",     t: "Respond live",          s: "Polls, clickers, real-time questions" },
        { v: "discussion",  t: "Discuss & annotate",    s: "Threaded discussion, Q&A, social annotation" },
        { v: "practice",    t: "Practice problems",     s: "Adaptive or low-stakes homework" },
        { v: "high-stakes", t: "Sit a high-stakes exam",s: "Proctored or secure testing" },
        { v: "writing",     t: "Write & get feedback",  s: "Originality, grading, essays" },
        { v: "video",       t: "Engage with video",     s: "Lecture capture, captioned media" },
        { v: "lab",         t: "Run a lab or simulation", s: "Virtual labs, science protocols" },
      ],
    },
    {
      key: "lms",
      eyebrow: "Question 02 — Where",
      prompt: "Which LMS are you teaching in this term?",
      multi: false,
      options: [
        { v: "canvas",     t: "Canvas",      s: "Current / transitional courses" },
        { v: "blackboard", t: "Blackboard",  s: "Legacy courses" },
        { v: null,         t: "Either, show me everything", s: "I'll filter later" },
      ],
    },
  ];

  // Tiny HTML-escape helper for any interpolated text. (Tool data is trusted,
  // but escape anyway so we don't accidentally break with an `&` in copy.)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ─── 2. Scoring (verbatim port from data.js) ───────────────────
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

  // ─── 3. State ──────────────────────────────────────────────────
  const state = {
    screen: 'hero',
    step: 0,
    answers: {
      goals: [],
      lms: null,
    },
    catalog: {
      search: '',
      lms: 'all',
      onlyA11y: false,
      page: 0,
    },
  };

  // How many catalog rows per page (59 tools → 2 pages).
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

  // Stubs filled in by later tasks
  function renderFinder() {
    const q = QUESTIONS[state.step];
    const total = QUESTIONS.length;
    const value = state.answers[q.key];
    const isLast = state.step === total - 1;
    const isMulti = !!q.multi;
    const canContinue = isMulti
      ? Array.isArray(value) && value.length > 0
      : value !== undefined && value !== null;

    // Progress bars
    const progress = document.getElementById('progress');
    progress.innerHTML = QUESTIONS.map((_, i) => {
      const cls = i < state.step ? 'is-past' : i === state.step ? 'is-current' : '';
      return `<div class="${cls}"></div>`;
    }).join('');

    // Eyebrow + counter
    document.getElementById('q-eyebrow').textContent = q.eyebrow;
    document.getElementById('q-counter').textContent =
      `0${state.step + 1} / 0${total}`;

    // Question prompt + options
    const slot = document.getElementById('question-slot');
    slot.innerHTML = `
      <h1 class="q-prompt serif">${esc(q.prompt)}</h1>
      ${q.sub ? `<p class="q-sub">${esc(q.sub)}</p>` : ''}
      <div class="options ${q.columns === 2 ? 'cols-2' : ''}">
        ${q.options.map((opt, i) => {
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
              <span class="letter">${String.fromCharCode(65 + i)}</span>
              <span class="body">
                <div class="opt-title">${esc(opt.t)}</div>
                <div class="opt-sub">${esc(opt.s)}</div>
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
    if (a.goals && a.goals.length) bits.push(a.goals.slice(0, 2).join(' + '));
    if (a.lms) bits.push(a.lms);
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

  function resultCardMarkup(t, rank, hero) {
    return `
      <div class="result-card${hero ? ' is-hero' : ''}">
        <div>
          <div class="result-rank">${String(rank).padStart(2, '0')}</div>
          ${hero ? '<div class="result-top-pick">TOP PICK</div>' : ''}
        </div>
        <div>
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
      </div>
    `;
  }

  function renderResults() {
    const results = scoreTools(state.answers);
    const top = results.slice(0, 3);
    const runners = results.slice(3, 6);

    document.getElementById('results-summary').innerHTML =
      `Built for <em>${esc(querySummary())}</em>.`;

    document.getElementById('results-top').innerHTML =
      top.map((t, i) => resultCardMarkup(t, i + 1, i === 0)).join('');

    const runnersWrap = document.getElementById('results-runners-wrap');
    if (runners.length === 0) {
      runnersWrap.style.display = 'none';
    } else {
      runnersWrap.style.display = '';
      document.getElementById('results-runners').innerHTML = runners.map(t => `
        <div class="runner-card">
          <div class="runner-head">
            <div class="runner-name">${esc(t.name)}</div>
          </div>
          <div class="runner-desc">${esc(t.desc.length > 110 ? t.desc.slice(0, 110) + '…' : t.desc)}</div>
        </div>
      `).join('');
    }
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
    state.answers = { goals: [], lms: null };
    state.step = 0;
  }

  // Allowed values for hash validation
  const VALID = {
    goals: new Set(['polling','discussion','practice','high-stakes','writing','video','lab']),
    lms: new Set(['canvas','blackboard']),
  };

  function syncHash() {
    const a = state.answers;
    const parts = [];
    if (a.goals && a.goals.length) parts.push('goals=' + a.goals.join(','));
    if (a.lms) parts.push('lms=' + a.lms);
    if (state.screen === 'results') parts.push('view=results');
    const newHash = parts.length ? '#' + parts.join('&') : '';
    if (location.hash !== newHash) {
      history.replaceState(null, '', location.pathname + location.search + newHash);
    }
  }

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

    if (params.goals) {
      answers.goals = params.goals.split(',').filter(g => VALID.goals.has(g));
    }
    if (params.lms && VALID.lms.has(params.lms)) answers.lms = params.lms;
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
      state.answers[key] = value;
      syncHash();
      render();
      setTimeout(advance, AUTO_ADVANCE_DELAY_MS);
    }
  }

  function advance() {
    if (state.step === QUESTIONS.length - 1) {
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
