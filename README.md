# AI Video Studio

Prompt-driven video production system. GitHub stores projects and source code; ChatGPT prepares project files and render requests; GitHub Actions or CircleCI executes the same Remotion engine. No separate web application is required for the prompt-driven workflow.

## Engine capabilities

Remotion compositions include:

- `DemoVideo`: the original fixed M1 pipeline demonstration.
- `ProjectVideo`: a data-driven composition that reads a project JSON file and renders consecutive scenes.
- `ThreeDShowcase` and `CinematicAdBenchmark`: bespoke 3D/motion-design benchmarks.
- `NarratedSkyExplainer`: a custom 3D composition with Kokoro narration, aligned captions and music; it can also composite reviewed Wikimedia Commons footage as full-bleed B-roll with an animated 3D scientific inset.

A `ProjectVideo` project can define:
- 1–20 scenes of type `title`, `content`, or `outro`.
- Per-scene text, duration, background and accent colors.
- Per-scene cinematic transitions: fade, directional slide, zoom and directional wipe, with configurable frame duration and easing.
- Local image assets (`png`, `jpg`, `jpeg`, `webp`, `svg`, `avif`) or remote HTTPS images.
- Local video clips (`mp4`, `mov`, `m4v`, `webm`, `mkv`) or remote HTTPS clips.
- Media placement (`background`, `left`, `right`), fit (`cover` or `contain`), object position and opacity.
- Video trim point, playback rate, mute state and volume.
- Up to 80 vector graphic elements per scene: rectangles, ellipses, SVG paths and free-positioned text.
- SVG path draw-on animation, same-topology path morphing, and keyframed transforms, opacity and scale.
- Up to six deterministic particle systems per scene, with a combined limit of 360 particles.
- Up to 200 timed subtitle/caption cues on the global project timeline, with speaker labels, safe-area positions, alignment and frame-based fades.
- Up to 16 overlapping global audio tracks for music, voice-over, sound effects and ambience.
- Per-track high/low-pass filters, parametric EQ, compression, algorithmic echo/reverb and stereo panning.
- Sidechain compression to duck music under voice-over, plus final EBU R128 loudness mastering.
- Composition width, height and frame rate.
- MP4/H.264 output.

The current validator limits projects to 1,800 total frames, with each scene between 30 and 900 frames.

## Narrated footage workflow

The `projects/examples/narrated-explainer` sample uses the NASA Image and Video Library, including the official no-music ISS video *Earth Views from the ISS*. NASA's media guidance allows public reuse of NASA-produced content with appropriate credit; check each individual item's creator and any exceptions before selection.

The sample selection is in `projects/examples/narrated-explainer/production/nasa-asset-selection.json`. The NASA API resolves the selected NASA ID to its official media manifest, then downloads only an MP4/WebM rendition hosted by `images-assets.nasa.gov`:

```bash
npm run assets:nasa-video -- download --selection projects/examples/narrated-explainer/production/nasa-asset-selection.json --project projects/examples/narrated-explainer
```

The same ISS clip is cut from different source-time offsets for distinct storyboard shots; the wavelength comparison remains an animated 3D scientific visual. The downloader records the actual resolved source URL, NASA item page, creator, license and SHA-256 in the project manifest. Render artifacts include attribution credits. Large video binaries are not committed to Git.

## Agent production workflow

For narrated explainers and short-form videos, follow [the Narrated Video Producer skill](agent/skills/narrated-video-producer/SKILL.md). The voice track and its actual word/phrase alignment should drive the edit; footage, motion graphics, captions, music and sound effects are coordinated around that timeline. See [external skill references](agent/EXTERNAL_SKILLS.md) for the official Remotion agent skills and reviewed open-source production workflows.

The repository includes an optional Kokoro ONNX narration adapter on the GitHub Actions render worker for Spanish and US English. It derives word timings from the generated speech alignment; arbitrary uploaded recordings still need a separate alignment workflow. Paid provider calls require explicit user consent. Local assets must live under the project's `assets/` folder. Local references are checked for path traversal and file existence before rendering. Remote sources must use public HTTPS URLs, without embedded credentials, and must not point to localhost or private network addresses. Remote audio hosts must also allow cross-origin access; local project assets are more reliable for repeatable renders.

### Open-license visual asset discovery

The asset producer can search Openverse without an API key and prepare reviewed still-image assets for local use:

```bash
node scripts/openverse-assets.mjs search --query "cinematic ocean aerial" --limit 12 --output /tmp/openverse-candidates.json
```

Review the candidate source pages and licenses, then create a selection JSON by copying only approved result objects into an `assets` array and adding a `shotIds` array to each one. Download the approved images and merge their provenance into the project's asset manifest:

```bash
node scripts/openverse-assets.mjs download --selection /path/to/selection.json --project projects/<slug>
```

The helper accepts CC0, Public Domain Mark and CC BY assets; rejects non-commercial/no-derivatives licenses, unsafe URLs, unsupported formats and files over 25 MiB; and records creator, source page, license, attribution, dimensions and SHA-256. Openverse is a discovery index, not a guarantee that source metadata is correct: verify each original source page before approval. This workflow discovers still images and is not a video-generation or stock-footage API.

To generate candidate searches directly from a storyboard, run one query per shot and keep the results grouped by shot ID:

```bash
node scripts/openverse-assets.mjs storyboard-search \
  --plan projects/<slug>/production/production-plan.json \
  --max-shots 12 --limit 8 \
  --output /tmp/storyboard-assets.json
```

