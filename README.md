# AI Video Studio

Prompt-driven video production system. GitHub stores the projects and source code; ChatGPT prepares render requests; GitHub Actions or CircleCI executes the same Remotion renderer.

## Current engine scope

M1 currently registers one Remotion composition: `DemoVideo`. Its demo project is `projects/demo/scene.json` (1920×1080, 30 FPS, 10 seconds).

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run typecheck
npm test
npm run validate:demo
npm run render
```

The default local render command remains `npm run render`. To select an explicit composition and output path:

```bash
mkdir -p render-output
npm run render:custom -- DemoVideo ../../render-output/my-video.mp4
```

## Prompt-driven cloud rendering

A render request is represented by `render-request.json`. ChatGPT can create or update this file in the repository after you specify the provider in your prompt.

Example request:

```json
{
  "provider": "github-actions",
  "projectPath": "projects/demo/scene.json",
  "compositionId": "DemoVideo",
  "outputName": "my-video",
  "requestId": "replace-with-a-unique-id"
}
```

Supported providers:

- `github-actions`: GitHub Actions renders the MP4 and stores it as an artifact for 3 days.
- `circleci`: a small GitHub Actions dispatcher calls the CircleCI API; CircleCI performs the render and stores the MP4 as an artifact (30 days by default).

The request file is intentionally separate from the renderer. Every request must use a new `requestId`, so repeating the same render settings still creates a new commit and starts a new render.

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

### Current limitations

- Only the registered `DemoVideo` composition can be rendered. The project path is validated against its composition ID.
- CircleCI rendering cannot start until the one-time CircleCI connection and three GitHub repository secrets are configured.
- The dispatcher confirms that CircleCI accepted the pipeline request. The actual render result and MP4 are available in the CircleCI pipeline's Artifacts tab.
- YouTube publishing and permanent video storage are not implemented yet.

## CI

GitHub Actions runs type-checking, tests, demo validation, and the studio build for code changes. A change limited to `render-request.json` skips the normal CI workflow and starts only the selected render provider.
