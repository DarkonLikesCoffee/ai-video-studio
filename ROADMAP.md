# AI Video Studio — Roadmap

This roadmap describes the intended product, not current implementation. Update checkboxes only after code and evidence demonstrate the capability. Keep it aligned with the verified project state and actual renders.

## North-star outcome

A user describes a video in ordinary language and receives a polished, coherent, cinematic video with appropriate visuals, editing, narration, music and sound design. AI Video Studio should **visually tell a story**, not merely animate information. It must work across topics and styles, use user-provided assets when requested, and improve weak drafts before delivery.

> **Creative principle:** AI Video Studio should not decide how to animate information. It should decide how to visually tell a story, then use the appropriate production techniques to bring that story to life.

A successful render is not a successful video. Technical validity, narrative quality and creative acceptance are separate gates.

## Strategic direction

The current slideshow-like output is a production-intelligence problem, not simply a shortage of effects. PR #81 adds a deterministic report with shot-specific alternatives, but it is advisory and does not autonomously select or apply a revised strategy. Avoid treating every scene as a text card, still image, diagram or background with generic motion.

A production should have:
- A clear promise, narrative progression and intended audience.
- Creative direction and a visual language appropriate to the topic.
- A shot-by-shot plan where every shot has a purpose, action or visual development.
- Per-shot visual-method selection instead of one universal scene template.
- Purposeful camera, subject, object and environmental motion.
- Editing, transitions and audio motivated by what is happening.
- Review of the actual rendered video, followed by targeted improvements.

Visual methods are selectable production capabilities—not mandatory ingredients. A shot may use real footage, user footage, generated video, still imagery, 2D animation, motion graphics, typography, diagrams, 3D, simulations or a hybrid. Select the simplest method that can produce the intended result at the required quality. Do not substitute unrelated stills/diagrams for requested footage without clearly reporting it.

## P0 — Reliable production and quality gates

**Goal:** Stop accepting technically successful but creatively weak videos and fix defects that invalidate current output.

