# AI Handoff Guide

## 2026-10-08 — continuous gateway and paths gestures

- The gateway previously swapped `minmax(0,1fr)` and pixel rows and changed selected content only on pointer release: grid interpolation was discrete and copy/buttons appeared abruptly. `WorldAtelier.paintGateway` now drives explicit pixel rows, font size, optical scale, grayscale, detail height and opacity from one bounded progress value. Touch/mouse drag follows position immediately; the existing GSAP runtime settles selection over 0.7s. Cancel restores the prior route. Wheel movement updates progress, then settles after the burst; a normal notch still advances to the next route. Keyboard/tap selection uses the same interpolation. No extra renderer, RAF or project state.
- Enter stays disabled for partially expanded cards and the native gateway retains keyboard focus if the focused Enter becomes disabled. Launch is blocked while dragging/settling, preventing accidental route activation. Returning from paths maps the legacy none state to Create in the balanced selector. Resize recomputes pixel rows; reduced-motion settles without autoplay. Existing world asset routing and actual Enter-only launch remain intact.
- `studio-launch.js` also interpolates Studio / How to use / Explore path row height, padding, title size and description while dragging, then settles over 0.65s. Bound selection at list ends rather than wrapping abruptly. Reuse native selection/guide/Studio handlers; commit aria selection only at settlement. Ignore Back/language/background controls for gestures.
- Local Playwright Chromium (Browser plugin unavailable): desktop 1440x900 and touch 390x844, real CDP touch moves while the finger is held. Five intermediate gateway samples grow the lower card monotonically and enlarge its title while the prior route remains selected. Cancel, wheel/eased snap, intermediate keyboard frames, empty-area no-launch, growing How to use row, Guide/Studio/Exit/Back, reduced motion and Enter bounds at tablet 820x1180, landscape 844x390 and narrow 320x640 pass. No relevant page/console errors. World GLBs held during focused menu/Studio tests; this is not a physical-device FPS benchmark. Repeat live desktop/touch after Pages deployment; physical iOS Safari remains untested.

## 2026-10-08 — actual Light Pillar Studio Kit

- Kit → Light Pillar now uses the same full upstream ray-march shader as the page backdrop. Source Customize controls: top/bottom colours, intensity, rotation speed, glow, pillar width/height, noise, pillar angle, low/medium/high quality and light mode. Layer blend uses native Layers → Blend mode; default screen reproduces the upstream light contribution. Studio pointer interaction is intentionally disabled so moving/selecting artwork does not alter saved renders.
- Shared stage renderer and native Kit loop/clock/history/project/capture paths. No new context or animation owner. Moving reads are asynchronous with at most one pending frame per destination context; completed frames are painted by the native loop. Source quality changes ray count/precision; raster bounds are 512/768/1024px for moving low/medium/high, 2048px for still/export. Page raster bounds and timing remain unchanged.
- Native opacity, spin, Motion flow/pulse, timing, Reset Design & Motion, wider responsive Design panel and edge toolbar all apply to the new tool. Persist only Kit parameters and native item state. Independent upstream comparison at equal size returned max byte difference 0 for all three qualities, dark/light. Desktop 1440x900 and touch 390x844: all exposed appearance sliders/colours, Reset/Undo/Redo, zero speed, asynchronous movement, layer hide/show and real project export/import passed locally; same-size export comparison allows one byte of Canvas2D rounding. Full poster and MP4 capture passed. Page controls, fullscreen, guide/Studio/Exit/planet routes and Enter with world assets held passed regression checks. No page/console errors in focused fixtures. Repeat live desktop/touch after Pages deployment before reporting release; physical hardware performance and iOS Safari remain untested.

## 2026-10-08 — edge toolbar, wider Kit Design, reset and Lab layers

