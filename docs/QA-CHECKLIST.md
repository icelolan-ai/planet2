# Cerebra Full QA Checklist

Run after structural refactors and before calling a release complete.

## Studio scene effects migration (supersedes page-art tests below)
- Launch/guide have no Crystal/Backdrop controls/canvases/clock. Rotating Text, native Enter-only routes, guide and Stepper still work.
- Actual Kit > Crystal Ball / Liquid Ether adds visible native layers. Presets and Design/Motion/opacity/Reset reach source renderers and participate in native Undo/Redo/project restore.
- Fit as background fits/reorders Crystal/Ether/Pillar behind other layers, retaining selection and Design. Saved order survives restore; hide/lock/group/delete and Reset resource disposal work. Reset preserves placement/order and restores parameters.
- Physics edits affect frozen fluid; palette edits preserve field. Moving readback at most one pending; hidden/reduced/disabled motion stops. Same-size export agrees with preview; larger capture preserves simulation and other composition content.
- Desktop1440x900/mobile390x844/narrow/short bounds, native EN/Thai and no app console errors. Project saves settings/seed, not exact live phase. Software QA is not a hardware/iOS benchmark.

## Animated Background (Liquid Ether / Light Pillar)
- Image > Animated background presets selects one background and opens Customize at once; re-selecting keeps values; choosing the other replaces it (one Undo step). Background list: Customize, Turn on/off, Remove.
- It always fills the frame (resize, orientation, stage shift, zoom/scale), sits under all layers, is not listed in Kit, cannot be selected/dragged/rotated from the canvas or the Layers grip, and is excluded from select-all/marquee.
- Every visible control changes the result; Follow pointer only reacts to mouse hover on empty canvas. Undo/Redo, Reset, project save/restore, legacy projects (full-size object -> background) and image/video export (full frame, same as preview).
- Fixture: `docs/qa/animated-background-ui.cjs` (VP env for 1440x900, 390x844, 820x1180, 844x390). Report emulation vs real device honestly.

## Studio default empty canvas
- First entry: no selection, no objects, planet hidden, "Crimson void" background, Layers shows only the hidden Cerebra row, empty-state card visible.
- Add Cerebra / another world from the card or the dock select reveals it and hides the card; Undo/Redo, Reset canvas and project restore keep the empty state consistent; opening from the Atelier with a world still shows that world; empty export shows the background.
- Hub/guide page backdrop (navy, crimson haze, dotted floor, horizon) legible at desktop/mobile/landscape. Fixture: `docs/qa/studio-empty-canvas-ui.cjs`.

## Studio planet lifecycle
- Delete from the planet's Layers row, Layer > Delete planet; canvas shows the empty card, heading "No planet yet". Add from Layers "+ Planet", Layer > Add planet…, the card, and the dock select; the menu lists Cerebra, every loaded world and the reserved disabled "Open 3D file…".
- Re-adding any planet gives factory settings (Tune, surface style, layer flags, opacity, pan/zoom); Undo/Redo and project restore keep present/deleted state. Fixture: `docs/qa/studio-planet-lifecycle-ui.cjs`.

## Entry / navigation
- Studio Stepper: first entry, Previous/Next, all indicator jumps, rapid navigation, Skip, Back/Escape, session completion and replay from How to use. Complete/skip must launch Studio even with world GLBs pending. Replay from active Studio must return to the existing session. Check EN/Thai, actual directional content/height transitions, reduced motion, keyboard focus and desktop/mobile/narrow/short-screen bounds.
- Landing page loads without visible errors.
- Enter World Atelier.
- Enter Studio Mode.
- Exit/re-enter Studio without duplicate UI or duplicated event handlers.

## Studio menu exclusivity
- Design, Save, Settings/Tools, Layers/context, Help/Keys, Library, S9 Lab and drawing controls never stack over one another unexpectedly.
- Opening menu B closes menu A.
- Tapping/clicking outside behaves consistently.
- Starting a drawing gesture collapses drawing customization controls and keeps drawing active.
- Drawing controls can be reopened intentionally.

## Design / Surface Style
Test every style:
- Original surface
- Dot grid
- Halftone dots
- Spikes
- Curly threads
- Fur bristles
- Wire polyhedron
- Plexus 3D
- Contour rings
- Meridian lines
- Particle cloud
- Crystal shards
- Radial data spokes
- Orrery rings
- Neural cells
- Data flow arcs
- Drifting strands

For every style:
- Selecting the style changes the planet visibly.
- Only relevant controls are visible.
- Every visible slider/toggle/select has a visible effect.
- Changing values does not throw errors or reset unrelated values.
- Switching styles preserves valid shared values and updates style-specific controls.

## Surface Base Shape
For compatible generated surfaces test:
- Sphere
- Football / Rugby
- Pentagon ball
- Geodesic ball
- Rounded cube
- Diamond
- Torus / Ring

Verify:
- Shape visibly changes silhouette.
- Shape strength blends correctly.
- Football length appears only for Football / Rugby.
- Torus hole appears only for Torus / Ring.
- Unsupported shape choices are hidden.
- Design and Tune Core show the same selected shape/state.

