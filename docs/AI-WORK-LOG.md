# Shared AI work history

Use with `AGENTS.md` and `AI-HANDOFF.md`. Entries are append-only; correct mistakes with a new dated entry. Times use Asia/Bangkok. Older detailed history remains in `AI-HANDOFF.md` and Git/PR history; this file does not invent missing release evidence.

## Current work / ownership

- Owner of both items below: Claude (took over from Codex on 2026-10-08; Codex released ownership at 20:14 Asia/Bangkok).
- **Task A (active, this change): real full-frame Animated Background** (Liquid Ether / Light Pillar). Branch `feat/animated-background-20261008` from main `d262704`. Files: `src/template.html`, `src/effects/studio-scene-effects.js`, `src/effects/liquid-ether.js`, `src/effects/light-pillar.js`, `src/effects/studio-guide-language.js`, `docs/qa/animated-background-ui.cjs`, docs.
- **Task B (queued, separate PR): Line Sidebar.** Resume PR #325 / branch `feat/native-line-sidebar-20261008` (checkpoint `650012ac…`, plus Claude claim commit `5c0d2ef` merging main docs). Touches `src/effects/line-sidebar.js`, `studio-launch.js`, `template.html`, `build_web.py`. Task A also edits `template.html`; Task B must be rebased/merged onto main after Task A lands. No Line Sidebar product code was changed by Claude yet.
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