- Selection quick tools are pinned at the lower-left edge above the dock, rather than following an object's bounds. Hide behind open editing panels. Kit/text/shape flyouts fall back to the Edit menu anchor if their context-bar button is hidden or outside the viewport. VisualViewport, rails and dock still constrain the panel.
- Every Kit Design uses a 600px maximum panel and two responsive columns for parameter cards and Motion. Titles, headings, nested sections and multiline text span the panel; below 468px available width, cards become one readable column. Object scale does not move the panel out of the viewport.
- Kit Reset Design & Motion restores the complete definition defaults, opacity/fill/blend/seed and shared rotation/motion/timing. Preserve object placement and layer membership. Native snapshot Undo/Redo works. Shape/text Design have reset buttons; main Reset offers a reversible all-object Design/Kit reset. Reset everything retains its existing confirmation/destructive scope, now also closes stale panels and resets drawing preferences and page backdrop controls.
- Water Lab and Particle Flow own native FX layer rows. Enable creates one row, disable/delete removes it, and eye/group visibility and layer opacity reach the shared-renderer meshes. Restoring Lab state before native composition restore preserves row opacity/group/hide values. Lab back/front control updates the native planet-relative stack; layer restacking across the planet changes the render side. Existing fluid checkpoints and project state remain unchanged.
- Meta Balls/Laser cached intermediate images are isolated per destination Canvas2D context, so export/thumbnail dimensions cannot overwrite the on-screen cache. Async completed frames are painted by the existing Kit loop. Static-frame QA allows a maximum one-byte Canvas2D premultiplication rounding difference; independent upstream shader and same-size export comparisons remain exact.
- Local Chromium QA: desktop 1440x900 / 1920x1080, touch 390x844, tablet 820x1180, landscape 844x390 and narrow 320x640. Large-object panel bounds and responsive columns, edge toolbar, per-Kit and all-object Reset/Undo/Redo, Lab layer enable/hide/opacity/delete/Undo/planet-relative stack, full Reset including drawing/Lab/stale menus passed. Both shader source references and same-size exports differ by zero bytes; all exposed source appearance controls, motion, project roundtrip, full poster and MP4 passed. Desktop/mobile Kit transport makes no synchronous preview reads, bounds pending reads to one, and retains explicit raster/memory limits. No page/console errors in focused fixtures (external ISS telemetry stubbed). Repeat live desktop/touch after Pages deployment; physical hardware performance and iOS Safari remain untested.

## 2026-10-08 — Kit preview stalls / zoom resolution / collapsed group headers

- Meta Balls and Laser Flow moving previews use Three r186's `readRenderTargetPixelsAsync` (PBO/fence) through the existing renderer, at most one pending read per item. No second renderer or animation loop. Existing Kit loop presents completed cached frames under native extra-motion transforms; do not paint from promise callbacks. Reduced-motion, stopped layers and exports render synchronously. A ticket rejects stale async results after a synchronous export/stop/resize. Restore renderer target, viewport, scissor/test and autoClear before awaiting. Unsupported/failed async reads fall back to synchronous reads.
- Reuse the intermediate canvas/ImageData at unchanged dimensions for Meta Balls, Laser Flow and page Light Pillar; buffers resize only when needed. Source shader equations/parameters stay intact. Shader raster limit rises from 512px to 1024px for moving previews and 2048px for still/export. Native Kit canvases still have explicit memory budgets; extreme zoom is bounded, not unlimited resolution.
- When all Laser Flow source speeds are zero, set native shader time to zero as well: upstream lateral fog drift still reads time independently of fall speed. A cache rebuild or export must not animate an intentionally stopped frame. Default moving source/reference behavior is unchanged.
- Shared Kit loop yields after 6ms Lite / 10ms normal work and resumes round-robin; remove whole-loop `cost * 2.2` sleep which stalled light tools behind one expensive tool. Hidden layers no longer consume visible-layer pixel budget. Normal moving canvas budget is 1.5MP instead of .9MP; Lite retains .5MP. Preserve full drawing detail for selected tools; simplify unselected work only when busy / Lite. Avoid font promises for tools with no font.
- Layer rows use `grid-auto-rows:max-content` plus a 34px minimum group header (existing coarse-pointer overrides remain 48px). A constrained scroll container must scroll, never compress an overflow-hidden group header to a few pixels. Keep existing layer/tree/actions/Undo state.
- Repro/QA: old software-rendered Meta preview at 540px incurred a 914ms synchronous draw and slowed the lightweight Rings layer to two draws in the 2.5s measurement. New isolated Kit measurement made zero synchronous GPU reads, reused ImageData, bounded pending reads to one, and Rings continued 34–42 native draws. This is a software Chromium transport/scheduling check with the planet renderer paused, not a physical-GPU FPS claim. At 300% still zoom, desktop shader raster is 1620x1620 instead of 512x512; mobile is 585x585. Verify pending-read export/stop, native source pixel/export parity, project roundtrip, group collapse/hide/lock/delete/Undo, crowded narrow scroll panels, desktop and touch views before reporting release. Physical PC GPU / iOS Safari remain untested.