The output keeps candidates separate per shot and includes thumbnail URLs for visual review. The agent should compare the candidate image against the shot's subject, framing and continuity before selecting it; no image is auto-approved.


### Open-license video footage discovery

For actual moving B-roll, the separate Wikimedia Commons helper searches video files without an API key:

```bash
node scripts/commons-video-assets.mjs storyboard-search \
  --plan projects/<slug>/production/production-plan.json \
  --max-shots 12 --limit 8
```

Review each original Commons file page, license, attribution and clip content before selecting it. The downloader accepts CC0, public-domain and CC BY 2.0/3.0/4.0 candidates, supports MP4/WebM/QuickTime/Ogg, limits downloads to 150 MiB and records provenance in `production/asset-manifest.json`. Candidate discovery is not license approval; verify the original source and the actual video duration/codec before editing.

### User-provided gameplay footage

For projects that need authentic gameplay rather than illustrative diagrams, add short clips recorded by the project owner or supplied with explicit permission. The VALORANT example documents the intake process in [USER_FOOTAGE.md](projects/valorant-immortal-decision-making/production/USER_FOOTAGE.md).

The narration application now injects approved video assets into matching `ProjectVideo` scene IDs as muted full-frame backgrounds, retaining vector overlays and timed captions. Scene duration follows the narration-retimed timeline. Add manifest entries with `type: "user-provided-gameplay"`, a local `file`, `shotIds`, and either `rightsBasis: "user-owned"` or `"permission-granted"` plus a meaningful `rightsNote`. User-supplied footage is not mislabeled as Creative Commons or public domain. Unmatched scenes retain their original visuals. The render artifact includes a credits/provenance text file.

## Creative Brief → production-plan import

Once a creative model returns a storyboard JSON following the director handoff contract, convert it into a validated production plan and preserve criterion-to-shot traceability:

```bash
npm run director:production-plan -- creative-brief.json storyboard.json production-plan.json
npm run validate:plan -- production-plan.json
npm run storyboard:preview -- production-plan.json storyboard-review.html
npm run storyboard:qa -- production-plan.json
```

The importer requires the storyboard delivery settings to match the Creative Brief, all required shot descriptions, frame-aligned contiguous timing that ends at the requested runtime, and a complete `acceptanceCoverage` map. Each entry uses the exact brief criterion text, one or more known shot IDs, and a short rationale. This is an authored traceability contract—not semantic proof that the shots actually satisfy the criterion. The importer maps free-form `engineApproach` notes to `implementationNotes` and preserves recognized engine enum values. It writes a separate production-plan JSON; it does not modify the brief or storyboard, create assets, or render video.

## Automated rendered-media QA

After a render, run a technical diagnostic pass on the actual MP4:

```bash
npm run qa:media -- render-output/my-video.mp4
```

This writes `render-output/my-video.qa.json` (or a supplied report path) with ffprobe metadata, audio silence intervals, video freeze intervals, black-frame intervals and EBU R128 loudness diagnostics. Missing audio/video streams or invalid duration fail the command. Silence, freeze and black intervals are warnings because a deliberate pause, fade or black transition may be legitimate; compare timestamps with the brief and inspect/listen to the MP4. This is a technical first-pass gate, not semantic or creative approval. See [Media QA skill](agent/skills/media-qa/SKILL.md).

## Storyboard risk review

Run a deterministic first-pass review against a production plan:

```bash
npm run storyboard:qa -- projects/examples/production-plan.json
```

It reports transparent review signals such as long shots, explicit static camera holds, repeated adjacent framing/visual methods/camera movement and shot-scale repetition or low recognized scale variety. It also flags placeholder-like descriptions, missing progression markers, highly similar adjacent visuals and lengthy copy. These are non-failing heuristics—not a semantic storyboard evaluator, creative score or approval gate. Recognized shot scales are inferred from common framing phrases; unknown descriptions are excluded from the variety warning. Review findings against the brief; intentional repetition and long holds may be appropriate.


## Example project

The repository keeps [projects/examples/three-scene-story/scene.json](projects/examples/three-scene-story/scene.json) as a compatibility sample for local SVG and remote MP4 assets.

The audio/VFX test is [AETHER — Motion Design Showcase](projects/showcase-motion/scene.json): a 16-second, four-scene film with original orbital artwork, flowing vector fields, spectrum graphics, vector path reveals, deterministic particles, keyframed movement and an original soundtrack. Its SVG source art lives under [projects/showcase-motion/assets](projects/showcase-motion/assets).

The separate [KINETIC — Scene Transition Showcase](projects/showcase-transitions/scene.json) is a 15-second, five-scene visual test dedicated to fade, slide, zoom and wipe transitions. It also exercises timed captions, including a cue that stays visible across the first scene cut.

The [PULSE — Editorial Motion Film](projects/showcase-pulse/scene.json) is a 20-second, five-scene benchmark with a deliberately different art direction: bold editorial typography, contrasting palettes, geometric layouts, animated SVG morphs, particle fields, captions that cross every scene boundary and an original generated soundtrack with transition impacts. It is rendered separately in CI so the engine is tested against more than one abstract orbital design.

### Local rendering

Requirements: Node.js 22+, npm and FFmpeg on PATH.

