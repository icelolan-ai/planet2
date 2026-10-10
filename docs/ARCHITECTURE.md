# Cerebra Architecture

This document is the primary map for humans and AI agents working on this repository.

## Source of truth

- `src/template.html` — page markup, CSS, and the main application runtime.
- `src/worlds.json` — world metadata.
- `src/effects/` — feature modules layered onto the main runtime.
- `src/build_web.py` — builds the deployable root `index.html` and hashed files in `assets/`.
- `.github/workflows/build-generated.yml` — safety-net build on `main` whenever source files change.
- Root `index.html` and `assets/` are generated output. Do not hand-edit them.

## Feature ownership

### Studio quick start
- `studio-stepper.js` adds the native React Bits-style four-step tutorial inside the existing launch dialog. `studio-launch.js` delegates only fresh Studio entry to it; returning to an active Studio stays immediate.
- The tutorial uses existing GSAP, keeps session-only completion state, and never owns project/history/rendering. First entry offers Previous/Next, indicator jumps, Skip and Back; subsequent entry is immediate. How to use > Start here exposes replay. Preserve native modal focus/route locking, EN/Thai, reduced motion and scrollable short screens.

### Planet surface
- `src/effects/surface.js` — renderer, styles, defaults, style-specific controls.
- `src/effects/surface-shapes.js` — generated-surface base-shape deformation and shape controls.
- `src/effects/surface-tune-core.js` — style-aware deep controls used by Tune Core.
- `src/effects/studio-tune-core-ux.js` — Studio-only Tune Core scope and duplicate-control cleanup.

When changing Surface Style, inspect all four files. Keep the renderer state under the existing `s_` keys so undo/save/reset remain compatible.

Surface workflow is intentionally split:
- **Design** chooses the Surface Style and Base Shape.
- **Tune Core** edits deeper parameters for the already-selected Surface/Shape.
- Tune Core must not repeat the Surface Style or Base Shape selector.
- Save/export lives in the Studio Save menu, not Tune Core.
- Tune Core is Studio-only; Explore/Atelier pages must not expose it.

### Studio menus
- `src/effects/studio-menu-fix.js` — floating-menu exclusivity, drawing-menu collapse, Tune Core tab visibility.
- `src/effects/studio-tune-core-ux.js` — Tune Core scope/ownership rules described above.

Rule: one floating menu at a time. Starting a drawing gesture must clear obstructing controls from the canvas.

### Drawing
- `src/effects/s7-brush.js` — Tentacle, Branch and Pen/Line symmetry.
- `src/effects/laser-pen.js` — Laser Flow ribbon on native Pen strokes; shares Laser shader/renderer and native moving-stroke clock, history and export.

Drawing additions must use the existing Studio stroke layer and undo/save path rather than a second canvas-state system.

### S9 Lab
- `src/effects/s9-core.js` — fluid/life/audio runtime.
- `src/effects/s9-ui.js` — Lab UI, project JSON, onboarding.

WebGPU is intentionally not part of this layer unless explicitly approved.

### Compatibility only
- `src/effects/runtime-compat.js` — temporary bridge used only when the legacy split loader source-loads newer Studio modules. It must not contain feature logic and must do nothing inside a normal rebuilt bundle.

### Other render effects
- `core.js` — Effects registry; must load before registered effects.
- `camera.js`, `fog.js`, `formation.js`, `hologram.js`, `burst.js`, `post-stack.js`, `diagnostics.js` — independent effect modules.

## Dependency rules

### Native Rocket layers

