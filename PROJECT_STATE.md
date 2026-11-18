# AI Video Studio — Project State

**Last verified:** 2026-11-18  
**Repository:** `DarkonLikesCoffee/ai-video-studio`  
**Default branch:** `main`  
**Last verified main commit:** `2bd52e9f0830600718fcb60fc5bd6f5cf6b4677` — “feat(video): sync narration and scene timelines”

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
- main is `2bd52e9f0830600718fcb60fc5bd6f5cf6b4677`, the squash merge of PR #57. PR #57 is merged; latest pre-merge CI run #44393414920 passed.
- PR #56 remains merged as `338b55a2bf45e39e096ac722a740f73b9562a5f1`; its looped-music and sidechain-tail fix removed the late digital-silence intervals in v6.
- V7 render #44387937003 showed generated narration lasted 47.31s while the video lasted 60.0s, leaving about 12.7s of visuals after the voice-over ended.
- PR #57 added validated per-scene camera motion and narration-aware retiming. It retimes scenes, transitions, local animation keyframes, particles, existing subtitles and non-voice audio events to the generated narration duration plus a 0.4s visual landing. It clamps keyframes to shortened scene/layer bounds and includes regression tests.
- V8 render #44392886686 failed safely during validation because two outro keyframes rounded one frame beyond the shortened scene. The bounds clamp and regression test fixed this; v8 did not produce an accepted MP4.
- V9 render #44393399283 succeeded before merge. Artifact #14469578336 contains the MP4 and QA JSON (temporary artifact; expires 2026-11-21). Generated narration was 47.31s; video stream 47.733s (47.8s container duration), leaving approximately 0.42s of visual landing.
- V9 QA: 1920x1080, 30fps, H.264/AAC stereo, -16.2 LUFS, zero silence intervals, zero frozen intervals and zero black-frame intervals. Contact sheet inspected. This verifies technical timing and motion diagnostics, not full creative acceptance.
- Main CI #44394465963 passed. Main render #44394465979 was still running at the last snapshot; inspect its artifact and update this state when complete.
- The visual result remains dominated by original tactical SVG/diagram compositions. There is still no authentic licensed VALORANT gameplay footage, so the explainer remains creatively below the intended cinematic standard.

## 7. Immediate development direction

1. Verify the post-merge main render #44394465979 and update this snapshot with its artifact/QA.
2. Prioritize authentic licensed moving VALORANT/gameplay footage and a shot-level workflow with verified rights and provenance.
3. Improve shot variety, purposeful camera movement, visual pacing and semantic QA; the current diagrams are still slideshow-like despite zero freeze warnings.
4. Add explicit voice-versus-video timing diagnostics to the media QA report so future projects cannot hide a short narration behind a long music track.
5. Keep the release gate strict: inspect the actual artifact and judge it against the brief. Technical QA alone does not make a finished cinematic explainer.

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
