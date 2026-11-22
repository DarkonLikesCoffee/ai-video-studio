# Skill: Pre-animation visual asset review

## Mission

Inspect the actual rendered appearance of source image assets before they are used in a scene or composition. Catch weak silhouettes, malformed proportions, awkward composition, inconsistent style and rendering defects before they are baked into an animation or video.

This is a model-led visual review stage. The preview command renders images; it does not call an AI model, calculate a quality score or approve artwork.

## Required workflow

1. Finish the first draft of the project's standalone visual assets and save them under projects/<slug>/assets/.
2. Generate rendered preview pages with:

       npm run assets:visual-review -- projects/<slug>

   Optionally pass --output-dir <directory>, --page-size 1-16 or --max-file-size-mb <number>. The default output is a temporary directory; the command prints exact PNG and HTML paths.
3. Open and inspect every asset-review-XX.png preview using the assistant's image-vision capability. The HTML page is a convenient index; the PNG files are the visual evidence. Do not judge an SVG solely by reading its XML/path data.
4. Review the artwork against the intended shot and visual direction:
   - silhouette, anatomy/proportions and recognizable subject;
   - balance, placement, crop, negative space and composition;
   - path/edge quality, stray shapes, holes, overlaps and unwanted gaps;
   - palette, contrast, lighting, detail density and style consistency;
   - transparency, background, aspect ratio and whether small details survive at video size;
   - whether separate layers/components will remain coherent when animated.
5. Correct defective source assets, regenerate the preview and inspect again. Do not put a known-bad asset into the scene just to move forward.
6. Make no more than three correction cycles for one materially defective asset before escalating the limitation or choosing a better source/visual method. Do not regenerate assets that already meet the brief.
7. Record the actual review in projects/<slug>/production/asset-visual-review.md: list inspected assets, findings, changes made, final disposition and any unresolved compromises. Never mark assets approved if the PNGs were not actually inspected.
8. Only after review, compose the approved assets into scene.json or the custom Remotion composition. Then run the ordinary project/asset-evidence checks and continue to the frozen-candidate render gate.

## Coverage and limitations

- The command previews standalone local .svg, .png, .jpg, .jpeg, .webp and .avif files recursively under the project's assets/ folder. It excludes video/audio, unsupported file types, symbolic links and image files above the configured size limit.
- It does not preview SVG markup embedded directly in TSX/JSX, CSS-generated shapes, Three.js objects, GLB/GLTF/FBX models, animation states or remote images. For important inline vector art or 3D objects, create a dedicated still-preview composition that renders the actual component/object and inspect that PNG before using it in the video.
- A correct still image does not guarantee a good animation. Inspect representative animation states and the final rendered MP4 separately.
- If the assistant cannot open or interpret the generated PNGs, it must disclose that and must not claim the assets passed visual review. Use another visual inspection path before proceeding.
