# Cerebra — build sources

`../index.html` is the finished site: one self-contained file (three.js, GSAP, fonts, Draco decoder
and all seven planet GLBs embedded). Open it straight from disk; no server needed.

Edit and rebuild:
- `worlds.json` — planet names, copy, accent colours, orbit radius, size, tilt, spin.
- `template.html` — markup, CSS and the app code.
- `opt.mjs` — re-optimises the GLBs from `D:\work\blender\planet\<Planet>\` (textures to webp, Draco kept,
  Aqua Foam simplified). Output goes to `glb/`.

    npm i three gsap esbuild @gltf-transform/cli @fontsource/bebas-neue @fontsource/barlow @fontsource/barlow-condensed @fontsource/geist-mono
    node opt.mjs
    npx esbuild vendor.js --bundle --format=iife --global-name=KY --minify --define:import.meta.url='"https://kythera.invalid/three/"' --outfile=build/vendor.min.js
    python build.py        # writes dist/index.html


## Web build (current)

    python3 src/build_web.py           # index.html + assets/ (hashed, cacheable)
    python3 src/build_web.py --inline  # old single-file page, for comparison

`build.py` above is the original single-file build from the author's machine; `build_web.py` builds from `src/assets-src/` and needs nothing outside the repo (esbuild via npx is optional, for minifying).
