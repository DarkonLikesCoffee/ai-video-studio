# Skill: Asset Producer

## Mission

Create or source a coherent set of visual and audio assets that makes the storyboard possible, while keeping the project reproducible and rights-aware.

## Procedure

1. Derive an asset list from the storyboard. Include subject, intended shot, dimensions/aspect ratio, duration (for video/audio), format, transparency needs and visual continuity constraints.
2. Classify each asset as: generated original, user-supplied, licensed stock, public-domain/CC, or temporary placeholder. Never blur these categories.
3. Prefer original generated artwork/imagery when appropriate. For real brands/products, use user-provided material or verified public references; do not fabricate exact logos or product details.
4. For generated images, write a shot-specific prompt describing composition, lens/angle, lighting, palette, subject placement, negative space and continuity. Generate each distinct shot/asset deliberately; avoid reusing one image across scenes unless it is a deliberate motif.
5. For sourced still images, use the Openverse discovery helper as a candidate finder, not an automatic approval system:
   - Search: `node scripts/openverse-assets.mjs search --query "<shot-specific subject>" --limit 12 --output /tmp/openverse-candidates.json`.
   - Review candidate titles, previews/source pages, creator, license and composition against the shot. Openverse is a search index; verify the original source page and current license before use.
   - Create a selection JSON containing only approved result objects under `assets`, adding the `shotIds` array to each selected object. Keep the original Openverse fields intact.
   - Download: `node scripts/openverse-assets.mjs download --selection /path/to/selection.json --project projects/<slug>`.
   - The helper allows CC0, PDM, CC BY and CC BY-SA only; it rejects non-commercial/no-derivatives licenses, non-HTTPS URLs, unsupported formats and oversized files. It downloads raster images locally and merges provenance into `production/asset-manifest.json`.
   - Openverse currently provides image/audio discovery here, not generated video footage. Treat stills as B-roll plates for deliberate parallax, camera moves and compositing; do not describe them as video clips.
6. Save approved assets under `projects/<slug>/assets/`. Use descriptive, stable filenames. Avoid remote URLs in final renders unless there is a compelling reason.
7. Create an asset manifest containing filename, type, intended shot IDs, source/provenance, license/permission, generation prompt or source URL, dimensions/duration and any limitations.
8. Check every file exists, opens, has the expected dimensions/codec and matches the storyboard. Replace broken or mismatched assets before rendering.

## Image/video continuity

- Keep product identity, proportions, color, markings and orientation consistent across shots.
- Use varied shot-specific framing while preserving the same subject identity.
- Ensure subject placement leaves room for typography where required.
- Avoid visual hallucinations in factual product demonstrations. If exact details cannot be represented reliably, use abstract illustrative visuals and label them accordingly.

## Audio and rights

Use original or clearly licensed music, voice and sound effects. Record provenance. Do not imitate a living artist's voice or present synthetic narration as a real person. Do not use copyrighted song lyrics or commercial recordings without permission.

## Required output

An asset manifest plus a complete local asset folder. Report missing assets honestly; never replace a required shot with a generic placeholder without recording that compromise.
