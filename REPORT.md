# Helmholtz AI Theme Compatibility Report

## Executive Summary

Getting the Helmholtz AI template to render **identically** to the reference `index.html` is
**not fully possible in the current state of the plugin** without source-code changes.

The static assets (CSS, fonts, images, colour-shade injection) work today. However, the
two most important features of the template — (1) per-slide YAML front-matter preprocessing
(title slides, section dividers, image-side columns) and (2) the branded header/footer
injection — require the Helmholtz plugin to run as a proper Reveal.js plugin, which the
current `reveal.html` does not support for user-supplied scripts.

---

## 1. What Works Out-of-the-Box (no code change needed)

| Feature | How |
|---|---|
| Load `helmholtz-ai.css` (typography, colours, block styles) | `css: helmholtz-ai.css` in note frontmatter |
| Font files (HalvarMittel, HermannBold, TexGyreCursor) | Relative `../fonts/` paths in CSS; served directly from the vault |
| Colour-shade IIFE (`--hzai-blue-10` … `--hzai-blue-100`) | Runs automatically at `<script>` parse time; no plugin init needed |
| SVG logo and background images | Resolved via `_base()` helper in the plugin script |
| Load `helmholtz-ai-plugin.js` as a script | `scripts: helmholtz-ai-plugin.js` in frontmatter |
| Disable vertical centering | `center: false` in frontmatter |
| 16:10 slide canvas | `width: 1600` + `height: 1000` in frontmatter |
| Kill transition animation | `transition: none` in frontmatter |
| Remove progress bar | `progress: false` in frontmatter |
| Remove slide numbers | `slideNumber: false` in frontmatter |
| MathJax3 engine | `mathEngine: mathjax` in frontmatter |

---

## 2. Where to Put the Files

Set **Assets directory** in plugin settings to a vault folder, e.g. `_Templates/Reveal.js`.

```
<vault>/
└── _Templates/Reveal.js/         ← Assets directory (set in plugin settings)
    ├── css/
    │   └── helmholtz-ai.css      ← copy from references/helmholtz-template/css/
    ├── fonts/
    │   ├── HalvarMittel-Rg.otf
    │   ├── HalvarMittel-Bd.otf
    │   ├── HalvarMittel-RgSlanted.otf
    │   ├── HalvarMittel-BdSlanted.otf
    │   ├── Hermann-Bold.otf
    │   ├── TexGyreCursor-Regular.otf
    │   ├── TexGyreCursor-Bold.otf
    │   ├── TexGyreCursor-Italic.otf
    │   └── TexGyreCursor-Bold-Italic.otf
    ├── img/
    │   ├── helmholtzai-logo-2-lines.svg
    │   ├── helmholtzai-logo-white.svg
    │   ├── footer-bg.svg
    │   └── titles/
    │       ├── generic.avif
    │       └── *.avif             ← all title background images
    └── js/
        └── helmholtz-ai-plugin.js  ← copy from references/helmholtz-template/js/
```

> **Why this structure matters for `_base()`:**
> The plugin's `_base()` helper locates the base directory by finding the `<script>` tag
> whose `src` contains `helmholtz-ai-plugin`. It returns the URL prefix up to `/js/`. The
> browser then resolves logos as `<base>/img/helmholtzai-logo-2-lines.svg` and background
> images as `<base>/img/titles/<bg>`. Placing the script at `js/` and images at `img/`
> matches this expectation exactly.

**Font path compatibility:** `helmholtz-ai.css` uses `url('../fonts/...')`. Because the CSS
is served from `…/_Templates/Reveal.js/css/helmholtz-ai.css`, the relative path resolves
to `…/_Templates/Reveal.js/fonts/`, which is exactly where the fonts are placed above.

**Note: do NOT place the files in `.obsidian/plugins/slides-extended/`.** The
`helmholtz-ai-wrapper.css` file in `references/helmholtz-template/css/` was an earlier
workaround for a Windows path bug. The current code (`toExternalPath` in
`revealRenderer.ts`) correctly normalises backslashes on Windows, so the assets directory
approach works directly and you do not need the wrapper.

