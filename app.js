(function () {
  'use strict';

  // ─── 1. Catalog data (verbatim port from data.js) ──────────────
  const LTI_TOOLS = [
    // ── Active tools ────────────────────────────────────────────────
    { name: "Acadly", desc: "A comprehensive classroom management platform that combines attendance tracking, live polling, assignments, and communication tools for enhanced student engagement.", bb: "yes", cv: "yes", t2: "yes", tags: ["engagement","polling","attendance","async","sync"] },
    { name: "ACS Lab Safety", desc: "A lab safety training and assessment platform specifically designed for University of Illinois Chicago to ensure compliance with laboratory safety protocols and regulations.", bb: "yes", cv: "yes", t2: "yes", tags: ["assessment","science","compliance","training"] },
    { name: "Aleks", desc: "An adaptive learning platform that uses artificial intelligence to provide personalized math and science instruction with detailed progress tracking.", bb: "yes", cv: "retired", t2: "no", tags: ["adaptive","math","science","stem","practice","publisher"] },
    { name: "Alexander Street", desc: "A digital library platform that provides access to streaming video content, including documentaries, performances, and educational videos for academic use.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","content","humanities","library"] },
    { name: "Ally", desc: "Ally helps improve the accessibility of digital course materials by providing instructors with feedback and guidance on content usability, while automatically generating alternative formats for learners. It supports inclusive teaching practices and helps institutions meet accessibility and compliance standards.", bb: "yes", cv: "no", t2: "yes", tags: ["accessibility","content","compliance"] },
    { name: "Anthology Course Evaluations", desc: "A course evaluation system specifically configured for University of Illinois Chicago to collect student feedback and institutional assessments.", bb: "yes", cv: "pending", t2: "yes", tags: ["evaluation","feedback","survey"] },
    { name: "Apollo Codio", desc: "A cloud-based development environment and curriculum platform designed for computer science education with integrated coding exercises and assessments.", bb: "yes", cv: "pending", t2: "yes", tags: ["coding","stem","cs","practice","ide"] },
    { name: "Canvas Attendance", desc: "Canvas Attendance (Roll Call) allows instructors to quickly record student attendance during live sessions, either manually or through student check-ins. It integrates attendance data with Canvas's gradebook and analytics to support participation tracking.", bb: "no", cv: "yes", t2: "yes", tags: ["attendance","engagement","sync"] },
    { name: "Canvas Intelligent Insights", desc: "Canvas Intelligent Insights uses AI-driven analytics to identify student engagement patterns, predict risk factors, and support data-informed teaching decisions. It provides dashboards and recommendations to enhance learning outcomes.", bb: "na", cv: "yes", t2: "yes", tags: ["analytics","ai","success","at-risk"] },
    { name: "Canvas Moderated Grading", desc: "Moderated Canvas refers to instructor or admin roles that have enhanced oversight capabilities (such as TA moderation, content approval workflows, or proctoring support) within Canvas courses. It enables structured control over student interactions, submissions, and discussion moderation.", bb: "no", cv: "yes", t2: "yes", tags: ["grading","assessment","high-stakes"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=392074dc-b258-4dd5-a318-b3c2015c2f81" },
    { name: "Canvas Studio", desc: "An interactive video platform to share video and audio content, while also supporting commenting, collaboration, and quizzing directly on media timelines. It allows threaded discussions, inline feedback, peer-to-peer interaction, and automatic captioning, all centrally managed with robust analytics that track engagement for deeper insight into learning outcomes.", bb: "no", cv: "yes", t2: "yes", tags: ["video","engagement","discussion","captioning","async"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=010a32e8-b48c-455c-b880-b3680147a91b" },
    { name: "Cengage Gateway", desc: "An integrated learning platform that provides access to Cengage's digital textbooks, homework assignments, and assessment tools with grade passback capabilities.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","textbook","homework","practice"] },
    { name: "ClassRanked", desc: "ClassRanked provides data-driven insights into course difficulty, student satisfaction, and instructor performance using verified student feedback. It helps students make informed course selections and supports departments with trend analysis.", bb: "no", cv: "research", t2: "—", tags: ["evaluation","analytics","feedback"] },
    { name: "Echo360", desc: "A lecture capture and video management platform that enables recording, streaming, and sharing of educational video content.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","capture","async"] },
    { name: "Elsevier (Evolve)", desc: "A comprehensive educational platform for health sciences that provides interactive learning resources, assessments, and digital textbooks for medical and nursing education.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","health","textbook","practice"] },
    { name: "ExamSoft", desc: "ExamSoft is a secure offline exam platform that supports high-stakes assessments, analytics, and question tagging. It ensures controlled testing environments and provides detailed performance reporting.", bb: "yes", cv: "research", t2: "yes", tags: ["assessment","high-stakes","integrity","proctoring"] },
    { name: "Expert TA", desc: "An online homework and assessment system primarily used for physics courses, providing automated grading and detailed feedback for STEM subjects.", bb: "yes", cv: "yes", t2: "yes", tags: ["stem","practice","homework","assessment"] },
    { name: "Follett Discovery", desc: "Follett Discovery allows instructors to search, adopt, and link course materials such as textbooks and digital resources directly within their course environment. It streamlines access to required materials and supports inclusive access and bookstore integrations.", bb: "yes", cv: "no", t2: "—", tags: ["textbook","publisher"] },
    { name: "Gradescope", desc: "An AI-assisted grading platform that streamlines the process of grading assignments, exams, and programming projects with automated feedback and analytics.", bb: "yes", cv: "yes", t2: "yes", tags: ["grading","assessment","stem","ai","writing"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=c7451af0-39a4-4167-8c1d-b36b012f039b" },
    { name: "Holscience", desc: "A science education platform that provides interactive simulations and virtual laboratory experiences for science courses.", bb: "yes", cv: "progress", t2: "—", tags: ["science","stem","simulation","lab"] },
    { name: "iClicker", desc: "iClicker enables real-time polling, quizzes, and attendance tracking to increase student engagement during live classes. Students can respond via mobile app or physical clickers.", bb: "yes", cv: "yes", t2: "yes", tags: ["polling","engagement","attendance","sync","large-class"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=8bba0d48-cd9a-4370-96e3-b43201411c63" },
    { name: "ILP Grading", desc: "ILP Grading (Instructor Learning Platform Grading) provides advanced grading workflows and rubrics for instructors to evaluate student work within Canvas. It supports streamlined scoring, feedback delivery, and integration with the Canvas gradebook.", bb: "no", cv: "yes", t2: "yes", tags: ["grading","assessment"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=d8c14696-939c-4623-94c3-b3a10166c826" },
    { name: "InQuizitive (Norton)", desc: "An adaptive quiz platform that provides personalized practice questions and assessments based on Norton's educational content.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","practice","humanities"] },
    { name: "Kortex", desc: "Digital textbook and course materials platform that provides students with access to over 400,000 digital textbooks from more than 700 publishers, including Pearson, McGraw-Hill, and Wiley.", bb: "no", cv: "pending", t2: "yes", tags: ["textbook","publisher","library"] },
    { name: "Labflow", desc: "A digital laboratory notebook and workflow management system designed for science courses to track experiments and lab activities.", bb: "yes", cv: "retired", t2: "no", tags: ["science","lab","stem"] },
    { name: "LinkedIn Learning", desc: "The production version of LinkedIn's professional development and skills training platform for educational institutions.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","skills","async","professional"] },
    { name: "Lingco", desc: "Lingco is a language learning platform that helps instructors create and deliver interactive language activities, assessments, and multimedia content. It supports course management, student engagement, and grade synchronization while providing tools designed specifically for language instruction.", bb: "no", cv: "yes", t2: "yes", tags: ["writing","humanities"] },
    { name: "Lucid", desc: "Lucid's LTI integration allows students and instructors to create, edit, and collaborate on diagrams, flowcharts, wireframes, and digital whiteboards directly within Canvas. It supports interactive visual assignments, group work, and embedded diagrams inside course content.", bb: "no", cv: "yes", t2: "yes", tags: ["collaboration","visual","whiteboard","group"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=629d8b59-42da-44d9-b857-b3a6016ab679" },
    { name: "Matlab", desc: "MATLAB is a powerful numerical computing environment used for data analysis, modeling, simulation, and visualization. It integrates with LMS platforms to enable assignment submissions, automated grading, and interactive learning modules in STEM courses.", bb: "yes", cv: "retired", t2: "no", tags: ["stem","math","engineering","computing"] },
    { name: "McGraw Hill Connect", desc: "A digital learning platform that provides adaptive learning technology, assignments, and assessments integrated with McGraw Hill's educational content.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook","homework"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=a87a3cab-ef47-49f0-a177-b369012eac93" },
    { name: "MNV / Macmillan Achieve", desc: "A gateway service for accessing educational content and resources through MNV Technology's platform.", bb: "yes", cv: "request", t2: "yes", tags: ["publisher","textbook"] },
    { name: "myBusinessCourse", desc: "An online learning platform that provides business education content, including accounting, finance, and business courses with integrated assessments.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","business","practice"] },
    { name: "MyOpenMath", desc: "An open-source online mathematics homework system that provides customizable problem sets and automatic grading for math courses.", bb: "yes", cv: "yes", t2: "yes", tags: ["math","stem","practice","open-source","homework"] },
    { name: "OpenOChem", desc: "An open-source organic chemistry learning platform that provides practice problems and educational resources for chemistry students.", bb: "yes", cv: "pending", t2: "—", tags: ["science","chemistry","stem","practice","open-source"] },
    { name: "Packback", desc: "An AI-powered discussion platform that encourages critical thinking through structured online discussions and peer engagement.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","ai","engagement","async","writing"] },
    { name: "Panopto", desc: "A comprehensive video platform for education that provides lecture capture, video management, and interactive video learning capabilities.", bb: "yes", cv: "yes", t2: "yes", tags: ["video","capture","async"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=4006194c-3a9e-4339-93b1-b367013674af" },
    { name: "Panorama", desc: "Panorama provides data-driven insights into student engagement, well-being, and sense of belonging through surveys and analytics. It helps instructors and administrators identify trends, support at-risk students, and inform student success initiatives.", bb: "no", cv: "yes", t2: "—", tags: ["analytics","success","survey","at-risk"] },
    { name: "Parchment Digital Badges", desc: "Parchment enables institutions to issue digital badges and certificates that track skills and achievements. It integrates with learning platforms to automate credential awarding and learner progress visualization.", bb: "yes", cv: "yes", t2: "yes", tags: ["badges","credentials","skills"] },
    { name: "Pearson Access", desc: "A comprehensive digital learning platform that provides access to Pearson's educational content, assessments, and adaptive learning tools.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook","homework"] },
    { name: "Perusall", desc: "A social annotation platform that allows students to collaboratively read and discuss academic texts, PDFs, and other course materials with integrated discussions and analytics.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","reading","annotation","async","humanities","writing"] },
    { name: "Photo Roster", desc: "Canvas Photo Roster displays profile photos next to student names throughout the LMS to help instructors and staff more easily recognize and engage with learners. It improves classroom familiarity and supports identity verification in remote or face-to-face teaching.", bb: "yes", cv: "yes", t2: "yes", tags: ["attendance","engagement"] },
    { name: "Piazza", desc: "A Q&A platform designed for academic courses that facilitates student-instructor and peer-to-peer communication and knowledge sharing.", bb: "yes", cv: "yes", t2: "yes", tags: ["discussion","qa","async","large-class","stem"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=c3acad21-4a04-4593-a2e2-b36b00fee801" },
    { name: "Poll Everywhere", desc: "A real-time audience response system that enables interactive polling, quizzes, and surveys during lectures and presentations.", bb: "yes", cv: "unlicensed", t2: "yes", tags: ["polling","engagement","sync"] },
    { name: "Redshelf", desc: "A digital textbook platform specifically configured for University of Illinois Chicago that provides access to e-textbooks and educational materials.", bb: "yes", cv: "retired", t2: "yes", tags: ["textbook","publisher"] },
    { name: "Respondus LockDown Browser", desc: "LockDown Browser restricts students' computer functions during online exams, preventing actions like copying, screen switching, or visiting other websites. It is often paired with monitoring tools to ensure test integrity.", bb: "yes", cv: "yes", t2: "yes", tags: ["assessment","high-stakes","integrity","proctoring"] },
    { name: "Runestone", desc: "An interactive textbook platform primarily used for computer science courses that combines reading materials with executable code examples.", bb: "yes", cv: "pending", t2: "—", tags: ["textbook","cs","coding","stem"] },
    { name: "SAGE Vantage", desc: "An integrated learning platform that combines SAGE Publications' content with adaptive learning technology and assessment tools.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","humanities","textbook"] },
    { name: "SCORM", desc: "SCORM is a standardized format for packaging interactive learning modules that can be imported into LMS platforms. It ensures compatibility, tracking, and communication between learning content and the LMS.", bb: "yes", cv: "yes", t2: "yes", tags: ["content"] },
    { name: "Soft Chalk Cloud", desc: "A content authoring and delivery platform that allows instructors to create interactive online lessons and educational content.", bb: "yes", cv: "yes", t2: "yes", tags: ["content","async"] },
    { name: "Stukent", desc: "A digital marketing education platform that provides simulations, courseware, and hands-on learning experiences for marketing courses.", bb: "yes", cv: "yes", t2: "yes", tags: ["business","simulation","practice","publisher"] },
    { name: "Top Hat", desc: "Top Hat is an interactive teaching platform that supports polling, quizzes, attendance, discussions, and digital textbook delivery. It enhances student engagement during live or asynchronous learning through mobile devices.", bb: "yes", cv: "retired", t2: "no", tags: ["polling","engagement","attendance","textbook"] },
    { name: "Turning Technologies (PointSolutions)", desc: "An interactive student response system that enables real-time polling, quizzes, and classroom engagement activities to enhance learning and participation.", bb: "yes", cv: "yes", t2: "yes", tags: ["polling","engagement","sync"] },
    { name: "Turnitin", desc: "Turnitin checks student submissions for originality by comparing them to extensive databases of academic and web content. It also offers grading tools, feedback features, and writing analytics.", bb: "no", cv: "yes", t2: "yes", tags: ["integrity","writing","grading","humanities"] },
    { name: "Virtual Machine", desc: "The Campus Virtual Machine provides instructors, TAs, and instructional designers with access to a stable, on-campus computing environment for running advanced LMS features, media tools, and integrations. It serves as a reliable alternative when a user's local hardware or network connection cannot support high-performance tasks.", bb: "na", cv: "na", t2: "yes", tags: [] },
    { name: "Wiley (WileyPLUS)", desc: "An integrated teaching and learning platform that combines Wiley's educational content with adaptive learning technology and assessment tools.", bb: "yes", cv: "yes", t2: "yes", tags: ["publisher","adaptive","textbook","homework"] },
    { name: "Zoom", desc: "A video conferencing platform integration that enables virtual meetings, webinars, and online classroom sessions within the LMS environment.", bb: "yes", cv: "yes", t2: "yes", tags: ["sync","collaboration"], video: "https://uic.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=0bf11245-7727-4f25-b10f-b39a01238fc1" },
    { name: "Zybooks", desc: "An interactive online textbook platform that combines reading materials with hands-on coding exercises and animations for computer science and engineering courses.", bb: "yes", cv: "yes", t2: "yes", tags: ["textbook","cs","coding","stem","practice"] },
    // ── Retired tools ───────────────────────────────────────────────
    { name: "Acrobatiq", desc: "An adaptive learning platform that provides personalized instruction and assessment capabilities for various academic subjects.", bb: "retired", cv: "retired", t2: "—", tags: ["adaptive","assessment"] },
    { name: "Coerll", desc: "The Center for Open Educational Resources and Language Learning platform that provides language learning materials and resources.", bb: "retired", cv: "retired", t2: "—", tags: ["humanities"] },
    { name: "ExamSoft Legacy", desc: "ExamSoft Legacy refers to the earlier version of the ExamSoft assessment platform that delivers secure, offline exams with robust question banking and performance analytics. It supports high-stakes testing environments but lacks newer cloud-based enhancements found in ExamSoft's modern suite.", bb: "retired", cv: "retired", t2: "yes", tags: ["assessment","high-stakes","integrity","proctoring"] },
    { name: "Feedback Fruits", desc: "A pedagogical tool suite that provides interactive learning activities including peer review, group assignments, and comprehension exercises.", bb: "retired", cv: "retired", t2: "—", tags: ["engagement","writing","discussion"] },
    { name: "For Class", desc: "A student engagement platform that facilitates classroom discussions, Q&A sessions, and interactive learning activities.", bb: "retired", cv: "retired", t2: "—", tags: ["engagement","discussion"] },
    { name: "Gradarius", desc: "A learning management and assessment platform that provides tools for course management, grading, and student analytics.", bb: "retired", cv: "retired", t2: "—", tags: ["analytics","grading"] },
    { name: "Intedashboard", desc: "InteDashboard is a team-based learning platform that supports readiness assurance tests, peer evaluation, and collaborative problem-solving activities. It helps instructors facilitate active learning and track student performance through structured group-based assessments.", bb: "retired", cv: "retired", t2: "—", tags: ["assessment","engagement","group"] },
    { name: "Law Evaluation Kit", desc: "A specialized evaluation and assessment platform designed for law school courses and legal education programs.", bb: "retired", cv: "retired", t2: "—", tags: ["assessment"] },
    { name: "Microsoft OneDrive LTI", desc: "A cloud storage integration that allows students and instructors to access, share, and collaborate on documents stored in Microsoft OneDrive directly within the LMS.", bb: "retired", cv: "retired", t2: "—", tags: ["collaboration"] },
    { name: "Microsoft Teams", desc: "A collaboration platform integration that enables video conferencing, chat, and team collaboration features within the learning management system.", bb: "retired", cv: "retired", t2: "—", tags: ["sync","collaboration"] },
    { name: "UIC Teaching Eval", desc: "A course evaluation system developed for University of Illinois Chicago to collect student feedback and assess teaching effectiveness.", bb: "retired", cv: "retired", t2: "—", tags: ["evaluation","survey"] },
    { name: "VoiceThread", desc: "VoiceThread allows asynchronous discussions through audio, video, and text comments on shared media. It supports interactive presentations, peer feedback, and accessible communication.", bb: "retired", cv: "retired", t2: "—", tags: ["discussion","video","async"] },
    { name: "Willolabs", desc: "A digital courseware delivery platform that provides access to digital textbooks and educational materials through Follett's content distribution system.", bb: "retired", cv: "retired", t2: "yes", tags: ["textbook","publisher"] },
  ];

  const AVAIL_LABEL = {
    yes: "Yes",
    no: "No",
    unlicensed: "Not licensed, unavailable.",
    retired: "Retired",
    pending: "Waiting for vendor response",
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
  ];

  // Tiny HTML-escape helper for any interpolated text. (Tool data is trusted,
  // but escape anyway so we don't accidentally break with an `&` in copy.)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ─── 2. Scoring (verbatim port from data.js) ───────────────────
  function scoreTools({ goals = [], lms = null, stakes = null, discipline = null, size = null }) {
    const requireA11y = true;
    const weights = { goal: 3, lms: 4, a11y: 5, stakes: 2, discipline: 2, size: 1 };
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

      if (size === "large" && tool.tags.includes("large-class")) { score += weights.size; reasons.push("large classes"); }

      if (tool.bb === "retired" && tool.cv === "retired") score -= 10;

      const max =
        goals.length * weights.goal +
        (lms ? weights.lms : 0) +
        (requireA11y ? weights.a11y : 0) +
        (stakes ? weights.stakes : 0) +
        (discipline ? weights.discipline : 0) +
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
    if (a.discipline) bits.push(a.discipline);
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
        <div class="result-pct-col">
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
      const t2cell = t.t2 === 'yes' ? '<span class="avail yes">Yes</span>'
                   : t.t2 === 'no'  ? '<span class="avail no">No</span>'
                   : '<span class="em-dash">—</span>';
      const videoLink = t.video
        ? '<a href="' + t.video + '" target="_blank" rel="noopener" class="catalog-video-link">&#9654; Watch walkthrough</a>'
        : '';
      return `
        <tr>
          <td data-label="Tool">
            <div class="catalog-name">${esc(t.name)}</div>
            <div class="catalog-tags">${t.tags.slice(0, 2).map(esc).join(' · ')}</div>
          </td>
          <td class="catalog-desc" data-label="What it's for">${esc(t.desc)}${videoLink}</td>
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
    state.answers = { goals: [], lms: null, discipline: null };
    state.step = 0;
  }

  // Allowed values for hash validation
  const VALID = {
    goals: new Set(['polling','discussion','annotation','practice','high-stakes','writing','video','lab']),
    lms: new Set(['canvas','blackboard']),
    discipline: new Set(['stem','science','humanities','business','health']),
  };

  function syncHash() {
    const a = state.answers;
    const parts = [];
    if (a.goals && a.goals.length) parts.push('goals=' + a.goals.join(','));
    if (a.lms) parts.push('lms=' + a.lms);
    if (a.discipline) parts.push('discipline=' + a.discipline);
    if (state.screen === 'results') parts.push('view=results');
    const newHash = parts.length ? '#' + parts.join('&') : '';
    if (location.hash !== newHash) {
      history.replaceState(null, '', location.pathname + location.search + newHash);
    }
  }

  function emptyAnswers() {
    return { goals: [], lms: null, discipline: null };
  }

  function hasAnyAnswer(a) {
    return (a.goals && a.goals.length > 0)
      || a.lms !== null
      || a.discipline !== null;
  }

  function firstUnansweredStep(a) {
    if (!a.goals || a.goals.length === 0) return 0;
    if (a.lms === null) return 1;
    if (a.discipline === null) return 2;
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
  document.addEventListener('DOMContentLoaded', () => {
    main = document.querySelector('main');

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
