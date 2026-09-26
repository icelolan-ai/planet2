# Working rules for this repo

- Edit `src/template.html` (and `src/worlds.json`), then run `python3 src/build_web.py`. It writes `index.html` and the hashed files in `assets/`. Never edit those outputs by hand.
- Binaries that rarely change (vendor bundle, fonts, Draco decoder, world GLBs) live in `src/assets-src/`.
- The split site needs http(s) (GitHub Pages or `python3 -m http.server`); it does not run from `file://`.
- For every task: commit, push, open a PR, and merge it into `main` without waiting to be asked again.
- After merging, open the page (headless Chromium, desktop and mobile viewports) and confirm the change actually shows before reporting it done. Live site: https://icelolan-ai.github.io/planet2/
- Save test screenshots outside the repo so they are never left as untracked files.
- Reply to the user in Thai.
