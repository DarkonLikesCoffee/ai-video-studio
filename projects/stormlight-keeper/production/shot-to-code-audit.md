# Shot-to-code implementation audit

- **00–04s — storm-headland:** `LighthouseRepairFilm` → `ShotScene(shot=0)`; ultra-wide coastal composition, moving water, wind-driven rain, robot enters from left and advances.
- **04–08s — door-and-machine:** `ShotScene(shot=1)`; low medium close-up, the robot is enlarged in foreground and braces/opens the door.
- **08–12s — climb-and-discover:** `ShotScene(shot=2)`; overhead camera angle, spiral stair geometry and robot moving into the lantern room.
- **12–16s — repair-macro:** `ShotScene(shot=3)`; tight macro camera, enlarged mechanical coupling, robot arm reach and gear rotation.
- **16–20s — beacon-ignition:** `ShotScene(shot=4)`; interior lens hero shot, warm ignition and rotating Fresnel elements.
- **20–24s — coast-relief:** `ShotScene(shot=5)`; water-level wide angle, lighthouse beam and distant vessel reveal.

The six camera states, scales, subject positions and visual events are authored separately. The robot and lighthouse are procedural geometry with stable visual design. The SVGs are separate design plates; the composition uses animated geometry for action.

## Required SVG preview inspection

Render each of the 10 SVGs to PNG using an SVG renderer at its viewBox dimensions (landscape plates at 1920×1080; object plates at their natural viewBox). Inspect each image for parse errors, clipped geometry, visual hierarchy, clean silhouette, balanced negative space and consistency with the film palette. Revise any weak plate before animation is accepted. Temporary rendered previews belong in a review directory and are not used as final scene footage.