```bash
npm install
npm run typecheck
npm test
npm run assets:audio
npm run validate:project -- projects/showcase-motion/scene.json
npm run audio:prepare -- projects/showcase-motion/scene.json
mkdir -p render-output
npm run render:custom -- ProjectVideo ../../render-output/aether-motion-showcase.mp4 --props=../../projects/showcase-motion/.render-project.json --public-dir=../../projects/showcase-motion
npm run audio:master -- render-output/aether-motion-showcase.mp4 projects/showcase-motion/scene.json
```

The renderer uses the folder containing the selected project JSON as Remotion's public directory. That makes the project's `assets/` paths resolve consistently in local renders, GitHub Actions and CircleCI. The default `npm run render` command remains the original M1 `DemoVideo` render.

## Project format

A minimal `ProjectVideo` project looks like this:

```json
{
  "schemaVersion": 1,
  "id": "my-video",
  "title": "My video",
  "composition": {
    "id": "ProjectVideo",
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "scenes": [
    {
      "id": "opening",
      "type": "title",
      "durationInFrames": 90,
      "title": "A new idea",
      "mediaLayers": [
        {
          "id": "background-image",
          "type": "image",
          "src": "assets/hero.webp",
          "x": 52,
          "y": 8,
          "width": 45,
          "height": 84,
          "fit": "contain",
          "zIndex": 1
        },
        {
          "id": "logo-overlay",
          "type": "image",
          "src": "assets/logo.webp",
          "x": 78,
          "y": 72,
          "width": 12,
          "height": 18,
          "rotation": -5,
          "startInFrames": 12,
          "durationInFrames": 60,
          "zIndex": 3
        }
      ]
    },
    {
      "id": "clip",
      "type": "content",
      "durationInFrames": 120,
      "title": "A moving picture",
      "mediaLayers": [
        {
          "id": "background-video",
          "type": "video",
          "src": "assets/clip.mp4",
          "x": 0,
          "y": 0,
          "width": 100,
          "height": 100,
          "fit": "cover",
          "muted": true,
          "trimBefore": 30,
          "playbackRate": 1,
          "zIndex": 0
        },
        {
          "id": "picture-in-picture",
          "type": "image",
          "src": "assets/overlay.webp",
          "x": 68,
          "y": 56,
          "width": 26,
          "height": 36,
          "opacity": 0.9,
          "startInFrames": 24,
          "durationInFrames": 84,
          "zIndex": 5
        }
      ]
    }
  ],
  "output": {
    "format": "mp4",
    "codec": "h264"
  }
}
```

For local media, `src` is relative to the project folder and must begin with `assets/`. For remote media, use an HTTPS URL. Images default to full-frame backgrounds; use `placement: "left"` or `"right"` to reserve the other side for text. Media opacity defaults to 1. Video is muted by default; set `muted: false` and optionally `volume` (0–1) to keep its embedded audio. A video that ends before its scene finishes holds its final frame; looping is not included in this milestone.

### Multiple layers and timing

Use `mediaLayers` instead of the legacy `media` property to compose up to eight image/video layers in one scene. Each layer can define:

- `x`, `y`, `width`, `height`: normalized percentages of the scene canvas (0–100).
- `zIndex`: stacking order; larger values render above smaller values.
- `opacity`: transparency from 0 to 1, and `rotation`: degrees from -360 to 360.
- `startInFrames` and `durationInFrames`: when the layer appears and how long it remains visible within the scene.
- Existing media properties such as `fit`, `position`, `trimBefore`, `playbackRate`, `muted`, and `volume`.

When custom geometry is provided, it overrides `placement`. The validator ensures a layer remains within the canvas and its timeline window stays inside its scene. The old single `media` property remains supported for existing projects; do not define both properties on the same scene.

### Keyframe animation

Media layers and text elements can be animated with independent numeric tracks. Supported properties are:

- `x`, `y`: normalized canvas position in percent for media and percentage translation for text. Animated values may range from -200 to 200 so elements can enter from outside the canvas; static media geometry remains within the canvas.
- `width`, `height`: media or text element size in percent.
- `opacity`: 0 (transparent) to 1 (opaque).
- `rotation`: degrees.
- `scaleX`, `scaleY`: scale multiplier, where 1 is the original size.

A keyframe's `easing` controls the segment from that keyframe to the next. Supported presets are `linear`, `ease-in`, `ease-out`, `ease-in-out`, `back`, `bounce`, `elastic`, and `spring`. For precise motion, use a cubic Bezier curve or custom spring settings.

Example media animation:

```json
{
  "id": "hero-image",
  "type": "image",
  "src": "assets/hero.webp",
  "x": 60,
  "y": 10,
  "width": 35,
  "height": 80,
  "animations": {
    "x": {
      "keyframes": [
        { "frame": 0, "value": 100, "easing": "ease-out" },
        { "frame": 30, "value": 60 }
      ]
    },
    "opacity": {
      "keyframes": [
        { "frame": 0, "value": 0 },
        { "frame": 24, "value": 1 }
      ]
    },
    "scaleX": {
      "keyframes": [
        { "frame": 0, "value": 0.7, "easing": { "type": "spring", "stiffness": 120, "damping": 16 } },
        { "frame": 30, "value": 1 }
      ]
    },
    "rotation": {
      "keyframes": [
        { "frame": 0, "value": 12 },
        { "frame": 30, "value": 0 }
      ]
    }
  }
}
```

Text elements use `titleAnimation`, `bodyAnimation`, and `eyebrowAnimation` at the scene level. Their keyframe frames are relative to the start of the scene. Media keyframes are relative to the start of that media layer's own visibility window. Keyframes must be strictly increasing and stay inside the relevant timeline duration; each property supports up to 30 keyframes.

