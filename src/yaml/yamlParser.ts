import { loadFront } from "yaml-front-matter";

import type { Options, SlidesExtendedSettings } from "../@types";
import { DEFAULTS } from "../slidesExtended-constants";
import { isEmpty, isNil, omit, omitBy, pick } from "../util";

export class YamlParser {
    private settings: SlidesExtendedSettings;

    constructor(settings: SlidesExtendedSettings) {
        this.settings = settings;
    }

    getSlideOptions(options: unknown, print = false): Options {
        const globalSettings = omitBy(
            this.settings,
            (v) => isNil(v) || v === "",
        );
        const printOptions = print ? this.getPrintOptions() : {};
        return Object.assign(
            {},
            DEFAULTS,
            globalSettings,
            options,
            printOptions,
        );
    }

    private getPrintOptions() {
        return {
            enableOverview: false,
            enableChalkboard: false,
            enableMenu: false,
            enablePointer: false,
            enableCustomControls: false,
            enableTimeBar: false,
            controls: false,
        };
    }

    getSlidifyOptions(options: Partial<Options>) {
        const slidifyProps = [
            "separator",
            "verticalSeparator",
            "notesSeparator",
        ];
        return pick(options, slidifyProps);
    }

    getRevealOptions(options: Partial<Options>) {
        const revealProps = [
            "width",
            "height",
            "margin",
            "minScale",
            "maxScale",
            "controls",
            "controlsTutorial",
            "controlsLayout",
            "controlsBackArrows",
            "progress",
            "slideNumber",
            "showSlideNumber",
            "hashOneBasedIndex",
            "hash",
            "respondToHashChanges",
            "history",
            "keyboard",
            "keyboardCondition",
            "disableLayout",
            "overview",
            "center",
            "touch",
            "loop",
            "rtl",
            "navigationMode",
            "shuffle",
            "fragments",
            "fragmentInURL",
            "embedded",
            "help",
            "pause",
            "showNotes",
            "autoPlayMedia",
            "preloadIframes",
            "autoAnimate",
            "autoAnimateMatcher",
            "autoAnimateEasing",
            "autoAnimateDuration",
            "autoAnimateUnmatched",
            "autoSlide",
            "autoSlideStoppable",
            "autoSlideMethod",
            "defaultTiming",
            "mouseWheel",
            "previewLinks",
            "postMessage",
            "postMessageEvents",
            "focusBodyOnPageVisibilityChange",
            "transition",
            "transitionSpeed",
            "backgroundTransition",
            "pdfMaxPagesPerSlide",
            "pdfSeparateFragments",
            "pdfPageHeightOffset",
            "viewDistance",
            "mobileViewDistance",
            "display",
            "hideInactiveCursor",
            "hideCursorTime",
            "markdown",
            "mermaid",
        ];

        // OSE-internal keys that must NOT be forwarded to Reveal.initialize().
        const oseInternalKeys = new Set([
            "bg",
            "css",
            "remoteCSS",
            "scripts",
            "remoteScripts",
            "plugins",
            "template",
            "defaultTemplate",
            "showGrid",
            "log",
            "enableLinks",
            "enableDrop",
            "enableCustomControls",
            "enableOverview",
            "enableChalkboard",
            "enableMenu",
            "enablePointer",
            "enableTimeBar",
            "enableAudioSlideshow",
            "timeForPresentation",
            "title",
            "separator",
            "verticalSeparator",
            "notesSeparator",
            "mathEngine",
            "highlightTheme",
        ]);

        const globalSettings = pick(
            omitBy(this.settings, isEmpty),
            revealProps,
        );
        const slideSettings = pick(options, revealProps);

        // Pass through any extra frontmatter keys not in the OSE-internal blocklist
        // so plugins can read them via deck.getConfig() (e.g. author, institution, date).
        const extraKeys = Object.keys(options).filter(
            (k) => !revealProps.includes(k) && !oseInternalKeys.has(k),
        );
        const extraSettings = pick(options, extraKeys);

        return Object.assign({}, globalSettings, slideSettings, extraSettings);
    }

    getTemplateSettings(options: Partial<Options>) {
        const properties = [
            "enableOverview",
            "enableChalkboard",
            "enableAudioSlideshow",
            "enableMenu",
            "enableCustomControls",
            "enableTimeBar",
            "enablePointer",
            "mathEngine",
        ];

        const globalSettings = pick(this.settings, properties);
        const slideSettings = pick(options, properties);

        return Object.assign({}, globalSettings, slideSettings);
    }

    parseYamlFrontMatter(input: string): {
        yamlOptions: unknown;
        markdown: string;
    } {
        try {
            const document = loadFront(input.replace(/^\uFEFF/, ""));
            return {
                yamlOptions: omit(document, ["__content"]),
                markdown: document.__content || input,
            };
        } catch (_error) {
            return {
                yamlOptions: {},
                markdown: input,
            };
        }
    }
}
