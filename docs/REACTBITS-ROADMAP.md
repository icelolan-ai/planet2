# React Bits integration — staged delivery

Requested by Ice, 7 October 2026 (Asia/Bangkok). Deliver in reviewable parts;
do not describe a source prototype as a deployed or verified tool.

## Part 1 — paths and guide

- Option Wheel: three curved route choices, selected route at the centre.
  Touch swipe, mouse wheel and keyboard selection share `selectPath`; Enter
  opens the route. Selection loops through all three without opening them.
- Rotating Text: staggered grapheme transitions follow selected route;
  Create / Animate / Export rotates in the guide. EN/Thai, stable accessible
  names, reduced motion and no automatic route changes.
- Crystalized Ball: presentation-only electric rim / dust illustration in
  the path and guide headers. No additional WebGL context or Studio layer.
- Target Cursor: desktop corner lock on controls, including open dialogs
  and Studio menu buttons. Preserve native cursor on canvas and text fields;
  touch and reduced-motion users do not receive the decoration.
- Liquid Ether / Light Pillar: choose Backdrop on the paths page. Colour,
  intensity and speed are editable. Ether also exposes viscosity; Pillar
  exposes width and rotation. Settings apply only to this page/session.

These are native adaptations for the current vanilla runtime. Crystalized
Ball, Ether and Pillar use bounded Canvas2D drawing; they are not direct React
ports or identical GPU simulations. Hidden pages pause; animation respects
reduced motion. Preserve EN/Thai labels and all existing Studio artwork.

## Part 2 — editable Studio tools (pending)

Use the existing `KIT` pipeline for selection, groups, hide/lock, Undo/Redo,
project files, image export and video composition. Prototype checkpoint:
local branch `wip/reactbits-toolkit-20261007`; none of the tools below is
included in Part 1. Validate every exposed control for a visible effect.

| Reference | Customize studied in upstream demo | Cerebra adaptation to validate |
| --- | --- | --- |
| Laser Flow | colour, speed, beam offsets/sizing, wisps, fog, strength, decay, falloff, interaction | Editable laser layer; colour, width/length, position, glow/haze, wisps and native Motion |
| Meta Balls | colour, cursor colour/size, count, speed, clump, animation size, transparency | Liquid scalar-field Kit; count, size, separation, softness, accent and Motion |
| Aero Shards | placement, material/detail, flow, scale/spread/depth, speed/spin, density, size/stretch, turbulence, glow/bloom, grain, effects, interaction | Bounded shard Kit with real geometry/palette controls; omit unsupported GPU-only controls |
| Lightfall | palette, speed/count, width/length, glow/density/twinkle, zoom, background glow, cursor light | Falling light Kit; palette, count, width/length, density, twinkle, zoom and Motion |
| Light Pillar | top/bottom colour, intensity, rotation speed, glow, width/height, noise, rotation, blend, quality | Pillar Kit; native colour/shape/Motion and shared layer composition |
| Soft Aurora | two colours, speed/scale/brightness, noise frequency/amplitude, band height/spread, octave decay, layer offset, colour speed, mouse influence | Aurora bands Kit with bounded layers and shape/Motion parameters |
| Galaxy | density, glow, saturation/hue, twinkle, star/rotation/animation speed, focal point, mouse repulsion | Seeded star/nebula Kit with focal and native Motion controls |
| Threads | colour, amplitude, distance, mouse interaction | Thread Kit; colour, amplitude, spacing, count, width and native Motion |
| Hyperspeed | presets Cyberpunk/Akira/Golden/Split/Highway/Neon Waves; effectOptions road, light and distortion configuration | Perspective trail Kit; presets, colours, lanes, distortion, road width, trail length/count and Motion |
| Waves | line/background colour, X/Y speed/amplitude, gaps, friction/tension, cursor limit | Wave grid Kit; palette, X/Y speeds/amplitudes, gaps and motion envelope |
| Liquid Chrome | base RGB, speed, amplitude, X/Y frequency, interaction | Metallic flow texture Kit with tint/highlight, amplitude/frequencies and native Motion |
| Balatro | three colours, pixelation, spin rotation/speed/amount/ease, contrast, lighting, offset, rotate, mouse interaction | Swirl texture Kit; palette, pixelation, spin, contrast/lighting, offsets and native Motion |
| Liquid Ether | three colours, mouse force/cursor size, resolution/dt, BFECC, viscosity/iterations, pressure iterations, bounce and auto-demo timing | Page backdrop in Part 1; consider texture Kit separately. Real fluid tools remain owned by Water Lab |
| Crystalized Ball | presets, colour, strands/crackle/flares/glow/sparks, dust count/fill/motion/shape/depth, sway/twinkle/haze, speed and interaction | Already page art; explore a decorative Kit, energy-planet preset or object halo in a later part |

