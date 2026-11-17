# AI Video Studio

Prompt-driven video production system. GitHub stores projects and source code; ChatGPT prepares project files and render requests; GitHub Actions or CircleCI executes the same Remotion engine. No separate web application is required for the prompt-driven workflow.

## Engine capabilities

Two Remotion compositions are registered:

- `DemoVideo`: the original fixed M1 pipeline demonstration.
- `ProjectVideo`: a data-driven composition that reads a project JSON file and renders consecutive scenes.

A `ProjectVideo` project can define:
- 1–20 scenes of type `title`, `content`, or `outro`.
- Per-scene text, duration, background and accent colors.
- Local image assets (`png`, `jpg`, `jpeg`, `webp`, `svg`, `avif`) or remote HTTPS images.
- Local video clips (`mp4`, `mov`, `m4v`, `webm`, `mkv`) or remote HTTPS clips.
- Media placement (`background`, `left`, `right`), fit (`cover` or `contain`), object position and opacity.
- Video trim point, playback rate, mute state and volume.
- Up to 16 overlapping global audio tracks for music, voice-over, sound effects and ambience.
- Composition width, height and frame rate.
- MP4/H.264 output.

The current validator limits projects to 1,800 total frames, with each scene between 30 and 900 frames. Local assets must live under the project's `assets/` folder. Local references are checked for path traversal and file existence before rendering. Remote sources must use public HTTPS URLs, without embedded credentials, and must not point to localhost or private network addresses. Remote audio hosts must also allow cross-origin access; local project assets are more reliable for repeatable renders.

## Example project

The repository includes [projects/examples/three-scene-story/scene.json](projects/examples/three-scene-story/scene.json). It demonstrates a local SVG illustration in the opening scene and a short CC0 MP4 clip in the second scene. The SVG is stored at [projects/examples/three-scene-story/assets/connection-map.svg](projects/examples/three-scene-story/assets/connection-map.svg).

Remote video sample source: [MDN CC0 flower video](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4).

### Local rendering

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run typecheck
npm test
npm run assets:audio
npm run validate:project -- projects/examples/three-scene-story/scene.json
mkdir -p render-output
npm run render:custom -- ProjectVideo ../../render-output/internet-explainer.mp4 --props=../../projects/examples/three-scene-story/scene.json --public-dir=../../projects/examples/three-scene-story
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

The current audio engine handles track placement, trimming, looping, speed, gain, fades, and keyframed volume. It does not yet synthesize speech, generate music, perform automatic dialogue/music ducking, provide EQ/compression/reverb, pan tracks, or master loudness. A `voiceover` track currently means adding an existing voice recording; text-to-speech is a separate future feature.



The scene title/body and existing graphic accents are rendered above media layers.

## Prompt-driven cloud rendering

A render request is represented by `render-request.json`. In a ChatGPT conversation, specify the project file, provider, and output name; ChatGPT can create or update this request in the repository.

Example request:

```json
{
  "provider": "github-actions",
  "projectPath": "projects/examples/three-scene-story/scene.json",
  "compositionId": "ProjectVideo",
  "outputName": "internet-explainer",
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
- Dedicated arbitrary text layers, shape primitives, SVG path morphing, video looping, subtitles and automatic prompt-to-project generation are not implemented yet. Keyframe animation currently supports numeric transforms and opacity for media layers and the built-in text elements. Audio synthesis, text-to-speech, audio effects processing and automatic mixing are future work.
- Remote assets require the render worker to access their public HTTPS URLs. Localhost and private network addresses are rejected.
- CircleCI rendering requires the one-time CircleCI connection and the three GitHub repository secrets above.
- Artifact links are served by the selected provider and may require an authenticated session.
- YouTube publishing and permanent video storage are not implemented yet.

## CI

GitHub Actions runs type-checking, tests, demo and project validation, Remotion composition discovery with the example project's props and local public directory, and the studio build. A change limited to `render-request.json` skips the normal CI workflow and starts only the selected render provider.