The animation evaluator uses Remotion's deterministic frame-based `interpolate()` and easing primitives, including physics-style spring easing. This makes the same project render consistently in GitHub Actions, CircleCI, and local renders.

### Scene transitions

A scene can define `transitionIn` to overlap its entrance with the end of the previous scene. The previous scene stays rendered underneath while the incoming scene animates above it. Transition time is taken from the overlap, not added to the final video duration; music and other global audio tracks remain on the same project timeline.

Supported transition types:

- `cut`: immediate hard cut; use `durationInFrames: 0`.
- `fade`: incoming scene fades over the previous scene.
- `slide-left`, `slide-right`, `slide-up`, `slide-down`: a directional push, with both scenes moving together.
- `zoom`: incoming scene scales down into place while fading in.
- `wipe-left`, `wipe-right`: reveal the incoming scene with a directional clip-path wipe.

Animated transitions use 1–90 frames and accept the same easing presets, cubic Bezier curves and spring settings as keyframe animations. The first scene has no previous scene to transition over. The final scene has no outgoing transition. For each intermediate scene, its incoming and outgoing transition windows must leave at least one frame of normal scene time between them.

Example:

```json
{
  "scenes": [
    {
      "id": "chapter-two",
      "type": "content",
      "durationInFrames": 120,
      "title": "A new perspective",
      "transitionIn": {
        "type": "slide-left",
        "durationInFrames": 24,
        "easing": "ease-out"
      }
    }
  ]
}
```

The renderer extends the previous scene's sequence only for the overlap and keeps layers whose visibility reaches the scene boundary alive throughout that transition. Explicitly shorter layer windows remain unchanged.

### Vector graphics and VFX

Use a scene's optional `graphics` array to place vector elements above image/video media. Graphics use percentage-based `x`, `y`, `width` and `height` geometry and the same local-frame animation tracks as media layers.

Supported element types:

- `rect`: filled or outlined rectangle, with an optional corner `radius`.
- `ellipse`: filled or outlined ellipse.
- `path`: SVG path data in a local 0–100 coordinate system, with `stroke`, `strokeWidth` and optional `lineCap`.
- `text`: independent text content with font family, size, weight, letter spacing and alignment.

All graphics can use `fill`, `stroke`, `strokeWidth`, `opacity`, `rotation`, `zIndex`, `startInFrames`, `durationInFrames` and keyframe `animations`. SVG paths support `pathProgress` from 0 to 1 to animate a stroke being drawn, plus optional `pathMorph.keyframes` to interpolate absolute `M`, `L`, `C`, `Q` and `Z` path coordinates. Morphs require 2–12 keyframes with identical command topology; the first keyframe must be frame 0 and match the initial `d` path. Keyframe easing uses the same presets, Bezier curves and spring settings as other animation tracks. Relative commands and arc segments are intentionally excluded from morph tracks to keep point correspondence deterministic. Each scene supports up to 80 vector elements.

Example:

```json
{
  "graphics": [
    {
      "id": "orbit-ring",
      "type": "ellipse",
      "x": 58,
      "y": 12,
      "width": 34,
      "height": 76,
      "stroke": "#7DEBFF",
      "strokeWidth": 2,
      "opacity": 0.7,
      "animations": {
        "rotation": {
          "keyframes": [
            { "frame": 0, "value": -18 },
            { "frame": 90, "value": 18 }
          ]
        }
      }
    },
    {
      "id": "draw-on-trail",
      "type": "path",
      "x": 8,
      "y": 16,
      "width": 84,
      "height": 68,
      "d": "M0 80 C20 0 80 100 100 20",
      "stroke": "#B9F5FF",
      "strokeWidth": 2,
      "animations": {
        "pathProgress": {
          "keyframes": [
            { "frame": 0, "value": 0, "easing": "ease-out" },
            { "frame": 60, "value": 1 }
          ]
        }
      }
    },
    {
      "id": "chapter-label",
      "type": "text",
      "x": 8,
      "y": 84,
      "width": 50,
      "height": 8,
      "text": "VECTOR SYSTEM",
      "fill": "#FFFFFF",
      "fontSize": 30,
      "fontWeight": 700,
      "textAnchor": "start",
      "letterSpacing": 3
    }
  ]
}
```

The `particleSystems` array adds deterministic emitters. Each system uses a numeric `seed`, a `count`, an origin and spread, a particle lifetime, angle and speed ranges, optional gravity, size range, opacity and a palette of up to eight colors. Particles can be circles, squares or diamonds and use normal, screen or lighten blending. The same seed and project settings produce the same particles on every render.

Example:

```json
{
  "particleSystems": [
    {
      "id": "stardust",
      "count": 90,
      "seed": 4217,
      "originX": 50,
      "originY": 52,
      "spreadX": 90,
      "spreadY": 80,
      "lifeInFrames": 100,
      "angleMinDeg": 0,
      "angleMaxDeg": 360,
      "speedMin": 0.3,
      "speedMax": 3.5,
      "gravity": 0,
      "sizeMin": 1,
      "sizeMax": 5,
      "opacity": 0.75,
      "colors": ["#FFFFFF", "#8DEBFF", "#A992FF"],
      "shape": "circle",
      "blendMode": "screen"
    }
  ]
}
```

Particle speed is measured in canvas percentage per second; gravity is percentage per second squared. A scene can contain up to six systems and 360 particles total. Emitters use deterministic motion rather than runtime randomness, so frame-by-frame renders remain reproducible.