Background direction: use Soft Aurora behind quiet informational sections,
Galaxy for Explore, Lightfall for short transitions, and Aero Shards for
featured-work previews. Render one subdued effect at a time behind readable
copy; do not put every full-strength effect on every page.

## Part 3 — UI adaptation (pending)

| Reference | Customize studied | Intended real UI surface |
| --- | --- | --- |
| Line Sidebar | colours, index/marker, proximity/shift/falloff, marker length/gap, tick scale, item spacing/font, smoothing | Web section rail, guide chapters and Studio panel navigation |
| Pill Nav | items/active href, colours, easing, mobile menu and initial animation | Existing web and Studio navigation; preserve command callbacks |
| Folder | colour, scale, up to three preview papers | Work/library presentation using real thumbnails |
| Flowing Menu | marquee speed, text/background/marquee/border colours | Existing web menu hover treatment; stable labels for touch/keyboards |
| Counter | value, digit places, font/weight, gap, radius, padding and gradients | Numeric outputs and actual item/step counts |
| Branched Menu | branch items, open/active, colours, row/indent/trunk/line geometry, draw/fold timing | Existing grouped layer and panel tree; no second state store |
| Folder Float | trigger/open/close, folder/paper/item colours, size, spread/lift/tilt, flap/rest angle, duration/stagger/bounce, drift/physics | Library groups and work previews |
| Slosh Gauge | value, interaction/disabled, liquid/glass colours, dimensions, ticks, viscosity/tilt/splash | Real opacity/intensity/liquid values bound to existing inputs |
| Sling Button | pad/icon/accent/well/band colours, size, arm/max-pull, launch/recoil/flight/particles, axis/tap/disabled | Existing Enter/save actions; keyboard/tap always work |
| Bell Toggle | off/on labels/icons, colours, size/radius, ring amplitude/passes/decay/duration/pivot, badge/waves/clapper | Existing state toggles; no invented notification subsystem |
| Swipe Row | actions, colours, dimensions, direction/resistance/bounce, snap/full-swipe/commit threshold, close/haptic | Layer/library rows; reveal native actions, never implicit destructive deletion |
| Comet Dial | value/min/max/step, unit/label, colours, size/sweep/thickness, speed/bounce/momentum, comet geometry | Rotation/angle controls bound to existing settings/history |
| Wake Slider | value/min/max/step, bars/height/gap, fill/track/crest, sensitivity/reach/skew/glide/smoothing, value display | Native range controls, preserving keyboard and numerical semantics |
| Rubber Segment | items/value, colours, size/radius/inset, equal slots, stretch/squash/speed/glide, dragging | Existing tabs/segmented controls and language switch |

## Part 4 — Stepper and integration QA (pending)

Stepper Customize: initial/current step, step callbacks, final-step callback,
indicator rendering/disable, content/footer classes, Back/Next labels/props.
Adapt the existing Library Spotlight guide before Studio; keep its real
examples, close control, Previous/Next, Open work and Don't show again.

## Source research

Read current primary demos from `DavidHDev/react-bits`:
`src/demo/Components/*Demo.jsx`, `src/demo/Micro/*Demo.jsx`,
`src/demo/Backgrounds/*Demo.jsx`, `src/demo/Animations/*Demo.jsx` and relevant
implementation files. Reference index: https://reactbits.dev/components/masonry
Each row refers to its named demo rather than treating Masonry as that effect.

## Validation gates for every part

1. Local build, source syntax, runtime console, meaningful first screen.
2. Desktop, narrow mobile, tablet and short landscape; EN and Thai.
3. Pointer, native touch swipe, keyboard, disabled states and reduced motion.
4. For Studio tools: visible parameter changes, groups/layer state, undo/redo,
   project round-trip, image and video composition; no effect-only DOM overlay.
5. Merge only that part, wait for generated build/Pages and test the live UI.
6. Update this roadmap with evidence and remaining limits before next part.
