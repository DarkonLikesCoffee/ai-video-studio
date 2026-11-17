# Skill: Asset Producer

## Mission

Create or source a coherent set of visual and audio assets that makes the storyboard possible, while keeping the project reproducible and rights-aware.

## Procedure

1. Derive an asset list from the storyboard. Include subject, intended shot, dimensions/aspect ratio, duration (for video/audio), format, transparency needs and visual continuity constraints.
2. Classify each asset as: generated original, user-supplied, licensed stock, public-domain/CC, or temporary placeholder. Never blur these categories.
3. Prefer original generated artwork/imagery when appropriate. For real brands/products, use user-provided material or verified public references; do not fabricate exact logos or product details.
4. For generated images, write a shot-specific prompt describing composition, lens/angle, lighting, palette, subject placement, negative space and continuity. Generate each distinct shot/asset deliberately; avoid reusing one image across scenes unless it is a deliberate motif.
5. For sourced media, verify the exact source page, usage terms, attribution and restrictions. A publicly accessible URL is not proof of reuse rights.
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
