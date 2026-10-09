# Shared AI work history

Use with `AGENTS.md` and `AI-HANDOFF.md`. Entries are append-only; correct mistakes with a new dated entry. Times use Asia/Bangkok. Older detailed history remains in `AI-HANDOFF.md` and Git/PR history; this file does not invent missing release evidence.

## Current work / ownership

- Owner: none. Claude released ownership after finishing everything handed over by Codex and the follow-ups: Animated Background (#327, #330), Line Sidebar (#325), UI overlap/smoothness/menu merge (#332), Threads Kit (#334), Aero Shards Kit (#336). No branch is in progress; `feat/native-line-sidebar-20261008`, `feat/animated-background-20261008` and the other feature branches are merged and can be ignored.
- Open caveats (see entries below): Liquid Ether is not frame-for-frame identical to the demo, the user's exact UI-overlap screenshot scenario was not reproduced, no real-device/Safari testing, Aero Shards has no pixel comparison with the WebGPU original.
- Before editing, claim a task here (branch, base, files) per `AGENTS.md`.

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

## 2026-10-08 Asia/Bangkok — Claude — UI overlap, background stutter, merged Mood & Poster presets (PR pending)

- User reports: (1) overlapping UI (Layers tray over the settings panel), (2) animated background presets stutter, (3) Mood and Poster presets should be one tidy menu.
- Stutter: measured main-thread frame times in headless software GL with `perf` harness (7 s, 1440x900): with Liquid Ether frames hitched up to 1.1-1.3 s (13 frames) and after changes max 0.3 s (42 frames), Light Pillar 1.35 s -> 0.25 s. Causes/changes: backgrounds no longer use the "selected" high-quality budget while Customize is open (canvas backing store 0.55 MP moving / 2 MP static, upscaled by CSS); Light Pillar background preview render cap 384/512/768 and default Quality back to Medium on desktop (High stays selectable; this reverses my earlier High default, deliberately, for smoothness); Liquid Ether load shedding: 1 sim step per frame and half solver iterations when frames arrive >42/55 ms apart, 3 steps (was 4) during build-up. Software GL numbers are a proxy; real-GPU smoothness untested.
- Overlap: a post-layout guard in `layoutTrays` pushes a stacked tray below the previous one if their real rectangles overlap, shrinks bottom trays that run under the side rails and caps rails (scrollable) when needed, and a ResizeObserver re-lays out when Layers/panel change size. Reproduced real overlaps at 320x640 (Layers over the Add rail) and 844x390 (Add/Decor rails over dock and Layers); none remain in the 1440/1024/390/844x390 checks. The exact user scenario (settings panel under an expanded Layers) was not reproduced locally; the guard covers any size growth after layout.
- Menu: "Mood" and "Poster presets" are one section "Mood & poster presets" with two labelled blocks (Mood: grid + Random look; Poster presets: grid); the Mood block is still hidden when no planet is shown, without hiding poster presets. Thai label added.
- Tests: `animated-background-ui.cjs` PASS 1440x900, 390x844, 844x390 (local, emulation); tray overlap probe at 6 viewports; screenshots reviewed. Live check pending the merge.

## 2026-10-08 Asia/Bangkok — Claude — overlap / smoothness / merged presets menu released

- PR #332 merged (merge `b19557850d8aa4463fd328f2c731d043485abd0c`), CI `build` succeeded, live bundle `assets/app.8697e2ab5d.js`.
- Live checks (headless Chromium emulation): `animated-background-ui.cjs` PASS 1440x900 and 390x844; tray overlap probe with Layers open and a background added: no overlaps at 844x390, 320x640, 1440x900. Smoothness numbers are software-GL proxies; real-device FPS, the user's exact overlap screenshot scenario and physical Safari/iOS remain unverified.
- Pending: Threads Kit checkpoint (`feat/kit-threads-20261008`), Aero Shards.

## 2026-10-08 Asia/Bangkok — Claude — Threads Kit (PR pending)

- New Kit object **Threads**: the React Bits Threads fragment shader copied verbatim (40 Perlin lines; source blend SRC_ALPHA/ONE_MINUS_SRC_ALPHA reproduced so alpha = value^2) in `src/effects/threads.js`, rendered through the shared stage renderer with async readback (no OGL, no own renderer/RAF/dependency); Kit category "Light & textures". Source: DavidHDev/react-bits `Backgrounds/Threads/Threads.jsx` (MIT + Commons Clause, notice in file header and template.html).
- Controls: colour, amplitude (source default 1), distance (0), plus Studio additions Start time (offset of the source clock) and Pointer X/Y (the source's smoothed pointer value, static in Studio; source "mouse interaction" follow is not exposed because the Kit loop has no pointer feed and it would disturb selection). Native Motion drives `iTime` (default amount = 1x source clock). Preview render caps 960 (selected)/512 px, 1 MP.
- Earlier "mobile check failing" was a test sampling artifact (hash ignoring alpha/colour); fixed in the fixture. Tests (headless Chromium emulation): Kit list entry, pixels drawn, every control changes the output and restores, Undo/Redo, snapshot restore, 1x export size, no page errors at 1440x900, 390x844, 844x390, 820x1180. Software-GL frame times: p50 ~180-300 ms vs 83 ms without it (shader is heavy by design; no hitches), real GPU untested.
- Not done: Aero Shards (2000-line vgpu source). Live check pending the merge.

## 2026-10-08 Asia/Bangkok — Claude — Threads Kit released

- PR #334 merged (merge `77c4a9588044c083b63ccb1ad8725102b8edcbc3`), CI `build` succeeded, live bundle `assets/app.e44c6cd750.js` on https://icelolan-ai.github.io/planet2/.
- Live check (headless Chromium emulation): Threads in the Kit list, draws, every control changes output, Undo/Redo, restore, export size at 1440x900 and 390x844 — PASS, no page errors. Real-GPU smoothness untested.
- Pending: Aero Shards only (large vgpu source; not started).

## 2026-10-08 Asia/Bangkok — Claude — Aero Shards Kit (PR pending)

- New Kit object **Aero Shards** in `src/effects/aero-shards.js`: the source WGSL (procedural shard paths, per-shard lighting/ACES, bloom prefilter + 5-tap blur, dither/ASCII styles, chromatic aberration/grain finishing) ported line by line to GLSL ES 3.00 on the shared Three/WebGL stage renderer (instanced draw via `gl_VertexID/gl_InstanceID`, premultiplied blending, half-float bloom targets). No WebGPU, vgpu, new renderer, RAF or dependency. Source: DavidHDev/react-bits `Backgrounds/AeroShards/AeroShards.jsx` (MIT + Commons Clause; notice in file header and template.html).
- Controls kept from the demo page (names/defaults/ranges verified against the live demo Customize panel and the JSX): background/shard/accent colours, placement, flow, material, detail, effect, scale, spread, depth, speed, spin, density, shard size, stretch, turbulence, glow, edge softness, bloom, grain, chromatic aberration. Studio addition: Quality (low/medium/high instance counts 1900/3200/4600; default low on touch). Omitted because a Kit has no pointer: interaction/radius/strength, ripple intensity, hold to gather, transition duration (placement/flow changes snap instead of easing) and Paused (use the Kit's Motion toggle).
- Deliberate differences: deterministic Kit clock (`flowDistance = t*speed*0.34`, travel phase from the same clock) instead of accumulated frame time; the source's `@interpolate(flat, first)` triangle colour is evaluated at every vertex (inputs are per instance/facet so the value is identical); ASCII/dither passes emulate WebGPU's top-left pixel origin; output is opaque (the source paints its background colour); preview render cap 1024/640 px and ~1.2 MP, capture up to 4096/8 MP.
- Verification limits: I could not render the original WebGPU component in headless Chromium (its canvas stayed blank), so there is **no pixel comparison with the demo**; fidelity rests on the line-by-line port and on visual plausibility. Tests (headless Chromium emulation, local build): no shader/compile errors on first use of every pass (shards, bloom, blur, finish, dither, ASCII), every control changes the output (spin only changes with motion on — verified separately and deterministic), all placement/flow/material/effect/quality options render, Undo/Redo, restore, 1x export size; 1440x900 full sweep, 390x844 / 820x1180 / 844x390 render checks. Software-GL frame p50 ~170-180 ms vs 83 ms without it, no hitches; real-GPU smoothness untested.

## 2026-10-08 Asia/Bangkok — Claude — Aero Shards Kit released

- PR #336 merged (merge `ca2814a46c39516e8527551afaba8da414ab5456`), CI `build` succeeded, live bundle `assets/app.2d3857df33.js` on https://icelolan-ai.github.io/planet2/.
- Live check (headless Chromium emulation): no shader errors, draws, every control changes output (spin only with motion on), Undo/Redo, restore, export size at 1440x900; render checks at 390x844. Still no pixel comparison with the WebGPU original and no real-GPU/iOS testing.
- Remaining: none queued. Open caveats: Liquid Ether vs demo look, UI-overlap user scenario, real-device smoothness.

## 2026-10-09 Asia/Bangkok — Claude — Studio opens on an empty canvas; "Crimson void" background (PR pending)

- User request: Studio should open with nothing selected and no objects (not even Cerebra) so the user adds Cerebra/other planets themselves, as the default; background (and the page before Studio) restyled like two attached web-design references (near-black navy, crimson glow/particles, cold corner glow, dotted floor to a thin horizon). Branch `feat/studio-empty-canvas-20261009`; files `src/template.html`, `src/effects/studio-launch.js`, `src/effects/studio-guide-language.js`, `docs/qa/studio-empty-canvas-ui.cjs`.
- Behaviour: first Studio session starts with preset `discovery` (no poster text), the planet layer hidden (`showSubject=false`), nothing selected. An empty-state card ("Empty canvas": Add Cerebra / Add another world) shows while the planet is hidden and there are no non-background objects; picking from the dock's subject select also reveals the planet; Reset canvas returns to the empty default; entering Studio from the Atelier with a chosen world still shows that world; Undo/Redo, projects and drafts keep working (hint re-syncs on restore). Existing sessions/drafts keep their own content.
- Background: new Studio background mode "Crimson void" (`paintDiscovery`, seeded canvas painting so preview, export and thumbnails match; bgA base, bgB accent): dark navy gradient, cold blue corner glow, crimson haze, bokeh, dust, perspective dotted floor and a horizon line, vignette. The pre-Studio hub page (`.cl-page`) gets the same look in CSS (fixed gradients, dotted floor via a masked perspective pseudo-element, horizon line); reduced to CSS only, no new RAF. Interpretation note: "the page before Studio" was taken as the guide/hub dialog; the gateway "choose mode" screens were not restyled.
- Tests (headless Chromium emulation, local build): new fixture `docs/qa/studio-empty-canvas-ui.cjs` PASS at 1440x900, 390x844, 820x1180, 844x390 (empty state, add Cerebra from the card, Undo returns to empty, empty export has the background); `animated-background-ui.cjs` PASS 1440 and 390; `line-sidebar-ui.cjs` PASS 4 viewports. Screenshots reviewed. Not pixel-compared to the references (they are mood references); live check pending the merge.

## 2026-10-09 Asia/Bangkok — Claude — QA fixture screenshot paths fixed, stray files removed

- Three fixtures I added (`kit-aero-shards-ui`, `line-sidebar-live-ui`, `studio-empty-canvas-ui`) built the screenshot path with a broken quote, so running them from the repo wrote PNGs into a directory literally named `'+(process.env…)+'`; three such files (`ls-live-*.png`) had been committed in PR #325, plus an older stray `$S/dbg.png`. All four files are removed and the fixtures now use `${SHOT}` (= `QA_SCREENSHOT_DIR` or the OS temp dir). Verified by running the empty-canvas fixture: screenshots land in the given directory and the repo stays clean. Docs/behaviour otherwise unchanged. The Studio empty-canvas change itself was released in PR #338 (live `app.dc5a0bd08e.js`; live fixture PASS at 1440x900 and 390x844).

## 2026-10-09 Asia/Bangkok — Claude — Studio planet lifecycle: delete, add fresh, 3D-file-ready menu (PR pending)

- User request: in Studio the user can delete Cerebra/other planets from Layers and add Cerebra/other planets; adding must start from the planet's factory defaults (nothing from the previous planet); the add-planet menu must be ready for opening/adding 3D files later. Branch `feat/studio-planet-lifecycle-20261009`; files `src/template.html`, `docs/qa/studio-planet-lifecycle-ui.cjs`, docs.
- Model: still one planet on the stage at a time (the engine renders a single subject); the existing planet layer item is never destroyed — Delete marks it `deleted` (+ hidden) so Undo/Redo, projects and drafts keep working, and Add clears the flag. Delete: trash button on the planet's Layers row, Layer > Delete planet, or removeItem. Add: Layers "+ Planet" button, Layer > Add planet…, the empty-canvas card ("Add Cerebra", "More planets / 3D file…") and the dock subject select while no planet exists. Adding while a planet exists replaces it (one undo step with planet look restored).
- Factory defaults on add (`resetSubjectDefaults`): Cerebra core Tune + surface style (`CerebraTune.reset`, `resetFx`), a world's tune (`WorldTune.resetWorld`, new, uses `World.TUNE_DEFAULT`, its tilt and ripple defaults), layer flags, pan/zoom, and the planet layer's opacity/group/lock/blend/rotation/keyframes/name. Opening Studio from the Atelier with a chosen world keeps that world's current look (explicit user choice). Switching planet with the dock select while one exists keeps each world's saved look as before.
- Future 3D files: `window.CerebraStudioPlanets.register({ id, label, labelTh, hint, available(studio), add(studio) })` appends entries to the Add-planet menu; "Open 3D file…" is already reserved (disabled, "soon") and is replaced when a loader registers under id `file3d`. No loader or file import exists yet.
- Cosmetics: panel heading shows "No planet yet" and the dock select shows "—" while the canvas has no planet.
- Tests (headless Chromium emulation, local build): `docs/qa/studio-planet-lifecycle-ui.cjs` PASS at 1440x900, 390x844, 844x390, 820x1180 — menu lists Cerebra, 7 worlds and the disabled 3D entry; add; customise (theme, layer flags, opacity, pan); delete from Layers; Undo restores, Redo deletes; re-add equals the first default (Tune snapshot, layer flags, opacity, pan) ; add world 0 then delete; no page errors. `studio-empty-canvas-ui` and `animated-background-ui` still PASS at 1440. Live check pending the merge.
- Limitations: one planet at a time; world look tested only for add/delete (not every world's tune values); physical devices untested.

## 2026-10-09 Asia/Bangkok — Claude — Studio planet lifecycle released

- PR #340 merged (merge `9b90be9ee937a0d79488b1c259f9927eaa98a9ec`), CI `build` succeeded, live bundle `assets/app.19074dce3e.js`. Live `studio-planet-lifecycle-ui.cjs` PASS at 1440x900 and 390x844 (headless Chromium emulation; add menu, add, delete, Undo/Redo, factory-default re-add). No 3D loader exists yet; use `CerebraStudioPlanets.register`. Physical devices untested.
- Still open from the earlier list: Liquid Ether vs demo look, new Kit objects from the roadmap (Lightfall, Galaxy, Hyperspeed, …), real-device smoothness measurements.

## 2026-10-09 Asia/Bangkok — Claude — Empty-canvas card close button; ghost planet selection ring fixed (PR pending)

- User reports: the "Empty canvas" card needs a close (×) button; after deleting Cerebra/a planet an invisible selection circle with corner handles (the multi-select box + planet ring) remained.
- Cause of the ghost: Select-all/marquee left `multiPlanet` (and the planet ring/box) set; deleting or hiding the planet did not clear it and `planetCircle()` kept reporting a circle from the last frame. Fix: deleting/hiding the planet clears `multiPlanet` and `selMode`; `planetCircle()`/`onPlanet()` return nothing when no planet is present or it is hidden; Select-all only includes the planet when it is present.
- Card: × button (40 px, aria-label, EN/TH); closing keeps it closed until a planet exists again; the Layers "+ Planet", Layer menu and dock select still add planets while it is closed. Branch `fix/empty-card-close-planet-ring-20261009`, file `src/template.html`, fixture `docs/qa/studio-planet-lifecycle-ui.cjs` extended (select-all then delete → no ring/box/multiPlanet; card closes and stays closed).
- Tests (headless Chromium emulation, local build): lifecycle fixture PASS 1440x900 and 390x844; empty-canvas fixture PASS; screenshots reviewed. Live check pending the merge.

## 2026-10-09 Asia/Bangkok — Claude — Empty-card close + ghost ring fix released

- PR #342 merged (merge `804a6cd59db9d56a24ce7f3755a25abe6b15b553`), CI `build` succeeded, live bundle `assets/app.2d2e2055b4.js`. Live `studio-planet-lifecycle-ui.cjs` PASS at 1440x900 and 390x844 (headless Chromium emulation): no ring/box/multiPlanet after select-all + delete, card closes and stays closed. Physical devices untested.
