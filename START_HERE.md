# START HERE — AI Video Studio

This is the entry point for **any AI assistant, model, or new conversation** continuing this repository. Read this file first, then follow the reading order below before changing code.

## One-line project goal

Build an AI video producer that turns an ordinary text prompt into a complete, polished video: it understands the brief, plans the story, creates or finds the right visual and audio assets, edits everything together, checks the actual result, fixes problems, and delivers the final MP4.

The goal is **not** merely to render slides or generate a valid MP4. The goal is a compelling finished video with purposeful visuals, real motion, strong editing, good sound, and quality appropriate to the brief.

## How to resume in a new conversation

The user can simply send:

> Continue developing this project. Start by reading `START_HERE.md` in the GitHub repository, then read every file it references. Check the actual current state of the repository and its CI before doing anything. Continue autonomously from the highest-priority next step in the roadmap. Do not ask me to repeat project context or ask permission for routine implementation decisions. Do not claim work is complete until it is tested and verified.

Repository: https://github.com/DarkonLikesCoffee/ai-video-studio

## Mandatory reading order

1. `PROJECT_STATE.md` — what the product is, what exists today, and what is not implemented.
2. `ROADMAP.md` — priorities, milestones, and acceptance criteria.
3. `PROGRESS_LOG.md` — dated history, important decisions, failures, and the latest handoff.
4. `AGENTS.md` — operating rules for any AI working in this repository.
5. `README.md` — actual engine architecture, project schema, commands, workflows, asset rules.
6. `docs/README.md` — documentation map and source-of-truth rules.
7. `agent/README.md` and `docs/agent-production-workflow.md` — production process and existing agent playbooks.
8. Relevant skill files under `agent/skills/` and the implementation/tests for the subsystem you intend to change.

Do not rely on this handoff alone when the live repository can be inspected. Verify branch, latest commit, open PRs, workflow runs, render artifacts and current files. These can change after this document was written.

## What to do after reading

1. Confirm the current branch and latest `main` commit. Check open PRs and recent CI/render workflows. Identify unfinished work or a conflicting in-progress branch.
2. Compare the live code against `PROJECT_STATE.md` and `ROADMAP.md`. If the documents are stale, correct them as part of the work.
3. Select the single highest-priority actionable milestone. Prefer a small end-to-end capability that improves the actual final video over adding more abstract infrastructure.
4. Write or update a short implementation plan, then implement it. Make ordinary technical and creative decisions autonomously.
5. Run relevant tests, typecheck, project validation and the actual render workflow. Inspect the resulting MP4, not just CI.
6. If quality fails, fix and rerender. Do not call a successful render a successful video.
7. Use a branch and PR. Merge after required checks pass and the output meets acceptance criteria. The user has already said routine merge approval is not needed; do not repeatedly ask whether to merge. This does not waive testing or quality gates.
8. Update `PROJECT_STATE.md`, `ROADMAP.md` and append to `PROGRESS_LOG.md` before finishing. Include commit/PR/run links, test outcomes, artifact location and honest limitations.

## Source-of-truth rules

- Code, tests, schemas and successful workflow outputs are authoritative for implemented capability.
- `README.md` documents engine behavior; inspect implementation if a capability matters to the change.
- `PROJECT_STATE.md` describes the verified state at its last update, not a promise that it is still current.
- `ROADMAP.md` is the intended direction, not evidence that a feature exists.
- A plan, skill, storyboard, fixture, mock or demo is not an implemented autonomous capability.
- Distinguish **implemented**, **partially implemented**, **manual workflow**, **planned**, and **not implemented**.
- Never invent a successful test, asset, license, render, visual inspection or user approval.
- Do not expose credentials, tokens, private data or secrets in repository files.

## Non-negotiable product principle

A technically valid MP4 can still be a bad video. Judge success by the actual audiovisual result and the original brief: storytelling, shot variety, meaningful motion, editing rhythm, imagery, narration, music, sound effects, synchronization and ending. If the output looks like a slideshow, it has failed the creative goal even if all automated tests pass.
