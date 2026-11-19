# Agent-led video production workflow

## Purpose

Define how an AI agent turns a natural-language brief into a finished video using the existing AI Video Studio engine. This is deliberately separated from the Remotion renderer: the agent plans and orchestrates; Remotion executes a deterministic project.

## Pipeline and artifacts

| Stage | Input | Required output | Gate |
|---|---|---|---|
| Brief | User prompt, references, constraints | Creative brief | Goal, audience and deliverable understood |
| Direction | Creative brief | Creative direction | One coherent, producible concept |
| Storyboard | Direction | Timed shot list | Runtime, pacing and visual variety checked |
| Assets | Shot list | Local assets + asset manifest | Every required asset exists and has known provenance |
| Build | Storyboard + assets | `scene.json` or custom composition | Typecheck/tests/project validation pass |
| Render | Valid project | MP4 artifact | Exact render request completes |
| QA | MP4 artifact | Timestamped issue report | Actual video inspected against criteria |
| Iterate | Issue report | Corrected project and new render | Blockers/major issues resolved |
| Deliver | Accepted MP4 | Artifact link + delivery notes | Final artifact matches accepted commit |

## Project boundaries

- `projects/<slug>/scene.json` remains the renderable `VideoProject` source.
- `projects/<slug>/production/` stores non-rendered planning documents: `creative-brief.md`, `storyboard.md`, `asset-manifest.json`, `audio-cue-sheet.md`, and `qa-report.md`.
- `projects/<slug>/assets/` stores local media used by the renderer.
- Do not add planning-only fields to the render schema.
- The `render-request.json` selects one project and one composition. Use a unique request ID for each actual render.

## Agent operating loop

1. Read the user's prompt and all supplied references. Preserve factual details and distinguish verified facts from assumptions.
2. Apply the Creative Director skill and record the selected direction.
3. Apply the Storyboard skill. Check timing mathematically and review adjacent-shot variety. If revisions are needed, initialize a revision artifact, select recommendations for review, export a review Markdown report, and author explicit edits separately. Selection alone does not change the plan. For selected critiques, use `npm run storyboard:revision -- prompt <revision.json> [revision-prompt.md]` to create a model-neutral handoff containing only affected shots and selected findings. Treat returned JSON edits as suggestions: import them with `npm run storyboard:revision -- import-edits <revision.json> <model-response.json>`. The importer limits edits to shots covered by selected critiques, rejects duplicate/unknown shot IDs and unsupported fields, then validate/apply to a separate plan copy.
4. Apply Asset Producer and Audio Designer. Create local assets and provenance/cue manifests.
5. Map the storyboard into the existing project schema. If a requested shot needs unsupported 3D or other features, decide whether to implement a reusable engine feature or choose a different visual solution.
6. Validate before rendering. Do not render all showcase videos for a project-specific change.
7. Render only the selected output.
8. Download and inspect the exact MP4 artifact from that run. Generate contact sheets and keyframes, and watch the full video if playback is available.
9. Apply Visual QA. If it fails, change the fewest high-impact things and rerender.
10. Deliver only the inspected final artifact, with the source commit and render-run link.

## Current capability truth

The existing engine has a capable data-driven 2D Remotion composition, vector graphics, keyframed animation, SVG path morphing, deterministic particles, scene transitions, subtitles and a global audio timeline with offline DSP/mastering. A separate Three.js showcase and a custom AURA benchmark demonstrate basic custom 3D composition work.

The repository does **not** yet contain an automatic prompt-to-project model, automatic asset-generation service, built-in voice generation/transcription, a general-purpose 3D scene authoring schema, or an automatic video-understanding/QA model. The agent can orchestrate available tools and inspect rendered artifacts, but these capabilities must not be represented as already built into the product.

## Quality principles

- Story first, visuals second, effects third.
- Use actual shot changes, not only title changes.
- Use distinct compositions, not one template repeated.
- Source assets intentionally and preserve rights/provenance.
- Local assets and deterministic renders are the default.
- A successful render is a candidate, not an accepted deliverable.