### Audio tracks and mixing

Audio is a project-level timeline, independent of scene cuts. This lets background music continue across scenes while voice-over, sound effects, and ambience enter at their own frame positions. A project can contain up to 16 overlapping tracks. Supported roles are `music`, `voiceover`, `sfx`, and `ambience`.

Example:

```json
{
  "audioTracks": [
    {
      "id": "background-score",
      "role": "music",
      "src": "assets/audio/music.mp3",
      "startInFrames": 0,
      "durationInFrames": 900,
      "volume": 0.55,
      "fadeInFrames": 45,
      "fadeOutFrames": 90,
      "loop": true,
      "volumeAutomation": {
        "keyframes": [
          { "frame": 0, "value": 1 },
          { "frame": 300, "value": 0.45, "easing": "ease-out" },
          { "frame": 480, "value": 1, "easing": "ease-in" }
        ]
      }
    },
    {
      "id": "narration-intro",
      "role": "voiceover",
      "src": "assets/audio/narration.mp3",
      "startInFrames": 30,
      "trimBefore": 15,
      "playbackRate": 1,
      "preservePitch": true,
      "volume": 1
    },
    {
      "id": "transition-whoosh",
      "role": "sfx",
      "src": "assets/audio/whoosh.wav",
      "startInFrames": 285,
      "durationInFrames": 60,
      "volume": 0.7,
      "fadeInFrames": 2,
      "fadeOutFrames": 24
    }
  ]
}
```

Track timing is measured in composition frames. `startInFrames` places the track on the full-project timeline; `durationInFrames` limits its timeline window; `trimBefore` skips the beginning of the source. The validator rejects tracks that extend past the video duration.

- `volume`: base gain from 0 (silent) to 1 (full level).
- `fadeInFrames` / `fadeOutFrames`: linear fades at the edges of the track.
- `volumeAutomation.keyframes`: an optional 0–1 gain multiplier, with the same easing presets and custom curves as visual animation.
- `playbackRate`: speed multiplier from 0.25× to 4×.
- `preservePitch`: keep the original pitch when changing playback speed.
- `loop`: repeat the selected audio range for the track's timeline window.
- `muted`: keep the track in the timeline but silence it.

Local audio files belong under the project folder's `assets/` directory. Supported formats are MP3, WAV, M4A, AAC, OGG, Opus, and FLAC. Remote sources must use public HTTPS URLs and need a host that permits cross-origin audio fetching. Prefer local audio assets for dependable cloud rendering.

The renderer uses Remotion's `<Audio>` component from `@remotion/media`. Multiple instances are mixed together on the same composition timeline; audio remains synchronized to the video frame clock. The project uses matching Remotion package versions to avoid API incompatibilities.

The sample project's audio assets are generated deterministically and are original synthesized fixtures, not third-party music. Generate them before validating or rendering the sample:

```bash
npm run assets:audio
npm run validate:project -- projects/examples/three-scene-story/scene.json
```

### Audio DSP, ducking and mastering

The base Remotion audio timeline still controls track placement, trims, playback speed, looping, fades and keyframed gain. Before rendering, `npm run audio:prepare -- <project.json>` uses FFmpeg to process any track with `effects` or `ducking` and writes a temporary `.render-project.json` plus generated WAV files under `assets/audio/.processed/`. The original project JSON is not modified.

Per-track `effects` supports:

- `highPassHz` / `lowPassHz`: remove unwanted low or high frequencies.
- `eqBands`: up to eight parametric bands, each with `frequency`, `gainDb` and optional `q`.
- `compressor`: threshold, ratio, attack, release and makeup gain.
- `reverb`: a lightweight algorithmic echo/reverb, controlled by `wet` and `roomSize`.
- `pan`: -1 (left) through 0 (centre) to 1 (right).

Music tracks can use `ducking` to reference one or more `voiceover` track IDs. FFmpeg's sidechain compressor lowers the music while the referenced voice signal is active, with configurable threshold, ratio, attack and release. For deterministic offline DSP, all tracks processed with effects or used as sidechains must be local files under the project's `assets/` directory.

Example:

```json
{
  "id": "music-bed",
  "role": "music",
  "src": "assets/audio/music.wav",
  "startInFrames": 0,
  "effects": {
    "highPassHz": 35,
    "lowPassHz": 16000,
    "eqBands": [
      { "frequency": 90, "gainDb": 2, "q": 0.8 },
      { "frequency": 2800, "gainDb": -1.5, "q": 1.2 }
    ],
    "compressor": {
      "thresholdDb": -22,
      "ratio": 3,
      "attackMs": 20,
      "releaseMs": 240,
      "makeupGainDb": 1
    },
    "reverb": { "wet": 0.2, "roomSize": 0.7 },
    "pan": 0
  },
  "ducking": {
    "sidechainTrackIds": ["narration"],
    "thresholdDb": -30,
    "ratio": 6,
    "attackMs": 25,
    "releaseMs": 350
  }
}
```

A project may also specify `audioMastering` with `integratedLufs`, `truePeakDb` and `loudnessRange`. After Remotion renders the mixed MP4, `npm run audio:master -- <video.mp4> <project.json>` applies FFmpeg's EBU R128 `loudnorm` filter to the final audio stream while copying the video stream. Defaults are -16 LUFS, -1.5 dBTP and 11 LU.

The new AETHER showcase exercises EQ, compression, algorithmic reverb, panning, sidechain ducking and final loudness mastering in CI. Its ducking key is a muted deterministic test signal so the demo can verify sidechain behaviour without pretending it contains recorded speech.