---

## 3. Minimal Note Frontmatter

Add the following YAML block at the top of your presentation note. It overrides the plugin
defaults that conflict with the Helmholtz template.

```yaml
---
title: My Presentation
theme: white
css: helmholtz-ai.css
scripts: helmholtz-ai-plugin.js
center: false
width: 1600
height: 1000
margin: 0
minScale: 0.1
maxScale: 3.0
progress: false
slideNumber: false
transition: none
transitionSpeed: fast
mathEngine: mathjax
separator: "\\n\\n---\\n\\n"
---
```

### Critical: `separator` override

The plugin's default separator regex `\r?\n---\r?\n` matches any `---` preceded by a
single newline. A per-slide YAML block looks like:

```
---
layout: title-dark
bg: generic.avif
---
```

The **closing** `---` is followed by a blank line, which means `\n---\n` (one newline before
and after) matches the default separator and splits the slide incorrectly mid-YAML. Using
`separator: "\\n\\n---\\n\\n"` (blank line on *both* sides of `---`) avoids this because
the YAML-closing `---` is never surrounded by two newlines on each side.

---

## 4. Issues and Bugs That Prevent Full Compatibility

### 4.1 `HelmholtzAIPlugin.preprocessMarkdown()` Is Never Called (CRITICAL)

**What it does:** Converts per-slide YAML front-matter blocks like

```markdown
---
layout: title-dark
bg: generic.avif
title: My Title
---
```

into Reveal.js `<!-- .slide: class="title-slide title-dark" data-background-image="..." -->`
syntax plus the full title-slide HTML (`<div class="title-content">…</div>`). It also
handles `layout: section`, `layout: image-side`, per-slide `font-size`, etc.

**What happens without it:** The YAML blocks render as raw Markdown text (a horizontal rule
+ plain text for each key-value pair). Title slides, section dividers, and image-side column
layouts all break completely.

**Root cause:** `revealRenderer.ts` processes the entire note server-side through the
`MarkdownProcessor` pipeline and injects the resulting HTML into `reveal.html` as
pre-split `<section data-markdown>` elements. By the time the browser runs, the markdown
has already been converted; there is no hook to call `preprocessMarkdown()` on raw text
before `Reveal.initialize()`.

### 4.2 `HelmholtzAIPlugin` Cannot Be Added to the Reveal.js Plugins Array (CRITICAL)

**What it does:** Reveal.js calls `HelmholtzAIPlugin.init(deck)` during initialisation.
`init()` is responsible for:
- Injecting the branded header (logo + page number) into every non-title section
- Injecting the footer (SVG wave + speaker info + logo) into every non-title section
- Transforming `data-layout="image-side"` sections into the two-column flex grid
- Applying per-slide `--slide-font-size` CSS variables
- Processing `[parse-markdown]` attributes

**What happens without it:** No headers, no footers, no two-column image layouts. The slides
render as plain left-aligned content without the branded chrome.

**Root cause:** The `plugins: [...]` array in `reveal.html` is hardcoded. It conditionally
includes built-in optional plugins (chalkboard, menu, pointer, etc.) via Mustache template
tags, but there is no mechanism to add user-supplied plugin variable names. Even when the
plugin script is loaded via `scripts:`, the global `HelmholtzAIPlugin` object exists but
`Reveal.initialize()` never receives it in the plugins array.

### 4.3 `deck.getPlugin('markdown')` Returns Null for ObsidianMarkdown (Minor)

The plugin replaces `RevealMarkdown` with `ObsidianMarkdown` (id: `"ObsidianMarkdown"`),
which wraps the original `RevealMarkdown`. `HelmholtzAIPlugin.init()` calls
`deck.getPlugin('markdown')` to obtain the `marked` parser for the `[parse-markdown]`
attribute feature. Since the plugin is registered as `"ObsidianMarkdown"` instead of
`"markdown"`, this call returns `null` and the `[parse-markdown]` feature silently fails.
Header/footer injection is unaffected (it does not depend on the markdown plugin).

### 4.4 `metadata` Object Cannot Be Passed to `Reveal.initialize()` (Moderate)

