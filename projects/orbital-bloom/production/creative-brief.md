# ORBITAL BLOOM — Creative Brief

## Concept
A dormant mechanical seed awakens inside a derelict orbital research station, unfolds into the last living organism of an extinct ecosystem, and reveals that the station was an enormous greenhouse built to preserve it.

## Audience and intended response
Viewers of premium science-fiction shorts and cinematic CGI. The emotional path is unease → tactile curiosity → anticipation → wonder → quiet revelation. The audience should understand the events by watching them, not through exposition.

## Creative thesis
A machine designed to preserve life becomes the final vessel of life itself. The contrast between machined metal and translucent organic growth carries the story.

## Narrative arc
1. **Discovery:** A dark station and damaged containment bay conceal a small floating seed.
2. **Recognition:** A macro camera pass reveals a sophisticated mechanism and dormant core.
3. **Activation:** The core ignites; the iris, rings and shell articulate in a coordinated release.
4. **Transformation:** The seed touches barren ground and becomes a living plant with roots, stems, branches, leaves and petals.
5. **Revelation:** A wide retreat exposes the station as an enormous orbital greenhouse, with a planet beyond its dome.

## Visual system
- **Palette:** Near-black station steel, desaturated blue-grey, machined copper, brushed titanium, amber energy, deep botanical teal, warm translucent petals and muted planetary blue.
- **Materials:** Physically based metals with controlled roughness and clearcoat; a transparent mineral-like chamber; emissive amber core; translucent petal surfaces with luminous veins; weathered steel and thin glass.
- **Lighting:** Cold low-intensity environmental fill. Grazing highlights define the shell. Amber core light becomes the practical source warming the plant and soil. The greenhouse reveal adds soft planetary blue.
- **Composition:** One continuous spatial environment, not five title cards. Close asymmetric framing gives way to low growth cinematography and a wide architectural payoff.
- **Typography:** None until the final two seconds; one restrained serif title.

## Motion and camera
Frame-synchronised 20-second camera path: high oblique station approach; macro orbital exploration; controlled orbit around the opening iris; low tracking arc as roots and petals grow; long rising dolly-back through the greenhouse. Use easing, anticipation and staggered mechanical timings. Every moving part has a causal role.

## Sound identity
No narrator or dialogue. Original 48 kHz stereo soundscape: low station resonance, sparse signal ticks, latch impact, metallic iris and panel movement, organic glass-like harmonics and a warm resolving tonal bed. Events are synchronised to the activation and bloom.

## Production strategy
- **Renderer:** `custom-remotion / OrbitalBloom3D`, a dedicated Remotion composition using React Three Fiber.
- **3D build:** Procedural geometry for eight segmented shell plates, pins, articulated iris blades, three independent rings, clear core chamber, amber core, greenhouse dome, station structure, planet and organic plant.
- **Audio:** Node built-in PCM synthesis at render time; no network or paid provider.
- **Rights:** 3D and audio source files are original project assets; no stock models, textures, footage or samples.
- **Fallback:** Do not substitute ProjectVideo. Diagnose WebGL or compatibility issues in the custom composition while preserving the visual story.

## Delivery
20 seconds, 1920×1080, 30fps, H.264 MP4 with AAC stereo audio. No dialogue, subtitles or explanatory copy. Final title: ORBITAL BLOOM.

## Acceptance criteria
1. Five readable narrative beats in one coherent visual world.
2. A detailed mechanical seed that visibly unfolds.
3. A genuine procedural 3D plant with independently animated organic forms.
4. Camera movement changes scale and perspective with the story.
5. Final reveal of the greenhouse, plant and distant planet.
6. Original sound design and passing technical QA; actual visual/audio review remains required.
