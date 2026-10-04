# Effects modules

Keep this directory modular. One file should own one feature or one narrowly related behavior.

## Current ownership

- `core.js` — shared Effects registry.
- `surface.js` — Surface Style renderer and style-specific parameters.
- `surface-shapes.js` — Base Shape deformation for generated surfaces.
- `surface-tune-core.js` — Surface-aware Tune Core UI.
- `studio-menu-fix.js` — Studio menu exclusivity and drawing-panel collapse only.
- `s7-brush.js` — Tentacle, Branch and symmetry drawing behavior.
- `runtime-compat.js` — temporary compatibility loader for the legacy GitHub Pages split bundle. Do not add feature logic here.
- `s9-core.js` — S9 rendering/runtime state.
- `s9-ui.js` — S9 user interface/project/onboarding.
- `camera.js`, `fog.js`, `formation.js`, `hologram.js`, `burst.js`, `post-stack.js`, `diagnostics.js` — isolated rendering/effect modules.

## Dependency notes

- `core.js` must load before modules that call `Effects.register`.
- `surface.js` must load before `surface-shapes.js`.
- Feature files should be safe against duplicate initialization.
- Do not put deployment/cache workarounds inside renderer or UI feature logic; keep them in `runtime-compat.js`.

## Naming

Prefer descriptive feature names over milestone-only names for new work. Existing milestone files remain for compatibility but new functionality should not be appended there unless it belongs to that feature.

## Change rule

If a change touches more than one feature, keep the implementation separated by file and document the cross-feature dependency in `docs/ARCHITECTURE.md`.
