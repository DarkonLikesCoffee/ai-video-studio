# Storyboard — A Bird's Journey

Total: 720 frames / 24 seconds at 30 fps. Four contiguous shots are implemented as distinct scene components in `src/BirdFlight.tsx`.

| Shot | Time / frames | Composition and visual event | Motion and transition |
|---|---|---|---|
| 1 — First light | 0–5s / 0–149 | Wide dawn cliff. A bird rests on a branch above layered hills; it launches and climbs into the open sky. | Branch and clouds sway; bird launches diagonally up/right with articulated wings. Fade from dark. |
| 2 — Open valley | 5–11s / 150–329 | Broad side-tracking view over a winding river between green mountain ridges. The bird crosses the frame, gaining altitude; two distant companions trail behind. | Bird travels left-to-right; clouds/terrain drift at different rates; wings cycle between flapping and gliding. |
| 3 — Close pass | 11–17s / 330–509 | Low-angle mountain pass. Tall pines frame the foreground while the bird banks toward camera and sweeps past, growing large then shrinking off-screen. | Scale change, banking rotation, faster wing cycle, foreground silhouettes and cloud parallax. |
| 4 — Last light | 17–24s / 510–719 | Very wide sunset horizon. The bird is a small silhouette moving toward a glowing sun; a loose distant flock crosses the upper sky. | Flight eases into a long glide; wing beats slow, bird recedes; final image fades gently. |

## Shot differentiation audit
- 1→2: dawn cliff/perch and launch become a wide moving river valley with side-tracking flight.
- 2→3: mid-distance bird and layered valley become a close, fast foreground pass, framed by tall dark pines.
- 3→4: close subject and forested pass become an open panoramic sunset with a small receding silhouette and flock.
- Text cards are intentionally absent; the story is carried by bird action, scale, environment and light.
