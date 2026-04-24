/**
 * Helmholtz AI Reveal.js Plugin
 *
 * Two responsibilities:
 *
 * 1. preprocessMarkdown(text)
 *    Called before Reveal.js parses the markdown file.  Converts per-slide
 *    YAML front matter blocks into <!-- .slide: data-... --> attributes and
 *    generates the appropriate HTML structure for each layout type:
 *
 *      layout: title-dark | title-light  →  full title slide HTML
 *      layout: section                   →  section-slide class + heading class
 *      layout: image-side                →  slide-image-fill class + data attrs
 *
 *    Slide separator assumed: "\n\n---\n\n"  (blank line before and after ---)
 *
 *    YAML front matter format (no blank line between opening/closing ---):
 *
 *      ---
 *      layout: title-dark
 *      bg: generic.avif
 *      title: My Presentation
 *      subtitle: Subtitle text
 *      font-size: 36px          # optional: overrides the global font size for this slide
 *      ---
 *
 *    author / institution / date are NOT written per-slide in slides.md; they
 *    come from the defaults object passed to preprocessMarkdown() (index.html).
 *    A slide-level author / institution / date can still override the global
 *    value if needed.
 *
 *      ---
 *      layout: image-side
 *      image: path/to/figure.png
 *      image-position: right      # left | right  (default: right)
 *      image-height: 70%          # CSS height applied to the <img> (default: CSS 94%)
 *      caption: Optional caption  # shown below the image
 *      font-size: 36px            # optional: per-slide font size override
 *      ---
 *      ## Slide Title
 *      Markdown content goes here into the text column.
 *
 * 2. init(deck)
 *    Post-processes the rendered DOM:
 *      a) Transforms sections with data-layout="image-side" into a two-column
 *         flex layout (text column + image column) before header/footer injection.
 *      b) Injects the branded header (logo + page number) and footer banner
 *         into every non-title section.
 *      c) Applies global fontSize (metadata.fontSize) to the .reveal element
 *         and per-slide font sizes (data-font-size attribute) to individual sections.
 *
 * Usage in index.html
 * -------------------
 *   const metadata = {
 *     author: 'Name', institution: 'Institute',
 *     shortTitle: 'Title', date: 'YYYY-MM-DD',
 *     // fontSize: '38px',  // optional: override the default 43 px for all slides
 *   };
 *   fetch('slides.md')
 *     .then(r => r.text())
 *     .then(md => {
 *       document.getElementById('slides-content').textContent =
 *         HelmholtzAIPlugin.preprocessMarkdown(md, metadata);
 *       Reveal.initialize({ metadata, plugins: [RevealMarkdown, HelmholtzAIPlugin, …] });
 *     });
 */

