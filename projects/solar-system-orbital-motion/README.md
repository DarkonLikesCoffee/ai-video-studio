# Solar System Orbital Motion

This Remotion feature provides two 1920×1080, 30 fps, 30-second compositions:

- \`SolarSystemOrbitalMotion\`: eight planets, a full Earth orbital year, the Sun, the Moon, orbit paths and a 2025 date overlay.
- \`InnerPlanets\`: Mercury through Mars only, a 2.5× orbital zoom and a 90-day simulation.

## Simulation model

Planetary mean longitude at J2000 and its secular rate are taken from NASA/JPL Solar System Dynamics, *Approximate Positions of the Planets*, Table 1 (valid 1800–2050). The Earth values use the table's `EM Bary` (Earth–Moon barycenter) row:
https://ssd.jpl.nasa.gov/planets/approx_pos.html

For simulation day \(d\) after 2025-01-01 00:00 UTC, the circular-orbit angle is:

\[
L(d) = \operatorname{normalize}\left(L_0 + \dot L \frac{d_{\mathrm{J2000}} + d}{36525}\right)
\]

where \(L_0\) is J2000 mean longitude, \(\dot L\) is the JPL mean-longitude rate in degrees per Julian century, and \(d_{\mathrm{J2000}}=9131.5\) days. Earth's simulated year is derived from its JPL angular rate (360 degrees divided by the mean angular rate).

The display date runs from January 1 through December 31, 2025. The final frame completes the derived Earth orbital period; the civil date label is capped at December 31 rather than rolling to January 1, 2026.

Orbit distances use the requested hybrid scale: linear through 1.6 AU and logarithmic compression beyond 1.6 AU. Planet sizes are deliberately stylized for legibility and are not to physical scale. Orbits are circular in the rendered diagram; this feature does not claim precision ephemerides or model eccentricity, inclination, perturbations or apparent sky positions.

Stars are generated from deterministic trigonometric seeds, so their positions remain unchanged across frames. Canvas drawing is repeated for each Remotion frame, while title and date are HTML overlays for crisp typography.

## Audio

The render workflow generates a 30-second original ambient score, includes it in the composition and masters it to -18 LUFS / -1.5 dBTP. No third-party music or footage is used.
