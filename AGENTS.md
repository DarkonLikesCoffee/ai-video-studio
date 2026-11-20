# Instructions for AI agents working in this repository

Before acting, read `START_HERE.md`, then `PROJECT_STATE.md`, `ROADMAP.md`, `PROGRESS_LOG.md`, and `README.md`. Follow the mandatory reading order in `START_HERE.md`.

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


## Render discipline

- A normal project commit is a development checkpoint, not permission to render. Do not edit `render-request.json` during project construction or iteration.
- Build and validate the complete candidate first. Push the project and all required assets as normal commits.
- Only after the candidate is frozen, make a separate commit that changes **only** `render-request.json`. Include `candidateSha`, the exact full SHA of the remote branch tip immediately before this request-only commit.
- The render workflow fetches full history and rejects a missing/mismatched candidate SHA, any other file in the triggering push, a new-branch push, or a previously submitted candidate SHA/request ID. The earliest duplicate request is the only one eligible to render.
- Do not update the project while a render is running. After a failure, inspect the logs, correct the cause in a new candidate commit, push it, rerun non-render checks and then submit one new request-only commit with a new request ID.

## Definition of done

For code changes: relevant tests, typecheck, validation and CI pass; the implementation matches its documentation.

For a video-production feature: additionally render a representative real project, retrieve the exact MP4 artifact, inspect the actual frames and motion, and listen to the audio when possible. Report when audio was measured but not listened to. Verify narration/captions, shot variety, pacing, transitions, sound design and technical metadata.

For every completed development session: update `PROJECT_STATE.md`, `ROADMAP.md` and `PROGRESS_LOG.md` so another AI can continue without the conversation history.
