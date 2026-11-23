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
   - The helper allows CC0, PDM and CC BY only; it rejects non-commercial/no-derivatives licenses, non-HTTPS URLs, unsupported formats and oversized files. It downloads raster images locally and merges provenance into `production/asset-manifest.json`.
   - Openverse currently provides image/audio discovery here, not generated video footage. Treat stills as B-roll plates for deliberate parallax, camera moves and compositing; do not describe them as video clips.
6. For sourced moving footage, use the Wikimedia Commons helper as a separate candidate finder:
   - Search a single subject: `node scripts/commons-video-assets.mjs search --query "ocean waves crashing" --limit 8`.
   - Search every storyboard shot: `node scripts/commons-video-assets.mjs storyboard-search --plan projects/<slug>/production/production-plan.json --max-shots 12 --limit 8`.
   - Review the original Commons file page, the license, attribution, duration and content before selection. Search results marked allowed are only candidates, never automatic approval.
   - Select only CC0, Public Domain or CC BY 2.0/3.0/4.0 assets, add the relevant `shotIds`, and download with `node scripts/commons-video-assets.mjs download --selection selection.json --project projects/<slug>`.
   - Only HTTPS files hosted on upload.wikimedia.org and supported MP4/WebM/QuickTime/Ogg videos are accepted; downloads are capped at 150 MiB and recorded in the shared asset manifest. Check the final clip's actual duration and codec before editing.
7. Save approved assets under `projects/<slug>/assets/`. Use descriptive, stable filenames. Avoid remote URLs in final renders unless there is a compelling reason.
8. Create an asset manifest containing filename, type, intended shot IDs, source/provenance, license/permission, generation prompt or source URL, dimensions/duration and any limitations. For new production plans set `assetVisualReviewRequired: true`; add `previewPath` and `visualReview` to each visual asset manifest entry. `visualReview` uses `status` (`pending`, `approved` or `rejected`), `reviewer`, `reviewedAt` and `notes`. Never invent approval evidence.
9. Render a preview for each visual asset, inspect it individually for rendering, malformed paths, clipping, silhouette, proportions, style continuity, contrast and resolution suitability, correct defects and re-preview. Only after actual inspection set `visualReview.status` to `approved` and record reviewer, timestamp and findings (including “no defects found” when appropriate). A rejected asset must not proceed as approved.
10. Check every file exists, opens, has the expected dimensions/codec and matches the storyboard. Replace broken or mismatched assets before rendering.
11. Run `npm run director:asset-evidence -- <production-plan.json> [asset-manifest.json] [report.json]`. Review each acceptance criterion’s mapped shots and manifest assets, unresolved plan references, local file status, provenance and rights status. When `assetVisualReviewRequired: true`, the report also requires each asset preview to exist and visual-review approval to include a reviewer, timestamp and notes. The GitHub Actions render workflow uses `--strict` when a production plan and manifest exist, so these missing review issues block renders for plans with this policy enabled. Legacy plans without the flag remain compatible. The report verifies files and review metadata—not whether the reviewer correctly judged visual suitability.

## NASA public-domain video footage

For NASA-produced footage, use the NASA Image and Video Library API and official item page:
- Review the individual NASA media item for its creator, credits and any item-specific exceptions; NASA-produced content is generally public domain, but don't assume third-party materials hosted by NASA are.
- Record the stable `nasaId`, details-page URL, title, creator, license and storyboard shot IDs in `nasa-asset-selection.json`.
- The downloader resolves `https://images-api.nasa.gov/asset/{nasa_id}` and accepts only MP4/WebM media renditions hosted on `images-assets.nasa.gov/video/`.
- Download with `node scripts/nasa-video-assets.mjs download --selection <selection.json> --project projects/<slug>`.
- The helper enforces HTTPS, domain, file-extension, MIME and 150 MiB limits, then records the exact resolved media URL, original page, attribution and SHA-256.
- When several shots use the same long source clip, use `trimBeforeSecondsByShotId` to select different source-time ranges instead of repeating the opening frames.
- Mute embedded source audio unless the individual item explicitly permits its use; include source-page and creator credits with the final render.

## Image/video continuity

- Keep product identity, proportions, color, markings and orientation consistent across shots.
- Use varied shot-specific framing while preserving the same subject identity.
- Ensure subject placement leaves room for typography where required.
- Avoid visual hallucinations in factual product demonstrations. If exact details cannot be represented reliably, use abstract illustrative visuals and label them accordingly.

## Audio and rights

Use original or clearly licensed music, voice and sound effects. Record provenance. Do not imitate a living artist's voice or present synthetic narration as a real person. Do not use copyrighted song lyrics or commercial recordings without permission.

## Required output

An asset manifest plus a complete local asset folder. Report missing assets honestly; never replace a required shot with a generic placeholder without recording that compromise.
