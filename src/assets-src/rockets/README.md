# Rocket source assets

Copied unchanged from `icelolan-ai/rocket`, commit `f0fe3e6321c5713f745d26d4497f2d386376f9a5`:

- `rocket3d/models/VEH_full.glb`: Falcon 9
- `rocket3d/models/VEH_FH_full.glb`: Falcon Heavy
- `rocket3d/models/SV_full.glb`: Saturn V
- `rocket3d/parts_manifest.json`: original CAD part ownership and explosion distances
- `rocket3d/vendor/three/examples/jsm/libs/meshopt_decoder.module.js`: original standalone decoder (copyright/license retained in file)
- `THREE-LICENSE.txt`: original Three.js license

`src/build_web.py` emits hashed relative URLs in `__ASSETS.rockets`. Models are lazy loaded. The adapter uses the existing stage renderer and native Kit layers, history, project and composition export. Original GLBs/manifest are reference data: do not reauthor them here.

`src/effects/rocket-model.js` ports Rocket's model logic with module loading changed to the existing Three.js runtime and hashed decoder URL, plus disposal of each clone's instance buffers. The original CAD coordinate frame must be restored before cumulative/instanced explosion calculations. GPU render targets/material clones are per layer and disposed on removal/reset. The three original parsed GLBs are cached, bounded by this catalogue of three vehicles.
