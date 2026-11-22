# Acoustic Product Film benchmark

This project is the first end-to-end creative benchmark for the model-neutral production workflow. It uses a single custom Remotion composition with procedural Three.js headphone geometry, five distinct shot beats and original generated music/Foley.

- Brief: `projects/acoustic-product-film/production/creative-brief.json`
- Storyboard: `projects/acoustic-product-film/production/storyboard.md`
- Production plan: `projects/acoustic-product-film/production/production-plan.json`
- Asset manifest: `projects/acoustic-product-film/production/asset-manifest.json`
- Remotion props: `projects/acoustic-product-film/composition.json`

Run `npm run assets:audio` before the strict asset-evidence check. This deterministically creates the four local WAV files declared in the manifest. CI and the GitHub Actions render workflow already run this generator before checking assets.

The render uses `AcousticProductFilm` (1920×1080, 30 fps, 600 frames). On GitHub's headless Linux runner it uses single-concurrency software WebGL. Rendering is not creative acceptance: inspect the actual MP4, check the camera motion and audio cues, and record any revisions before considering the benchmark successful.
