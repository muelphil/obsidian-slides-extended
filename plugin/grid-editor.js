window.GridEditor = window.GridEditor || {
    id: "GridEditor",

    // Readable from the parent frame for future use; keep in sync with
    // GRID_COORDINATE_PRECISION in src/reveal/revealPreviewView.ts.
    precision: 1,

    init: (deck) => {
        const self = window.GridEditor;

        const getReferenceElement = () => {
            return document.querySelector(".reveal .slides") ?? document.body;
        };

        const getOverlay = () => {
            let overlay = document.querySelector(".slides-extended-overlay");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "slides-extended-overlay";
                getReferenceElement().appendChild(overlay);
            }
            return overlay;
        };

        const getRectLayer = () => {
            let layer = document.querySelector(".slides-extended-rect-layer");
            if (!layer) {
                layer = document.createElement("div");
                layer.className = "slides-extended-rect-layer";
                getReferenceElement().appendChild(layer);
            }
            return layer;
        };

        document.body.classList.add("slides-extended-edit-mode");
        getOverlay();

        const readout = document.createElement("div");
        readout.id = "slides-extended-coordinates";
        readout.className = "slides-extended-coordinates";
        readout.textContent = "x: --.%, y: --.%";
        document.body.appendChild(readout);

        const update = (clientX, clientY) => {
            const reference = getReferenceElement();
            const rect = reference.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                readout.textContent = "x: --.%, y: --.%";
                return;
            }

            const x = self.quantize(
                self.clamp(((clientX - rect.left) / rect.width) * 100),
            );
            const y = self.quantize(
                self.clamp(((clientY - rect.top) / rect.height) * 100),
            );
            readout.textContent = `x: ${x.toFixed(self.precision)}, y: ${y.toFixed(self.precision)}`;
        };

        document.body.addEventListener(
            "mousemove",
            (event) => {
                const clientX =
                    event.clientX ?? event.pageX - window.scrollX ?? 0;
                const clientY =
                    event.clientY ?? event.pageY - window.scrollY ?? 0;
                update(clientX, clientY);

                if (self.drawing && self.preview) {
                    self.updatePreview(self.pointerToPercent(event));
                }
            },
            { capture: true },
        );

        document.body.addEventListener("touchmove", (event) => {
            const touch = event.touches[0];
            if (touch) {
                update(touch.clientX, touch.clientY);
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
                const reference = getReferenceElement();
                const rect = reference.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    return;
                }

                event.preventDefault();

                self.drawing = true;
                self.startPoint = self.pointerToPercent(event);

                self.preview = document.createElement("div");
                self.preview.className = "slides-extended-draw-rect";
                getRectLayer().appendChild(self.preview);
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

                const endPoint = self.pointerToPercent(event);
                const topLeft = {
                    x: Math.min(self.startPoint.x, endPoint.x),
                    y: Math.min(self.startPoint.y, endPoint.y),
                };
                const bottomRight = {
                    x: Math.max(self.startPoint.x, endPoint.x),
                    y: Math.max(self.startPoint.y, endPoint.y),
                };

                const precision = self.precision ?? 1;
                console.log(
                    `[GridEditor] rectangle drawn: top-left (${topLeft.x.toFixed(precision)}, ${topLeft.y.toFixed(precision)}), bottom-right (${bottomRight.x.toFixed(precision)}, ${bottomRight.y.toFixed(precision)})`
                );

                parent.postMessage(
                    {
                        type: "slides-extended-grid-draw",
                        left: topLeft.x,
                        top: topLeft.y,
                        width: bottomRight.x - topLeft.x,
                        height: bottomRight.y - topLeft.y,
                    },
                    "*",
                );

                if (self.preview) {
                    self.preview.remove();
                    self.preview = null;
                }
            },
            { capture: true },
        );
    },

    pointerToPercent(event) {
        const reference =
            document.querySelector(".reveal .slides") ?? document.body;
        const rect = reference.getBoundingClientRect();
        const clientX = event.clientX ?? event.pageX - window.scrollX ?? 0;
        const clientY = event.clientY ?? event.pageY - window.scrollY ?? 0;
        return {
            x: window.GridEditor.quantize(
                window.GridEditor.clamp(
                    ((clientX - rect.left) / rect.width) * 100,
                ),
            ),
            y: window.GridEditor.quantize(
                window.GridEditor.clamp(
                    ((clientY - rect.top) / rect.height) * 100,
                ),
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
