(function () {
  'use strict';

  // ─── 1. Catalog data (verbatim port from data.js) ──────────────
  const LTI_TOOLS = [
    { name: "Acadly", desc: "Classroom management combining attendance, live polling, assignments, and student-engagement comms.", bb: "yes", cv: "yes", t2: "yes", tags: ["engagement","polling","attendance","async","sync","general"] },
    { name: "ACS Lab Safety", desc: "Lab safety training and assessment with compliance tracking for laboratory protocols.", bb: "yes", cv: "yes", t2: "yes", tags: ["assessment","science","compliance","training"] },
    { name: "Aleks", desc: "Adaptive AI-driven math and science instruction with detailed progress tracking.", bb: "yes", cv: "retired", t2: "no", tags: ["adaptive","math","science","stem","practice","publisher"] },
    { name: "Alexander Street", desc: "Streaming video library — documentaries, performances, and academic video.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","content","humanities","library"] },
    { name: "Ally", desc: "Improves accessibility of digital course materials and auto-generates alternative formats for learners.", bb: "yes", cv: "no", t2: "yes", tags: ["accessibility","content","compliance"] },
    { name: "Anthology Course Evaluations", desc: "Configured course-evaluation system to collect student feedback and institutional assessments.", bb: "yes", cv: "pending", t2: "yes", tags: ["evaluation","feedback","survey"] },
    { name: "Packback", desc: "AI-powered structured discussion platform that encourages critical thinking and peer engagement.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","ai","engagement","async","writing"] },
    { name: "Apollo Codio", desc: "Cloud development environment and curriculum platform for computer-science education.", bb: "yes", cv: "pending", t2: "yes", tags: ["coding","stem","cs","practice","ide"] },
    { name: "Canvas Attendance", desc: "Roll Call — record live-session attendance manually or via check-ins, integrates with gradebook.", bb: "no", cv: "yes", t2: "yes", tags: ["attendance","engagement","sync"] },
    { name: "Canvas Intelligent Insights", desc: "AI analytics for engagement patterns and at-risk prediction with instructor dashboards.", bb: "na", cv: "yes", t2: "yes", tags: ["analytics","ai","success","at-risk"] },
    { name: "Canvas Moderated Grading", desc: "TA moderation, content approval, and proctoring oversight workflows within Canvas.", bb: "no", cv: "yes", t2: "yes", tags: ["grading","assessment","high-stakes"] },
    { name: "Canvas Studio", desc: "Interactive video platform — inline comments, quizzing on timelines, threaded discussions, captioning.", bb: "no", cv: "yes", t2: "yes", tags: ["video","engagement","discussion","captioning","async"] },
    { name: "Cengage Gateway", desc: "Digital Cengage textbooks, homework, assessments with grade passback.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","textbook","homework","practice"] },
    { name: "ClassRanked", desc: "Course difficulty, satisfaction, and instructor-performance insights from verified student feedback.", bb: "no", cv: "pending", t2: "—", tags: ["evaluation","analytics","feedback"] },
    { name: "Echo360", desc: "Lecture capture and video management — recording, streaming, and sharing.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","capture","async","general"] },
    { name: "Elsevier (Evolve)", desc: "Interactive health-sciences platform with resources, assessments, and digital textbooks for medical & nursing ed.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","health","textbook","practice"] },
    { name: "ExamSoft", desc: "Secure offline exam platform for high-stakes assessment with analytics and question tagging.", bb: "yes", cv: "research", t2: "yes", tags: ["assessment","high-stakes","integrity","proctoring"] },
    { name: "Follett Discovery", desc: "Search, adopt, and link textbooks and digital resources within the course environment.", bb: "yes", cv: "no", t2: "yes", tags: ["textbook","publisher"] },
    { name: "Gradescope", desc: "AI-assisted grading for assignments, exams, and programming projects with rubrics and feedback.", bb: "yes", cv: "yes", t2: "yes", tags: ["grading","assessment","stem","ai","writing"] },
    { name: "Holscience", desc: "Interactive simulations and virtual laboratory experiences for science courses.", bb: "yes", cv: "progress", t2: "—", tags: ["science","stem","simulation","lab"] },
    { name: "iClicker", desc: "Real-time polling, quizzes, and attendance to increase engagement in live classes.", bb: "yes", cv: "yes", t2: "yes", tags: ["polling","engagement","attendance","sync","large-class"] },
    { name: "ILP Grading", desc: "Advanced grading workflows and rubrics with streamlined scoring and gradebook integration.", bb: "no", cv: "yes", t2: "yes", tags: ["grading","assessment"] },
    { name: "InQuizitive (Norton)", desc: "Adaptive quiz platform with personalized practice questions tied to Norton content.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","practice","humanities"] },
    { name: "Kortex", desc: "Digital-textbook platform with 400K+ titles from Pearson, McGraw-Hill, Wiley, and more.", bb: "no", cv: "pending", t2: "yes", tags: ["textbook","publisher","library"] },
    { name: "Labflow", desc: "Digital lab notebook and workflow management for science courses.", bb: "yes", cv: "retired", t2: "no", tags: ["science","lab","stem"] },
    { name: "LinkedIn Learning", desc: "LinkedIn's professional development and skills-training platform.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","skills","async","general","professional"] },
    { name: "Lucid", desc: "Diagrams, flowcharts, wireframes, and digital whiteboards collaboratively inside Canvas.", bb: "no", cv: "yes", t2: "yes", tags: ["collaboration","visual","whiteboard","group"] },
    { name: "Matlab", desc: "Numerical computing for analysis, modeling, simulation — assignment submission and auto-grading for STEM.", bb: "yes", cv: "retired", t2: "no", tags: ["stem","math","engineering","computing","grading"] },
    { name: "McGraw Hill Connect", desc: "Adaptive learning, assignments, and assessment integrated with McGraw-Hill content.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook","homework"] },
    { name: "MNV / Macmillan Achieve", desc: "Gateway for Macmillan content and resources.", bb: "yes", cv: "request", t2: "yes", tags: ["publisher","textbook"] },
    { name: "myBusinessCourse", desc: "Online business-education content — accounting, finance — with integrated assessments.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","business","practice"] },
    { name: "MyOpenMath", desc: "Open-source online math homework with customizable problem sets and auto-grading.", bb: "yes", cv: "yes", t2: "yes", tags: ["math","stem","practice","open-source","homework"] },
    { name: "OpenOChem", desc: "Open-source organic-chemistry practice and resources.", bb: "yes", cv: "pending", t2: "—", tags: ["science","chemistry","stem","practice","open-source"] },
    { name: "Panopto", desc: "Lecture capture, video management, and interactive video learning.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","capture","async","general"] },
    { name: "Panorama", desc: "Surveys and analytics for engagement, well-being, and at-risk insight.", bb: "no", cv: "yes", t2: "yes", tags: ["analytics","success","survey","at-risk"] },
    { name: "Parchment Digital Badges", desc: "Issue digital badges and certificates that track skills and achievements.", bb: "no", cv: "yes", t2: "yes", tags: ["badges","credentials","skills"] },
    { name: "Pearson Access", desc: "Digital Pearson content, assessments, and adaptive learning tools.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook","homework"] },
    { name: "Perusall", desc: "Social annotation — students collaboratively read and discuss PDFs and course texts.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","reading","annotation","async","humanities","writing"] },
    { name: "Piazza", desc: "Q&A platform for student–instructor and peer-to-peer communication.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","qa","async","large-class","stem"] },
    { name: "Poll Everywhere", desc: "Real-time audience response — polling, quizzes, surveys during lectures.", bb: "yes", cv: "pending", t2: "yes", tags: ["polling","engagement","sync"] },
    { name: "Photo Roster", desc: "Displays student profile photos throughout the LMS to aid recognition and engagement.", bb: "yes", cv: "yes", t2: "yes", tags: ["roster","general"] },
    { name: "Redshelf", desc: "Configured e-textbook platform for UIC.", bb: "yes", cv: "retired", t2: "yes", tags: ["textbook","publisher"] },
    { name: "Respondus LockDown Browser", desc: "Restricts computer functions during online exams to preserve test integrity.", bb: "yes", cv: "yes", t2: "yes", tags: ["assessment","high-stakes","integrity","proctoring"] },
    { name: "Runestone", desc: "Interactive textbook for CS courses with executable code examples.", bb: "yes", cv: "pending", t2: "—", tags: ["textbook","cs","coding","stem"] },
    { name: "SAGE Vantage", desc: "SAGE content with adaptive learning and assessment tools.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","humanities","textbook"] },
    { name: "SCORM", desc: "Standardized package format for interactive learning modules — compatibility and tracking across LMS.", bb: "yes", cv: "yes", t2: "yes", tags: ["authoring","content","standard"] },
    { name: "Soft Chalk Cloud", desc: "Authoring and delivery of interactive online lessons.", bb: "yes", cv: "yes", t2: "yes", tags: ["authoring","content","async"] },
    { name: "Stukent", desc: "Digital-marketing simulations, courseware, and hands-on marketing learning.", bb: "yes", cv: "yes", t2: "yes", tags: ["business","simulation","practice","publisher"] },
    { name: "Expert TA", desc: "Online physics homework and assessment with automated grading and feedback.", bb: "yes", cv: "yes", t2: "yes", tags: ["physics","stem","practice","homework","grading"] },
    { name: "Top Hat", desc: "Polling, quizzes, attendance, discussions, digital textbooks for live or async learning.", bb: "yes", cv: "retired", t2: "no", tags: ["polling","engagement","attendance","textbook"] },
    { name: "Turning / PointSolutions", desc: "Interactive student-response system for real-time polling and classroom engagement.", bb: "yes", cv: "yes", t2: "yes", tags: ["polling","engagement","sync"] },
    { name: "Turnitin", desc: "Originality checking with grading tools, feedback, and writing analytics.", bb: "no", cv: "yes", t2: "yes", tags: ["integrity","writing","grading","humanities"] },
    { name: "UIC Teaching Eval", desc: "Configured course-evaluation system for UIC.", bb: "retired", cv: "retired", t2: "—", tags: ["evaluation","survey"] },
    { name: "Virtual Machine", desc: "On-campus computing environment for advanced LMS, media, and integration tasks.", bb: "—", cv: "—", t2: "yes", tags: ["infrastructure","compute"] },
    { name: "VoiceThread", desc: "Asynchronous audio/video/text discussions on shared media — peer feedback and presentations.", bb: "retired", cv: "retired", t2: "—", tags: ["discussion","video","async"] },
    { name: "Wiley (WileyPLUS)", desc: "Wiley content with adaptive learning and assessment.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook"] },
    { name: "Willolabs", desc: "Follett Willo digital delivery of textbooks and materials.", bb: "retired", cv: "retired", t2: "yes", tags: ["textbook","publisher"] },
    { name: "Zoom", desc: "Video conferencing — virtual meetings, webinars, and online sessions inside the LMS.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","sync","conferencing","general"] },
    { name: "Zybooks", desc: "Interactive online textbooks with coding exercises and animations for CS and engineering.", bb: "yes", cv: "yes", t2: "yes", tags: ["textbook","cs","coding","stem","engineering","practice"] },
  ];

  const AVAIL_LABEL = {
    yes: "Available",
    no: "Not in this LMS",
    retired: "Retired",
    pending: "Pending vendor",
    research: "Researching",
    request: "On request",
    progress: "In progress",
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
        { v: "discussion",  t: "Discuss together",      s: "Threaded discussion or Q&A" },
        { v: "annotation",  t: "Annotate readings",     s: "Social annotation on PDFs" },
        { v: "practice",    t: "Practice problems",     s: "Adaptive or low-stakes homework" },
        { v: "high-stakes", t: "Sit a high-stakes exam",s: "Proctored or secure testing" },
        { v: "writing",     t: "Write & get feedback",  s: "Originality, grading, essays" },
        { v: "video",       t: "Engage with video",     s: "Lecture capture, captioned media" },
        { v: "lab",         t: "Run a lab or sim",      s: "Virtual labs, science protocols" },
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
    {
      key: "discipline",
      eyebrow: "Question 03 — Discipline",
      prompt: "What's the broad shape of your subject?",
      multi: false,
      columns: 2,
      options: [
        { v: "stem",       t: "STEM",                     s: "Math, CS, engineering" },
        { v: "science",    t: "Lab science",              s: "Bio, chem, physics" },
        { v: "humanities", t: "Humanities & social sci.", s: "Reading-heavy, writing-heavy" },
        { v: "business",   t: "Business",                 s: "Accounting, finance, marketing" },
        { v: "health",     t: "Health sciences",          s: "Medical, nursing" },
        { v: null,         t: "Not subject-specific",     s: "General-purpose pick" },
      ],
    },
    {
      key: "mode",
      eyebrow: "Question 04 — Cadence",
      prompt: "Is this for live class time or between-class work?",
      multi: false,
      options: [
        { v: "sync",  t: "Synchronous",     s: "Happens during the lecture" },
        { v: "async", t: "Asynchronous",    s: "Students work on their own time" },
        { v: null,    t: "Both — flexible", s: "Pick something versatile" },
      ],
    },
    {
      key: "requireA11y",
      eyebrow: "Question 05 — Accessibility",
      prompt: "Do you need the tool to be Title II compliant?",
      sub: "Recommended for any course you publish broadly.",
      multi: false,
      options: [
        { v: true,  t: "Yes — required", s: "Filter out non-compliant tools" },
        { v: false, t: "Nice to have",   s: "Surface them but don't filter" },
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
  function scoreTools({ goals = [], lms = null, requireA11y = false, stakes = null, discipline = null, mode = null, size = null }) {
    const weights = { goal: 3, lms: 4, a11y: 5, stakes: 2, discipline: 2, mode: 1, size: 1 };
    return LTI_TOOLS.map(tool => {
      let score = 0;
      const reasons = [];

      goals.forEach(g => {
        if (tool.tags.includes(g)) { score += weights.goal; reasons.push(g); }
      });

      if (lms === "canvas" && tool.cv === "yes") { score += weights.lms; reasons.push("Canvas-ready"); }
      else if (lms === "blackboard" && tool.bb === "yes") { score += weights.lms; reasons.push("Blackboard-ready"); }
      else if (lms === "canvas" && tool.cv !== "yes") { score -= weights.lms; }
      else if (lms === "blackboard" && tool.bb !== "yes") { score -= weights.lms; }

      if (requireA11y && tool.t2 === "yes") { score += weights.a11y; reasons.push("Title II compliant"); }
      if (requireA11y && tool.t2 !== "yes") { score -= weights.a11y * 2; }

      if (stakes === "high" && tool.tags.includes("high-stakes")) { score += weights.stakes; reasons.push("high-stakes assessment"); }
      if (stakes === "low" && tool.tags.includes("practice")) { score += weights.stakes; reasons.push("low-stakes practice"); }

      if (discipline && tool.tags.includes(discipline)) { score += weights.discipline; reasons.push(discipline); }

      if (mode === "sync" && tool.tags.includes("sync")) { score += weights.mode; reasons.push("real-time"); }
      if (mode === "async" && tool.tags.includes("async")) { score += weights.mode; reasons.push("self-paced"); }

      if (size === "large" && tool.tags.includes("large-class")) { score += weights.size; reasons.push("large classes"); }

      if (tool.bb === "retired" && tool.cv === "retired") score -= 10;

      const max =
        goals.length * weights.goal +
        (lms ? weights.lms : 0) +
        (requireA11y ? weights.a11y : 0) +
        (stakes ? weights.stakes : 0) +
        (discipline ? weights.discipline : 0) +
        (mode ? weights.mode : 0) +
        (size ? weights.size : 0);

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
      discipline: null,
      mode: null,
      requireA11y: null,
    },
    catalog: {
      search: '',
      lms: 'all',
      onlyA11y: false,
    },
  };

  // ─── 4. DOM cache (filled on init) ─────────────────────────────
  let main;

  // ─── 5. Render dispatcher ──────────────────────────────────────
  function render() {
    main.dataset.screen = state.screen;
    if (state.screen === 'quiz') renderQuiz();
    if (state.screen === 'results') renderResults();
    renderCatalog();
  }

  // Stubs filled in by later tasks
  function renderQuiz() {
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

    // Leader slot — Task 6 fills this.
    renderLeader();
  }

  function renderLeader() {
    const slot = document.getElementById('leader-slot');
    // Hide on Q1
    if (state.step === 0) { slot.innerHTML = ''; return; }
    const top = scoreTools(state.answers)[0];
    if (!top || top.score <= 0) { slot.innerHTML = ''; return; }
    slot.innerHTML = `
      <div class="leader">
        <div class="eyebrow"><span class="dot"></span>Leader so far</div>
        <span class="name">${esc(top.name)}</span>
        <span class="pct">${top.pct}% MATCH</span>
        <span class="tail">Keep going — your shortlist refines with each answer.</span>
      </div>
    `;
  }

  function querySummary() {
    const a = state.answers;
    const bits = [];
    if (a.goals && a.goals.length) bits.push(a.goals.slice(0, 2).join(' + '));
    if (a.lms) bits.push(a.lms);
    if (a.discipline) bits.push(a.discipline);
    if (a.mode) bits.push(a.mode);
    return bits.length ? bits.join(' / ') : 'your course';
  }

  function availMarkup(stateVal) {
    const label = AVAIL_LABEL[stateVal] || stateVal || '—';
    let cls = 'yes';
    if (stateVal === 'no') cls = 'no';
    else if (stateVal === 'retired') cls = 'retired';
    else if (['pending', 'research', 'request', 'progress', 'na'].includes(stateVal)) cls = 'warn';
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
            <div class="result-tag-list">${t.tags.slice(0, 3).map(esc).join(' · ')}</div>
          </div>
          <p class="result-desc">${esc(t.desc)}</p>
          <div class="result-avail-row">
            ${availMarkup(t.cv)}
            <span class="sep">·</span>
            ${availMarkup(t.bb)}
            <span class="sep">·</span>
            <span class="result-t2">Title II: <strong>${t.t2 === 'yes' ? 'Compliant' : t.t2 === 'no' ? 'No' : '—'}</strong></span>
          </div>
          ${(t.reasons && t.reasons.length) ? `
            <div class="result-why">
              <span class="why-label">Why →</span>
              ${t.reasons.slice(0, 5).map(r => `<span class="tag">${esc(r)}</span>`).join('')}
            </div>` : ''}
        </div>
        <div class="result-pct-col">
          <div class="result-pct">${t.pct}<span class="sign">%</span></div>
          <div class="result-pct-label">Match</div>
          <div class="result-pct-bar"><div style="width: ${t.pct}%"></div></div>
          <button class="btn ghost">Tool details →</button>
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
            <div class="runner-pct">${t.pct}%</div>
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
    document.getElementById('catalog-tbody').innerHTML = rows.map(t => {
      const t2cell = t.t2 === 'yes' ? availMarkup('yes')
                   : t.t2 === 'no'  ? availMarkup('no')
                   : '<span class="em-dash">—</span>';
      return `
        <tr>
          <td data-label="Tool">
            <div class="catalog-name">${esc(t.name)}</div>
            <div class="catalog-tags">${t.tags.slice(0, 2).map(esc).join(' · ')}</div>
          </td>
          <td class="catalog-desc" data-label="What it's for">${esc(t.desc)}</td>
          <td data-label="Canvas">${availMarkup(t.cv)}</td>
          <td data-label="Blackboard">${availMarkup(t.bb)}</td>
          <td data-label="Title II">${t2cell}</td>
        </tr>
      `;
    }).join('');
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
    state.answers = { goals: [], lms: null, discipline: null, mode: null, requireA11y: null };
    state.step = 0;
  }

  // Allowed values for hash validation
  const VALID = {
    goals: new Set(['polling','discussion','annotation','practice','high-stakes','writing','video','lab']),
    lms: new Set(['canvas','blackboard']),
    discipline: new Set(['stem','science','humanities','business','health']),
    mode: new Set(['sync','async']),
    a11y: new Set(['yes','nice']),
  };

  function syncHash() {
    const a = state.answers;
    const parts = [];
    if (a.goals && a.goals.length) parts.push('goals=' + a.goals.join(','));
    if (a.lms) parts.push('lms=' + a.lms);
    if (a.discipline) parts.push('discipline=' + a.discipline);
    if (a.mode) parts.push('mode=' + a.mode);
    if (a.requireA11y === true)  parts.push('a11y=yes');
    if (a.requireA11y === false) parts.push('a11y=nice');
    if (state.screen === 'results') parts.push('view=results');
    const newHash = parts.length ? '#' + parts.join('&') : '';
    if (location.hash !== newHash) {
      history.replaceState(null, '', location.pathname + location.search + newHash);
    }
  }

  function emptyAnswers() {
    return { goals: [], lms: null, discipline: null, mode: null, requireA11y: null };
  }

  function hasAnyAnswer(a) {
    return (a.goals && a.goals.length > 0)
      || a.lms !== null
      || a.discipline !== null
      || a.mode !== null
      || a.requireA11y !== null;
  }

  function firstUnansweredStep(a) {
    if (!a.goals || a.goals.length === 0) return 0;
    if (a.lms === null) return 1;
    if (a.discipline === null) return 2;
    if (a.mode === null) return 3;
    if (a.requireA11y === null) return 4;
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
    if (params.discipline && VALID.discipline.has(params.discipline)) answers.discipline = params.discipline;
    if (params.mode && VALID.mode.has(params.mode)) answers.mode = params.mode;
    if (params.a11y && VALID.a11y.has(params.a11y)) {
      answers.requireA11y = params.a11y === 'yes';
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
      state.screen = 'quiz';
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
  document.addEventListener('DOMContentLoaded', () => {
    main = document.querySelector('main');

    // Populate hero count from data
    document.getElementById('hero-count').textContent =
      `The 2026 catalog · ${LTI_TOOLS.length} integrations`;

    // Hero buttons
    document.getElementById('btn-start-quiz').addEventListener('click', () => {
      state.step = 0;
      goToScreen('quiz');
    });
    document.getElementById('btn-browse').addEventListener('click', () => {
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Quiz option click delegation
    document.getElementById('screen-quiz').addEventListener('click', (e) => {
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
      goToScreen('quiz');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      resetAnswers();
      goToScreen('hero');
    });

    document.getElementById('catalog-search-input').addEventListener('input', (e) => {
      state.catalog.search = e.target.value;
      renderCatalog();
    });

    document.getElementById('catalog-pills').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lms]');
      if (!btn) return;
      state.catalog.lms = btn.dataset.lms;
      renderCatalog();
    });

    // Listen on the real <input>'s change event so clicks anywhere on the wrapping
    // <label> (visual square OR text) toggle the filter consistently.
    document.getElementById('catalog-a11y-input').addEventListener('change', (e) => {
      state.catalog.onlyA11y = e.target.checked;
      renderCatalog();
    });

    hydrateFromHash();
    render();
  });

  window.addEventListener('hashchange', () => {
    hydrateFromHash();
    render();
  });

})();
