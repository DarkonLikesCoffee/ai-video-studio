# AI Video Studio — Project State

**Last verified:** 2026-11-18  
**Repository:** `DarkonLikesCoffee/ai-video-studio`  
**Default branch:** `main`  
**Last verified main commit:** `baeabc412b2a52be48e69d41b6709936b265cc6c` — “feat(footage): integrate user gameplay clips”

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

## 5. Recent end-to-end test: VALORANT explainer

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

## 6. Latest GitHub state snapshot

Verified on 2026-11-18:
- main is `baeabc412b2a52be48e69d41b6709936b265cc6c`, the squash merge of PR #58. PR #58's CI run #44397239973 passed before merge.
- PR #57 merged as `2bd52e9f0830600718fcb60fc5bd6f5cf6b4677`; narration-aware retiming and per-scene camera motion are on main.
- PR #56 merged as `338b55a2bf45e39e096ac722a740f73b9562a5f1`; looped music/sidechain-tail fix removed the late digital-silence intervals.
- V7 render #44387937003 exposed the original narration mismatch: voice 47.31s, video 60.0s.
- V9 branch render #44393399283 and post-merge main render #44394465979 both succeeded. Main artifact #14469659407: 1920x1080, 30fps, H.264/AAC stereo, video 47.733s, audio 47.8s, -16.1 LUFS, zero silence/freeze/black intervals. Contact sheet inspected. This proves technical synchronization, not creative acceptance.
- PR #58 fixed a missing integration: the existing footage timeline helper was used by the custom NarratedSkyExplainer branch, but not by the main narrated ProjectVideo path. It now injects approved clips as muted full-frame scene backgrounds, preserving vector overlays and captions.
- The footage manifest accepts either approved CC0/Public Domain/CC BY 2/3/4 assets or user-provided clips with explicit `rightsBasis` (`user-owned` or `permission-granted`) and a meaningful `rightsNote`. User-provided footage is credited separately and is not mislabeled as a public license.
- Added `projects/valorant-immortal-decision-making/production/USER_FOOTAGE.md` with shot IDs, clip preparation, manifest format and privacy/rights guidance.
- PR #58 CI #44397239973 passed; PR #58 merged as `baeabc412b2a52be48e69d41b6709936b265cc6c`. The post-merge main CI should be checked before next render.
- No gameplay clips have been added to the repository yet. The pipeline is ready, but no new gameplay render has been performed. The current video still uses illustrative SVGs and is not accepted as a cinematic VALORANT explainer.

## 7. Immediate development direction

1. Verify post-merge main CI for PR #58.
2. Add a small set of actual VALORANT gameplay selects recorded by the project owner or supplied with explicit permission, mapped to the six shot IDs in `production/USER_FOOTAGE.md`.
3. Keep player names/chat/account identifiers out of the final edit unless explicitly wanted; crop or blur them before use.
4. Render with the new footage injection, then inspect the full MP4 for visual relevance, motion, crop, pacing, caption legibility and audio sync.
5. If clips cannot be supplied, search only genuinely reusable public-license footage; do not pretend unrelated stock video is VALORANT gameplay.
6. Extend semantic visual QA and shot variety checks once real footage is present.

The biggest gap is not basic rendering. It is the **production intelligence and audiovisual quality** between a user's prompt and the final edit.

Start by examining the current implementation and building a quality-first, reusable production workflow that can:
1. Turn a prompt into a detailed creative brief and a shot-level production plan.
2. Match every shot to an appropriate visual method: footage, generated media, 3D, motion graphics, diagrams or typography.
3. Validate that the storyboard has real shot variety and meaningful action, not just different text cards.
4. Resolve assets with provenance and explicit rights checks; never silently substitute an unrelated still image for requested moving footage.
5. Build a timeline with narration, visuals, captions, music and SFX coordinated together.
6. Render a representative video and run measurable plus human/AI-assisted quality review.
7. Iterate on high-impact defects before accepting delivery.