`HelmholtzAIPlugin.init(deck)` reads footer text (author | shortTitle | date) from
`deck.getConfig().metadata`. The plugin's `yamlParser.ts → getRevealOptions()` picks only
from an explicit allow-list of Reveal.js properties; `metadata` is not in the list.
Even if the user adds `metadata: { author: 'X', ... }` to the note's YAML frontmatter,
it will not appear in `revealOptionsStr` and therefore not reach `deck.getConfig()`.
The footer would render with blank author/title/date fields.

### 4.5 Built-in Reveal.js Theme May Conflict

The plugin always injects a theme stylesheet (`id="theme"`) before user CSS. The default
is `black.css`, which sets `--r-background-color: #191919`. The `reveal.html` inline script
reads this variable to determine `has-dark-background` / `has-light-background` on `<body>`.
With the black theme active, `has-dark-background` is set even though the Helmholtz CSS
overrides the background to `#ffffff`, causing visual inconsistencies in components that
key off body class (e.g. Reveal.js overlay effects).

**Workaround (partial):** Set `theme: white` in the frontmatter. The white theme still
injects some Reveal.js defaults, but `--r-background-color` will be `#fff` so the body
class will be `has-light-background`, which is the correct state. The Helmholtz CSS loaded
afterwards overrides the remaining white-theme defaults.

### 4.6 `defaultOptions.center = true` in `reveal.html`

`reveal.html` hardcodes `center: true` inside `defaultOptions`. The per-note `center: false`
frontmatter value is merged via `extend(defaultOptions, revealOptionsStr, queryOptions)`,
so the frontmatter **does** override it. This is not a bug, but it means `center: false`
**must** be set explicitly in every Helmholtz presentation note, or in the plugin-wide
"Center content" toggle in settings.

---

## 5. Required Code Changes to Make the Template Fully Work

### 5.1 Add `plugins` Array Support (addresses 4.2)

Allow user scripts to declare themselves as Reveal.js plugins in `reveal.html`.
One approach: add a Mustache section `{{#pluginNames}}` that emits the variable names
into the plugins array. The user would configure plugin variable names (e.g.
`pluginNames: HelmholtzAIPlugin`) in the note frontmatter.

**`reveal.html` change (conceptual):**

```js
plugins: [
    ObsidianMarkdown,
    RevealHighlight,
    // ... existing conditional plugins ...
    {{#pluginNames}}
    {{{.}}},           // ← emit user-supplied global variable names
    {{/pluginNames}}
],
```

**`yamlParser.ts` change:** Add `"pluginNames"` to the `revealProps` allow-list **or**
handle it as a template-only setting (passed through the Mustache context, not to
`revealOptionsStr`).

### 5.2 Call `preprocessMarkdown()` Before Reveal.initialize() (addresses 4.1)

This is the hardest problem because the markdown has already been pre-split into HTML
sections by the time `reveal.html` runs.

**Option A — Client-side post-processing hook (low-friction):**
Add a `beforeInit` hook placeholder in `reveal.html`. Before `Reveal.initialize(options)`
is called, run a list of user-supplied global function names:

```js
// In reveal.html, just before Reveal.initialize():
const beforeInitFns = {{{beforeInitFnsStr}}};  // JSON array of fn names
for (const name of (beforeInitFns || [])) {
    if (typeof window[name] === 'function') window[name](options);
}
Reveal.initialize(options);
```

The user would set `beforeInit: HelmholtzAIPlugin.preprocessMarkdown` … but this would
need raw markdown, not HTML. This approach requires passing the raw markdown to the
browser, which is a larger architectural change.

**Option B — Server-side Helmholtz processor (medium friction, cleanest):**
Add a `HelmholtzProcessor` to the `MarkdownProcessor` pipeline (in `processContent` or
as a separate optional phase) that runs the same logic as `HelmholtzAIPlugin.preprocessMarkdown()`:
- Splits the markdown by separator
- Detects per-slide YAML front-matter
- Converts `layout: title-dark/title-light` into `<!-- .slide: ... -->` + title HTML
- Converts `layout: section` into `<!-- .slide: class="section-slide" -->`
- Converts `layout: image-side` into `<!-- .slide: class="slide-image-fill" data-... -->`

