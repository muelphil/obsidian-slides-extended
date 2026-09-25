(() => {
    /**
     * Workaround for an esbuild minifier bug: the top-level `window.X =
     * window.X || { ... }` object literal can be (mis)detected as an export,
     * producing a broken `export default` for a classic script tag. Wrapping
     * the whole definition in an IIFE keeps the global assignment stable and
     * the output format-independent.
     */
    window.GridEditor = window.GridEditor || {
        id: "GridEditor",

        // Readable from the parent frame for future use; keep in sync with
        // GRID_COORDINATE_PRECISION in src/reveal/revealPreviewView.ts.
        precision: 1,

        getReferenceElement() {
            return document.querySelector(".reveal .slides") ?? document.body;
        },

        getOverlay() {
            let overlay = document.querySelector(".slides-extended-overlay");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "slides-extended-overlay";
                this.getReferenceElement().appendChild(overlay);
            }
            return overlay;
        },

        getRectLayer() {
            let layer = document.querySelector(".slides-extended-rect-layer");
            if (!layer) {
                layer = document.createElement("div");
                layer.className = "slides-extended-rect-layer";
                this.getReferenceElement().appendChild(layer);
            }
            return layer;
        },

        // The element coordinates are relative to: the innermost grid under
        // the pointer, or the slide area (.slides) when outside any grid.
        resolveReferenceElement(clientX, clientY) {
            const element = document.elementFromPoint(clientX, clientY);
            return (
                element?.closest?.("[data-slides-grid]") ??
                this.getReferenceElement()
            );
        },

        currentSlideIndex() {
            const indices = window.Reveal?.getIndices?.();
            return indices ? `${indices.h},${indices.v}` : null;
        },

        setActiveGrid(clientX, clientY) {
            const element = document.elementFromPoint(clientX, clientY);
            const grid = element?.closest?.("[data-slides-grid]");
            const key = grid ? grid.getAttribute("data-slides-grid") : null;

            if (key === this.activeGridKey) {
                return;
            }

            if (this.activeGridKey !== null) {
                this.indicators
                    ?.get(this.activeGridKey)
                    ?.indicator.classList.remove("is-active");
            }

            this.activeGridKey = key;

            if (key !== null) {
                this.indicators?.get(key)?.indicator.classList.add("is-active");
            }
        },

        init: (deck) => {
            const self = window.GridEditor;

            self.activeGridKey = null;
            self.indicators = new Map();

            document.body.classList.add("slides-extended-edit-mode");
            self.getOverlay();
            self.refreshIndicators(deck);

            deck.on("slidechanged", () => {
                self.refreshIndicators(deck);
            });

            const readout = document.createElement("div");
            readout.id = "slides-extended-coordinates";
            readout.className = "slides-extended-coordinates";
            readout.textContent = "x: --.%, y: --.%";
            document.body.appendChild(readout);

            const updateReadout = (clientX, clientY) => {
                const reference = self.drawing
                    ? self.referenceElement
                    : self.resolveReferenceElement(clientX, clientY);
                const rect = reference.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const x = self.quantize(
                        self.clamp(
                            ((clientX - rect.left) / rect.width) * 100,
                        ),
                    );
                    const y = self.quantize(
                        self.clamp(
                            ((clientY - rect.top) / rect.height) * 100,
                        ),
                    );
                    const gridIndex =
                        reference.getAttribute?.("data-slides-grid");
                    const suffix = gridIndex ? ` (in #${gridIndex})` : "";
                    readout.textContent = `x: ${x.toFixed(self.precision)}, y: ${y.toFixed(self.precision)}${suffix}`;
                } else {
                    readout.textContent = "x: --.%, y: --.%";
                }
            };

            const cancelDraw = () => {
                self.drawing = false;
                self.startPoint = null;
                self.referenceElement = null;
                self.clearPreview();
            };

            document.body.addEventListener(
                "mousemove",
                (event) => {
                    const clientX =
                        event.clientX ?? event.pageX - window.scrollX ?? 0;
                    const clientY =
                        event.clientY ?? event.pageY - window.scrollY ?? 0;

                    updateReadout(clientX, clientY);

                    if (!self.drawing) {
                        self.setActiveGrid(clientX, clientY);
                    }

                    if (self.drawing && self.preview) {
                        self.updatePreview(self.pointerToPercent(event));
                    }
                },
                { capture: true },
            );

            document.body.addEventListener("touchmove", (event) => {
                const touch = event.touches[0];
                if (touch) {
                    self.setActiveGrid(touch.clientX, touch.clientY);
                }
            });

            window.addEventListener("blur", cancelDraw);

            document.addEventListener("mouseleave", cancelDraw);

            document.addEventListener("mouseenter", (event) => {
                if (!self.preview) {
                    return;
                }
                const buttons = event.buttons ?? 0;
                if ((buttons & 1) === 0) {
                    cancelDraw();
                }
            });

            document.body.addEventListener(
                "dragstart",
                (event) => {
                    event.preventDefault();
                },
                { capture: true },
            );

            document.body.addEventListener(
                "mousedown",
                (event) => {
                    if (event.button !== 0) {
                        return;
                    }

                    const clientX =
                        event.clientX ?? event.pageX - window.scrollX ?? 0;
                    const clientY =
                        event.clientY ?? event.pageY - window.scrollY ?? 0;

                    event.preventDefault();

                    self.drawing = true;
                    self.referenceElement = self.resolveReferenceElement(
                        clientX,
                        clientY,
                    );
                    self.startPoint = self.pointerToPercent(event);

                    self.preview = document.createElement("div");
                    self.preview.className = "slides-extended-draw-rect";

                    // The green rectangle is drawn inside the active grid's
                    // indicator, so it inherits the grid's coordinate system
                    // and never affects the underlying slide content.
                    const key = self.referenceElement.getAttribute?.(
                        "data-slides-grid",
                    );
                    const container = key
                        ? self.indicators.get(key)?.indicator
                        : undefined;
                    (container ?? self.getRectLayer()).appendChild(
                        self.preview,
                    );
                    self.updatePreview(self.startPoint);
                },
                { capture: true },
            );

            document.body.addEventListener(
                "mouseup",
                (event) => {
                    if (!self.drawing) {
                        return;
                    }
                    self.drawing = false;

                    const startPoint = self.startPoint;
                    const reference = self.referenceElement;
                    self.startPoint = null;
                    self.referenceElement = null;
                    self.clearPreview();

                    const endPoint = self.pointerToPercent(event, reference);
                    const topLeft = {
                        x: Math.min(startPoint.x, endPoint.x),
                        y: Math.min(startPoint.y, endPoint.y),
                    };
                    const bottomRight = {
                        x: Math.max(startPoint.x, endPoint.x),
                        y: Math.max(startPoint.y, endPoint.y),
                    };

                    // Round before measuring so x+width and y+height never
                    // exceed 100 - otherwise the resulting grid overflows the
                    // slide and causes scrollbars.
                    const precision = self.precision ?? 1;
                    const left = Number.parseFloat(
                        topLeft.x.toFixed(precision),
                    );
                    const top = Number.parseFloat(
                        topLeft.y.toFixed(precision),
                    );
                    const right = Number.parseFloat(
                        bottomRight.x.toFixed(precision),
                    );
                    const bottom = Number.parseFloat(
                        bottomRight.y.toFixed(precision),
                    );

                    const width = right - left;
                    const height = bottom - top;
                    if (width < 0.5 || height < 0.5) {
                        return;
                    }

                    console.log(
                        `[GridEditor] rectangle drawn: top-left (${left.toFixed(precision)}, ${top.toFixed(precision)}), bottom-right (${right.toFixed(precision)}, ${bottom.toFixed(precision)})`
                    );

                    parent.postMessage(
                        {
                            type: "slides-extended-grid-draw",
                            left,
                            top,
                            width,
                            height,
                            slidesGrid:
                                reference?.getAttribute?.(
                                    "data-slides-grid",
                                ) ?? null,
                            slide: self.currentSlideIndex(),
                        },
                        "*",
                    );
                },
                { capture: true },
            );
        },

        clearPreview() {
            if (this.preview) {
                this.preview.remove();
                this.preview = null;
            }
        },

        pointerToPercent(event, referenceOverride) {
            const reference =
                referenceOverride ??
                this.referenceElement ??
                this.getReferenceElement();
            const rect = reference.getBoundingClientRect();
            const clientX =
                event.clientX ?? event.pageX - window.scrollX ?? 0;
            const clientY =
                event.clientY ?? event.pageY - window.scrollY ?? 0;
            return {
                x: this.quantize(
                    this.clamp(((clientX - rect.left) / rect.width) * 100),
                ),
                y: this.quantize(
                    this.clamp(((clientY - rect.top) / rect.height) * 100),
                ),
            };
        },

        updatePreview(endPoint) {
            if (!this.preview || !this.startPoint) {
                return;
            }
            const left = Math.min(this.startPoint.x, endPoint.x);
            const top = Math.min(this.startPoint.y, endPoint.y);
            const width = Math.abs(endPoint.x - this.startPoint.x);
            const height = Math.abs(endPoint.y - this.startPoint.y);
            this.preview.style.left = `${left}%`;
            this.preview.style.top = `${top}%`;
            this.preview.style.width = `${width}%`;
            this.preview.style.height = `${height}%`;
        },

        // Rebuilds the indicator tree for the current slide.
        //
        // All indicators live inside the edit-mode rect layer, which spans
        // exactly the .slides element. The tree mirrors the DOM hierarchy of
        // the real grid elements: nested grid indicators are children of
        // their parent grid's indicator, so percentage positions match
        // exactly without any math.
        refreshIndicators(deck) {
            this.indicators = new Map();
            this.activeGridKey = null;
            this.clearPreview();

            const layer = this.getRectLayer();
            layer
                .querySelectorAll(".slides-extended-grid-indicator")
                .forEach((indicator) => indicator.remove());

            const slide = deck.getCurrentSlide();
            if (!slide) {
                return;
            }

            const grids = slide.querySelectorAll("[data-slides-grid]");
            for (const grid of grids) {
                const key = grid.getAttribute("data-slides-grid");
                if (!key) {
                    continue;
                }

                const indicator = document.createElement("div");
                indicator.className = "slides-extended-grid-indicator";
                indicator.dataset.slidesGrid = key;
                indicator.style.left = grid.style.left;
                indicator.style.top = grid.style.top;
                indicator.style.width = grid.style.width;
                indicator.style.height = grid.style.height;

                // Find the parent grid in the real DOM and place this
                // indicator as a child of its indicator. If there is no
                // parent, place it at the top level of the rect layer.
                const parentGrid = grid.parentElement?.closest?.(
                    "[data-slides-grid]",
                );
                const parentKey = parentGrid?.getAttribute?.(
                    "data-slides-grid",
                );
                const parentIndicator =
                    parentKey !== null && parentKey !== undefined
                        ? this.indicators.get(parentKey)?.indicator
                        : undefined;

                (parentIndicator ?? layer).appendChild(indicator);

                this.indicators.set(key, {
                    indicator,
                    sourceElement: grid,
                });
            }
        },

        quantize(value) {
            const precision = this.precision ?? 1;
            return Number.parseFloat(value.toFixed(precision));
        },

        clamp(value) {
            if (Number.isNaN(value)) {
                return 0;
            }
            return Math.min(100, Math.max(0, value));
        },
    };
})();