const HelmholtzAIPlugin = (() => {

  /* -------------------------------------------------------------------------
     Asset path helper – resolves paths relative to this plugin script's URL
     --------------------------------------------------------------------- */
  function _base() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src && s.src.includes('helmholtz-ai-plugin')) {
        return s.src.substring(0, s.src.lastIndexOf('/js/') + 1);
      }
    }
    return 'shared/reveal-template/';
  }

  /* -------------------------------------------------------------------------
     Footer label text  (author | shortTitle | date)
     --------------------------------------------------------------------- */
  function _footerLabel(cfg) {
    const parts = [];
    if (cfg.author)     parts.push(cfg.author);
    if (cfg.shortTitle) parts.push(cfg.shortTitle);
    if (cfg.date)       parts.push(cfg.date);
    return parts.join('\u2002|\u2002');
  }

  /* =========================================================================
     MARKDOWN PREPROCESSING
     ========================================================================= */

  /**
   * Parse YAML front matter at the start of a slide text block.
   * Returns { meta: {key:value, …}, content: 'remaining markdown' } or null.
   *
   * Recognised format:
   *   ---
   *   key: value
   *   key-with-dashes: "quoted value"
   *   ---
   *   (rest of slide content)
   */
  function _parseFrontMatter(slideText) {
    const match = slideText.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return null;

    const meta = {};
    for (const line of match[1].split('\n')) {
      // Match "key: value" — key may contain hyphens, value stops at trailing space
      const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):\s*(.+?)\s*$/);
      if (!m) continue;
      let val = m[2];
      // Strip optional surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[m[1].trim()] = val;
    }
    return { meta, content: match[2] || '' };
  }

  /** Render a subset of inline Markdown to HTML (links, bold, italic). */
  function _renderInlineMarkdown(text) {
    return text
      // Escape raw HTML to prevent injection
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // [text](url) → <a href="url" target="_blank">text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // *italic*
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  /** title-dark / title-light slides */
  function _transformTitle(meta, content, defaults) {
    // Slide-level YAML overrides global defaults for author / institution / date
    const resolved = Object.assign({}, defaults, meta);

    const cls    = resolved.layout === 'title-light' ? 'title-light' : 'title-dark';
    const bgFile = resolved.bg || 'generic.avif';
    // Use bg as-is if it already looks like a path; otherwise resolve to titles dir
    const bgPath = (bgFile.includes('/') || bgFile.startsWith('.') || bgFile.startsWith('http'))
      ? bgFile
      : `${_base()}img/titles/${bgFile}`;

    const brand = cls === 'title-dark'
      ? '<div class="title-brand">Helmholtz AI</div>'
      : '';
    const instDate = [resolved.institution, resolved.date].filter(Boolean).join('\u2002/\u2002');

    const fontSizeAttr = resolved['font-size'] ? ` data-font-size="${resolved['font-size']}"` : '';

    return (
      `<!-- .slide: class="title-slide ${cls}" data-background-image="${bgPath}" data-background-size="cover"${fontSizeAttr} -->\n` +
      `<div class="title-content">\n` +
      `  ${brand}\n` +
      `  <h2 class="title-main">${resolved.title || ''}</h2>\n` +
      `  <p class="subtitle">${resolved.subtitle || ''}</p>\n` +
      `  <div class="title-meta">${resolved.author || ''}${instDate ? '<br>' + instDate : ''}</div>\n` +
      `</div>\n` +
      content
    );
  }

  /** layout: section */
  function _transformSection(meta, content) {
    // Append <!-- .element: class="section-title" --> after the first heading
    const modContent = content.replace(
      /^(#{1,6} .+?)$/m,
      '$1\n<!-- .element: class="section-title" -->'
    );
    const fontSizeAttr = meta['font-size'] ? ` data-font-size="${meta['font-size']}"` : '';
    return `<!-- .slide: class="section-slide"${fontSizeAttr} -->\n\n${modContent}`;
  }

  /**
   * layout: image-side
   * Stores image config as data-* attributes; the actual DOM transformation
   * happens in init() after Reveal's markdown plugin has rendered the content.
   */
  function _transformImageSide(meta, content) {
    const pos     = meta['image-position'] || 'right';
    const imgSrc  = meta.image || '';
    const imgH    = meta['image-height'] || '';
    const caption = meta.caption || '';

    const attrs = [
      `data-layout="image-side"`,
      `data-image="${imgSrc}"`,
      `data-image-position="${pos}"`,
      imgH    ? `data-image-height="${imgH}"` : '',
      caption ? `data-caption="${caption}"`   : '',
      meta['font-size'] ? `data-font-size="${meta['font-size']}"` : '',
    ].filter(Boolean).join(' ');

    return `<!-- .slide: class="slide-image-fill" ${attrs} -->\n\n${content}`;
  }

  /** Dispatch one slide block through the appropriate transformer. */
  function _transformSlide(slideText, defaults) {
    const parsed = _parseFrontMatter(slideText);
    if (!parsed) return slideText;

    const { meta, content } = parsed;
    switch (meta.layout) {
      case 'title-dark':
      case 'title-light': return _transformTitle(meta, content, defaults);
      case 'section':     return _transformSection(meta, content);
      case 'image-side':  return _transformImageSide(meta, content);
      default: {
        // Unknown layout: convert all YAML keys to data-* attributes
        const attrs = Object.entries(meta)
          .map(([k, v]) => `data-${k}="${v}"`)
          .join(' ');
        return attrs ? `<!-- .slide: ${attrs} -->\n\n${content}` : content;
      }
    }
  }

  /* =========================================================================
     COLOR SHADE INJECTION
     Mirrors LaTeX \colorlet{hgfblue10}{hgfblue!10!white} etc. from
     beamercolorthemehelmholtzai.sty.  Two loops — one over colour names,
     one over shade steps (10–100) — set CSS custom properties on :root:
       --hzai-blue-10  →  color-mix(in hsl, var(--hzai-blue) 10%, white 90%)
     Values are stored verbatim; nested var() references resolve at paint time.
     ========================================================================= */
  (function _injectColorShades() {
    const colors = [
      'darkblue', 'blue', 'lightblue', 'gray', 'green', 'mint',
      'highlight', 'matter', 'aerospace', 'earth', 'energy',
      'health', 'information',
    ];
    const root = document.documentElement;
    for (const color of colors) {
      for (const shade of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
        root.style.setProperty(
          `--hzai-${color}-${shade}`,
          `color-mix(in hsl, var(--hzai-${color}) ${shade}%, white ${100 - shade}%)`
        );
      }
    }
  })();

  /* =========================================================================
     FOOTER SVG  –  background shapes from reference/footer.svg
     viewBox "0 0 461 13.091" — preserveAspectRatio="none" stretches width.
     ========================================================================= */
  const FOOTER_SVG = `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 461 13.091"
    preserveAspectRatio="none"
    width="100%" height="100%"
    aria-hidden="true"
    style="display:block;position:absolute;inset:0;">
    <path d="M460.095,13.091l0,-10.909l-181.417,0l-6.546,6.546l-272.132,0l0,4.364l460.095,0Z"
          fill="#002864" fill-rule="nonzero"/>
    <path d="M460.095,13.091l0,-13.091l-113.387,0l-6.546,6.546l-340.162,0l0,6.546l460.095,-0Z"
          fill="#14c8ff" fill-rule="nonzero"/>
  </svg>`;

  /* =========================================================================
     PLUGIN EXPORT
     ========================================================================= */
  return {
    id: 'helmholtz-ai',

    /* -----------------------------------------------------------------------
       preprocessMarkdown(text, defaults)
       Transform YAML front matter blocks in the raw markdown string.
       Must be called before Reveal.initialize() — see index.html.
       Separator: "\n\n---\n\n"  (blank line on both sides of ---)

       defaults – object with presentation-level metadata (author, institution,
                  date, …) read from the Reveal.initialize() metadata block.
                  Individual slides may override any key in their own YAML.
       ----------------------------------------------------------------------- */
    preprocessMarkdown(text, defaults = {}) {
      // Normalise Windows line endings
      const normalised = text.replace(/\r\n/g, '\n');
      const SEP = '\n\n---\n\n';
      return normalised.split(SEP).map(slide => _transformSlide(slide, defaults)).join(SEP);
    },

    /* -----------------------------------------------------------------------
       init(deck)
       Post-process the rendered DOM, then inject header/footer chrome.
       ----------------------------------------------------------------------- */
    init(deck) {
      const userCfg = deck.getConfig().metadata || {};
      const cfg = {
        author:     userCfg.author     || '',
        shortTitle: userCfg.shortTitle || '',
        date:       userCfg.date       || '',
        fontSize:   userCfg.fontSize   || '',
      };

      // Apply global font-size override to the .reveal element
      if (cfg.fontSize) {
        deck.getRevealElement().style.fontSize = cfg.fontSize;
      }

      const base          = _base();
      const logoSrc       = base + 'img/helmholtzai-logo-2-lines.svg';
      const footerLogoSrc = base + 'img/helmholtzai-logo-white.svg';
      const footerLabel   = _footerLabel(cfg);
      const allSlides     = deck.getSlides();

      /* ── Step 0: parse-markdown attribute ───────────────────────────────
         Elements with [parse-markdown] have their text content parsed as
         markdown and replaced with the resulting HTML.  This lets authors
         write markdown inside HTML containers in slides.md.
         ─────────────────────────────────────────────────────────────────── */
      const mdPlugin = deck.getPlugin('markdown');
      if (mdPlugin && mdPlugin.marked) {
        document.querySelectorAll('[parse-markdown]').forEach(el => {
          const lines = el.textContent.split('\n');
          const nonEmpty = lines.filter(l => l.trim().length > 0);
          if (!nonEmpty.length) return;
          const minIndent = nonEmpty.reduce((min, l) =>
            Math.min(min, l.match(/^(\s*)/)[1].length), Infinity);
          const dedented = lines.map(l => l.slice(minIndent)).join('\n').trim();
          el.innerHTML = mdPlugin.marked(dedented);
          el.removeAttribute('parse-markdown');
        });
      }

      /* ── Step 1: build image-side column layout ─────────────────────────── */
      allSlides.forEach(section => {
        if (section.dataset.layout !== 'image-side') return;

        const imgSrc  = section.dataset.image         || '';
        const pos     = section.dataset.imagePosition || 'right';
        const imgH    = section.dataset.imageHeight   || '';   // empty = CSS default (94%)
        const caption = section.dataset.caption       || '';

        // Keep the <h2> as the slide title; collect everything else
        const h2 = section.querySelector(':scope > h2');
        const contentNodes = Array.from(section.childNodes).filter(n => {
          if (n === h2) return false;
          if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) return false;
          return true;
        });
        contentNodes.forEach(n => section.removeChild(n));

        // Text column
        const textCol = document.createElement('div');
        textCol.className = 'column';
        contentNodes.forEach(n => textCol.appendChild(n));

        // Image column
        const imgCol = document.createElement('div');
        imgCol.className = 'column image-col';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = caption || 'Figure';
        if (imgH) img.style.height = imgH;  // overrides CSS default of 94%
        imgCol.appendChild(img);
        if (caption) {
          const p = document.createElement('p');
          p.className = 'source';
          p.innerHTML = _renderInlineMarkdown(caption);
          imgCol.appendChild(p);
        }

        // Columns container — DOM order determines visual left/right
        const colClass = pos === 'left' ? 'col-image-left' : 'col-image-right';
        const columnsDiv = document.createElement('div');
        columnsDiv.className = `columns ${colClass}`;
        if (pos === 'left') {
          columnsDiv.appendChild(imgCol);
          columnsDiv.appendChild(textCol);
        } else {
          columnsDiv.appendChild(textCol);
          columnsDiv.appendChild(imgCol);
        }
        section.appendChild(columnsDiv);
      });

      /* ── Step 2: page counter ───────────────────────────────────────────── */
      let totalPages = 0;
      allSlides.forEach(s => {
        if (!s.classList.contains('title-slide') && s.dataset.template !== 'title')
          totalPages++;
      });

      /* ── Step 3: header + footer injection ──────────────────────────────── */
      let pageIdx = 0;
      allSlides.forEach(section => {
        // Apply per-slide font size via CSS variable (CSS rule targets non-h2 children)
        if (section.dataset.fontSize) {
          section.style.setProperty('--slide-font-size', section.dataset.fontSize);
        }

        const isTitle = section.classList.contains('title-slide') ||
                        section.dataset.template === 'title';
        if (isTitle) return;

        pageIdx++;
        const pageStr = `${pageIdx}\u2002/\u2002${totalPages}`;

        /* Header */
        const header = document.createElement('div');
        header.className = 'hzai-header';
        header.setAttribute('aria-hidden', 'true');
        header.innerHTML = `
          <img class="hzai-header-logo" src="${logoSrc}" alt="Helmholtz AI">
          <span class="hzai-page-number">${pageStr}</span>`;
        section.appendChild(header);

        /* Footer */
        const footer = document.createElement('div');
        footer.className = 'hzai-footer';
        footer.setAttribute('aria-hidden', 'true');
        footer.innerHTML = FOOTER_SVG;

        const leftStrip = document.createElement('div');
        leftStrip.className = 'hzai-footer-strip-left';
        if (footerLabel) {
          const txt = document.createElement('span');
          txt.className = 'hzai-footer-text';
          txt.textContent = footerLabel;
          leftStrip.appendChild(txt);
        }
        footer.appendChild(leftStrip);

        const rightStrip = document.createElement('div');
        rightStrip.className = 'hzai-footer-strip-right';
        const footerLogo = document.createElement('img');
        footerLogo.className = 'hzai-footer-logo';
        footerLogo.src = footerLogoSrc;
        footerLogo.alt = 'Helmholtz AI';
        rightStrip.appendChild(footerLogo);
        footer.appendChild(rightStrip);

        section.appendChild(footer);
      });
    },
  };

})();

// CommonJS / bundler compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelmholtzAIPlugin;
}