## 2026-10-08 — PC native pointer / viewport and page Light Pillar correction

- User screenshot shows the paths page constrained to a centred 1200px shell and a clipped backdrop. Remove the shell width cap for the hub; move the backdrop to the dialog viewport with no central mask. Guide copy retains its readable width. Restore native cursors globally by removing legacy `cursor:none` and hiding the legacy replacement; Target Cursor corners remain additive. Eraser retains a native crosshair.
- `viewport-controls.js` adds a user-gesture Full screen / Exit full screen button on paths/guide and a command in the native Studio View menu where Fullscreen API is supported. Preserve the native menuEntries object; wrap only its View function, not the catalogue object. Fullscreen changes invoke the existing resize path. EN/Thai labels and aria state track actual fullscreen state. Unsupported windows do not expose the action.
- `light-pillar.js` embeds the full upstream LightPillar ray-march shader, source quality profiles (24/40/80 samples, 1/2/4 waves), linear colour parsing and uniforms. Reuse stage WebGL renderer; restore target/viewport/scissor/test/autoClear. No extra renderer/animation owner/WebGPU. Page controls: colours, intensity, opacity, speed, glow, width/height, grain, rotation, pointer interaction, blend and quality, plus Reset. Settings are session-only, not Studio project state. Explicit build order before page-backdrops.
- Default page backdrop is now Light Pillar. Legacy sinusoidal colour flow remains separately named Colour flow, not falsely presented as a Liquid Ether fluid simulation. Actual Liquid Ether and Crystalized Ball corrections remain pending. Page scheduler pauses hidden pages/guide and reduced motion; effect raster bounded to 256/384/512px with 15fps page cadence. Initial backdrop is delayed 150ms to let navigation paint before shader compilation; does not gate entry on world assets.
- Reference ledger: the old 14 stroked gradients are replaced by the source distance-field/ray-march shader. Independent original shaders at 96x64/t=0 in all three quality profiles match native pixels with maximum byte difference 0, and custom renderer viewport/scissor state is restored. Intentional adaptations: shared renderer/raster bound, elapsed native page time instead of a new RAF, page opacity for readable menus, native pointer/touch state, default medium on fine pointer and low on coarse pointer. Theme-aware light mode is not exposed for this dark page.
- Validation: source build/syntax/diff, independent shader/state comparison, real parameter image changes, reset/styles/pointer/speed/reduced motion and language checks. Native cursor computed styles, full-width shell/backdrop, Fullscreen API entry/exit, native Studio View action, window resize, guide/Studio/Exit/planet routes tested with world GLBs held before entry. Complete desktop/mobile and live checks before reporting release; physical PC browser/GPU and iOS Safari remain untested.

## 2026-10-07 — Laser Flow source-shader fidelity correction

