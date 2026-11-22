# Pre-animation visual review

## Review result: pending / blocked by environment

This composition is built from procedural Three.js geometry and inline JSX rather than standalone SVG or raster assets. The repository's `assets:visual-review` command only previews static files under a project's assets/ directory; it cannot review inline Three.js geometry, materials, composition or animation states.

Required before render:
- Generate still PNG previews of the actual composition at representative frames (exterior/astronaut, cave entry, crystal reveal, crystal fully awakened).
- Open each PNG in image vision and inspect astronaut silhouette/proportions, cave geometry, crystal facets, framing, clipping and lighting.
- Correct source geometry/material/camera defects and regenerate previews until ready.

No visual approval is claimed in this note.
