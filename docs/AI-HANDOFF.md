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

## 2026-10-07 — launch paths, field guide, per-planet labels and Spotlight

- Added `src/effects/studio-launch.js`: Create → Enter now opens Studio / How to use / Explore planets. Explore uses the existing World Atelier; Explore solar system remains available from the original gateway. Direct Studio exit returns to paths. Touch release cannot activate a newly revealed path button. Native modal handles focus, Escape and scrolling.
- Guide uses actual toolbar SVGs, Kit thumbnails/UI definitions, Effects controls, Tune/Water/Design controls, keyboard shortcuts and the read-only `studio.menuEntries` catalogue. Nine chapters, cross-chapter search, Thai explanations, exact ranges/options and Help → How to use. Current catalogue: 817 topics, including nested Kit/Effects/menu parameters. `entry.launchPaths` and `app.openGuide()` are the entry points. Capture shortcuts pause while the guide is open.
- `reference-design.js`: Celestial system accepts `p.bodyLabels` and `p.bodyFonts` arrays; older comma-separated `p.labels` falls back without changing old saves. Separate name/font controls follow the body count and retain hidden entries when reducing it. Nine Kit fonts, including embedded Noto Sans Thai; global size, weight, colour, label distance and visibility. Font loading also waits for per-planet overrides. SIL OFL notice retained beside embedded font in `template.html`.
- Spotlight renders the saved composition into a temporary frame-aspect viewport, restores native stage/camera/state in `finally`, and caches by work state/aspect. Preview is a symmetric trapezoid; straight dialog and square close button stay outside the clipping.
- Validation: build, JS syntax and diff checks; Playwright Chromium at 390×844, 820×1180 and 1440×900; actual single-touch Enter, all three paths, returning from planets/Studio, all guide chapters/search, guide Escape preserving Studio, legacy/per-body names with Thai and comma, per-body font Undo/Redo, snapshot round-trip, 2/12 bodies, Spotlight aspect and native viewport restoration. No page errors. Repeat live desktop/mobile checks after Pages deploy.
- Visual review compared generated hub/guide concept with actual browser screenshots: corrected heading wrapping/font, Thai glyph fallback, responsive gutters/rows, icon identity, dark/pink palette and guide rail. Intentional adaptations: existing Inferno GLB supplies real planet artwork, Thai instructional text replaces concept placeholder copy, Back stays at top-right. Guide uses app-native icons and a captioned toolbar instead of raster UI mockups. No new WebGL context or paid/runtime service.
- Limits: browser QA emulates device sizes; physical iOS Safari remains a user check. Existing Library export is a JSON backup; the guide recommends `.cerebra` project files for cross-device editing and does not claim a Library import UI exists.
