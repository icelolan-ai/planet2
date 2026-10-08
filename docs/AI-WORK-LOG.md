# Shared AI work history

Use with `AGENTS.md` and `AI-HANDOFF.md`. Entries are append-only; correct mistakes with a new dated entry. Times use Asia/Bangkok. Older detailed history remains in `AI-HANDOFF.md` and Git/PR history; this file does not invent missing release evidence.

## Current work / ownership

- Owner of both items below: Claude (took over from Codex on 2026-10-08; Codex released ownership at 20:14 Asia/Bangkok).
- **Task A: DONE and live** (PR #327, see entry below). 
- **Task B: DONE and live** (PR #325 merged, see entry below).
- No active task (background fix released). Next: new Kit objects (Threads/Aero Shards) — claim in this section before editing.
- Kit objects (Threads/Aero Shards) are not started; wait until A and B are closed.

## 2026-10-08 — Codex — PR #323 released

- PR: https://github.com/icelolan-ai/planet2/pull/323 (merged).
- Source commit: `a0e8c0d8f6ba8dc75e138044af8eae321d03692b`; merge: `09baabbda4c95b377983951d6915297ad784816a`; generated release: `4d553369aadda382d5e934896b7505df39c69311`, bundle `assets/app.fc1b59c068.js`.
- Liquid Ether and Light Pillar moved from Kit buttons into Image > Animated background presets. Presets create native full-area background Kit layers; old projects remain supported. Kit has four categories; Design separates shape/colour/appearance; Motion is two columns on desktop and one on narrow screens. Native layers, history/project and reset remain owners.
- Validation: build/syntax/diff; actual local and final deployed Chromium desktop 1440x900/mobile 390x844 gateway/guide/Studio, presets, Design sliders, Undo/Redo, project snapshot/restore, replacement, Kit reset/folding and responsive Motion layout. No application errors in focused fixtures.
- CI 37778569149 and final Pages 37778675672 succeeded. Physical Safari/device FPS were not tested. Line Sidebar and additional Kit objects remain separate work.

## 2026-10-08 — Codex — Line Sidebar checkpoint, user requested Claude handoff

- New source adapter preserves original buttons/summary identities and native active state in guide chapters, Studio section headings and web section rail. React Bits source falloff/smoothing is adapted through the existing GSAP ticker; no new renderer/RAF/dependency/project schema.
- Source references: JSX blob `844164c170320cfa59997cb098959b3bf3be3429`, CSS blob `d05dadf4ca2fb486b0b4e923fe23f092ced35418`, demo blob `6e0785266629e5b1622b01d2f5e07e1f85b21d27` in DavidHDev/react-bits. Compact pink markers, native typography/mobile horizontal chapter layout are intentional adaptations.
- `studio-launch.js` changes localization and guide catalogue heading extraction to retain marker/index wrappers, and allows toolbar captions to wrap without overlap. Build order places `line-sidebar.js` after `studio-stepper.js`.
- QA reached desktop guide pointer/keyboard, EN/TH, falloff targets, settled ticker/reduced motion and Studio folds/presets/localization. The full fixture FAILED at section-rail navigation; therefore no full viewport PASS or live release is claimed.
- Last edit: `Glide.to(top)` routes fine-pointer section commands through the existing wheel-scroll owner, addressing the race between browser smooth scroll and native idle snap. This last fix has only passed build/syntax/diff, and has NOT been rerun through the UI fixture. Verify touch/reduced-motion fallback as well.
- Latest checks: `python3 src/build_web.py`, `node --check src/effects/line-sidebar.js`, `git diff --check` passed. Generated local bundle `assets/app.f49a7f297c.js` is temporary and must not be committed.
- Fixture freezes the stage renderer after the initial visible gateway to avoid software-GPU overhead. It verifies UI state only, not effect pixels, hardware performance or complete rendering. Perform unfrozen rendering/live checks before release.
- Remote checkpoint is for review/takeover, not completed release. Codex stops product edits after publishing this handoff to avoid overlap.

## 2026-10-08 — Codex — shared history workflow

- Added repository-wide `AGENTS.md`, this work log and matching `CLAUDE.md` rules. Updated the latest handoff with released/pending status and takeover steps.
- Every future completed task/fix must record owner, files, commit/PR, actual tests, release evidence, limitations and next steps. Before editing, check other active work and publish a claim. Switching AI requires a published checkpoint and explicit ownership release.
- Documentation validation: relative links/files and `git diff --check`; no product behavior is changed by these rules.

## 2026-10-08 20:14 Asia/Bangkok — Codex — handoff published, ownership released

- Shared AI history/rules merged via https://github.com/icelolan-ai/planet2/pull/324, source `1aef0d50703c4b303853bc586253f86bb9918729`, merge `ab360cca381b52a25fd82b885cf92449c28b8d53`. Documentation only; production source/bundle unchanged. No product release is implied.
- Exact source checkpoint published via https://github.com/icelolan-ai/planet2/pull/325, commit `650012ac6660bac396cb06de025d43f61f7f86f4`; all five uploaded source/fixture blobs matched local git hashes. The PR is open/WIP and must stay unmerged until remaining QA passes.
- Codex releases the Line Sidebar task and stops product edits. Claude must claim ownership and merge latest main documentation into the checkpoint before continuing. No new Kit object work was started.
- Handoff references/status checked and fixture syntax/diff checks passed. UI and live QA for the final scroll fix remain pending as documented above.

## 2026-10-08 21:16 Asia/Bangkok — Claude — Animated Background as a real layer (PR pending; NOT yet released)

- Owner: Claude. Branch `feat/animated-background-20261008`, base main `d262704`. PR/merge/deploy state is recorded in the handoff once done; until then this is unreleased.
- Liquid Ether / Light Pillar are no longer enlarged Kit objects. An item with `bg:true` (still a `kit` item, so the existing renderer, page clock, compositor, history, project JSON and export are reused; no new renderer/RAF/dependency) now: always takes the visible frame (`placeBase` recomputes x/y/w/h, rot 0, no spin), counters the stage shift with a synced `translate`, ignores pointer events (cannot be selected/dragged/resized/rotated from the canvas, excluded from marquee/select-all/layout targets, no edit/rotate handles, no selection bar), is pinned to the bottom by `stackDom` and cannot be dragged in the Layers list, and is exported with the exact frame rectangle. Only one background exists; choosing the other replaces it in one Undo step.
- UI: Image > Animated background presets selects/replaces the background and opens Customize immediately; a Background list (name, Customize, Turn on/off, Remove) re-opens Customize without recreating it and keeps values. Customize groups: Colour / Appearance / Motion / Interaction / Quality, two columns on wide screens, one on narrow, numeric outputs, per-tool Reset, EN/TH.
- Migration: old projects with `liquidEther`/`lightPillar` items that came from the template (`tpl`) or cover >=80% of the frame become backgrounds (parameters, opacity, seed kept); smaller ones stay ordinary objects and show "Convert to background". Crystal Ball keeps its previous "Fit as background" button.
- Source comparison (DavidHDev/react-bits main, MIT + Commons Clause, copyright David Haz; notice in the source files retained; LiquidEther.jsx / LightPillar.jsx read 2026-10-08): added the missing Liquid Ether controls `autoDemo`, `takeoverDuration`, `autoResumeDelay`, `autoRampDuration`, and "Follow pointer" for both effects. In Studio the seeded auto path now honours Auto animation, pointer takeover, resume delay and ramp. Differences kept on purpose: pointer following defaults OFF and is fed only by mouse/pen hover over empty canvas (never touch, buttons held, drawing or dragging) so it cannot disturb selection/drawing; Light Pillar glow default .002 (source .005) and Studio clamped ranges were already in place; fluid momentum persists after Auto animation is turned off (decays by viscosity like the source); Light Pillar uses the existing shared WebGL renderer.
- Validation actually run (headless Chromium software GL, device emulation, NOT physical iOS/Safari): build, `node --check`; fixture `docs/qa/animated-background-ui.cjs` at 1440x900, 390x844, 820x1180, 844x390 with the real unfrozen renderer: select/replace/re-select keeps values, geometry equals the viewport after rotating/resizing, canvas drag/click does not select or move it, zoom/scale/stage-shift keep it in frame, hide + Undo/Redo, snapshot restore, legacy-project migration, export 1x frame size, Thai manager text, no page errors. Control sweep (motion off, deterministic): every visible control changes pixels except those that need motion/pointer/light-mode; those were verified separately with motion on / real mouse moves (speed 0 stops Pillar, pulse moves, pointer on/off, Ether pointer, autoDemo on vs off).
- Not tested: physical iPhone/iPad/Safari, hardware FPS, long video export. Live Pages check pending the merge.
- Remaining: merge PR + live desktop/mobile check; then Task B (Line Sidebar PR #325); then new Kit objects.

## 2026-10-08 21:30 Asia/Bangkok — Claude — Animated Background released

- PR #327 merged (merge `0726e95a2961b3b14f17f633a872a68f78123a08`, source `53a3ad2`); CI `build` succeeded; generated main `af1ef9e`, live bundle `assets/app.a11a652b97.js` confirmed on https://icelolan-ai.github.io/planet2/.
- Live check: `docs/qa/animated-background-ui.cjs` against the deployed site, headless Chromium device emulation (not physical devices), desktop 1440x900 and mobile 390x844 PASS (select/replace/keep values, frame-exact geometry, no canvas selection, zoom/shift, undo/redo, restore, legacy migration, export size, Thai, no page errors). Tablet 820x1180 and landscape 844x390 passed on the local build only.
- Still pending: Line Sidebar (PR #325, Claude-owned; rebase/merge main first, rerun `line-sidebar-ui.cjs` and unfrozen checks), then new Kit objects. Physical Safari/iOS and hardware FPS untested.

## 2026-10-08 22:00 Asia/Bangkok — Claude — Line Sidebar verified (PR #325; release status in the next entry once merged/live)

- Resumed Codex checkpoint `650012ac`; merged main (Animated Background) — no code conflicts, only the work-log doc (took main's, re-recorded here). No new Line Sidebar code was needed: the final `Glide.to` command fix works.
- Local build tests (headless Chromium software GL, device emulation, not physical devices): `docs/qa/line-sidebar-ui.cjs` PASS at 1440x900, 390x844, 820x1180 and 844x390 (guide chapters mouse/Enter, EN/TH, falloff, reduced-motion fallback in guide, Studio section folds/presets/localization, rail click and focused Enter reach sections 1 and 2, no overflow, no page/console errors). New `docs/qa/line-sidebar-live-ui.cjs` with the renderer NOT frozen: desktop, desktop reduced-motion and mobile 390x844 touch — rail click, Enter, wheel, touch swipe (CDP touch events), return to section 1 and no horizontal overflow all pass, no page errors.
- Baseline comparison on main: rail buttons did not navigate at all before this PR (scroll stayed 0). Wheel and touch scrolling are identical to main (same values); in reduced-motion a wheel at ~section 3 is ignored identically on main (pre-existing, not changed here).
- Notes: Glide travel from section 3 back to 1 takes ~3 s under software GL; test waits accordingly. Physical iOS/Safari/hardware FPS untested.

## 2026-10-08 23:00 Asia/Bangkok — Claude — Line Sidebar released

- PR #325 merged (merge `907a35e693aa141b3ff7f9a526ac149174228ec3`); CI `build` succeeded; generated main live bundle `assets/app.01858defcf.js` confirmed on https://icelolan-ai.github.io/planet2/.
- Live checks (headless Chromium device emulation, not physical devices): `line-sidebar-ui.cjs` PASS at 1440x900, 390x844, 820x1180, 844x390; `line-sidebar-live-ui.cjs` (renderer running) PASS for desktop, desktop reduced-motion and mobile touch, run one case at a time (a concurrent run once stalled a click under software GL; not reproduced alone).
- Known/pre-existing: reduced-motion wheel is ignored near section 3 identically on main; Glide travel across sections takes ~3 s. Physical iOS/Safari and hardware FPS untested.
- Pending: new Kit objects only (Threads/Aero Shards) — not started.

## 2026-10-08 23:50 Asia/Bangkok — Claude — Animated Background: visibility and demo-fidelity fix (PR pending)

- User report: presets did not look like the React Bits demo, and Cerebra / the effect was hidden. The linked page (`/components/masonry`) is a gallery component, not a background; I compared against the Liquid Ether and Light Pillar demo pages instead (screenshots taken 2026-10-08, demo controls and defaults read from the pages and from LiquidEther.jsx / LightPillar.jsx).
- Cause of "hidden": the Customize panel (600 px wide, up to full height) covered the artwork; on 390x844 it covered the whole screen. Now it is a bottom sheet (<=42% height, first section open) on narrow screens, a half-width side sheet on short landscape screens, and 520 px wide on desktop. Planet order was already correct (background under Cerebra).
- Liquid Ether look: the Studio driver was a Lissajous loop at 30 fps (fat flat blobs). It is now the source AutoDriver logic on a seeded virtual clock: random targets inside the 0.2 margin, `autoSpeed` units/s, smoothstep ramp, 60 steps/s (2 per page frame, 4 during the first ~3 s so a new layer fills in without one long blocking frame; initial warm-up 30 steps desktop / 16 coarse instead of an earlier 120/60 that froze software GL). Simulation/output shaders unchanged (previous byte-exact check stands).
- Light Pillar: default Quality is High on non-touch devices (source default); added Blend mode (Normal/Screen/Lighten/Overlay/Soft light/Colour dodge/Plus lighter; default Screen).
- Demo control comparison: Ether demo shows Colour 1-3, Mouse force 20, Cursor size 100, Resolution 0.5, Auto speed 0.5, Auto intensity 2.2, Pressure 32, Bounce, Auto animate, Viscous, Viscous coef 30, Viscous iterations 32 — all present (plus Studio extras BFECC, step, light background). Pillar demo: Top/Bottom colour, Intensity 1, Rotation speed 0.3, Glow 0.002, Pillar width 3, height 0.4, Noise 0.5, Pillar rotation 25, Interactive, Mix blend, Quality — all present.
- Limitation: I could not run the original React demo and ours frame-for-frame; fluid motion is random-target driven, so a given instant never matches the demo exactly, and the headless software-GL runs show a slower flow than real GPUs. Visual match on a physical device is unverified.
- Tests: `animated-background-ui.cjs` PASS at 1440x900, 390x844, 820x1180, 844x390 (local build, emulation). Live check pending the merge.

## 2026-10-08 00:30 Asia/Bangkok — Claude — Background visibility/fidelity fix released

- PR #330 merged (merge `dfcecb94cac8126a6eff24d74471202f0f2ef5b1`), CI `build` succeeded, live bundle `assets/app.eb570ecfc6.js` on https://icelolan-ai.github.io/planet2/.
- Live `animated-background-ui.cjs` PASS at 1440x900 and 390x844 (headless Chromium emulation); the 390x844 screenshot shows the Customize bottom sheet with Cerebra visible above it. Not tested on physical devices; the fluid is still not a frame-for-frame match of the React Bits demo (random-target driven; large cursor footprint on narrow screens follows the source's cell-based size).
