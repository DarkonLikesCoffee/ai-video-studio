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
- Composition width, height and frame rate.
- MP4/H.264 output.

The current validator limits projects to 1,800 total frames, with each scene between 30 and 900 frames. Local assets must live under the project's `assets/` folder. Local references are checked for path traversal and file existence before rendering. Remote sources must use public HTTPS URLs, without embedded credentials, and must not point to localhost or private network addresses.

## Example project

The repository includes [projects/examples/three-scene-story/scene.json](projects/examples/three-scene-story/scene.json). It demonstrates a local SVG illustration in the opening scene and a short CC0 MP4 clip in the second scene. The SVG is stored at [projects/examples/three-scene-story/assets/connection-map.svg](projects/examples/three-scene-story/assets/connection-map.svg).

Remote video sample source: [MDN CC0 flower video](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4).

### Local rendering

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run typecheck
npm test
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

The scene title/body and existing graphic accents are rendered above media layers. Dedicated independently positioned text layers, shape primitives, and keyframe animation are later milestones.

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
- Dedicated text layers, shape primitives, keyframe animation, video looping, audio-only tracks, voice-over, subtitles and automatic prompt-to-project generation are not implemented yet.
- Remote assets require the render worker to access their public HTTPS URLs. Localhost and private network addresses are rejected.
- CircleCI rendering requires the one-time CircleCI connection and the three GitHub repository secrets above.
- Artifact links are served by the selected provider and may require an authenticated session.
- YouTube publishing and permanent video storage are not implemented yet.

## CI

GitHub Actions runs type-checking, tests, demo and project validation, Remotion composition discovery with the example project's props and local public directory, and the studio build. A change limited to `render-request.json` skips the normal CI workflow and starts only the selected render provider.
