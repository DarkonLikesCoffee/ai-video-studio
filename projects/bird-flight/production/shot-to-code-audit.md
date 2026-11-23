# Shot-to-code implementation audit

All four shots are implemented in `src/BirdFlight.tsx` and selected by the frame ranges in `BirdFlight`.

| Shot / frames | Source implementation | Concrete implemented event |
|---|---|---|
| First light / 0–149 | `OpeningShot`, `Bird`, `Pine`, `Cloud` | A perched bird silhouette and an animated launch interpolating up and right; the wings articulate as it leaves the branch. Dawn sun, branch and hills establish the view. |
| Open valley / 150–329 | `ValleyShot`, `Bird`, `Cloud` | Bird tracks horizontally above a winding river; terrain/clouds drift; two smaller birds trail behind. |
| Close pass / 330–509 | `ClosePassShot`, `Bird`, `Pine` | Bird banks and scales from small to close to small in a low-angle, pine-framed mountain pass. |
| Last light / 510–719 | `HorizonShot`, `Bird`, `DistantBirds`, `Cloud` | Bird shrinks into a wide sunset, wing beats damp into a glide, and a distant flock crosses the sky. |

The bird is a procedural rig, not a static asset: both wings rotate on a frame-driven cycle; body height and bank angle vary by shot; position/scale follow each shot's flight curve. Background silhouettes, palettes, depth layers and framing differ by shot.