## Tune Core
- Original Surface exposes normal Shape / Colour / Core / Motion controls.
- Generated Surface shows Surface deep controls appropriate to its selected style.
- Core tabs with no visible effect are hidden.
- Changing Surface in Design immediately updates Tune Core.
- Changing Surface/Tune values in Tune Core immediately updates Design and planet rendering.
- Reset restores expected defaults without changing the wrong Surface Style.

## Drawing
- Laser Flow Pen: actual mouse/touch draw, Pen effect settings panel bounds, colour/thickness/opacity and source appearance controls; apply to an existing drawing; symmetry, erase/Undo/Redo, reset, project roundtrip and canvas export. Still/reduced-motion export must match the displayed frozen frame.
- Enlarged Kit: selected/unselected and lite raster budgets, stopped/export shader resolution, async moving transport and no new renderer/RAF. Check detailed edges at native size as well as target dimensions.
- Pen
- Line
- Eraser
- Tentacle
- Branch
- Symmetry Off
- Mirror vertical
- Mirror horizontal
- Radial N=2 through 12

Verify:
- Pointer/touch start, move and end.
- No accidental page scroll while drawing.
- Undo/redo treats one gesture/batch coherently.
- Stroke point limits prevent runaway data.
- Drawing remains visible in save/export composition.

## Layers / selection
- Select one item.
- Multi-select/marquee where supported.
- Layer visibility.
- Lock/unlock.
- Reorder.
- Group/select controls.
- More/context menu.
- No invisible blank area triggers actions.

## Save / project
- Save menu opens alone.
- Format/size/duration selectors do not close the menu accidentally.
- Poster/image composition works.
- Project JSON export/import works.
- Undo state remains usable after normal edits.

## S9 Lab
- Panel opens alone.
- Fluid controls.
- Life layers: planet, cloud, jelly, cell, venom, germ, black hole.
- Sound reaction can be enabled/disabled without leaving microphone state stuck.
- Onboarding/guide does not block normal Studio use.
- No WebGPU path is enabled unless separately approved.

## Responsive
Test at minimum:
- Desktop landscape
- Tablet landscape
- Tablet portrait
- Mobile portrait

Verify:
- No horizontal page/menu overflow.
- Planet remains meaningfully visible when editing.
- Bottom sheets/panels can open and collapse.
- Touch targets remain usable.
- Canvas is not permanently obscured by controls.

## Stability
- No uncaught console errors during the pass.
- No duplicate controls after repeated open/close cycles.
- No increasing duplicate event behavior after re-entering Studio.
- No severe frame-rate regression from idle UI.
- Reduced-motion mode remains usable.

## Completion report
Record:
- pass/fail per section
- exact failing control and reproduction steps
- desktop/mobile difference
- source file likely responsible
- whether the issue blocks deployment

## Laser Flow Pen Customize and caps
- Pen effect settings scrolls directly to the Laser section; desktop has two readable columns and narrow screens one, within viewport bounds.
- Colour, thickness, opacity, glow, flow, wisps, fog, decay/fade and animation controls change the native stroke. Omit Kit position/T geometry controls.
- Opening an existing Laser Drawing loads its settings; Edit current drawing controls whether changes affect that Drawing. Slider gestures coalesce in Undo/Redo; Line records are preserved.
- Straight/curved strokes have round continuous caps and joins at both ends; a tap is circular. No rectangular source-tile tips or per-triangle alpha bands. Glow zero and wide halo remain usable.
- Same-size native preview/export agree within one Canvas2D rounding byte. Eraser, symmetry, alpha lock/masks and saved project metadata still use the native Drawing owner.
- Drawing reset and object Design reset restore all Laser fields. Older saved strokes missing the extra fields render with defaults. Stopped/speed-zero strokes are visible on their first frame.

## Crystalized Ball page art
- Compare equal-size upstream field+dust+composite and check DPR2 particle/edge placement. Exercise real pointer/touch rim heat/stir/kick, all appearance sliders, count 0/40000, preset/motion/shape/speed/paused/interaction/intro, localization and reset on both pages. Bound panels at desktop/mobile/narrow/landscape and prevent editor gestures from switching routes.
- Check at most one async read per moving state, reduced-motion/static manual update, Studio/hidden clock stop, superseded-buffer disposal and native Full Reset hook. Enter-only routing, Studio/Lab state and existing backdrops remain unaffected.

## Liquid Ether page backdrop
- Backdrop > Liquid Ether renders fluid driven by actual mouse/touch and the source auto driver; Colour flow remains a separate legacy option.
- Source palette/force/radius/resolution, viscosity/pressure, BFECC/bounce, timestep, auto timings and light mode controls reach the source solver. Contextual fields, numeric outputs and EN/Thai fit desktop/narrow panels.
- Compare the source solver/colour output using identical forces at equal dimensions. Verify real pixels, asynchronous moving readback, reduced-motion stop/manual update and late-frame rejection.
- Off/style switch/Reset dispose fluid resources. Menu/Guide/Studio navigation pauses the page clock and never gates Enter on fluid/world assets. Native Studio and Water Lab state are unaffected.