This is still a lightweight DSP chain, not a full DAW or mastering suite. Text-to-speech, voice generation, convolution reverb, multiband dynamics, advanced noise reduction and automatic speech transcription are future work. A `voiceover` track currently means importing an existing recording.



The scene title/body and existing graphic accents are rendered above media layers.

## Subtitle and caption timeline

Subtitles are optional project-level cues, measured in composition frames rather than scene-local frames. Because the cues are rendered above the complete scene sequence, a caption can continue across a hard cut or cinematic transition without being restarted. Cues may overlap for simultaneous speakers.

Each cue supports:
- Required `id`, `startInFrames`, `durationInFrames` and `text`.
- Optional `speaker` label.
- `position`: `top`, `center` or `bottom` (default: `bottom`).
- `alignment`: `left`, `center` or `right` (default: `center`).
- Optional font size, weight, family and text color.
- A dark readability panel with configurable opacity.
- Optional fade-in and fade-out frame counts (short fades are applied by default).

Example:

```json
{
  "subtitles": [
    {
      "id": "caption-01",
      "startInFrames": 42,
      "durationInFrames": 75,
      "text": "A visual story begins with a single shift.",
      "speaker": "NARRATOR",
      "position": "bottom",
      "alignment": "center",
      "fontSize": 36,
      "fontWeight": 600,
      "color": "#FFFFFF",
      "backgroundOpacity": 0.78,
      "fadeInFrames": 6,
      "fadeOutFrames": 8
    }
  ]
}
```

The validator limits a project to 200 cues, requires every cue to remain inside the complete video timeline, and checks IDs, text lengths, style values and fade durations. This is a timed overlay system; it does not generate speech or automatically transcribe audio.
## Agent-led production workflow

The repository includes an agent production playbook under [`agent/`](agent/README.md), focused skills for creative direction, storyboarding, asset production, Remotion implementation, audio design and visual QA, plus a separate [production-plan schema](schemas/production-plan.schema.json). A production plan is not a renderable project; it is the planning artifact used before creating `projects/<slug>/scene.json`.

Read [the full production workflow](docs/agent-production-workflow.md) and validate a plan with:

```bash
npm run validate:plan -- projects/examples/production-plan.json
```

This is an orchestration contract for an AI agent, not a hosted LLM service. The repository does not autonomously call a model or generate assets by itself; the connected agent performs those steps using the available tools.

## Prompt-driven cloud rendering

A render request is represented by `render-request.json`. In a ChatGPT conversation, specify the project file, provider, and output name; ChatGPT can create or update this request in the repository.

Example request:

```json
{
  "provider": "github-actions",
  "projectPath": "projects/showcase-motion/scene.json",
  "compositionId": "ProjectVideo",
  "outputName": "aether-motion-showcase",
  "requestId": "replace-with-a-unique-id"
}
```

Supported providers:

- `github-actions`: GitHub Actions renders the MP4 and stores it as an artifact for 3 days.
- `circleci`: a small GitHub Actions dispatcher calls the CircleCI API; CircleCI performs the same Remotion render and stores the MP4 as a CircleCI artifact.

The render request must use a new `requestId` each time. The selected project JSON is passed to Remotion through `--props`; for `ProjectVideo`, the project folder is also passed as `--public-dir` so its assets load in both providers.

### One-time CircleCI setup

1. Sign in to CircleCI and connect the private GitHub repository `DarkonLikesCoffee/ai-video-studio`.
2. Set the project's config source to `.circleci/config.yml` and make sure its pipeline definition is available.
3. In CircleCI, copy the project slug from **Project Settings → Overview** and the pipeline definition ID from **Project Settings → Pipelines**.
4. Create a CircleCI personal API token. CircleCI API v2 requires a personal API token; project API tokens are not supported for v2.
5. In GitHub, open **Settings → Secrets and variables → Actions** and add these repository secrets:
   - `CIRCLECI_TOKEN`: the CircleCI personal API token.
   - `CIRCLECI_PROJECT_SLUG`: the exact three-part project slug shown by CircleCI.
   - `CIRCLECI_PIPELINE_DEFINITION_ID`: the pipeline definition UUID.

Do not commit tokens or place them in `render-request.json`. GitHub Actions reads the secrets and sends only the render parameters to CircleCI.

### Checking a CircleCI render

Use this request shape in `circleci-status-request.json` (the `requestId` must be unique each time):

```json
{
  "pipelineId": "the-pipeline-uuid-from-the-render-dispatch-log",
  "requestId": "status-check-unique-id"
}
```

A push that changes only this file starts a short GitHub Actions status check. It reports whether the CircleCI job is queued, running, successful, or failed, and lists the artifact URL when the MP4 is ready. It does not keep a GitHub runner waiting while CircleCI renders.

## Current limitations

