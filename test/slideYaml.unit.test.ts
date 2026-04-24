import { SlideYamlProcessor } from "src/obsidian/processors/slideYamlProcessor";
import type { Options } from "src/@types";
import { YamlStore } from "src/yaml/yamlStore";

const BASE_OPTIONS: Options = {
    separator: "\r?\n---\r?\n",
    verticalSeparator: "\r?\n--\r?\n",
    // minimal required fields
    bg: "",
    center: true,
    css: "",
    defaultTemplate: "",
    enableLinks: false,
    height: 700,
    highlightTheme: "zenburn",
    log: false,
    margin: 0.04,
    notesSeparator: "note:",
    remoteCSS: "",
    scripts: "",
    remoteScripts: "",
    showGrid: false,
    template: "reveal.html",
    theme: "black",
    timeForPresentation: 0,
    title: "",
    width: 960,
    enableCustomControls: false,
    transition: "default",
    mathEngine: "katex",
};

function opts(extra?: Partial<Options>): Options {
    return Object.assign({}, BASE_OPTIONS, extra);
}

describe("SlideYamlProcessor", () => {
    let sut: SlideYamlProcessor;

    beforeAll(() => {
        YamlStore.getInstance().options = opts();
    });

    beforeEach(() => {
        sut = new SlideYamlProcessor();
    });

    test("leaves slide without yaml fence unchanged", () => {
        const md = "## Hello World\n\nSome content.";
        expect(sut.process(md, opts())).toBe(md);
    });

    test("converts simple yaml fence to slide comment", () => {
        const md = "```yaml\nlayout: title-dark\n```\n\n## My Slide\n";
        const result = sut.process(md, opts());
        expect(result).toContain('<!-- .slide: data-layout="title-dark" -->');
        expect(result).not.toContain("```yaml");
        expect(result).toContain("## My Slide");
    });

    test("maps bg key to data-background-image", () => {
        const md = "```yaml\nbg: hero.avif\n```\n\n## Slide\n";
        const result = sut.process(md, opts());
        expect(result).toContain('data-background-image="hero.avif"');
        expect(result).not.toContain('data-bg=');
    });

    test("maps class key as class attribute not data-class", () => {
        const md = "```yaml\nclass: my-class\n```\n\n## Slide\n";
        const result = sut.process(md, opts());
        expect(result).toContain('class="my-class"');
        expect(result).not.toContain("data-class");
    });

    test("maps font-size to data-font-size", () => {
        const md = "```yaml\nfont-size: 32px\n```\n\n## Slide\n";
        const result = sut.process(md, opts());
        expect(result).toContain('data-font-size="32px"');
    });

    test("merges with existing slide comment", () => {
        const md =
            '<!-- .slide: data-existing="yes" -->\n```yaml\nlayout: section\n```\n\n## Slide\n';
        const result = sut.process(md, opts());
        expect(result).toContain('data-existing="yes"');
        expect(result).toContain('data-layout="section"');
        // Only one slide comment
        expect((result.match(/<!--\s*\.slide:/g) ?? []).length).toBe(1);
    });

    test("handles multiple slides across separator", () => {
        const md =
            "```yaml\nlayout: title\n```\n\n## Slide 1\n---\n## Slide 2\n";
        const result = sut.process(md, opts());
        expect(result).toContain('data-layout="title"');
        expect(result).toContain("## Slide 2");
    });

    test("does not process yaml fence not at slide start", () => {
        // A yaml block that is NOT at the start (preceded by content)
        const md = "## Title\n\n```yaml\nlayout: foo\n```\n\nContent\n";
        const result = sut.process(md, opts());
        // The fence should be left untouched since content precedes it
        expect(result).toContain("```yaml");
    });

    test("leaves slide unchanged when yaml fence is invalid", () => {
        const md = "```yaml\n: bad yaml: [\n```\n\n## Slide\n";
        const result = sut.process(md, opts());
        // invalid yaml — slide should be returned as-is
        expect(result).toContain("```yaml");
    });

    test("snapshot: full multi-key yaml block", () => {
        const md =
            "```yaml\nlayout: title-dark\nbg: cover.avif\nfont-size: 36px\nclass: hero\n```\n\n## Title Slide\n";
        expect(sut.process(md, opts())).toMatchSnapshot();
    });
});
