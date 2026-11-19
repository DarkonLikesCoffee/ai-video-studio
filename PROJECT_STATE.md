# AI Video Studio — Project State

**Last verified:** 2026-11-19  
**Repository:** `DarkonLikesCoffee/ai-video-studio`  
**Default branch:** `main`  
**Verified main HEAD:** `40ffe8fd8a21466fa4cca607ace6ecc422c7ab35` — `docs(progress): log storyboard critic merge`  
**Open PRs at verification:** none  
**Latest main CI:** run `44507106494`, completed successfully  
**Current development branch in this snapshot:** `main`

> Snapshot only. Recheck GitHub before relying on these values.

## Product goal

Turn an ordinary prompt into a polished video with purposeful story, visuals, motion, editing, narration, music and sound. Technical render validity is not creative acceptance. Avoid slideshow-like outputs and do not claim autonomous capabilities that are only manual playbooks.

## Current architecture

TypeScript/npm workspaces; Remotion core renderer; FFmpeg for media/audio preparation and QA; custom Remotion/Three.js compositions for selected showcase projects; GitHub Actions and CircleCI render workflows. Main areas: `packages/`, `apps/`, `projects/`, `scripts/`, `agent/skills/`, `.github/workflows/`.

## Verified planning and QA capabilities on main

Merged milestones:
- PR #66: story-first visual storytelling requirements and required per-shot `visualMethod`, `action`, `visualProgression` fields in production-plan validation.
- PR #67: deterministic warning-only storyboard-risk CLI (`storyboard:qa`).
- PR #68: HTML storyboard planning preview (`storyboard:preview`); this is a planning artifact, not an animated animatic.
- PR #69: additional warnings for vague descriptions/actions, incomplete progression, similar adjacent visuals and text-heavy shots.
- PR #70: recognized shot-scale signals, repeated shot scale and low scale-variety warnings.
- PR #71: review-only storyboard critic (`storyboard:critic`) translates deterministic findings into prioritized revision suggestions. It does not edit the source plan, call an AI provider or approve creative quality.

Latest post-merge CI run #44507106494 passed.

## Renderer and media capabilities

The validated project schema supports scenes/layers, images and video, vector shapes/text/SVG, keyframed motion, deterministic particles, transitions, captions and audio tracks with processing/mastering. Kokoro ONNX narration is available in the render workflow for supported Spanish and US English voices. Asset workflows include reviewed Openverse images, Wikimedia Commons video and NASA manifests with provenance checks. Read source/tests/README for limits before relying on a feature.

## Important limitations — not yet a complete product

- No generally available autonomous LLM Director that reliably converts arbitrary prompts into renderable production projects.
- No universal generative video or consistent character/asset generation service.
- No general 3D scene-authoring system for arbitrary prompts.
- No fully autonomous semantic rendered-video QA and repair.
- No polished end-user prompt-to-video application covering the whole pipeline.
- No permanent hosting or publishing system.
- Storyboard QA remains heuristic; critic reports are suggestions, not semantic evaluation.
- The VALORANT benchmark has historically been technically renderable but creatively rejected for slideshow-like vector visuals. Authentic gameplay footage is not yet confirmed in the repo benchmark.

## Current priority

P0 quality gates and P1 Production Director/storyboard workflow remain incomplete. The near-term development direction is a traceable storyboard revision loop: preserve the source plan, critique findings, selected recommendations, explicit edits, and validation results in a separate revision artifact; never silently mutate the original. Then improve semantic/visual review and media-backed production. Keep changes small and evidence-driven.

## Resume instructions

Read `START_HERE.md`, then `PROJECT_STATE.md`, `ROADMAP.md`, `PROGRESS_LOG.md`, `AGENTS.md`, `README.md`, and the relevant implementation/tests/skills. Verify live main, open PRs, CI and render evidence. Prefer a reusable end-to-end slice. Never claim a render or creative inspection without evidence.
