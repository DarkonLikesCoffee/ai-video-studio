# Agent-led video production workflow

## Purpose

Define how an AI agent turns a natural-language brief into a finished video using the existing AI Video Studio engine. This is deliberately separated from the Remotion renderer: the agent plans and orchestrates; Remotion executes a deterministic project.

## Pipeline and artifacts

| Stage | Input | Required output | Gate |
|---|---|---|---|
| Brief | User prompt, references, constraints | Creative brief | Goal, audience and deliverable understood |
| Direction | Creative brief | Creative direction | One coherent, producible concept |
| Composition selection | Creative direction + verified composition catalogue | Plan-level `renderStrategy` | One whole-video renderer/composition selected with rationale, capabilities, status and fallback |
| Storyboard | Creative Brief + model storyboard JSON | Validated production plan + criterion-to-shot trace | Every criterion maps to known shot IDs; composition decision is preserved; delivery matches the brief; timing is contiguous and frame-aligned |
| Assets | Shot list + production plan | Local assets + asset manifest + strict criterion/shot asset-evidence report (included in render artifact) | Planned references resolve; manifest shot IDs are valid; local files, provenance and rights evidence are complete before render |
| Asset visual review | Local image/SVG assets + shot direction | Rendered Remotion PNG preview pages + assistant review notes | Assistant visually inspects actual preview images, corrects defects and records findings before scene implementation |
| Build | Reviewed storyboard + assets | `scene.json` or custom composition | Typecheck/tests/project validation pass |
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
- `scripts/director-compositions.ts` is the capability catalogue for whole-video composition choices. It describes registered IDs, appropriate uses, strengths, limitations and whether a composition is selectable.
- The top-level `renderStrategy` in each production plan is a planning decision. Per-shot `visualMethod` remains independent: a single Remotion composition may combine footage, 2D graphics, typography and 3D assets.
- `render-request.json` selects one project and one composition. Its composition ID must match the plan's registered `renderStrategy`; the render workflow checks this before installing dependencies or invoking Remotion. A plan marked `to-be-built` cannot render until the custom composition is implemented, registered in `RemotionRoot` and added to the catalogue.
- For backward compatibility, renders without a linked production plan are still permitted, but their composition ID must exist in the checked-out Remotion root. Its commit is a **render trigger**. Never update it during normal project construction or while a render is queued/running.

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
2. Validate the brief with `npm run director:brief -- <creative-brief.json>`. Use `npm run director:storyboard-prompt -- <creative-brief.json> [handoff.md]` to create the shot-level handoff. The handoff requires the model to compare at least three creative territories internally, select one, establish an evolving visual grammar, and plan distinct visual events instead of repeated layouts with new text. Submit it to a creative model/agent, then review the storyboard against the output contract and brief; the CLI creates instructions, not the storyboard itself.
3. Apply the Creative Director skill and record the selected direction.
4. Read `scripts/director-compositions.ts` and select a whole-video renderer/composition. Include the complete `renderStrategy` in the storyboard JSON. The model-neutral storyboard prompt embeds the current catalogue; ProjectVideo is not the default.
5. Produce the shot-level storyboard JSON from the creative handoff (or author it directly). Import it with `npm run director:production-plan -- <creative-brief.json> <storyboard.json> <production-plan.json`. The importer requires exact delivery settings, frame-aligned contiguous timing, and complete acceptance-criterion mappings to known shot IDs with rationale. Coverage is an authored claim, not semantic proof; review each mapped shot against its criterion.
6. Apply the Storyboard skill. Check adjacent-shot variety and use the preview as a review checkpoint. Where useful, label shots with narrativeBeat and run storyboard:beats; treat its prompts as review guidance, not a fixed narrative formula. If revisions are needed, initialize a revision artifact, select recommendations, export a Markdown report, and author explicit edits separately. Selection alone does not change the plan. For selected critiques, use storyboard:revision prompt to create a model-neutral handoff containing only affected shots and selected findings. Treat returned JSON edits as suggestions: import them with storyboard:revision import-edits. The importer limits edits to selected shot IDs, rejects duplicate/unknown IDs and unsupported fields, then validate/apply to a separate plan copy.
7. Apply Asset Producer and Audio Designer. Create local assets and provenance/cue manifests. Run `npm run director:asset-evidence -- <production-plan.json> [asset-manifest.json] [report.json]` to map criterion→shots→manifest assets and verify local file/path safety plus provenance/rights fields. The render workflow enforces `--strict` for plans with manifests; procedural shots may intentionally have no asset. The report is not semantic proof that an asset satisfies a criterion.
8. **Pre-animation visual review:** follow `agent/skills/asset-visual-review/SKILL.md` and run `npm run assets:visual-review -- projects/<slug>`. Open and inspect every rendered PNG page, fix weak assets and repeat the preview. Record the review in `production/asset-visual-review.md`. The renderer does not make a visual-quality decision; the assistant must inspect the images.
9. Map the storyboard into the existing project schema. If a requested shot needs unsupported 3D or other features, decide whether to implement a reusable engine feature or choose a different visual solution.
10. **BUILD COMPLETE:** Finish all creative, asset, narration, timing, composition and caption work. Commit normal development checkpoints as needed, but do not touch `render-request.json`. The branch may have many commits; that is expected and must not create render requests.
11. **PRE-RENDER GATE:** Validate the exact candidate: typecheck/tests, project validation, production plan validation, frame-aligned duration, contiguous shots, final shot ending exactly at delivery duration, asset evidence and rights/provenance, narration, paths and composition. Review the complete project and explicitly declare it RENDER-READY. If any blocker exists, continue building; do not render.
12. **FREEZE:** Commit all candidate files and record the candidate SHA. Do not modify that candidate while rendering. Create exactly one unique `render-request.json` for that candidate. The request update triggers GitHub Actions; do not issue duplicate requests while it is queued or running.
13. Render only the selected output. If it fails, inspect the logs and evidence before making changes. Do not retry the same candidate blindly. Fix the root cause, repeat the pre-render gate, commit a new candidate SHA, then request a render for that new candidate only.
14. Download and inspect the exact MP4 artifact from that run. Read the included `*.provenance.json` manifest and workflow summary for source commit, request/project IDs, workflow run/attempt, artifact ID/URL/digest and QA-report linkage. Generate contact sheets and keyframes, and watch the full video if playback is available.
15. Apply Visual QA. If it fails, change the fewest high-impact things and rerender only the corrected frozen candidate.
16. Deliver only after the actual video is accepted. A successful render is a candidate, not acceptance.

