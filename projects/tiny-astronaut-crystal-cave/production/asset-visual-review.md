# Pre-animation / 3D asset visual review

## Asset format
No standalone SVG or raster assets are used. The astronaut, lander, planetary terrain, cave, shards and central crystal are original procedural Three.js geometry and materials embedded directly in the dedicated composition. The static image-asset preview utility does not inspect inline Three.js objects, so five rendered composition stills are used instead.

## Review cycle 1 — initial stills
Rendered at frames 75, 210, 330, 450 and 575.
- Exterior and character: recognizable low-poly alien world, warm rust terrain, distant planet and moons.
- Cave / discovery / awakening: failed. A closed sphere blocked the camera, leaving the cavern and crystal almost entirely black.
- Correction: replaced the closed sphere with an open-front cavern (roof, side walls, back wall and broken rock shoulders), removed duplicated cave shell geometry, corrected camera yaw.

## Review cycle 2 — open cavern
- Cave became readable, with central cyan crystal, surrounding shards, cave walls and particles.
- Defect: astronaut lower body was clipped by the cave floor.
- Correction: lifted both cave-scene astronaut placements to ground level.

## Review cycle 3 — cave character
- Astronaut is fully visible and the crystal reveal reads clearly.
- Defect: exterior astronaut appeared while the landing pod was still descending.
- Correction: lander touchdown now completes before the astronaut is introduced; landing supports were lengthened to meet the ground.

## Final review gate
Render and inspect the five current PNG states again. Confirm touchdown/explorer timing, full astronaut silhouette in the cave, crystal visibility and unclipped frame edges. Do not mark ready until current branch CI, build and final MP4 QA pass.