Prioritize a small working vertical slice over a large architecture rewrite. Before choosing a video-generation provider or paid service, compare viable options and costs; do not spend money without explicit user approval.

## 8. Development update — visual storytelling production guidance (2026-11-19)


- Work started on branch `feature/visual-storytelling-production-guidelines`, based on the roadmap update commit `1341df8aa1f391024d5f30d25ecadc6048b9bebb`.
- Creative Director guidance now requires concrete visual events, per-shot method choice, subject/action, producibility and effects motivated by the story.
- Storyboard guidance now requires a shot's visual method, action and start/development/end progression, plus a pre-production slideshow-risk review. It explicitly rejects scene-title lists as storyboards.
- Agent production workflow now has a production-intelligence checklist and warns against defaulting to title cards, static diagrams or repeated layouts.
- These changes strengthen agent orchestration guidance only. They do **not** implement a persistent AI Director, automatic storyboard generation, semantic slideshow detection or new render-engine capabilities.
- No tests or renders run yet (documentation-only changes).
- Next: open PR and validate CI, then implement a focused storyboard-quality validator with tests as the next code slice.

## 9. Development update — required shot action/progression fields (2026-11-19)

- Extended the production-plan validator to require `visualMethod`, `action`, and `visualProgression` on every shot, alongside existing purpose/visual/framing/camera/transition/audio fields.
- Added tests for missing visual-method selection, action, and progression.
- Updated all four checked-in production-plan examples (launch film, narrated sky explainer, SORA product film, VALORANT explainer) with per-shot method, action and start→development→end progression.
- This enforces planning completeness, not semantic quality: it cannot yet detect whether descriptions are genuinely compelling, repetitive or slideshow-like. The fields can still be poorly authored and need later heuristic/AI-assisted review.
- CI for the latest branch head is in progress; tests are not yet confirmed passing. No render was run because this changes production planning/validation, not the render engine.
- Next: wait for CI, fix failures if any, then merge only after checks pass. Follow-up code task is a deterministic slideshow-risk report (duration/static visual progression/shot-variety signals), with warnings rather than subjective hard failures.

## 9. Development update — visual storytelling requirements merged (2026-11-19)

- PR #66: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/66 merged by squash into main.
- Merge commit: `bbfce5c68d9a4c4a84b918285b23ac07f26b52f6`.
- CI run #44499140921 passed for the PR head `8a1bf5bbca568792332972bc89b852c58ef00950`.
- Creative Director, Storyboard and agent production workflow playbooks now emphasize story-first planning, per-shot method selection, concrete action, start/development/end progression and pre-production slideshow-risk review.
- Production-plan validator requires `visualMethod`, `action`, and `visualProgression` for every shot. All four checked-in production-plan examples were updated. Tests cover missing method/action/progression.
- These checks validate plan completeness, not creative quality or semantic slideshow detection. No renderer changes or render were made.
- Next implementation slice: add a deterministic storyboard-risk report with transparent heuristic warnings (long holds, repeated adjacent visual method/framing/motion, static cues), without treating warnings as failures or pretending to understand story semantics.

## 10. Development update — deterministic storyboard risk report (in progress, 2026-11-19)

- Branch `feature/storyboard-risk-report` started from current main after PR #66 and its documentation follow-ups.
- Added `scripts/storyboard-qa.ts`, exporting `analyzeStoryboardRisks` and a CLI that prints review warnings for long shots (8s+), static/locked camera holds (5s+), repeated adjacent framing (2+), repeated visual methods (3+) and repeated camera movement (3+).
- Warnings are intentionally non-fatal and transparent; they identify patterns for review and do not claim semantic understanding or prove that a storyboard is bad.
- Added tests for long/static shots, repeated framing, repeated method/movement and a varied short sequence. Added `npm run storyboard:qa` and a CI invocation against the example production plan.
- CI validation is pending for this branch; no render was run.