- Replaced `laser-flow.js`'s Canvas2D stroke approximation with the complete upstream fragment shader, source blob `977e160f9b2669beb96e179856dd1f5bb5a78c47` from `DavidHDev/react-bits/src/content/Animations/LaserFlow/LaserFlow.jsx`; studied `LaserFlowDemo.jsx` Customize and defaults. MIT + Commons Clause notice already embedded in template remains applicable.
- Native Kit Design: source colour, beam offsets/sizing, wisps, flow strength/speed, fog intensity/scale/fall speed, decay and falloff. Density restricted to useful 0.1–2 (shader clamps to 2, maps 0 to 1); intensity 0 disables wisps. Source speed controls also allow zero. English/Thai labels added. No fake glow/width sliders remain in the Design definition.
- Uses the existing stage renderer, bounded 512px offscreen target, cached native Kit composition and native Motion clock. No new renderer, RAF, storage or WebGPU. Target/viewport/scissor/test/autoClear restored in `finally`; GPU resources disposed on pagehide. Optical-alpha conversion + native Screen blend preserve the source opaque-black/screen light contribution, including fog, without an opaque black rectangle.
- `template.html` adds optional Kit `normalizeP` at native add/restore (all other definitions unchanged); legacy Laser origin/size/wisp/flow/fog/falloff keys migrate into source prop names before defaults are merged. Saved parameters, native undo/redo and project imports remain owned by CoreStudio. Legacy auxiliary keys retained, although the old approximate appearance is deliberately replaced.
- Reference ledger: old bezier, fake gradient haze and looped stroke wisps replaced by the source beam sampling, FBM fog and seeded wisp shader. Independent source shader at 320x256/t=0 versus native RGBA bridge: maximum byte difference 0; native Screen result on black versus source RGB: maximum difference 0. Meta Balls' independent shader check remains difference 0. Intentional differences: native transparent layer/Screen blend, native clock/amount and optional Pulse; no pointer-dependent tilt or one-time demo fade-in. Theme-aware light-background inversion and web-page placement remain pending, not claimed complete.
- QA route: gateway -> paths -> native Studio -> Kit -> Laser Flow / Meta Balls -> Edit/Design -> native file/capture paths. Browser plugin unavailable; installed Playwright Chromium used. Desktop 1440x900: all geometry/palette sliders, Motion stop/resume/styles, zero speeds, keyboard Undo/Redo, groups/hide/show/lock, actual .cerebra download/FileReader import, export layer parity (0), full poster and MP4 capture passed; tablet 820x1180 and short landscape 844x390 panel bounds passed. Touch/mobile 390x844 passed the same control/history/project/reference/parity checks with no page/console errors. Deployed desktop/mobile checks follow before completion. Software 3D held still only during independent parameter tests, restored for full poster/video and screenshots; not a device performance benchmark. Physical iOS Safari remains untested.

## 2026-10-07 — urgent Enter wait and Meta Balls fidelity correction

- Source branch `fix/entry-reference-fidelity-20261007`; the unshipped Part 2B worktree is preserved separately and is not admitted into this release.
- Root cause: Studio was constructed only after seven GLBs downloaded/decoded; launch paths additionally gated on `worldsReady`. Construct native Studio and AmbientDots before the gateway appears. Paths, guide and Cerebra editing no longer wait for world assets. AmbientDots must precede extensions that remove the old Tune reset pane. Native Close tolerates an absent Fab focus target before worlds finish.
- Planet routes retain their asset requirement, show progress without closing the hub and open after `cerebra:worlds-ready` if still requested. Background insertion pauses during Studio/capture; warm-up does not render over active Studio/capture. Subject options unlock when ready. Background errors emit `cerebra:worlds-error` and expose a reload message rather than an unexplained permanent wait.
- Replaced Meta Balls' 160px gradient raster with upstream shader/hash/orbit equations through the existing Three renderer and an offscreen render target. Native Kit clocks/state/history/project/composition remain in use; no extra renderer, RAF or WebGPU. Existing parameter keys retained; added animation area and idle cursor-ball radius. 50 balls, bounded 512px target, deterministic idle orbit and native Motion amount. Full MIT + Commons Clause notice embedded in template and generated page.
- Reference ledger: old gradient, evenly spaced motion and fuzzy raster edges differed from upstream; shader field/derivative edges and deterministic hashed orbits now match the source. The default transparent 256px frame was compared pixel-by-pixel with an independently loaded upstream fragment shader, maximum byte difference 0. Intentional differences: native layer controls, bounded target, deterministic idle cursor instead of live pointer following, optional breathe style. Other page/laser approximations remain pending and must not be called visually faithful.
- Validation: local build/syntax/diff; actual desktop 1440x900 and touch/mobile 390x844 gateway -> guide -> Studio -> File/Exit -> planets, with all world downloads held until after Studio closes. No renderer/update freezing in this entry test; no page errors after release and planet load. Independent Kit checks cover all exposed controls, Motion stop/resume, styles, Undo/Redo, group/hide/lock, real project export/import and native export-layer parity (difference 0). Software 3D is held still only for independent Kit checks, not entry/performance or full captures. Live Pages and full capture checks follow deployment. Physical iOS Safari remains untested.

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

