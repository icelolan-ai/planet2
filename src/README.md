# Kythera — build sources

`../index.html` is the finished site: one self-contained file (three.js, GSAP, fonts, Draco decoder
and all seven planet GLBs embedded). Open it straight from disk; no server needed.

Edit and rebuild:
- `worlds.json` — planet names, copy, accent colours, orbit radius, size, tilt, spin.
- `template.html` — markup, CSS and the app code.
- `opt.mjs` — re-optimises the GLBs from `D:\work\blender\planet\<Planet>\` (textures to webp, Draco kept,
  Aqua Foam simplified). Output goes to `glb/`.

    npm i three gsap esbuild @gltf-transform/cli @fontsource/cormorant-garamond @fontsource/geist-sans @fontsource/geist-mono
    node opt.mjs
    npx esbuild vendor.js --bundle --format=iife --global-name=KY --minify --define:import.meta.url='"https://kythera.invalid/three/"' --outfile=build/vendor.min.js
    python build.py        # writes dist/index.html
