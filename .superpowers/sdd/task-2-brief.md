### Task 2: Apply the UIC brand theme

**Files:**
- Modify: `slides/index.html` (replace the empty `<style>` block)

**Interfaces:**
- Consumes: the `.reveal`, `.eyebrow`, `.deck-title`, `.deck-sub`, `.deck-foot` structure from Task 1.
- Produces: theme classes used by all later slides — `.eyebrow`, `.slide-h` (slide headline), `.lead` (lead paragraph), `.bullets` (styled `<ul>`), `.stat-grid` / `.stat` (number tiles), `.two-col` (2-column layout), `.pill` (red accent chip), `.mono`.

- [ ] **Step 1: Replace the `<style>` block contents with the UIC theme**

```css
:root {
  --navy: #001E62;
  --navy-2: #2d3a6b;
  --red: #D50032;
  --red-ink: #a80027;
  --paper: #ffffff;
  --panel: #f4f6fa;
  --muted: #6b7280;
  --line: #dde3f0;
  --serif: "Source Serif 4", Georgia, serif;
  --sans: "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif;
}

.reveal { font-family: var(--sans); font-size: 30px; color: var(--navy); }
.reveal .slides { text-align: left; }
.reveal .slides section { background: var(--paper); }

/* Reveal paints a background layer; make the deck white with a navy title slide. */
.reveal .backgrounds { background: var(--paper); }
.reveal section[data-slide="title"] { color: var(--navy); }

.reveal h1, .reveal h2 { font-family: var(--serif); font-weight: 600; letter-spacing: -0.02em; line-height: 1.04; color: var(--navy); }
.reveal .deck-title { font-size: 2.6em; margin: 0.1em 0 0.15em; }
.reveal .deck-title em, .reveal .slide-h em { font-style: italic; color: var(--red); }
.reveal .deck-sub { font-family: var(--serif); font-size: 1.05em; color: var(--muted); max-width: 20ch; }
.reveal .deck-foot { font-family: var(--sans); font-size: 0.55em; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin-top: 1.4em; }

.reveal .eyebrow { font-size: 0.5em; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin: 0 0 0.4em; }
.reveal .eyebrow::before { content: ""; display: inline-block; width: 0.5em; height: 0.5em; border-radius: 50%; background: var(--red); margin-right: 0.6em; vertical-align: middle; }

.reveal .slide-h { font-size: 1.7em; margin: 0 0 0.5em; }
.reveal .lead { font-family: var(--serif); font-size: 1em; color: var(--navy-2); max-width: 26ch; }

.reveal .bullets { list-style: none; margin: 0.6em 0 0; padding: 0; }
.reveal .bullets li { position: relative; padding-left: 1.4em; margin: 0.5em 0; font-size: 0.82em; color: var(--navy-2); }
.reveal .bullets li::before { content: "\2713"; position: absolute; left: 0; color: var(--red); font-weight: 700; }

.reveal .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2em; align-items: start; }

.reveal .pill { display: inline-block; padding: 0.15em 0.7em; border-radius: 999px; background: var(--red); color: #fff; font-size: 0.5em; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; vertical-align: middle; }
.reveal .mono { font-family: ui-monospace, Menlo, monospace; font-size: 0.72em; background: var(--panel); border: 1px solid var(--line); padding: 0.1em 0.4em; border-radius: 4px; color: var(--navy); }

.reveal .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8em; margin-top: 0.6em; }
.reveal .stat { background: var(--panel); border: 1px solid var(--line); border-top: 4px solid var(--red); padding: 0.7em 0.8em; }
.reveal .stat .num { font-family: var(--serif); font-size: 1.8em; font-weight: 700; color: var(--navy); line-height: 1; }
.reveal .stat .lbl { font-size: 0.5em; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 0.4em; }

/* Title slide gets a full navy background instead of white. */
.reveal section[data-slide="title"] { padding-left: 0.4em; }
.reveal .slide-navy { color: #fff; }

.reveal a { color: var(--red); }
.reveal .slides section .fragment.visible { }
```

- [ ] **Step 2: Give the title slide a navy background**

Update the Slide 1 opening tag (from Task 1) to add a background color attribute. Change:

```html
    <section data-slide="title">
```
to:
```html
    <section data-slide="title" data-background-color="#001E62" class="slide-navy">
```

And because the title text must now read on navy, add these rules to the end of the `<style>` block:

```css
.reveal section.slide-navy h1,
.reveal section.slide-navy .deck-title { color: #fff; }
.reveal section.slide-navy .deck-sub { color: rgba(255,255,255,0.8); }
.reveal section.slide-navy .deck-foot,
.reveal section.slide-navy .eyebrow { color: rgba(255,255,255,0.65); }
.reveal section.slide-navy .deck-title em { color: #ff8099; }
```

- [ ] **Step 3: Verify in browser**

Run: `open /Users/olgaberezina/Projects/UIC-LTI-Catalog/slides/index.html`
Expected: Title slide now has a navy background with white serif title and a red dot before the eyebrow. Fonts are Source Serif 4 (title) and Source Sans 3 (eyebrow/footer).

- [ ] **Step 4: Commit**

```bash
cd /Users/olgaberezina/Projects/UIC-LTI-Catalog
git add slides/index.html
git commit -m "Add UIC brand theme to presentation deck"
```

---