## 2026-10-07 — bilingual guide/menu labels and swipe choices

- `studio-guide-language.js` supplies English/Thai copy and a session-only language controller. Fresh loads default to English. EN / ไทย selectors appear in paths, guide and Studio menu bar; switching retains the current guide chapter/query and does not modify project data, artwork text, layer names or input values. Technical Kit/effect identifiers remain recognisable. No external translation API.
- `studio-launch.js` translates all nine guide chapters, generated parameter explanations, toolbar captions, primary Studio menu labels and common control headings. Search indexes English and Thai explanations. Menu command handlers and state continue to use original identifiers; `template.html` renders translated command labels only. Build order explicitly places the dictionary before launch.
- Gateway is now a fixed-height vertical selector, with Create initially selected. Swipe up selects Explore; swipe down selects Create. Paths use three selectable rows: selected large/colour, others compact/grayscale. Swipe, mouse wheel and Up/Down move selection; only Enter button/key opens the chosen path. Tapping a row selects it without opening. Gesture cancellation/click suppression prevent accidental activation; reduced-motion and short landscape layouts are supported.
- Local Playwright Chromium QA (Browser plugin/skill not listed): 390×844, 820×1180, 1440×900 and 844×390; native CDP touch gestures on both screens; every English chapter/parameter description checked for untranslated Thai; bilingual search and switches; ten Studio menus, artwork preservation, keyboard Enter, responsive Enter visibility and reload English default. No page errors. Live QA follows after deployment. Physical iOS Safari remains untested.

## 2026-10-07 — React Bits Part 2A: native Laser Flow / Meta Balls

- `laser-flow.js` and `meta-balls.js` register two Canvas2D Kit definitions; explicit build order precedes the Kit registry in `template.html`. Duplicate initialisation guards retained. New objects start with Motion on via the optional definition flag `motionOnAdd`; imported items retain their saved flag. No new renderer, scheduler or storage schema.
- Kit → Laser Flow / Meta Balls; Edit → Design selected exposes shape/palette controls, native Motion styles and common opacity/spin/timing. Speed rows use the existing Motion section and idle fold behaviour. English/Thai parameter labels added in `studio-guide-language.js`. Guide catalogue picks up the same definitions.
- See `REACTBITS-ROADMAP.md` for upstream Customize mapping and pending work. Part 2B+ tools and Part 3/4 navigation/onboarding remain pending; web-page Laser Flow integration is deferred. Canvas2D visual adaptations intentionally omit shader-only and pointer interaction controls. Meta Balls raster is bounded to 160×160, at most 12 blobs; native item pixel/frame budgets remain in effect.
- Local validation: unminified build, generated JS syntax and diff checks; every exposed geometry/palette control changes pixels; native keyboard Undo/Redo; Motion on/off, zero speed/resume and styles; English/Thai labels; group/lock; real `.cerebra` download/FileReader import preserving parameters. Native export-layer comparison returned maximum byte difference 0 for both tools. Full poster composition and native MP4 recording passed; both tools were observed in the video compositor and a nonempty MP4 blob was generated.
- Chromium QA: desktop 1440×900, touch/mobile 390×844, panel bounds at tablet 820×1180 and landscape 844×390. No page or console errors. Software-rendered 3D was held still during independent Kit/control checks, then restored for full capture and visual QA; this is not a device performance benchmark. Repeat deployed desktop/mobile checks after Pages builds. Physical iOS Safari recording remains untested.
