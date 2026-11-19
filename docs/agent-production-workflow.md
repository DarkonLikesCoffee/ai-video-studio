# Agent-led video production workflow

## Purpose

Define how an AI agent turns a natural-language brief into a finished video using the existing AI Video Studio engine. This is deliberately separated from the Remotion renderer: the agent plans and orchestrates; Remotion executes a deterministic project.

## Pipeline and artifacts

| Stage | Input | Required output | Gate |
|---|---|---|---|
| Brief | User prompt, references, constraints | Creative brief | Goal, audience and deliverable understood |
| Direction | Creative brief | Creative direction | One coherent, producible concept |
| Storyboard | Creative Brief + model storyboard JSON | Validated production plan + criterion-to-shot trace | Every criterion maps to known shot IDs; delivery matches the brief; timing is contiguous and frame-aligned |
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
2. Validate the brief with `npm run director:brief -- <creative-brief.json>`. Use `npm run director:storyboard-prompt -- <creative-brief.json> [handoff.md]` to create the shot-level handoff. Submit it to a creative model/agent, then review the storyboard against the output contract and brief; the CLI creates instructions, not the storyboard itself.
3. Apply the Creative Director skill and record the selected direction.
4. Produce the shot-level storyboard JSON from the creative handoff (or author it directly). Import it with npm run director:production-plan -- <creative-brief.json> <storyboard.json> <production-plan.json>. The importer requires exact delivery settings, frame-aligned contiguous timing, and complete acceptance-criterion mappings to known shot IDs with rationale. Coverage is an authored claim, not semantic proof; review each mapped shot against its criterion.
5. Apply the Storyboard skill. Check adjacent-shot variety and use the preview as a review checkpoint. Where useful, label shots with narrativeBeat and run storyboard:beats; treat its prompts as review guidance, not a fixed narrative formula. If revisions are needed, initialize a revision artifact, select recommendations, export a Markdown report, and author explicit edits separately. Selection alone does not change the plan. For selected critiques, use storyboard:revision prompt to create a model-neutral handoff containing only affected shots and selected findings. Treat returned JSON edits as suggestions: import them with storyboard:revision import-edits. The importer limits edits to selected shot IDs, rejects duplicate/unknown IDs and unsupported fields, then validate/apply to a separate plan copy.
6. Apply Asset Producer and Audio Designer. Create local assets and provenance/cue manifests.
7. Map the storyboard into the existing project schema. If a requested shot needs unsupported 3D or other features, decide whether to implement a reusable engine feature or choose a different visual solution.
8. Validate before rendering. Do not render all showcase videos for a project-specific change.
9. Render only the selected output.
10. Download and inspect the exact MP4 artifact from that run. Generate contact sheets and keyframes, and watch the full video if playback is available.
11. Apply Visual QA. If it fails, change the fewest high-impact things and rerender.

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