- `ProjectVideo` supports up to eight simultaneous image/video layers per scene, with normalized geometry, rotation, opacity, z-order, and independent visibility windows.
- Audio DSP uses local FFmpeg binaries. Tracks that need EQ, compression, reverb, panning or sidechain processing must use local assets; remote audio can still be used for unprocessed playback.
- Video looping and shader-based effects are not implemented in the data-driven `ProjectVideo` schema. Bespoke 3D work requires a custom Remotion composition. The repository now defines an agent production workflow and validates pre-production plans, but it does not host an autonomous LLM agent or an automatic asset-generation service. Timed subtitle overlays are supported, but automatic transcription and text-to-speech are not implemented. SVG path morphing is supported for compatible absolute M/L/C/Q/Z path topologies. The current vector system supports rectangles, ellipses, paths, text, deterministic particle fields and 2D scene transitions; it is not a full 3D or node-based VFX suite. Audio synthesis, text-to-speech, convolution reverb and multiband processing are future work.
- Remote assets require the render worker to access their public HTTPS URLs. Localhost and private network addresses are rejected.
- CircleCI rendering requires the one-time CircleCI connection and the three GitHub repository secrets above.
- Artifact links are served by the selected provider and may require an authenticated session.
- YouTube publishing and permanent video storage are not implemented yet.

## CI

GitHub Actions runs type-checking, tests, production-plan validation, legacy-project validation, FFmpeg audio preparation (including sidechain DSP), and the studio build. Video rendering is intentionally separated into the on-demand render workflow so ordinary code changes do not generate benchmark videos or accumulate render artifacts. A change limited to `render-request.json` skips the normal CI workflow and starts only the selected render provider.


## Custom Remotion compositions

The cloud render request can target any composition registered in `packages/video-engine/src/root.tsx`; Remotion rejects IDs that are not registered. Use `ProjectVideo` with a validated `projectPath` for schema-driven projects. For a custom React composition, set `compositionId` to its registered ID and optionally provide `projectPath` to a JSON props file under `projects/`. The request file may omit `projectPath` when the composition uses only its own defaults and bundled assets. When a custom composition receives `projectPath`, the render worker passes that JSON file as props and uses its folder as the public asset directory.


## Generated narration and word-synced captions

A ProjectVideo render can request an optional generated voice-over by adding `narrationPath` to `render-request.json`:

```json
{
  "provider": "github-actions",
  "projectPath": "projects/examples/narrated-explainer/scene.json",
  "narrationPath": "projects/examples/narrated-explainer/production/narration.json",
  "compositionId": "ProjectVideo",
  "outputName": "narrated-sky-explainer",
  "requestId": "narrated-sky-v1"
}
```

The narration config uses `schemaVersion: 1`, a `text` field, and optional `language`, `voice`, `speed`, `speaker`, and `subtitle` settings. The initial Kokoro ONNX adapter supports Spanish (`es`: `ef_dora`, `em_alex`, `em_santa`) and US English (`en-us`: `af_heart`, `af_sarah`). Its MIT runtime and Apache-2.0 model run on the render worker; no hosted TTS account or API key is used. Model files are cached between GitHub Actions runs. The Spanish voice choices are experimental and should be listened to before commercial use.

The pipeline writes `assets/audio/narration.wav` and `production/narration-alignment.json`, derives word timings from the model's phoneme durations, and builds short phrase captions with per-word highlighting. It inserts a voice-over track, applies sidechain ducking to music tracks, and leaves the original project JSON untouched. When narration is requested, the storyboards must be long enough for the generated speech; the pipeline deliberately fails instead of speeding up or clipping a longer voice-over. Do not include an existing voice-over track in the same project when requesting generated narration.


### Custom narrated 3D composition benchmark

The narrated explainer also registers `NarratedSkyExplainer`, a bespoke five-shot Three.js composition. It uses the same narration script/alignment workflow but consumes `projects/examples/narrated-explainer/composition.json` as composition metadata rather than the ProjectVideo scene schema. The render worker stages the original score and transition whoosh beside the generated narration, then supplies the timed subtitle cues as Remotion props. This benchmark deliberately uses a different visual scene for each chapter (solar-system wide shot, molecule macro, wavelength visualization, scattering particle field and a luminous horizon) rather than the reusable ProjectVideo title-card layout.


## Storyboard planning preview

Generate a reviewable HTML overview from a production plan before committing to asset production or a full render:

```bash
npm run storyboard:preview -- projects/<project>/production/production-plan.json /tmp/storyboard-review.html
```

The page presents shot order, time ranges, selected visual methods, concrete actions, start/development/end progression, framing, camera movement, transitions, text, asset references and audio cues. It is a **planning review artifact**, not an MP4, animated animatic, generated footage or semantic creative approval. It does not render or load referenced assets. Use it to review whether the authored sequence tells a coherent visual story before production.

## Storyboard quality signals

The storyboard QA command also reports transparent warning-only heuristics for placeholder-like visual/action descriptions, missing Start/Development/End progression markers, highly similar adjacent visual descriptions, and long on-screen copy. These are review prompts—not semantic judgments or automatic failures. A human/AI creative review remains necessary.

## Storyboard critique report

Run a review-only critique against a production plan:

```bash
npm run storyboard:critic -- projects/examples/production-plan.json review-output/critique.md
```

The report turns deterministic storyboard-risk findings into prioritized, concrete revision guidance (high/medium). It does not rewrite the source plan, does not use an AI model, and is not a creative approval. Apply selected changes to a copy, then rerun `npm run validate:plan` and `npm run storyboard:qa`.


## Traceable storyboard revisions

Create a revision artifact from a production plan. It preserves the exact source text and parsed plan, SHA-256 fingerprint, critic suggestions (initially unselected), explicit shot edits and validation results:


```bash
npm run storyboard:revision -- init projects/<slug>/production/production-plan.json projects/<slug>/production/storyboard-revision.json
```

Review the artifact and manually set `suggestions[].selected` to `true` for suggestions you want to retain. Add explicit edits to `edits` (each with `shotId`, `changeNote` and a `fields` object). Validate the revision, then write the revised plan to a separate file:


