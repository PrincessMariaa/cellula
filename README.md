# Cellula

Interactive 3D mammalian-cell educational sandbox. English interface, isotope tracing, paired reference comparisons and exploratory gene controls.

## Scientific status
This is an educational hypothesis model, not a validated healthy/cancer cell simulator. Gene-to-flux coefficients are illustrative. P-gp is not implemented. Gene controls do not drive the main ATP or membrane model. See MODEL_NOTES.md and the in-app assumptions.

## Run locally
With Python 3 installed, from this folder:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Do not open index.html directly as a file; ES modules need an HTTP server. No build or npm install is needed to run the app. Three.js is bundled in dist/vendor with its license.

## Upload to GitHub
1. Extract this ZIP.
2. Create a GitHub repository.
3. Upload the CONTENTS of this folder to the repository root, including the hidden .github folder. Do not upload the ZIP itself as the website.
4. Commit to the main branch.
5. In Settings → Pages, select GitHub Actions as the source.
6. In Actions, run Deploy Cellula or push a new commit to main. The workflow publishes dist/.

The workflow runs model tests before deploying. GitHub Pages availability depends on your account and repository settings. A Pages site may be publicly accessible even if its repository is private; check visibility before publishing.

If your upload interface omits hidden folders, use Git or GitHub Desktop so .github/workflows/pages.yml is included.

## Tests
Node.js 20+ recommended. No dependencies are needed for these numerical tests:

```sh
node test-model.mjs
node test-tracers.mjs
node test-isotopes.mjs
node test-genes.mjs
```

## Files
- dist/index.html, CSS and app.js: interface and controls.
- dist/scene.js: 3D rendering.
- dist/model.js: cell energetics, ions and mechanics.
- dist/isotope-model.js, isotope-lab.js: paired isotope experiments.
- dist/genes.js: explicitly hypothetical gene-to-rate mapping.
- dist/tracers.js: separate generic tracer sandbox.

The original hosting configuration, repository history, credentials and node_modules are not included. All experiments run in the browser; histories are cleared on reload unless exported as CSV. No analytics or backend is configured.

## License
Three.js retains its included MIT license. No license has been selected for the original application code; choose one before inviting reuse.