This approach requires the processor to know it should run (opt-in via frontmatter flag,
e.g. `helmholtzPreprocess: true`).

**Option C — Custom `reveal.html` in assets directory (workaround, no plugin changes):**
The renderer searches `{assetsDir}/html/reveal.html` before falling back to the built-in
template. A custom template could inject raw markdown differently. However, `{{{slides}}}`
already contains split HTML, so raw markdown is unavailable in the template context.

### 5.3 Expose `metadata` to `Reveal.initialize()` (addresses 4.4)

Add `"metadata"` to the `revealProps` allow-list in `yamlParser.ts`:

```typescript
// In getRevealOptions():
const revealProps = [
    'width', 'height', ...,
    'metadata',   // ← add this
];
```

The user can then write:

```yaml
metadata:
  author: John Doe
  institution: Helmholtz Center ABC
  shortTitle: My Talk
  date: "2025-06-01"
```

in their note frontmatter and it will reach `deck.getConfig().metadata`.

### 5.4 Fix `deck.getPlugin('markdown')` (addresses 4.3)

In `obsidian-markdown.js`, change the plugin id from `"ObsidianMarkdown"` to `"markdown"`:

```js
// src/plugin/obsidian-markdown.js
window.ObsidianMarkdown = window.ObsidianMarkdown || {
    id: "markdown",   // ← was "ObsidianMarkdown"
    ...
};
```

This would make `deck.getPlugin('markdown')` succeed from HelmholtzAIPlugin.init(). It
also aligns ObsidianMarkdown with the standard Reveal.js plugin id that third-party plugins
expect. There is a small risk that nothing in the existing code depends on the id being
`"ObsidianMarkdown"`, but this should be verified with existing tests.

---

## 6. How `reveal.html` Conflicts with the Helmholtz Template

| `reveal.html` default | Helmholtz requirement | Override method |
|---|---|---|
| `center: true` | `center: false` | `center: false` in frontmatter ✅ |
| `transition: 'default'` | `transition: 'none'` | `transition: none` in frontmatter ✅ |
| `progress: true` | `progress: false` | `progress: false` in frontmatter ✅ |
| `width: 960, height: 700` | `width: 1600, height: 1000` | Override in frontmatter ✅ |
| Built-in theme (e.g. `black`) | No theme / white background | `theme: white` in frontmatter ⚠️ partial |
| `plugins: [ObsidianMarkdown, ...]` | `HelmholtzAIPlugin` in plugins array | Requires code change ❌ |
| No `preprocessMarkdown()` call | Needs calling before `Reveal.initialize()` | Requires code change ❌ |
| `metadata` not in `revealOptionsStr` | `deck.getConfig().metadata` needs values | Requires code change ❌ |
| `slideNumber: false` default | `slideNumber: false` (same) | ✅ no action needed |

---

## 7. Recommended Path Forward

**For immediate partial use (styling only — no headers/footers/layouts):**

1. Create the directory structure in §2.
2. Add the frontmatter from §3 to your presentation note.
3. Write slides using standard Markdown only (no per-slide YAML front-matter). You will get the correct fonts, colours, and typography, but **no branded header/footer chrome** and no title-slide / section-divider layouts.

**For full compatibility (requires plugin source changes):**

Implement changes 5.1–5.3 in priority order:

1. **5.2 Option B** — Add a server-side Helmholtz YAML preprocessor to the pipeline. This is the cleanest solution and does not require any reveal.html changes.
2. **5.1** — Add `{{#pluginNames}}` support to `reveal.html` and wire it through `yamlParser.ts`, so `HelmholtzAIPlugin.init()` is invoked by Reveal.js and injects headers/footers.
3. **5.3** — Expose `metadata` through `revealOptionsStr` so author/title/date appear in the footer.
4. **5.4** — Fix the `ObsidianMarkdown` plugin id for broader third-party compatibility.

All four changes are self-contained and do not affect the existing processor pipeline or
other presentations.
