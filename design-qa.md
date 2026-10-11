# Launch gravity design QA

Reference: attached IMG9275 (current native hub) plus IMG9261 violet cosmic art direction. Compared side by side in /tmp/gravity-reference-review.jpg with hosted source captures normalized to CSS sizes: 1440x900 DPR1,390x844 DPR3,820x1180 DPR2,844x390 DPR1,320x568 DPR1. Reviewed every viewport and EN/Thai captures from source run38128048846; all5 full UI passes/errors[].

- P0/P1/P2: none remaining. Preserved three-path wheel/native heading/icons/copy, violet selected state/gray alternatives, mobile hero above controls and desktop hero left. Header min40px controls remain in viewport.
- Ring/debris share one square foreground frame and origin; nebula uses same pointer vector at slower depth. Ring edge/wisps are actual transparent image content, not an unrelated CSS circle over a baked portal. Palette/lighting/soft alpha edges agree. Nebula is intentionally quieter behind native menu.
- Actual assertions: ring and inward radial transforms change over time,28 bounded sprites share frame, mouse pressure/parallax responds without entering routes, native touch swipe/keyboard/Enter all3 routes/return/EN/TH continue; animations pause in guide/Studio, reduced motion static.
- No new canvas/renderer/RAF/controller/storage. Source images lazily requested only on hub entry; production layers ring329232/space71120/rock9328bytes plus existing dust56514.

Limits: hosted Chromium emulation/software GL, not physical Safari/device FPS/long recording. Live deployment pending. Native contrast/copy/art direction intentionally adapted from supplied reference.

Source final result: passed. Live final result: blocked until PR356 merge/generated Pages/full live QA.
