---
title: "Show Grid & Edit Mode"
description: "Align content with the debug grid and draw new grids directly in the preview."
weight: 3
---

Two tools in the preview pane help you place content precisely: **Show Grid** overlays a 10 × 10 reference grid on the slide, and **Edit Mode** lets you draw a new grid with your mouse and have it inserted as a `<grid>` tag.

### Show Grid

Show Grid overlays a faint blue 10 × 10 grid across the whole slide. Each line sits at 10% intervals, so you can read off the *x* and *y* position and *width* and *height* of any block of content as a percentage of the slide.

#### Activating

Click the **Show grid** icon in the preview toolbar. The icon turns blue while it is on and is grey while it is off. Click it again to hide the grid.

> [!TIP]
> The grid is a visual aid only. It does not appear in the exported presentation and does not interfere with navigation or editing.

#### Reading a position

To find the coordinates of a block of content, look at where its top-left corner lands on the grid:

- The *x* value is the vertical line at the block's left edge (0 on the left, 100 on the right).
- The *y* value is the horizontal line at the block's top edge (0 at the top, 100 at the bottom).
- The *width* is the span of vertical lines the block covers.
- The *height* is the span of horizontal lines the block covers.

A block that starts at the 20% line and ends at the 60% line is, for example, `<grid drag="40 100" drop="20 0">`.

### Edit Mode

Edit Mode adds visual helpers on top of Show Grid and lets you create new grids by drawing them with the mouse.

#### Activating

Click the **Toggle edit mode** icon in the preview toolbar. While it is on, the icon is highlighted. Every grid on the current slide is outlined with a grey dashed box, and a small coordinate readout appears in the top-right corner.

> [!TIP]
> You can use Edit Mode without Show Grid, but the two are most useful together: the blue grid shows you the numbers, and the grey boxes show you where each existing grid actually is.

#### The coordinate readout

Move your mouse over the slide and the readout in the top-right corner shows the position under the cursor as a percentage, for example `x: 42.5%, y: 68.0%`.

When the cursor is inside a grid, the readout shows which grid it is, for example `x: 42.5%, y: 68.0% (in #3)`. The number is the grid's index on the slide.

> [!NOTE]
> The coordinates are always relative to the grid you are working inside. If you are drawing inside an existing grid, the values are percentages of *that* grid, not of the whole slide.

#### The active grid

The grid under your cursor is the **active grid**. It is highlighted with an orange border instead of the usual grey dashed border.

- The coordinate readout is measured relative to the active grid.
- A grid you draw is created inside the active grid.
- When the cursor is outside any grid, the active grid is the slide itself and the values are relative to the whole slide.

#### Drawing a new grid

1. Move the cursor to where you want the new grid to start. The grid under the cursor is highlighted in orange.
2. Click and drag to size the new grid. A green rectangle follows your cursor while you drag.
3. Release the mouse button. The grid is created.

While you drag, the green rectangle is sized relative to the active grid, and the readout shows the live coordinates.

#### Where the grid goes

What happens next depends on where you are viewing the slides:

- **Inside Obsidian** — the new `<grid>` tag is inserted at the cursor position in the source note, and the caret moves inside the new grid so you can start adding content immediately.
- **In a browser** (via the *Open in browser* toolbar action) — there is no note to edit, so the `<grid>` tag is copied to your clipboard instead and a brief **Copied!** notice appears. Paste it into your note wherever you want.

A drawn grid is inserted in the same syntax as a hand-written one:

```md
<grid drag="width height" drop="x y">
...
</grid>
```

The *width*, *height*, *x*, and *y* values are the dimensions and position of the rectangle you drew, expressed as percentages of the active grid.

> [!TIP]
> You can draw a grid inside an existing grid to build nested layouts. The nested grid's values are relative to its parent, matching how nested `<grid>` tags behave.

### Reference

- **Show grid** (toolbar icon) — toggles the blue 10 × 10 reference grid.
- **Toggle edit mode** (toolbar icon) — toggles the grey grid outlines, the orange active-grid highlight, the coordinate readout, and grid drawing.
- **Coordinate readout** (top-right, edit mode) — live *x* / *y* of the cursor, relative to the active grid, with the grid index in parentheses when inside a grid.
- **Active grid** (orange border) — the grid under the cursor; the reference for both the readout and any grid you draw.
