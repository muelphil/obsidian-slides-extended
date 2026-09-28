# ✨ Add server-side per-slide variables

Labels: `type: enhancement`

## 🔖 Feature description

Slide templates and CSS need access to presentation-aware state, not only
frontmatter values. In particular, templates need slide numbers and the
current heading hierarchy so layouts can render section labels, breadcrumbs,
and custom counters without browser-side scripts.

I would like each parsed slide to expose:

- Template variables: `<% slideNumber %>`, `<% slidesTotal %>`,
  `<% slideNumberH %>`, `<% slideNumberV %>`, `<% slideNumberC %>`,
  `<% slideNumberT %>`, and `<% h1 %>` through `<% h6 %>`.
- Slide-local CSS variables: `--slide-number`, `--slides-total`,
  `--slide-number-c`, `--slide-number-t`, `--slide-number-h`,
  `--slide-number-v`, and `--h1` through `--h6`.

Heading values should inherit from preceding slides. A same-level or
higher-level heading replaces the previous context and clears lower heading
levels; the last same-level heading on a slide wins. Template values render
inline Markdown as HTML, while CSS values use CSS-safe plain text.

## ✔️ Solution

Add an extensible post-template slide-processing pipeline before Reveal HTML
conversion. It should parse the deck’s horizontal and vertical slides, let
modular processors set per-slide variables, and serialize CSS values through
the existing slide-comment annotation path.

Implement built-in slide-number and heading-context processors. Resolve
template variables from the computed slide context, preserve configured
frontmatter variables on ordinary slides, and remove the old browser-side
global CSS variable script.

## ❓ Alternatives

Keep calculating variables in `TemplateProcessor` and update CSS values in a
Reveal browser script. This couples deck-level state to template expansion,
cannot cleanly provide heading inheritance, and leaves CSS state global rather
than static on individual slides.

## 📝 Additional Context

The implementation must preserve protected fenced code, existing slide
annotations, notes, separators, and template behavior. Heading CSS values are
single-quoted CSS strings, for example:

```html
<!-- .slide: style="--h1: 'Quarterly Results'" -->
```
