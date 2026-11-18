# AI Video Studio — Roadmap

This roadmap describes the intended product, not current implementation. Update checkboxes only after code and evidence demonstrate the capability.

## North-star outcome

A user enters a free-form prompt and receives a polished, coherent, cinematic video with appropriate visuals, editing, narration, music and sound design. The system should work across topics and styles, use user-provided assets when requested, and improve weak results before delivery.

## P0 — Establish reliable production and quality gates

**Goal:** Stop accepting technically successful but creatively weak videos.

- [ ] Diagnose and fix the silent audio intervals in the VALORANT render; add automated tests that detect unexpected silence and missing/short audio tracks.
- [ ] Add a repeatable video QA report: duration, resolution, FPS, codecs, audio stream, loudness/true peak, black frames, freeze/static intervals, shot-boundary contact sheet and asset/caption coverage.
- [ ] Define a measurable storyboard quality check: shot duration, shot-size/framing variety, visual-method variety, meaningful action per shot, and repeated composition detection.
- [ ] Make render acceptance explicit: CI success is necessary but not sufficient; the MP4 must be inspected against the brief.
- [ ] Preserve exact render provenance: source commit, project ID, request ID, workflow run, artifact ID and QA report.
- [ ] Add a reusable quality benchmark project that tests actual footage + graphics + narration + continuous music/SFX, not only abstract vector animation.

**Exit criteria:** A deliberately weak/slideshow-like project is flagged by QA; a good benchmark passes technical checks and human-reviewed creative criteria; audio gaps are detected.

## P1 — Build the reusable AI production director

**Goal:** Convert arbitrary user prompts into structured, editable production plans.

- [ ] Define stable schemas for brief, creative direction/style bible, script, shot list, asset requests, audio cue sheet and QA findings.
- [ ] Implement a director workflow that maps a prompt into these artifacts and validates them.
- [ ] For every shot, select the right visual approach (live footage, generated video, still image, 3D, motion graphics, diagram, typography or hybrid).
- [ ] Generate a coherent shot list with timing, camera/framing, subject/action, transitions, overlays and sound cues.
- [ ] Include explicit confidence/assumption/source fields; do not fabricate facts or claim unsupported capabilities.
- [ ] Keep model/provider integration swappable; do not hard-code one AI vendor into the production model.
- [ ] Support continuation/resume from saved project artifacts so a different model or conversation can continue.

**Exit criteria:** A new prompt for a topic not represented by existing demo projects creates a validated production package without hand-authoring each scene.

## P2 — Asset acquisition and generation

**Goal:** Give each planned shot the right media.

- [ ] Unify asset discovery for still images and moving footage, including Openverse, Wikimedia Commons, NASA where relevant, and user-supplied assets.
- [ ] Build an asset review/selection manifest with source URL, creator, license, restrictions, attribution, media type, dimensions/duration, codec and hash.
- [ ] Add provider adapters for generative still/video media only after comparing quality, rights, latency, reliability and cost.
- [ ] Support user-provided image, video, audio and 3D assets with clear import/validation rules.
- [ ] Handle missing or unsuitable footage honestly; do not disguise diagrams or stills as real footage.
- [ ] Add visual consistency controls for recurring subjects, locations, colors and art direction where the chosen providers support them.

**Exit criteria:** The system can satisfy a mixed shot list using reviewed real footage, generated assets and user assets, with complete provenance and no silent substitutions.

## P3 — Cinematic editing and motion

**Goal:** Move beyond slide-like compositions into authored audiovisual sequences.

- [ ] Build reusable editing primitives for shot grammar, camera motion, parallax/depth, match cuts, motivated transitions, speed changes, compositing and kinetic typography.
- [ ] Make custom Remotion compositions first-class; ProjectVideo remains a useful compatibility renderer, not the creative ceiling.
- [ ] Improve integration of Three.js scenes and imported 3D models where a shot benefits from 3D.
- [ ] Drive visual events from narration and audio beats without making every cut a generic beat cut.
- [ ] Support varied visual styles through style definitions and reusable primitives, not one rigid template per style.
- [ ] Benchmark on several unrelated topics and formats.

**Exit criteria:** Multiple unrelated prompts produce visibly different, intentional edits with meaningful motion and no repeated slideshow grammar.

## P4 — Professional audio and narration

**Goal:** Make audio a designed part of the edit.

- [ ] Diagnose silence/gaps, clipping, loudness and true peak automatically.
- [ ] Add a provider-neutral voice interface for supported providers/local engines, with voice/language selection and clear cost/consent gates.
- [ ] Add reliable forced alignment for arbitrary imported narration, with honest phrase-level fallback if word alignment is unavailable.
- [ ] Create sound-effect cueing tied to specific actions, not generic whooshes on every transition.
- [ ] Support continuous score, ambience, dynamic ducking, transitions, fades and platform-aware mastering.
- [ ] Add actual audio playback/listening to QA workflow where possible.

**Exit criteria:** Voice, music, ambience and SFX form a balanced, continuous mix synchronized with the edit; automated checks flag silence and audio faults.

## P5 — Autonomous visual/audio quality review and iteration

**Goal:** The system improves its own draft before delivery.

- [ ] Generate contact sheets and representative motion clips automatically.
- [ ] Use frame/video understanding to review continuity, relevance, composition, repetition, motion and brief compliance.
- [ ] Review narration/script/caption consistency and audio/video synchronization.
- [ ] Convert QA findings into prioritized, actionable edit changes.
- [ ] Re-render only affected project(s) and compare revisions.
- [ ] Keep an auditable record of what was inspected and what remains uncertain.

**Exit criteria:** A poor draft is automatically identified, revised and re-rendered; final delivery includes a truthful QA summary.

## P6 — Usable end-to-end product

**Goal:** Make the production system easy to use without manually editing JSON or GitHub files.

- [ ] Provide a simple prompt and reference-input interface.
- [ ] Let users select style, duration, format, language, voice and audio preferences without overwhelming them.
- [ ] Support uploading and organizing personal assets.
- [ ] Show production progress, decisions, asset review and render/QA status.
- [ ] Allow targeted revisions (“make this section faster”, “replace this shot”, “change narration voice”) without rebuilding everything.
- [ ] Deliver downloadable MP4 and editable project package with credits.

**Exit criteria:** A user can create, review and revise a video without directly editing repository files.

## Priority policy

1. Fix defects that invalidate current output (audio gaps, timing, broken assets).
2. Improve the actual audiovisual result with a tested end-to-end vertical slice.
3. Build reusable production intelligence and asset workflows.
4. Expand provider choices and product UI only when they advance the north-star outcome.
5. Avoid adding more showcase templates unless they test a concrete capability or quality regression.

## Release gate for every video-producing milestone

Do not mark a milestone complete until:
- Typecheck, tests and project validation pass.
- The actual render succeeds from the intended source commit.
- The exact artifact is downloaded and verified.
- The video is inspected across its full timeline or with sufficient representative motion review.
- Audio is listened to when possible; otherwise clearly state that only technical measurements were performed.
- The result is judged against the original brief and the acceptance criteria.
- Any known defects and limitations are documented.


## Current implementation focus — visual motion after v6

- [ ] Verify PR #57's per-scene camera motion in a fresh rendered VALORANT artifact; require visible movement, no unintended crop and a lower freeze-warning count.
- [ ] Add real licensed moving footage for briefs that demand authentic action; camera motion over static SVGs is an incremental improvement, not a substitute.
- [ ] Review shot variety, action relevance and pacing across the complete rendered timeline before accepting the video.