- [x] Add a deterministic storyboard-risk report with warnings for long shots, static camera holds, repeated adjacent framing, visual method and camera movement; warnings are transparent heuristics, not creative verdicts.
- [ ] Diagnose and fix unexpected audio gaps/silence in current benchmark renders; maintain tests for missing, short, silent or misaligned audio tracks. **Partial implementation:** PR #86 now enables EBU R128 peak measurement and parses its summary. The existing policy warns above -1 dBFS and errors above 0 dBFS. Silence/gap detection and benchmark validation remain, so this item is still partial. Silence/gap detection remains in place; a parser fix for trailing EOF silence is merged (#75), with regression tests; broader diagnosis/benchmark validation is still pending.
- [ ] Maintain repeatable media QA: duration, resolution, FPS, codecs, streams, loudness/true peak, silence, black frames, freeze/static intervals, contact sheets for visual inspection, asset/caption coverage and synchronization. **Partial implementation:** media QA reports metadata/audio silence/loudness/true peak/freeze/black-frame intervals; contact-sheet CLI is merged (#76) and was used on VALORANT v4; one benchmark inspection is now recorded, but repeatability and creative acceptance remain pending. The optional contact-sheet JSON evidence report (PR #79) is merged and records exact sample timestamps, options, input, output and layout.
- [ ] Define measurable storyboard checks: shot duration, framing/shot-size and visual-method variety, meaningful action/progression, repeated composition, text dependence and static/slideshow-like patterns. **Partial implementation:** warning signals now cover long/static shots, repeated method/framing/camera movement, vague visual/action descriptions, missing progression markers, highly similar adjacent visuals and lengthy copy; broader coverage and rendered-video QA remain. Recent PR #70 also adds recognized shot-scale checks: repeated adjacent scale and low scale variety across longer sequences (with a 60% recognition threshold). These are still heuristic warnings; broader checks and real-video QA remain.
- [ ] Make render acceptance explicit: CI success is necessary, but creative acceptance requires inspection of the actual MP4 against the brief.
- [ ] Preserve render provenance: source commit, project ID, request ID, workflow run, artifact ID and QA report.
- [ ] Maintain a reusable end-to-end benchmark with real moving footage, graphics, narration, continuous music and SFX—not only abstract vector animation.
- [ ] Update benchmark documentation and project state to reflect current evidence; remove stale claims and distinguish capability readiness from an actually verified render.

**Exit criteria:** QA flags a deliberately weak/slideshow-like project; a benchmark passes technical checks and human-reviewed creative criteria; known audio defects are detected; the inspected artifact and evidence are traceable.

## P1 — AI Production Director and visual storytelling

**Goal:** Turn arbitrary prompts into a creative brief and deliberate audiovisual plan before production begins.

- [ ] Define stable, editable schemas for brief, audience/purpose, creative direction/style bible, script, storyboard/shot plan, asset requests, audio cue sheet, assumptions/sources and QA findings.
- [ ] Implement a Director workflow that interprets the prompt and chooses a narrative approach, tone, pacing, style and visual storytelling strategy.
- [ ] Translate abstract concepts into concrete visual events, actions, demonstrations, comparisons, metaphors or reveals; avoid defaulting to explanatory text cards.
- [ ] Establish a narrative structure appropriate to the format (e.g. hook, development, optional midpoint re-engagement, payoff/CTA) rather than forcing a fixed formula on every video.
- [ ] Make every shot serve the story or explain why it is needed. Specify what the audience sees and what changes during the shot.
- [ ] Select a visual method for each shot: footage, generated media, 3D, motion graphics, diagram, typography, 2D animation, simulation or hybrid.
- [ ] Generate a coherent shot plan with duration, framing/shot size, camera position and motion, subject/action, visual progression, transition, overlay/text rationale and audio cues.
- [ ] Add validation for vague, repetitive, static or text-heavy shot plans and revise them before rendering.
- [ ] Include explicit confidence, assumptions and source fields; do not fabricate facts or claim unsupported capabilities.
- [ ] Keep model/provider integration swappable; avoid coupling the production schema to one AI vendor.
- [ ] Support save/resume from project artifacts so another model, agent or conversation can continue without re-planning everything.

**Exit criteria:** An unfamiliar prompt produces a validated creative brief and executable shot plan with meaningful visual variety and a selected production method per shot, without hand-authoring every scene.

## P1 — Storyboard approval and production planning

**Goal:** Make the storyboard an executable plan, not a scene-title list.

- [x] Require every shot to include a selected visual method, concrete action and start/development/end visual progression in the production-plan schema; validate these fields and keep example plans updated.
- [x] Generate a reviewable HTML storyboard planning preview from production plans before full production (timeline-ordered shot cards, visual method/action/progression, framing/camera/transition/audio cues; not an animated animatic).
- [x] Add a review-only storyboard critic report that converts deterministic QA findings into prioritized revision suggestions; it does not modify plans or approve creative quality.

- [ ] Include shot ID, duration, narrative purpose, visual action/progression, method, composition, camera, asset dependencies and audio cues.
- [ ] Support a review/approval checkpoint for expensive, complex or ambiguous production plans; do not make approval mandatory for every low-cost workflow unless configured.
- [ ] Validate timing and transitions as a complete sequence, including pacing, continuity, repeated visual grammar and shot-to-shot variety.
- [x] Provide a clear path to revise individual shots without regenerating the entire plan using a versioned, source-preserving revision artifact and separate revised-plan output.
- [x] Add a traceable revision artifact/workflow that records the source plan text/object and SHA-256, critic suggestions and selection state, explicit edits, and validation errors/warnings while preserving the original plan. Selection and edits are manual/agent-explicit; no silent auto-repair.
- [x] Export a model-neutral revision handoff prompt from selected suggestions, including only affected shot context and strict JSON edit-output instructions. This is prompt packaging, not an LLM integration.
- [x] Import model-returned revision JSON with strict checks for selected shot IDs, duplicate edits and supported fields; validate and apply only to a separate revised plan.
- [x] Support optional explicit narrative-beat labels and a review report that groups beat coverage/duration and flags gaps without inferring story meaning or enforcing a fixed arc.

**Exit criteria:** A reviewer can understand the intended video and approve or change its shot plan before expensive asset generation or rendering; the approved plan drives production.

## P1 — Expand reusable visual-production capabilities

**Goal:** Enable the Director to produce different kinds of visual sequences, not just animated slide compositions.

- [ ] Build reusable Remotion compositions and motion-graphics primitives for dynamic, layered visuals, data, maps, UI, typography and visual explanations.
- [ ] Expand purposeful camera motion: pan, tilt, dolly, orbit, tracking, zoom, framing changes and parallax/depth where supported and appropriate.
- [ ] Add subject/object/environment animation with explicit motion curves, keyframes and visual states.
- [ ] Improve compositing and layered scene support, including foreground/background separation, occlusion and depth effects when assets and tooling support them.
- [ ] Integrate Three.js scenes and imported 3D models as a selectable production method for shots that benefit from spatial environments, camera movement or object interaction.
- [ ] Evaluate Blender for shots requiring complex modelling, lighting, simulation, rendering or capabilities that are not economical in the current web/Remotion engine. Use it as an optional specialist renderer, not a blanket dependency.
- [ ] Support 2D character/rig animation and physical simulation only for projects where those techniques serve the brief.
- [ ] Make generated/custom Remotion compositions first-class; ProjectVideo remains a useful compatibility renderer, not the creative ceiling.
- [ ] Create a capability registry and method-selection interface so production plans can request capabilities without hard-coding a single engine.
- [ ] Benchmark visual capabilities on several unrelated topics and formats.

**Architecture policy:** Remotion is the current core composition/rendering path. Three.js, Blender, specialized animation tools and other renderers should be integrated selectively behind reusable interfaces. FFmpeg remains a post-processing, audio/video processing and export tool. Evaluate HyperFrames or other engines against concrete requirements before adopting; do not add technology merely because it appears in research.

**Exit criteria:** Multiple unrelated prompts produce visibly different, purposeful visual sequences using more than one visual method; a scene can contain real motion/action and is not limited to text cards, still images or generic vector animation.

## P2 — Asset acquisition and generation

**Goal:** Give every planned shot the appropriate media with review, rights and provenance.

- [ ] Unify discovery of still images and moving footage, including Openverse, Wikimedia Commons, NASA where relevant, and user-provided assets.
- [ ] Build an asset review/selection manifest with source URL, creator, license, restrictions, attribution, media type, dimensions/duration, codec and hash.
- [ ] Add provider adapters for generated still/video media only after comparing quality, rights, latency, reliability, controllability and cost.
- [ ] Support user-provided image, video, audio and 3D assets with clear import/validation rules.
- [ ] Handle missing or unsuitable footage honestly; do not disguise diagrams or stills as real footage.
- [ ] Add visual consistency controls for recurring subjects, locations, palettes and art direction where selected providers support them.
- [ ] Keep asset selection connected to shot intent and approved creative direction; avoid sourcing media solely to fill a scene.

**Exit criteria:** The system satisfies a mixed shot list with reviewed real footage, generated assets and user assets, with complete provenance and no silent substitutions.

## P2 — Cinematic editing, motion and temporal control

**Goal:** Develop a purposeful audiovisual edit rather than a collection of individually animated scenes.

- [ ] Build reusable editing primitives for shot grammar, camera movement, parallax/depth, match cuts, motivated transitions, speed changes, compositing, freeze frames and kinetic typography.
- [ ] Support transitions motivated by content, composition, motion or narrative—not a default transition on every scene boundary.
- [ ] Drive visual events from narration and audio beats when meaningful; do not force every cut to the beat.
- [ ] Support controlled emphasis (punch-ins, reframing, holds and speed changes) with pacing safeguards; effects must be motivated by the scene, not applied at fixed intervals.
- [ ] Build continuity-aware pacing and shot sequencing: contrast shot sizes, change visual method, maintain or intentionally break motion/composition continuity.
- [ ] Provide style definitions and reusable primitives without enforcing one rigid template per style.
- [ ] Add color grading as a configurable, shot/style-aware finishing stage. Avoid blanket filters that can damage the source or make every video look the same.
- [ ] Evaluate techniques such as tracking, morphing, slow motion, speed ramps and advanced interpolation as capability-specific work with benchmarks and explicit limitations.

**Exit criteria:** Several unrelated prompts produce intentionally edited, visually varied sequences with meaningful motion, transitions and pacing—not repeated slideshow grammar or indiscriminate effects.

## P2 — Professional audio and narration

**Goal:** Make audio an intentional part of storytelling and editing.

- [ ] Diagnose silence/gaps, clipping, loudness, true peak and synchronization automatically.
- [ ] Add a provider-neutral voice interface for supported providers/local engines, with voice/language selection and clear cost/consent gates.
- [ ] Add reliable forced alignment for arbitrary imported narration, with honest phrase-level fallback if word alignment is unavailable.
- [ ] Create sound-effect cueing tied to specific visual actions; avoid generic whooshes on every transition.
- [ ] Support continuous score, ambience, dynamic ducking, transitions, fades and platform-aware mastering.
- [ ] Make silence trimming context-aware and configurable; preserve dramatic, expressive and natural pauses. Never impose one universal silence-margin rule without listening/review.
- [ ] Add actual audio playback/listening to QA workflow where possible.

**Exit criteria:** Voice, music, ambience and SFX form a balanced, continuous mix synchronized with the edit; automated checks flag defects and the audio is reviewed where possible.

## P3 — Visual/audio QA, critique and iterative repair

**Goal:** The system evaluates its actual draft, identifies high-impact weaknesses and improves it before delivery.

- [ ] Generate contact sheets, shot-boundary frames and representative motion clips automatically.
- [ ] Use frame/video understanding to review continuity, relevance, composition, visual variety, repetition, motion, text dependence and brief compliance.
- [ ] Review narration/script/caption consistency and audio/video synchronization.
- [ ] Detect and diagnose slideshow-like output, including long static shots, repeated layouts, meaningless motion and scenes that do not visually advance.
- [ ] Convert QA findings into prioritized, specific and actionable edits—not vague scores alone.
- [ ] Re-render only affected scenes/sections when feasible and compare revisions.
- [ ] Keep an auditable record of inspected artifacts, evidence, corrections and remaining uncertainty.
- [ ] Use explicit acceptance criteria and avoid pretending automated vision/audio analysis is infallible.

**Exit criteria:** A weak draft is identified with evidence, corrected and re-rendered; the final delivery includes a truthful QA summary and unresolved limitations.

## P4 — End-to-end benchmark and capability validation

**Goal:** Prove the architecture works across different content types before scaling complexity.

- [ ] Maintain benchmark projects for distinct visual challenges (e.g. real footage/editing, 3D spatial explanation, motion-graphics explainer, screen/UI tutorial, character/action narrative).
- [ ] Define briefs and acceptance criteria before rendering each benchmark.
- [ ] Record the selected visual methods, engine paths, asset sources, cost/compute, render duration and QA outcomes.
- [ ] Compare versions and preserve failures as regression cases.
- [ ] Require a benchmark to demonstrate a new capability before declaring it production-ready.

**Exit criteria:** The system has verified examples across unrelated topics and visual formats, with measurable technical results and documented creative review.

## P5 — Usable end-to-end product

**Goal:** Make production easy to use without manually editing JSON or GitHub files.

- [ ] Provide a simple prompt and reference-input interface.
- [ ] Let users select style, duration, format, language, voice and audio preferences without overwhelming them.
- [ ] Support uploading and organizing personal assets.
- [ ] Show production progress, creative decisions, storyboard review, asset selection and render/QA status.
- [ ] Allow targeted revisions (“make this section faster”, “replace this shot”, “change narration voice”) without rebuilding everything.
- [ ] Deliver downloadable MP4 and editable project package with credits.

**Exit criteria:** A user can create, review and revise a video without directly editing repository files.

## Priority policy

1. Fix defects that invalidate current output.
2. Improve the actual audiovisual result with a tested end-to-end vertical slice.
3. Solve production intelligence and story/shot planning before adding superficial polish.
4. Build reusable visual, motion, editing and audio capabilities guided by benchmark needs.
5. Add QA and iteration that inspect the actual output.
6. Expand providers and product UI only when they advance the north-star outcome.
7. Adopt a new framework/tool only when it fills a verified capability gap or offers a substantial measured improvement.
8. Avoid adding more showcase templates unless they test a concrete capability or quality regression.
9. Prefer a small, working vertical slice over large architecture rewrites or speculative multi-agent complexity.
10. Do not spend money on paid services or APIs without explicit user approval.

## Release gate for every video-producing milestone

Do not mark a milestone complete until:
- Typecheck, tests and project validation pass.
- The actual render succeeds from the intended source commit.
- The exact artifact is downloaded and verified.
- The video is inspected across its timeline or with sufficient representative motion review.
- Audio is listened to when possible; otherwise clearly state that only technical measurements were performed.
- The result is judged against the original brief and acceptance criteria.
- Any known defects and limitations are documented.
- Provenance and QA evidence are saved with the project.

## Current implementation focus — transition from rendering reliability to production intelligence

The recent work has established important pipeline foundations: media QA diagnostics, narration/timeline synchronization, per-scene camera motion and integration of user-authorized footage into the narrated ProjectVideo path. Verify live code, CI, PRs, renders and artifacts before treating this snapshot as current.

- [x] Establish automated media diagnostics for rendered MP4s (metadata, silence, loudness, freeze and black-frame analysis) and attach reports to render artifacts.
- [x] Synchronize narrated visuals and timelines and add regression coverage for boundary/timing issues.
- [x] Add per-scene camera-motion capability and verify a fresh render, subject to the evidence recorded in project-state docs.
- [x] Integrate authorized local footage into the narrated ProjectVideo production path with rights metadata and separate credits.
- [ ] Verify and document the latest real render against its creative brief; do not equate motion diagnostics or technical synchronization with creative acceptance.
- [ ] Update the project-state, continuity and progress docs so stale benchmark/footage claims do not contradict verified current evidence.
- [ ] Begin the next quality-first vertical slice with the Production Director → storyboard/shot plan → visual-method selection → production → actual-video QA loop.
- [ ] Use the existing VALORANT project as a regression/creative-quality case, not as justification to repeat its diagram-heavy visual approach.
- [ ] Choose the first implementation task only after inspecting the current director, storyboard, production schema, render path and QA code. Favor a focused, testable improvement.

The largest gap is not basic rendering. It is the **production intelligence and audiovisual quality** between a user's prompt and the final edit.
\n\n## 2026-11-19 — Visual strategy report JSON (completed)\n\n- [x] PR #82 adds machine-readable, versioned JSON output to `storyboard:strategy` alongside Markdown, including optional file output.\n- CI passed for PR head `b12bd9cf`; PR #82 merged as `25e946045f00764142fb26c9c8e305bdd511e8c5`; post-merge main CI passed.\n- This remains deterministic, advisory QA—not semantic understanding, automatic creative revision or autonomous Production Director behavior.\n- Next slice: review the existing revision-artifact workflow and design a non-duplicative, reviewable bridge from visual-strategy findings to explicit revision suggestions/edits.\n

## Render evidence workflow

- [x] Automatically attach a contact sheet and JSON evidence report to every GitHub Actions render artifact (PR #84 merged; post-merge main CI pending and no render has yet exercised this workflow).
- [ ] Inspect actual render artifacts across motion and listen to audio; contact sheets alone are insufficient acceptance.