- Add Planet > Rocket is a category in the existing planet menu; the three vehicles become native `kit:rocket` layers so they can coexist with planets and other artwork.
- `rocket-model.js` ports original Rocket model/manifest semantics; `studio-rockets.js` owns only its Kit definition, contextual part controls and per-item GPU caches. `CoreStudio` remains the controller. The existing stage renderer renders transparent targets; no extra renderer, canvas-state store or scheduler is created.
- Original GLBs/manifest/standalone meshopt decoder live in `src/assets-src/rockets/`. `build_web.py` supplies hashed relative paths through `__ASSETS.rockets`; load lazily. Preserve the source CAD frame during instanced explosion calculations before applying view centering/rotation.
- Settings (including per-part colour/visibility and material variant) live under native item `p`; GPU state is WeakMap-only. Native `KIT.ready(item)` is awaited before poster/video capture for asynchronously loaded definitions. Removal/reset disposes target/material clones. The catalogue cache is bounded to three original models.
- `docs/qa/studio-rockets-ui.cjs` verifies all three real models, actual pixels/controls, assembled instance transforms, native history/project and responsive UI. `QA_EXPORT=1` adds composition PNG capture; leave `QA_PAUSE_STAGE` unset for full rendering checks. Separate Rocket slot-swaps/Part Gallery are outside this adapter.

1. `core.js` must exist before any `Effects.register(...)` module.
2. `surface.js` must initialize before `surface-shapes.js`.
3. `surface-shapes.js` and `surface.js` must be available before Surface Tune is validated.
4. `studio-tune-core-ux.js` must load after `surface-tune-core.js`.
5. Studio extensions must patch the existing `window.__cerebra.studio`; do not create a second Studio controller.
6. Feature modules must guard against duplicate initialization.
7. `src/build_web.py` contains the authoritative explicit effect-module order. Do not rely on filename alphabetical order.
8. `runtime-compat.js` is legacy-only; a rebuilt hashed bundle must not source-load feature modules again.

## State rules

- Planet/world tuning stays in the existing `tune` object.
- Surface keys use `s_`.
- New controls must participate in undo/redo, reset and project/save behavior.
- Do not create hidden parallel state unless there is a documented reason.

## UI rules

- Controls with no effect for the current Surface Style should be hidden, not disabled/greyed.
- Surface Style and Base Shape are selected in Design; Tune Core only exposes deeper controls.
- Tune Core is available only while Studio is active.
- Save/export is owned by the Studio Save menu.
- On mobile/tablet, menus should preserve canvas visibility and avoid horizontal overflow.
- Only one floating menu/panel should remain open at a time.
- Touch targets should remain usable on coarse pointers.

## Build and deploy

Local/source validation still uses:

```bash
python3 src/build_web.py
```

The generated root `index.html` and `assets/` must come from that script only. Never edit them by hand.

On `main`, `.github/workflows/build-generated.yml` reruns the same build when `src/template.html`, `src/worlds.json`, `src/effects/**`, or `src/build_web.py` changes. If generated output differs, the workflow commits it back to `main`. The generated-only commit does not retrigger the workflow because of the path filter.

After the generated build lands, validate the deployed GitHub Pages site, not only repository source.

## Refactor policy

Do not perform a whole-app rewrite. Extract one feature at a time, preserve its public state/API, build, then run the full QA checklist before moving to the next feature.

### Studio Crystal Ball and backdrop tools (supersedes page ownership)
- `studio-scene-effects.js` registers native `crystalBall` and `liquidEther` Kit definitions. Original shaders/solver remain in `crystalized-ball.js` and `liquid-ether.js`, reusing the shared stage renderer and native Kit clock. `studio-reactbits-pages.js` now owns rotating text only: no Crystal/Backdrop controls, canvases or effect RAF on launch/guide.
- Per-item WeakMap offscreen buffers isolate drawing from native composition export; never serialize GPU caches. Native p/Motion/layer/history/project/capture are authoritative. Delete/restore/Design reset dispose resources. Crystal preserves eight source presets, with selected moving1536px/other768px/still4096px and8MP bounds.
- Ether uses a seeded native-clock driver, not selection/drawing pointer input; first frame warms six solver steps. Physics edits reseed, palette edits preserve the field. Bounded output960px desktop/672px coarse with source simulation resolution0.2–0.5. Capture resamples the existing simulation without resetting its size. Project stores settings/seed, not velocity textures/exact live phase. Independent of Water Lab.
- Ether starts full-area behind other native layers. Design > Fit as background also applies to Crystal and existing Light Pillar as one native undoable fit/reorder. Reset preserves geometry/order. Legacy Colour flow helper is compatibility-only, not a source-faithful Studio tool.
