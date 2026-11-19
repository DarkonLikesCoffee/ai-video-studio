# AI Video Studio — Project State

**Last verified:** 2026-11-19  
**Repository:** `DarkonLikesCoffee/ai-video-studio`  
**Default branch:** `main`  
**Last verified main commit:** `93cec7fec2a4c8917bb6c231519b75181fb54d48` — `docs: reconcile contact sheet QA status after merge (#77)`
**Current development branch:** `main`; PRs #72–#77 merged; contact-sheet CLI merged and used to inspect a real benchmark MP4

> This is a snapshot. Always verify the live repository, open PRs and workflows before relying on it.

## 1. Product vision

AI Video Studio should let someone describe a video in ordinary language and receive a finished, high-quality MP4 without manually editing it.

The system should act like a coordinated production team:
- Understand the prompt, audience, purpose, constraints and references.
- Develop the concept, script, visual direction and shot-by-shot storyboard.
- Find, generate or import suitable footage, images, illustrations, 3D elements and audio.
- Edit shots with purposeful camera movement, compositing, animation, transitions and pacing.
- Produce or source narration, music, ambience and synchronized sound effects.
- Render the project, inspect the real video and audio, identify defects, revise and render again.
- Deliver the final MP4 plus source/project files and asset credits.

It must support many topics and visual styles, not just a fixed set of templates or demos. A successful render is not the same as a successful video.

## 2. Architecture that exists

The repository is a TypeScript/Node project using npm workspaces. The rendering engine is based on Remotion, with FFmpeg for audio preparation/mastering and a separate Three.js/custom-composition path for selected showcase work. GitHub stores source and project files; GitHub Actions (and a CircleCI configuration) execute renders. The README says no separate web application is required for the prompt-driven workflow.

Main areas:
- `packages/`: shared video engine and project/render logic.
- `apps/`: application code.
- `projects/`: examples, showcase projects and recent video projects.
- `agent/skills/`: production playbooks for creative direction, storyboard, assets, Remotion, audio, visual QA and narrated video production.
- `docs/agent-production-workflow.md`: manual/agent-led production pipeline.
- `.claude/skills/video-engine/`: vendored video-engine skill and integration notes.
- `.github/workflows/`: CI and render automation.
- `render-request.json`: selects the current requested render; inspect before using because it is mutable.

## 3. Verified engine capabilities

The current README documents these `ProjectVideo` capabilities:
- Data-driven multi-scene projects (1–20 scenes) and 1080p/other configured dimensions and FPS.
- Local or remote image/video layers, multiple layers per scene, positioning, cropping/fit, opacity, rotation, trim and playback controls.
- Vector graphics (rectangles, ellipses, SVG paths and text), keyframed transforms, SVG path draw-on and constrained path morphing.
- Deterministic particle systems.
- Scene transitions (cut, fade, slides, zoom and wipes).
- Timed subtitle/caption cues.
- Global overlapping audio tracks for music, voice-over, SFX and ambience.
- Audio fades, automation, filters, EQ, compression, echo/reverb, panning, music ducking and loudness mastering.
- MP4/H.264 rendering and project validation.

Other implemented pieces documented in the repository:
- Kokoro ONNX narration adapter on the GitHub Actions render worker for Spanish and US English. Its generated speech alignment is used for word timings. It is not a general hosted TTS provider system and does not force-align arbitrary uploaded recordings.
- Openverse still-image discovery/download workflow for selected open licenses. Candidate results require human/agent review and are not automatically approved.
- Wikimedia Commons video discovery/download helper with license/provenance checks. Candidate results require review.
- NASA Image and Video Library asset-manifest workflow with HTTPS host/rendition/size checks and provenance records.
- Custom Remotion/Three.js showcase compositions and project-specific examples.

Treat README, source code, tests and current workflows as authoritative. Verify any specific limits or behavior in code before depending on them.

## 4. What is not yet a complete product capability

The repository is **not yet a fully autonomous prompt-to-video AI product**. In particular, do not claim these are solved:
- A persistent, generally available LLM director that reliably turns arbitrary prompts into production-ready projects without manual orchestration.
- Universal generative video/footage creation or automatic access to premium video-generation models.
- A general-purpose image/video/3D asset generation service with style/character consistency.
- A mature universal 3D scene-authoring system for arbitrary prompts and imported user models.
- A polished end-user workflow for importing, organizing and managing arbitrary personal assets.
- A provider-agnostic voice system with broad language/voice selection and reliable alignment for arbitrary recordings.
- Fully automatic semantic video/audio QA that can reliably judge any rendered video and autonomously repair it.
- A production-ready end-user web product for the entire workflow.
- Permanent hosted video delivery, publishing or distribution workflow.

Some related pieces exist as manual scripts, examples, playbooks or limited adapters. Do not confuse those with end-to-end product capabilities.

## 5. Historical end-to-end test: VALORANT explainer

Project: `projects/valorant-immortal-decision-making/`  
PR #50: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/50  
Alignment fix PR #52: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/52  
Successful render run: https://github.com/DarkonLikesCoffee/ai-video-studio/actions/runs/44360142074  
Main CI: https://github.com/DarkonLikesCoffee/ai-video-studio/actions/runs/44362063980  
Main render workflow: https://github.com/DarkonLikesCoffee/ai-video-studio/actions/runs/44362064050

