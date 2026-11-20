# Agent-led video production workflow

## Purpose

Define how an AI agent turns a natural-language brief into a finished video using the existing AI Video Studio engine. This is deliberately separated from the Remotion renderer: the agent plans and orchestrates; Remotion executes a deterministic project.

## Pipeline and artifacts

| Stage | Input | Required output | Gate |
|---|---|---|---|
| Brief | User prompt, references, constraints | Creative brief | Goal, audience and deliverable understood |
| Direction | Creative brief | Creative direction | One coherent, producible concept |
| Storyboard | Creative Brief + model storyboard JSON | Validated production plan + criterion-to-shot trace | Every criterion maps to known shot IDs; delivery matches the brief; timing is contiguous and frame-aligned |
| Assets | Shot list + production plan | Local assets + asset manifest + strict criterion/shot asset-evidence report (included in render artifact) | Planned references resolve; manifest shot IDs are valid; local files, provenance and rights evidence are complete before render |
| Build | Storyboard + assets | `scene.json` or custom composition | Typecheck/tests/project validation pass |
| Render-ready freeze | Complete candidate project | Frozen commit SHA + unique render request | All project and production checks pass; no planned edits remain; exact candidate SHA is recorded |
| Render | Frozen, valid project | MP4 artifact | Explicit request for that candidate completes |
| QA | MP4 artifact | Timestamped issue report | Actual video inspected against criteria |
| Iterate | Issue report | Corrected project and new render candidate | Only targeted fixes; all checks repeated before the next render |
| Deliver | Accepted MP4 | Artifact link + delivery notes | Final artifact matches accepted commit |

## Project boundaries

- `projects/<slug>/scene.json` remains the renderable `VideoProject` source.
- `projects/<slug>/production/` stores non-rendered planning documents: `creative-brief.md`, `storyboard.md`, `asset-manifest.json`, `audio-cue-sheet.md`, and `qa-report.md`.
- `projects/<slug>/assets/` stores local media used by the renderer.
- Do not add planning-only fields to the render schema.
- `render-request.json` selects one project and one composition. Its commit is a **render trigger**. Never update it during normal project construction or while a render is queued/running.

## Technical render-request gate

The GitHub Actions render workflow enforces the freeze protocol before installing dependencies or running Remotion:

- Push the complete, validated candidate project to the target branch first. This is a normal development push and does not trigger rendering.
- In a separate commit, change **only** `render-request.json`. Set `candidateSha` to the full SHA of the remote branch tip immediately before that request-only commit.
- The preflight compares `candidateSha` to the push's previous remote SHA and verifies that the entire triggering push changed exactly one path: `render-request.json`.
- The workflow fetches full Git history and checks request history across fetched refs. A candidate SHA or request ID already submitted is rejected; only the earliest duplicate submission can proceed.
- A request cannot render on the initial push that creates a branch. It must follow a candidate that already exists on the remote.
- To render a corrected version after a failure, commit the correction as a new candidate, push it normally, and then make one new request-only commit. Do not reuse the old candidate SHA or request ID.

This is a technical safety gate, not proof of creative readiness. Existing project, narration, production-plan, asset-evidence and final-media QA checks still apply.

## Agent operating loop

1. Read the user's prompt and all supplied references. Preserve factual details and distinguish verified facts from assumptions.
2. Validate the brief with `npm run director:brief -- <creative-brief.json>`. Use `npm run director:storyboard-prompt -- <creative-brief.json> [handoff.md]` to create the shot-level handoff. Submit it to a creative model/agent, then review the storyboard against the output contract and brief; the CLI creates instructions, not the storyboard itself.
3. Apply the Creative Director skill and record the selected direction.
4. Produce the shot-level storyboard JSON from the creative handoff (or author it directly). Import it with `npm run director:production-plan -- <creative-brief.json> <storyboard.json> <production-plan.json`. The importer requires exact delivery settings, frame-aligned contiguous timing, and complete acceptance-criterion mappings to known shot IDs with rationale. Coverage is an authored claim, not semantic proof; review each mapped shot against its criterion.
5. Apply the Storyboard skill. Check adjacent-shot variety and use the preview as a review checkpoint. Where useful, label shots with narrativeBeat and run storyboard:beats; treat its prompts as review guidance, not a fixed narrative formula. If revisions are needed, initialize a revision artifact, select recommendations, export a Markdown report, and author explicit edits separately. Selection alone does not change the plan. For selected critiques, use storyboard:revision prompt to create a model-neutral handoff containing only affected shots and selected findings. Treat returned JSON edits as suggestions: import them with storyboard:revision import-edits. The importer limits edits to selected shot IDs, rejects duplicate/unknown IDs and unsupported fields, then validate/apply to a separate plan copy.
6. Apply Asset Producer and Audio Designer. Create local assets and provenance/cue manifests. Run `npm run director:asset-evidence -- <production-plan.json> [asset-manifest.json] [report.json]` to map criterion→shots→manifest assets and verify local file/path safety plus provenance/rights fields. The render workflow enforces `--strict` for plans with manifests; procedural shots may intentionally have no asset. The report is not semantic proof that an asset satisfies a criterion.
7. Map the storyboard into the existing project schema. If a requested shot needs unsupported 3D or other features, decide whether to implement a reusable engine feature or choose a different visual solution.
8. **BUILD COMPLETE:** Finish all creative, asset, narration, timing, composition and caption work. Commit normal development checkpoints as needed, but do not touch `render-request.json`. The branch may have many commits; that is expected and must not create render requests.
9. **PRE-RENDER GATE:** Validate the exact candidate: typecheck/tests, project validation, production plan validation, frame-aligned duration, contiguous shots, final shot ending exactly at delivery duration, asset evidence and rights/provenance, narration, paths and composition. Review the complete project and explicitly declare it RENDER-READY. If any blocker exists, continue building; do not render.
10. **FREEZE:** Commit all candidate files and record the candidate SHA. Do not modify that candidate while rendering. Create exactly one unique `render-request.json` for that candidate. The request update triggers GitHub Actions; do not issue duplicate requests while it is queued or running.
11. Render only the selected output. If it fails, inspect the logs and evidence before making changes. Do not retry the same candidate blindly. Fix the root cause, repeat the pre-render gate, commit a new candidate SHA, then request a render for that new candidate only.
12. Download and inspect the exact MP4 artifact from that run. Read the included `*.provenance.json` manifest and workflow summary for source commit, request/project IDs, workflow run/attempt, artifact ID/URL/digest and QA-report linkage. Generate contact sheets and keyframes, and watch the full video if playback is available.
13. Apply Visual QA. If it fails, change the fewest high-impact things and rerender only the corrected frozen candidate.
14. Deliver only after the actual video is accepted. A successful render is a candidate, not acceptance.

## Current capability truth

The existing engine has a capable data-driven 2D Remotion composition, vector graphics, keyframed animation, SVG path morphing, deterministic particles, scene transitions, subtitles and a global audio timeline with offline DSP/mastering. A separate Three.js showcase and a custom AURA benchmark demonstrate basic custom 3D composition work.

The repository does not yet contain an automatic prompt-to-project model, automatic asset-generation service, built-in voice generation/transcription, a general-purpose 3D scene authoring schema, or an automatic video-understanding/QA model. The agent can orchestrate available tools and inspect rendered artifacts, but these capabilities must not be represented as already built into the product.

## Quality principles

- Story first, visuals second, effects third.
- Use actual shot changes, not only title changes.
- Use distinct compositions, not one template repeated.
- Source assets intentionally and preserve rights/provenance.
- Local assets and deterministic renders are the default.
- A successful render is a candidate, not an accepted deliverable.
