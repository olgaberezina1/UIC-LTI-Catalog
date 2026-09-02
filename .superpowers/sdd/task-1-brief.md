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