What was verified:
- The Kokoro narration alignment bug was fixed in PR #52; the earlier mismatch between written words and phoneme groups was resolved with regression coverage.
- The branch render completed and produced an MP4 artifact.
- The MP4 was retrieved and inspected. It is approximately 60.1 seconds, 1920×1080, 30 FPS, H.264 with AAC stereo audio, around 7.16 MB.
- The rendered project uses original tactical SVG/motion graphics and English narration. No authentic VALORANT gameplay footage was supplied; the diagrams are illustrative, not gameplay.

Creative QA result: **not accepted as a successful cinematic explainer**.
- It relies heavily on dark backgrounds, typography, reticles and relatively static tactical diagrams.
- It lacks the requested FPS perspective, real gameplay, player actions, gunfights, elimination and coordinated site-execute footage.
- Visual motion and shot variety are too limited; it feels closer to animated slides than a cinematic esports edit.
- The audio file contains long digital-silence intervals in the final section (measured intervals reported during inspection: approximately 46.85–50.07s, 51.22–56.03s and 57.22–60.10s). This needs a fresh source-level and render-level diagnosis before claiming it is fixed.
- This is evidence that the render pipeline can work; it is not evidence that the system can create cinematic videos from arbitrary prompts.

The next agent should use this project as a regression/quality case, not simply produce another similar SVG slideshow.

## 6. Verified current repository snapshot — 2026-11-19

- Main HEAD: `93cec7fec2a4c8917bb6c231519b75181fb54d48` (PR #77 merged).
- PR #76 CI run #44516361047 passed; PR #77 CI run #44517012780 passed; post-merge main CI run #44517175453 passed.
- PRs #66–#77 are merged.
- A real MP4 from render run #44485488551 (artifact #14511125907) was retrieved and inspected with a contact sheet. Its bundled media-QA report passed with no detected silence, frozen video, black frames or audio/video duration drift beyond thresholds. See the new benchmark entry in `PROGRESS_LOG.md`.
- Recheck live branches, PRs, CI and commit SHAs before relying on this snapshot.

### Storyboard milestones on main

- **PR #66 — Story-first production guidance:** every shot requires a visual method, concrete action and start/development/end progression. Validator and examples were updated.
- **PR #67 — Storyboard risk CLI:** `storyboard:qa` produces deterministic, warning-only signals for long/static shots and repeated framing, visual method or camera movement.
- **PR #68 — Storyboard planning preview:** `storyboard:preview` creates standalone HTML shot cards with production-plan information. It is not a video animatic.
- **PR #69 — Expanded heuristic QA:** warnings for placeholder/vague descriptions and actions, incomplete progression, similar adjacent descriptions and text-heavy shots.
- **PR #70 — Shot-scale variety signals:** recognized framing labels and warning-only repeated/low shot-scale variety signals.
- **PR #71 — Storyboard critic:** `storyboard:critic` turns existing QA findings into prioritized revision suggestions. It is review-only; it does not mutate plans, use an AI provider, or approve creative quality.
- **PR #76 — Contact-sheet CLI:** `qa:contact-sheet` samples frames from an MP4 into a reviewable image grid; now used on a real benchmark artifact.

### Verified limitations

These features are deterministic and heuristic. They do not semantically understand the story, inspect motion continuously, listen to the audio, or guarantee cinematic quality. A contact sheet is a sparse visual sample, not full-video creative approval. Do not claim a persistent autonomous Production Director or automatic repair loop exists.

## 7. Immediate development direction

The next reusable slice is a **traceable storyboard revision workflow**:
1. Preserve the original production plan.
2. Capture the critic report and its findings.
3. Let a user/agent select suggestions explicitly.
4. Record each applied edit in a separate revision artifact.
5. Validate the revised plan and retain the validation result.
6. Keep the original plan untouched and make the revision reviewable/rollbackable.

Start with a small versioned artifact schema and deterministic tests. Do not auto-apply critique silently. After this, evaluate model-assisted semantic review only with a clear no-paid-call/consent gate and auditable outputs. Keep P0 quality gates and the broader P1 Production Director goals in view; do not mistake additional heuristics for the finished product.

## Resume checklist

Read `START_HERE.md`, this file, `ROADMAP.md`, `PROGRESS_LOG.md`, `AGENTS.md`, `README.md`, and relevant source/tests/skills. Verify live GitHub state before doing work. Prefer small end-to-end slices with tests and concrete validation evidence. Never claim a render or creative inspection without evidence.


## Media QA true-peak addition (merged)

The `scripts/media-qa.ts` report now extracts `True peak` from the FFmpeg EBU R128 log when present. It warns above -1.0 dBFS and fails above 0.0 dBFS. Both thresholds are configurable; absent readings are omitted. Unit tests cover safe, warning and over-limit readings. This is an additive audio QA improvement and does not claim audio listening or creative acceptance.


## Trailing-silence QA improvement (PR #75 merged)

Media QA is being extended to treat a final `silence_start` without a corresponding `silence_end` as silence through the probed media duration (EOF). This addresses a gap in the current log parser and is being regression-tested. PR #75 CI passed and the change was merged. The parser closes a final unmatched silence interval at the probed duration; regression tests cover long/short trailing silence and zero-length EOF cases.


## Contact-sheet review utility (PR #76 merged)

`npm run qa:contact-sheet -- video.mp4` generates a JPEG contact sheet using FFmpeg/FFprobe, sampling frames at a configurable interval and arranging them in a configurable grid. Options include `--interval`, `--columns`, `--width`, and `--output`. PR #76 CI passed and the feature is merged. Unit tests cover layout and option validation, but an actual MP4 contact sheet has not yet been generated and visually inspected in this work.
