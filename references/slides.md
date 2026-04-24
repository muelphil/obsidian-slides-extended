---
layout: title-dark
bg: generic.avif
title: Super Awesome Project Title
subtitle: Subtitle
---

Note:
Welcome to the Helmholtz AI Reveal.js demo presentation.
Press **S** to open the speaker notes window.

---

---
layout: title-light
bg: aeronautics-space-transport.avif
title: Super Awesome Project Title
subtitle: Subtitle
---

Note:
Alternative title slide using a light-coloured photograph as the background.
The `title-brand` div is omitted on this variant — the logo in the photo itself acts as branding.

---

---
font-size: 30px
---
## Usage

1. Download all files from GitHub
2. Include in your presentation:
   - `<link>` the CSS in `<head>`
   - `<script>` the plugin before `Reveal.initialize()`
3. Fetch and preprocess `slides.md`, then call `Reveal.initialize()`:

   ```javascript
   const metadata = {
     author: 'Name', institution: 'Institute',
     shortTitle: 'Title', date: 'YYYY-MM-DD',
     // fontSize: '38px',   // optional global font-size override
   };
   fetch('slides.md')
     .then(r => r.text())
     .then(md => {
       document.getElementById('slides-content').textContent =
         HelmholtzAIPlugin.preprocessMarkdown(md, metadata);
       Reveal.initialize({
         metadata,
         plugins: [ RevealMarkdown, HelmholtzAIPlugin, RevealHighlight ],
       });
     });
   ```

Note:
Walk the audience through the three setup steps.
The code block shows the minimal configuration needed.
All slides after this point demonstrate individual template features.

---

## Main Slide Title

<p class="subtitle">Subtitle with more details</p>

- Standard bullet **point** can be created with ordinary Markdown
- They can have multiple sub-points
  - As can be seen here
    - Or here
  - The ordering is unimportant

Note:
Standard content slide demonstrating subtitle text and nested unordered lists.
Bullet nesting is unlimited — keep it to three levels for readability.

---

## Equations

Reveal.js supports LaTeX equations via MathJax or KaTeX.
Enable MathJax3 by adding `RevealMath.MathJax3` to the plugins array (see README).

$$f(x) = \sum_i w x_i^2 + \frac{\beta}{2}$$

Inline math also works: the softmax is
<span>$\sigma(\mathbf{z})_j = \dfrac{e^{z_j}}{\sum_k e^{z_k}}$</span>

Note:
MathJax3 renders both display-mode ($$...$$) and inline ($...$) LaTeX.
Inline math is wrapped in a <span> to prevent the Markdown parser from
interpreting underscores as italic markers.

---

---
layout: image-side
image: example_image.png
image-position: right
image-height: 70%
caption: "Example Image — Till Korten [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)"
---

## Columns and Figures

1. The right column is sized to fit the image at full height — no overflow
2. The left column fills the remaining width automatically
3. Change `image-position: left` to flip the layout
4. Omit `image-height` to use the full available column height

Note:
Two-column layout configured entirely through the slide's YAML front matter.
The Markdown content in this slide automatically becomes the text column.
Replace `image:` with any path relative to index.html.

---

## Source Code

```python
import numpy as np

def foo(a: float, b: float) -> float:
    """Add two numbers and return the result plus one."""
    return a + b + 1

result = foo(np.pi, np.e)
print(f"Result: {result:.4f}")
```

Syntax highlighting uses Reveal.js's **Highlight** plugin
(Monokai theme by default — swap the CSS link for another theme).

Note:
Code blocks use standard fenced Markdown syntax: triple backticks followed
by the language name. Reveal's Highlight plugin handles syntax colouring.

---

## Blocks

<div class="block">
  <div class="block-title">block</div>
  <div class="block-body">This is how a regular block looks like.</div>
</div>

<div class="vspace-md"></div>

<div class="block-example">
  <div class="block-example-title">exampleblock</div>
  <div class="block-example-body">An example block is styled differently.</div>
</div>

<div class="vspace-md"></div>

<div class="block-alert">
  <div class="block-alert-title">alertblock</div>
  <div class="block-alert-body">Alert blocks can draw attention to critical information.</div>
</div>

Note:
Three block types matching the LaTeX beamer `block`, `exampleblock`,
and `alertblock` environments. Use `.vspace-md` divs for vertical spacing.

---

## Colors

<p class="subtitle">CSS Custom Properties</p>

<p style="font-size:0.5em; margin:0 0 6px; font-weight:bold;">Core Palette</p>
<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; font-size:0.55em; margin-bottom:10px;">
  <div style="background:var(--hzai-darkblue); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-darkblue</code></div>
  <div style="background:var(--hzai-blue); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-blue</code></div>
  <div style="background:var(--hzai-lightblue); color:var(--hzai-darkblue); padding:12px 8px; border-radius:3px;"><code>--hzai-lightblue</code></div>
  <div style="background:var(--hzai-gray); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-gray</code></div>
  <div style="background:var(--hzai-green); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-green</code></div>
  <div style="background:var(--hzai-mint); color:var(--hzai-darkblue); padding:12px 8px; border-radius:3px;"><code>--hzai-mint</code></div>
  <div style="background:var(--hzai-highlight); color:var(--hzai-darkblue); padding:12px 8px; border-radius:3px;"><code>--hzai-highlight</code></div>
  <div style="background:var(--hzai-matter); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-matter</code></div>
</div>

