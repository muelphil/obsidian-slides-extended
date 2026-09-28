# Add server-side per-slide variables

## Summary

Adds an extensible, server-side post-template slide-processing pipeline and
uses it to expose slide-number and inherited-heading variables to templates
and slide-local CSS.

## Changes

- Adds exported `SlideDeck`, `SlideGroup`, and `SlideDeckProcessor` types plus
  an injectable `SlidePostProcessor`.
- Computes slide count/total/horizontal/vertical values and injects the six
  camelCase template variables and six requested CSS variables per slide.
- Computes inherited `h1` through `h6` context, rendering inline Markdown to
  HTML for templates and serializing CSS-safe plain text as single-quoted CSS
  strings.
- Serializes generated CSS variables through existing `.slide` comments, so
  they become static styles on their Reveal sections.
- Preserves ordinary frontmatter variables on non-template slides and defers
  optional slide-context placeholders until the post-processing phase.
- Removes the renderer-injected browser script that previously set global
  slide-number variables.
- Updates feature snapshots and adds focused regression coverage.

## Validation

- `pnpm exec biome check ./src`
- `pnpm exec jest test/slidePostProcessor.unit.test.ts test/template.unit.test.ts --runInBand`
- `pnpm exec jest --testPathIgnorePatterns=assetResolver.unit.test.ts`

The complete test suite retains one known, out-of-branch Windows POSIX-path
failure in `test/assetResolver.unit.test.ts`; that unrelated fix is
intentionally not included here.

## Checklist

- [x] Added focused unit and pipeline regression tests.
- [x] Updated verified snapshots.
- [x] Kept unrelated asset-resolver changes out of this branch.