```bash
npm run storyboard:revision -- validate projects/<slug>/production/storyboard-revision.json
npm run storyboard:revision -- apply projects/<slug>/production/storyboard-revision.json projects/<slug>/production/production-plan-revised.json
npm run validate:plan -- projects/<slug>/production/production-plan-revised.json
npm run storyboard:qa -- projects/<slug>/production/production-plan-revised.json
```

The CLI refuses to proceed if the original source file changed or the embedded source text/hash no longer match. The original plan is never overwritten. Validation errors and heuristic warnings are stored separately in the revision artifact; warnings are not semantic creative approval. Suggestions are not automatically applied: edits remain explicit and reviewable.

Select or deselect suggestions and generate a review report without applying changes:
```bash
npm run storyboard:revision -- select projects/<slug>/production/storyboard-revision.json suggestion-001
npm run storyboard:revision -- select projects/<slug>/production/storyboard-revision.json suggestion-001 --off
npm run storyboard:revision -- review projects/<slug>/production/storyboard-revision.json projects/<slug>/production/revision-review.md
```
Selected suggestions are review markers only; they do not generate edits. The Markdown review report shows selections, critique details, explicit edits and the last validation state.

Export a ready-to-use, model-neutral revision brief that includes only selected suggestions and the original shot data for affected shots:
```bash
npm run storyboard:revision -- prompt projects/<slug>/production/storyboard-revision.json projects/<slug>/production/revision-prompt.md
```
The prompt contains constraints to preserve the original plan, edit only referenced shots, avoid inventing assets or unsupported capabilities, and return JSON `edits` suitable for review. It is a handoff prompt—not an AI API call. It requires at least one selected suggestion and does not alter the revision artifact or plan.

After the model returns JSON edits, import them into the revision artifact (this does not alter the storyboard plan):
```bash
npm run storyboard:revision -- import-edits projects/<slug>/production/storyboard-revision.json model-response.json
npm run storyboard:revision -- validate projects/<slug>/production/storyboard-revision.json
npm run storyboard:revision -- apply projects/<slug>/production/storyboard-revision.json projects/<slug>/production/storyboard-revised.json
```
The importer rejects unknown shot IDs, duplicate edits per shot, unselected-shot edits and unsupported field names. Imported edits remain explicit and must be validated before applying to a separate revised-plan file.


### True-peak audio QA

The media QA report extracts EBU R128 true-peak readings from FFmpeg's `ebur128` summary when available. A reading above the recommended `-1.0 dBFS` threshold is reported as a warning; above `0.0 dBFS` is an error. Missing true-peak data is not treated as a pass or failure and is omitted from the report. These thresholds are configurable through `inspectMedia` options (`warningTruePeakDbfs`, `maxTruePeakDbfs`).


### Trailing-silence detection

Media QA now treats an unmatched final FFmpeg `silence_start` as an interval ending at the probed file duration (EOF). This catches audio that becomes silent and remains silent through the end of the video, even when FFmpeg does not emit a matching `silence_end` event. A zero-length interval at EOF is ignored.


### Contact sheets for rendered-video inspection

Generate a visual contact sheet from an MP4 using FFmpeg, sampled at a configurable interval. This helps spot repeated compositions, pacing and visual gaps; it does not replace watching the video.

```bash
npm run qa:contact-sheet -- render.mp4
npm run qa:contact-sheet -- render.mp4 --interval 3 --columns 5 --width 360 --output review.jpg
```

Defaults: one thumbnail every 5 seconds, 4 columns, 320 px width. Requires FFmpeg and FFprobe. Output is JPEG; video is not modified.

### Render artifacts

GitHub Actions renders now also generate a contact sheet and a versioned JSON evidence report automatically after media QA. Both files are uploaded alongside the MP4 and media-QA report, making sparse visual review available for every GitHub Actions render without a manual command. The contact sheet samples at 5-second intervals by default; it is not a substitute for watching the full video.


## Narrative beat review

Production plans may optionally label shots with `narrativeBeat`: `hook`, `setup`, `context`, `development`, `escalation`, `reveal`, `payoff`, `cta`, `transition` or `pause`. These labels are explicit author/director choices; the system does not infer story roles from prose.

Generate a review report:

```bash
npm run storyboard:beats -- projects/examples/production-plan.json
```

Write a Markdown report to a file, or use `--json` for a versioned machine-readable report:

```bash
npm run storyboard:beats -- projects/examples/production-plan.json beats.json --json
```

The report groups tagged shots, totals their durations, shows untagged shots and offers review prompts for missing opening/development/payoff labels when at least 60% of a sequence of three or more shots is labeled. These are optional creative guidelines—not validation errors or an approval score. Formats that do not use a conventional narrative arc may omit tags or ignore the prompts.


## Creative brief contract (AI Production Director groundwork)

Before a storyboard, capture the video's objective, audience, desired response, creative thesis, emotional arc, visual language, storytelling strategy, motion, sound and production-method strategy in a model-neutral JSON creative brief. The version-1 schema is `schemas/creative-brief.schema.json`; a sample is `projects/examples/creative-brief.json`.


Validate and render a Markdown summary:

```bash
npm run director:brief -- projects/examples/creative-brief.json
npm run director:brief -- projects/examples/creative-brief.json creative-brief-summary.md
```

This is a contract/validation stage, not an autonomous LLM director. It does not generate the brief, storyboard or assets.