## Current capability truth

The existing engine has a capable data-driven 2D Remotion composition, vector graphics, keyframed animation, SVG path morphing, deterministic particles, scene transitions, subtitles and a global audio timeline with offline DSP/mastering. The registered `ThreeDShowcase`, `CinematicAdBenchmark`, `NarratedSkyExplainer`, `MadridTrip` and `MadridNewYorkParis` compositions demonstrate bespoke composition work; they are specific production paths, not a general-purpose 3D authoring schema.

The repository does not yet contain an automatic prompt-to-project model, automatic asset-generation service, a general-purpose voice-provider or transcription system (the render worker has an optional Kokoro ONNX text-to-speech and word-alignment adapter), a general-purpose 3D scene authoring schema, or an automatic video-understanding/QA model. The agent can orchestrate available tools and inspect rendered artifacts, but these capabilities must not be represented as already built into the product.

## Quality principles

- Story first, visuals second, effects third.
- Use actual shot changes, not only title changes.
- Use distinct compositions, not one template repeated.
- Source assets intentionally and preserve rights/provenance.
- Local assets and deterministic renders are the default.
- A successful render is a candidate, not an accepted deliverable.


## Mandatory pre-animation asset visual-review gate

For every project with standalone local image/SVG assets, run `npm run assets:visual-review -- projects/<slug>` before scene implementation. The assistant must open and inspect every generated PNG, correct defects, repeat previews after changes and record findings in `production/asset-visual-review.md`. The preview tool does not call an AI model or approve assets. Inline SVG/JSX and 3D assets require their own rendered still previews.


## Mandatory shot-differentiation gate (new)

Before build and before render, every production must follow `agent/skills/shot-differentiation/SKILL.md`. For each shot, the assistant must describe the visible subject, composition/framing, visual event, camera event, transition, and what changes from the previous shot. Adjacent-shot differences must be describable without mentioning text. A single reused scene/camera animation with title changes is explicitly rejected.


During implementation, maintain a shot-to-code audit in the project's production notes: source files/component, actual implemented visual event, and checkpoints where the change is visible. Storyboard promises are not evidence of implementation. During final QA, inspect actual MP4 frames at boundaries and regular intervals against the audit. If scene/layout/camera/subject repetition with text-only variation is detected, classify it as a major failure and block delivery. Fix during build or iterate from evidence; do not spend renders discovering missing creative implementation.
