# Instructions for AI agents working in this repository

Before acting, read `START_HERE.md` and follow its task-specific context-loading path. Do not read large status/history documents or the entire README by default; load only the current snapshot and sections relevant to the task.

## Mission

Help build AI Video Studio into a prompt-to-finished-video production system. Do not optimize only for passing CI, increasing code volume, adding templates, or producing demo MP4s. Optimize for the quality and usefulness of the final video.

## Working rules

- Inspect the live repository and current GitHub state before making assumptions.
- Make normal implementation decisions autonomously. Do not ask the user to approve every small decision or routine merge.
- Ask only when a missing user decision is truly blocking or would cause spending, external publication, or a materially different deliverable.
- Never incur paid API/model costs without explicit user consent. Prefer free/local/open-license options where practical and record tradeoffs.
- Never pretend that a playbook, prompt, fixture or orchestration stub is an autonomous AI capability.
- Do not claim a video, voice, image, footage, sound effect or license exists until the file and its provenance are verified.
- Preserve attribution, licensing and usage restrictions for every external asset.
- Keep project planning documents separate from render-schema files.
- Prefer reusable capabilities over one-off demo-specific hacks.
- Keep changes scoped; add regression tests for bugs and new behavior.
- Use a feature/fix/docs branch and PR. Do not push directly to `main`.
- Do not ask whether to merge. Merge when required CI, render and quality gates pass. If a gate fails, diagnose and fix it first.
- Do not hide failures, skip failed tests, weaken validation merely to get green CI, or call a failed/partial run successful.

## Dependency installation and lockfile rules

- This repository is an npm workspace rooted at the repository root and requires Node.js 22 or newer.
- Use `npm ci` from the repository root for clean installs. Do not use an unqualified `npm install` merely to set up a checkout.
- `package-lock.json` is the committed source of truth for the resolved npm dependency tree. Never hand-edit it.
- When intentionally adding, removing or upgrading a dependency, run npm from the repository root with the appropriate workspace selector, review all affected `package.json` files and the generated root lockfile, and commit them together.
- After dependency changes, verify a clean `npm ci`, type-check, tests, project validations and Studio build. CI, GitHub Actions rendering and CircleCI must use `npm ci`, not floating `npm install`.
- Do not prune dependencies using search results alone; trace imports, build-time use, scripts, tests, workflows and dynamic loading first.

## Render discipline — mandatory

- **A normal project commit is a development checkpoint, not permission to render.** The Render video workflow is triggered by changes to `render-request.json`; do not edit or commit that file during ordinary build iterations.
- Build the entire selected video first: creative brief, direction, storyboard/production plan, assets and rights/provenance, scene/composition, narration, timing, transitions, captions and audio.
- During BUILD/ITERATION, use non-render checks only: tests, typecheck, project validation, production-plan validation, asset-evidence validation, storyboard/QA reports and previews. Fix every blocking issue before requesting a render.
- Before scene implementation, follow `agent/skills/asset-visual-review/SKILL.md`: render standalone local image/SVG assets into preview PNGs, inspect every page with image vision, correct defects and record the actual findings. The preview command does not provide semantic approval.
- Do not create a render request until you have explicitly reviewed the complete project and declared the candidate **RENDER-READY**. A render request is a deliberate production action, not a progress update or debugging probe.
- Before requesting a render, validate the exact candidate and confirm: all files are committed; no planned edits remain; project path/composition/narration paths are correct; plan duration and frame count agree; shots are contiguous, frame-aligned and end exactly at delivery duration; all asset references resolve; asset evidence/rights checks pass; project and narration validation pass; and request ID is unique.
- **One render request per frozen candidate commit.** Record the candidate commit SHA and request ID. Do not change the project while that render is running. Do not create another request just because the first is still queued or running.
- If a render fails, inspect its logs and QA evidence first. Make only the necessary fixes, run all non-render checks again, commit the corrected candidate, and request another render only when the corrected candidate is render-ready. Never rerun the same request or make speculative render attempts to discover errors that local/CI validation can catch.
- After a render completes, download and inspect that exact artifact. A successful job is not creative acceptance. For a QA failure, use the actual QA findings to drive a targeted revision.
- Keep render-request commits out of the build loop. Avoid repeatedly updating `render-request.json` to trigger CI or renders.

- **Technical freeze gate (enforced by CI):** Push the complete candidate project first. Then make a separate commit that changes only `render-request.json`; include `candidateSha` equal to the exact remote branch tip immediately before that request commit. The render workflow fetches full history and rejects a missing/mismatched SHA, any other file in the triggering push, reused candidate SHAs, and reused request IDs. A new branch push cannot render. If any project files remain unpushed, push them in a normal development commit first, then create the request-only commit.

## Definition of done

For code changes: relevant tests, typecheck, validation and CI pass; the implementation matches its documentation.

For a video-production feature: additionally render a representative real project, retrieve the exact MP4 artifact, inspect the actual frames and motion, and listen to the audio when possible. Report when audio was measured but not listened to. Verify narration/captions, shot variety, pacing, transitions, sound design and technical metadata.

For every completed development session: update `PROJECT_STATE.md`, `ROADMAP.md` and `PROGRESS_LOG.md` so another AI can continue without the conversation history.


## Mandatory pre-animation asset visual-review gate

For every video project with standalone local image/SVG assets, run `npm run assets:visual-review -- projects/<slug>` before composing them into scenes. The assistant must open and inspect each generated PNG, correct materially weak assets, repeat previews after changes and record findings in `production/asset-visual-review.md`. If image inspection is unavailable, disclose the limitation and do not claim approval.

## Mandatory shot-differentiation gate

For every video request, read `agent/skills/shot-differentiation/SKILL.md` before storyboarding or implementation. Enforce its pre-render rejection checklist and shot-to-code audit. The storyboard must specify visual events/compositions; implementation must prove these are actually distinct; final MP4 inspection must compare the shots to that audit. Text-only variation over a repeated scene is a major failure. Do not request a render when the project fails this gate, and do not deliver a failed video—fix it and render a new frozen candidate.
