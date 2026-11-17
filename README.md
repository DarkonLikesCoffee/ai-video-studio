# AI Video Studio

Prompt-driven video production system. GitHub stores projects and source code; ChatGPT prepares project files and render requests; GitHub Actions or CircleCI executes the same Remotion engine. No separate web application is required for the prompt-driven workflow.

## Engine capabilities

Two Remotion compositions are currently registered:

- `DemoVideo`: the original fixed M1 pipeline demonstration.
- `ProjectVideo`: a data-driven composition that reads a project JSON file and renders a sequence of configurable scenes.

A `ProjectVideo` project can define:
- 1–20 consecutive scenes, each with a type (`title`, `content`, or `outro`).
- Per-scene title, eyebrow, body text, duration, background color, and accent color.
- Composition width, height, and frame rate.
- MP4/H.264 output.

The current validator limits a project to 1,800 total frames, with each scene between 30 and 900 frames. Images, source video clips, voice-over, music, subtitles, and automatic prompt-to-project generation are not implemented yet.

## Example project

The repository includes [projects/examples/three-scene-story/scene.json](projects/examples/three-scene-story/scene.json), a three-scene explainer about how the internet works. The entire video is described by this JSON file; the shared `ProjectVideo` component renders it.

To render it locally from the repository root:

```bash
npm install
npm run typecheck
npm test
npm run validate:project -- projects/examples/three-scene-story/scene.json
mkdir -p render-output
npm run render:custom -- ProjectVideo ../../render-output/internet-explainer.mp4 --props=../../projects/examples/three-scene-story/scene.json
```

Requirements: Node.js 22+ and npm. The default `npm run render` command remains the original M1 `DemoVideo` render.

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
      "eyebrow": "INTRODUCTION",
      "title": "A new idea",
      "body": "A short supporting sentence.",
      "backgroundColor": "#0B1020",
      "accentColor": "#67E8F9"
    }
  ],
  "output": {
    "format": "mp4",
    "codec": "h264"
  }
}
```

Each scene has a unique ID and a required title. Colors must use six-digit hex notation. The project validator checks the schema before either render provider is started.

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

The render request must use a new `requestId` each time. The selected scene file is passed to Remotion through its `--props` option, so scene content and timing come from the project JSON rather than a hardcoded component.

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

### Current limitations

- The registered compositions are currently `DemoVideo` and `ProjectVideo`.
- `ProjectVideo` currently supports text-based motion-graphics scenes only; media assets and audio are future work.
- CircleCI rendering requires the one-time CircleCI connection and the three GitHub repository secrets above.
- Artifact links are served by the selected provider and may require an authenticated session.
- YouTube publishing and permanent video storage are not implemented yet.

## CI

GitHub Actions runs type-checking, tests, project validation, Remotion composition discovery using the example project props, and the studio build. A change limited to `render-request.json` skips the normal CI workflow and starts only the selected render provider.
