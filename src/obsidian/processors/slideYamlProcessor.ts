import * as yaml from "js-yaml";
import type { Options, Processor } from "src/@types";
import { CommentParser } from "src/obsidian/comment";

/**
 * Processes fenced ```yaml blocks at the very start of a slide.
 *
 * Usage — place a yaml code fence as the FIRST content of a slide
 * (optionally after an existing `<!-- .slide: ... -->` comment):
 *
 * ```yaml
 * layout: title-dark
 * bg: hero.avif
 * font-size: 32px
 * class: my-class
 * ```
 *
 * Each key is mapped to a `<!-- .slide: ... -->` attribute:
 *   - `bg`        → `data-background-image`
 *   - `class`     → `class="..."` attribute
 *   - `font-size` → `data-font-size`
 *   - other keys  → `data-{key}`
 *
 * Any existing `<!-- .slide: ... -->` comment in the slide is merged so that
 * pre-existing attributes are preserved and YAML values are added on top.
 */
export class SlideYamlProcessor implements Processor {
    // Matches a ```yaml fence that is either:
    //   (a) at the very start of the slide (optional leading whitespace), OR
    //   (b) immediately after an opening <!-- .slide: ... --> comment.
    private yamlFenceRegex =
        /^(\s*<!--.*?-->\s*\n)?\s*```yaml\s*\n([\s\S]*?)```\s*(\n|$)/s;

    private slideCommentRegex = /<!--\s*(?:\.)?slide.*?-->/s;

    private parser = new CommentParser();

    process(markdown: string, options: Options): string {
        const sep = new RegExp(options.separator, "gmi");
        const vSep = new RegExp(options.verticalSeparator, "gmi");

        const horizontalGroups = markdown.split(sep);
        const separatorMatches = [...markdown.matchAll(sep)].map((m) => m[0]);

        const processedGroups = horizontalGroups.map((group) => {
            const verticalSlides = group.split(vSep);
            const vSeparatorMatches = [...group.matchAll(vSep)].map(
                (m) => m[0],
            );

            const processedVertical = verticalSlides.map((slide) =>
                this.transformSlide(slide),
            );

            return processedVertical
                .map((slide, i) =>
                    i < vSeparatorMatches.length
                        ? slide + vSeparatorMatches[i]
                        : slide,
                )
                .join("");
        });

        return processedGroups
            .map((group, i) =>
                i < separatorMatches.length
                    ? group + separatorMatches[i]
                    : group,
            )
            .join("");
    }

    transformSlide(slide: string): string {
        const fenceMatch = this.yamlFenceRegex.exec(slide);
        if (!fenceMatch) {
            return slide;
        }

        const yamlText = fenceMatch[2];
        let parsed: Record<string, unknown>;

        try {
            parsed = yaml.load(yamlText) as Record<string, unknown>;
        } catch (_e) {
            // Invalid YAML — leave the slide untouched.
            return slide;
        }

        if (!parsed || typeof parsed !== "object") {
            return slide;
        }

        // Remove the fenced block (and any optional preceding comment) from the slide.
        const slideWithoutFence = slide.replace(this.yamlFenceRegex, "");

        // Collect existing data-* attributes from a preceding comment (if any).
        const existingAttrs = this.extractExistingAttrs(fenceMatch[1] ?? "");

        // Apply YAML properties on top of existing attributes.
        const classes: string[] = existingAttrs.classes;
        const attrs: Map<string, string> = existingAttrs.attrs;

        for (const [key, val] of Object.entries(parsed)) {
            const value = String(val);

            if (key === "class") {
                classes.push(value);
            } else if (key === "bg") {
                attrs.set("data-background-image", value);
            } else if (key === "font-size") {
                attrs.set("data-font-size", value);
            } else if (key.startsWith("data-")) {
                attrs.set(key, value);
            } else {
                attrs.set(`data-${key}`, value);
            }
        }

        if (classes.length > 0) {
            attrs.set("class", classes.join(" "));
        }

        const attrStr = [...attrs.entries()]
            .map(([k, v]) => `${k}="${v}"`)
            .join(" ");

        const slideComment = `<!-- .slide: ${attrStr} -->`;

        // If the slide still has a comment after fence removal, replace it;
        // otherwise prepend.
        if (this.slideCommentRegex.test(slideWithoutFence)) {
            return slideWithoutFence.replace(
                this.slideCommentRegex,
                slideComment,
            );
        }
        return `${slideComment}\n${slideWithoutFence}`;
    }

    private extractExistingAttrs(commentStr: string): {
        attrs: Map<string, string>;
        classes: string[];
    } {
        const attrs = new Map<string, string>();
        const classes: string[] = [];

        if (!commentStr || !this.slideCommentRegex.test(commentStr)) {
            return { attrs, classes };
        }

        const comment = this.parser.parseLine(commentStr.trim());
        if (!comment) {
            return { attrs, classes };
        }

        // Use CommentParser's buildAttributes to get the serialised attribute
        // string, then re-parse it into key/value pairs.
        const attrString = this.parser.buildAttributes(comment);
        const attrRegex = /(\S+)="([^"]*)"/g;
        let m: RegExpExecArray | null;

        while ((m = attrRegex.exec(attrString)) !== null) {
            const [, key, value] = m;
            if (key === "class") {
                classes.push(...value.split(" ").filter(Boolean));
            } else {
                attrs.set(key, value);
            }
        }

        return { attrs, classes };
    }
}
