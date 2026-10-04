# AI Handoff Guide

Use this file before changing Cerebra.

## First read

1. `docs/ARCHITECTURE.md`
2. `CLAUDE.md`
3. The feature file(s) you are changing
4. `docs/QA-CHECKLIST.md`

## Safe workflow

1. Start from latest `main` on a new branch.
2. Change source files only; do not hand-edit generated `index.html` or `assets/`.
3. Keep one feature per change where practical.
4. Reuse existing state and controllers instead of creating parallel systems.
5. Run `python3 src/build_web.py`.
6. Inspect the diff, especially generated bundle changes.
7. Open PR, merge only after validation.
8. Verify the live GitHub Pages build on desktop and mobile/tablet emulation.

## Before editing a feature

- Surface: inspect `surface.js`, `surface-shapes.js`, `surface-tune-core.js`.
- Studio menus: inspect `studio-menu-fix.js` and relevant markup in `template.html`.
- Drawing: inspect `s7-brush.js` and Studio stroke/undo methods in `template.html`.
- S9: inspect both `s9-core.js` and `s9-ui.js`.

## Non-negotiable behavior

- Undo/redo must remain coherent.
- Reset must restore the active feature correctly.
- Save/project export must preserve user-visible state.
- Surface controls that have no effect must be hidden for that style.
- Opening a menu must close conflicting menus.
- Starting to draw must remove obstructing controls from the canvas.
- Do not begin WebGPU work without explicit approval.

## Debugging order

When a feature appears in source but not on the live site:

1. Verify source is on `main`.
2. Verify the generated app bundle contains it.
3. Verify GitHub Pages is serving the new build hash.
4. Check cache/versioned compatibility loaders.
5. Test the feature in the live UI.

Do not report a feature as complete only because its source file exists.

## Handoff note format

For each completed change leave a short note covering:

- feature changed
- files changed
- state/API touched
- UI location
- tests run
- known limitations
- follow-up work
