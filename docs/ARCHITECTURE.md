# Cerebra Architecture

This document is the primary map for humans and AI agents working on this repository.

## Source of truth

- `src/template.html` — page markup, CSS, and the main application runtime.
- `src/worlds.json` — world metadata.
- `src/effects/` — feature modules layered onto the main runtime.
- `src/build_web.py` — builds the deployable root `index.html` and hashed files in `assets/`.
- Root `index.html` and `assets/` are generated output. Do not hand-edit them.

## Feature ownership

### Planet surface
- `src/effects/surface.js` — renderer, styles, defaults, style-specific controls.
- `src/effects/surface-shapes.js` — generated-surface base-shape deformation and shape controls.
- `src/effects/surface-tune-core.js` — Surface tab inside Tune Core and style-aware deep controls.

When changing Surface Style, inspect all three files. Keep the renderer state under the existing `s_` keys so undo/save/reset remain compatible.

### Studio menus
- `src/effects/studio-menu-fix.js` — floating-menu exclusivity, drawing-menu collapse, Tune Core tab visibility.

Rule: one floating menu at a time. Starting a drawing gesture must clear obstructing controls from the canvas.

### Drawing
- `src/effects/s7-brush.js` — Tentacle, Branch, Pen/Line symmetry and drawing compatibility bootstrap.

Drawing additions must use the existing Studio stroke layer and undo/save path rather than a second canvas-state system.

### S9 Lab
- `src/effects/s9-core.js` — fluid/life/audio runtime.
- `src/effects/s9-ui.js` — Lab UI, project JSON, onboarding.

WebGPU is intentionally not part of this layer unless explicitly approved.

### Other render effects
- `core.js` — Effects registry; must load before registered effects.
- `camera.js`, `fog.js`, `formation.js`, `hologram.js`, `burst.js`, `post-stack.js`, `diagnostics.js` — independent effect modules.

## Dependency rules

1. `core.js` must exist before any `Effects.register(...)` module.
2. `surface.js` must initialize before `surface-shapes.js`.
3. `surface-shapes.js` and `surface.js` must be available before Surface Tune is validated.
4. Studio extensions must patch the existing `window.__cerebra.studio`; do not create a second Studio controller.
5. Feature modules must guard against duplicate initialization because the current Pages deployment can use compatibility source loading as well as rebuilt bundles.

## State rules

- Planet/world tuning stays in the existing `tune` object.
- Surface keys use `s_`.
- New controls must participate in undo/redo, reset and project/save behavior.
- Do not create hidden parallel state unless there is a documented reason.

## UI rules

- Controls with no effect for the current Surface Style should be hidden, not disabled/greyed.
- On mobile/tablet, menus should preserve canvas visibility and avoid horizontal overflow.
- Only one floating menu/panel should remain open at a time.
- Touch targets should remain usable on coarse pointers.

## Build and deploy

Run:

```bash
python3 src/build_web.py
```

Then commit the generated root `index.html` and `assets/` produced by the build. Validate the deployed site after merge.

## Refactor policy

Do not perform a whole-app rewrite. Extract one feature at a time, preserve its public state/API, build, then run the full QA checklist before moving to the next feature.