<p style="font-size:0.5em; margin:0 0 6px; font-weight:bold;">Research Fields</p>
<div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px; font-size:0.55em;">
  <div style="background:var(--hzai-aerospace); color:var(--hzai-darkblue); padding:12px 8px; border-radius:3px;"><code>--hzai-aerospace</code></div>
  <div style="background:var(--hzai-earth); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-earth</code></div>
  <div style="background:var(--hzai-energy); color:var(--hzai-darkblue); padding:12px 8px; border-radius:3px;"><code>--hzai-energy</code></div>
  <div style="background:var(--hzai-health); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-health</code></div>
  <div style="background:var(--hzai-information); color:#fff; padding:12px 8px; border-radius:3px;"><code>--hzai-information</code></div>
</div>

Note:
All 13 palette colours exposed as CSS custom properties — use var(--hzai-blue) etc.
in your own styles; never hard-code hex values.
Each colour also has 10 tint shades: --hzai-blue-10 through --hzai-blue-100.
See the next slide for the colour-shades showcase.

---

## Color Shades

<p class="subtitle">Tints via <code>color-mix</code> – example: <code>--hzai-blue</code></p>

<div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:0.58em; margin-top:8px;">
  <div style="background:var(--hzai-blue-10); color:var(--hzai-darkblue); padding:12px 10px; border-radius:3px;"><code>--hzai-blue-10</code></div>
  <div style="background:var(--hzai-blue-60); color:#fff; padding:12px 10px; border-radius:3px;"><code>--hzai-blue-60</code></div>
  <div style="background:var(--hzai-blue-20); color:var(--hzai-darkblue); padding:12px 10px; border-radius:3px;"><code>--hzai-blue-20</code></div>
  <div style="background:var(--hzai-blue-70); color:#fff; padding:12px 10px; border-radius:3px;"><code>--hzai-blue-70</code></div>
  <div style="background:var(--hzai-blue-30); color:var(--hzai-darkblue); padding:12px 10px; border-radius:3px;"><code>--hzai-blue-30</code></div>
  <div style="background:var(--hzai-blue-80); color:#fff; padding:12px 10px; border-radius:3px;"><code>--hzai-blue-80</code></div>
  <div style="background:var(--hzai-blue-40); color:var(--hzai-darkblue); padding:12px 10px; border-radius:3px;"><code>--hzai-blue-40</code></div>
  <div style="background:var(--hzai-blue-90); color:#fff; padding:12px 10px; border-radius:3px;"><code>--hzai-blue-90</code></div>
  <div style="background:var(--hzai-blue-50); color:var(--hzai-darkblue); padding:12px 10px; border-radius:3px;"><code>--hzai-blue-50</code></div>
  <div style="background:var(--hzai-blue-100); color:#fff; padding:12px 10px; border-radius:3px;"><code>--hzai-blue-100</code></div>
</div>

<p style="font-size:0.45em; margin-top:12px; color:var(--hzai-gray);">The plugin generates shades for all 13 palette colors at script load via two loops (colors × steps 10–100), setting <code>color-mix(in hsl, var(--hzai-&lt;name&gt;) N%, white (100−N)%)</code> on <code>:root</code> — mirroring LaTeX's <code>\colorlet{hgfblue10}{hgfblue!10!white}</code>. Use e.g. <code>var(--hzai-health-30)</code> or <code>var(--hzai-energy-70)</code> in any inline style or CSS rule.</p>

Note:
Each of the 13 palette colours has 10 tints (10–100) auto-generated by
_injectColorShades() in helmholtz-ai-plugin.js at script-load time.
color-mix(in hsl, var(--hzai-NAME) N%, white (100-N)%) mirrors
the LaTeX \colorlet{hgfblueN}{hgfblue!N!white} definitions.

---

## URLs, Fonts & Collaborators

- Raw links: <https://helmholtz.ai>
- Named links: [Helmholtz AI](https://helmholtz.ai)
- Hermann Bold: <span class="hermann">Hermann Bold – Helmholtz's display font</span>
- Halvar Mittel: standard body text, **bold**, *italic*, ***bold-italic***
- Monospace: `TexGyreCursor – code font`

<div class="reference">
  Foo et al., "Bar and its theories", 42, HAICON 24.
</div>

<div class="collaborators">
  <!-- Replace with actual partner logos -->
  <img src="shared/reveal-template/img/helmholtzai-logo-2-lines.svg" alt="Helmholtz AI" />
</div>

Note:
Typography and link showcase.
The `.reference` div pins a citation above the footer (bottom-left).
The `.collaborators` div places partner logos above the footer (bottom-right).

---

---
layout: section
---

## Sections Look Like This

Note:
Section divider slides use `layout: section` in the YAML front matter.
In the preprocessed output this becomes `class="section-slide"` on the section,
and `class="section-title"` on the heading.

---

## After the Section Divider

<div class="highlight-box">
  <strong>Tip:</strong> Use <code>layout: section</code> in the slide's YAML
  front matter to create a divider slide with the same look as the LaTeX
  <code>\section{}</code> command.
</div>

- Section slides show the header / footer overlay just like content slides
- The section title uses the same Hermann Bold display font
- Decorative chevron accent appears in the corner

Note:
First content slide after a section divider.
Page numbering continues uninterrupted across section breaks.

---

---
layout: title-light
bg: energy.avif
title: Energy Research Title
subtitle: A subtitle for the energy research field
---

Note:
Title slide variant using the energy research field background image.
Any image from `shared/reveal-template/img/titles/` can be used here.
