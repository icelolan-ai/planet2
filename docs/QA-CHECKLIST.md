# Cerebra Full QA Checklist

Run after structural refactors and before calling a release complete.

## Entry / navigation
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
