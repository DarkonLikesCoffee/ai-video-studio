## 2026-11-18 — User-provided gameplay footage integration merged (PR #58)

- Reviewed the post-merge narration-sync render #44394465979 and downloaded artifact #14469659407. QA: 47.733s video, 47.8s audio, 1920x1080, 30fps, H.264/AAC stereo, -16.1 LUFS, zero silence/freeze/black intervals. Contact sheet confirmed the technical result still reads as repeated vector-diagram compositions.
- Diagnosed a missing production integration: buildNarratedFootageTimeline existed and was used for NarratedSkyExplainer custom props, but the ProjectVideo narration path never added the resulting footage to scene media layers.
- PR #58 added owner-provided footage rights metadata (user-owned or permission-granted plus a meaningful rightsNote), injects matched local video as muted full-frame backgrounds behind the scene's vector overlays and captions, preserves custom-composition props compatibility, and adds separate user footage credits.
- Added tests for explicit rights metadata, shot-to-scene injection, trim offsets, overlay preservation and credits. Added projects/valorant-immortal-decision-making/production/USER_FOOTAGE.md and README documentation.
- First CI run #44396824372 failed only because the empty-credits test expected the old message. Updated the expectation; final PR CI #44397239973 passed, including typecheck and all tests.
- PR #58 merged by squash to main as baeabc412b2a52be48e69d41b6709936b265cc6c.
- No actual gameplay clips have been added yet and no footage render has been performed. The code path is now ready; creative validation requires real, authorized gameplay clips.
- Next: verify post-merge main CI, then select short clips from the user's own recordings or clips with explicit permission, map them to shot IDs, render and inspect.
- Current branch / commit: main / baeabc412b2a52be48e69d41b6709936b265cc6c.

## 2026-11-18 — Narration/video timeline synchronization fixed and merged

- User review identified that narration ended before the video. Measured v7 from workflow #44387937003: generated narration was 47.31s while the rendered video remained 60.0s, leaving approximately 12.7s of un-narrated visuals.
- Added packages/video-engine/src/narration-timeline.ts and integrated it into scripts/apply-narration.ts. The helper retimes scene durations, transitions, local animation keyframes, media/graphic/particle timing, existing subtitles, and non-voice audio events together to the narration duration plus a 0.4s visual landing. Source trim and playback-rate values remain unchanged.
- Added regression tests for shared timeline retiming and frame-boundary clamping. V8 render #44392886686 exposed a one-frame keyframe overflow in two outro graphics; fixed it by clamping local keyframes to their shortened scene/layer duration. V9 render succeeded.
- Latest PR CI #44393414920 passed. PR #57 merged by squash into main as 2bd52e9f0830600718fcb60fc5bd6f5cf6b4677.
- V9 branch render #44393399283 produced artifact #14469578336. Measured narration: 47.31s. Video: 47.733s (47.8s container duration), approximately 0.42s visual landing after speech. QA: 1920x1080, 30fps, H.264/AAC stereo, -16.2 LUFS, zero silence/freeze/black intervals. Contact sheet inspected.
- Main CI #44394465963 passed. Main render #44394465979 was running at the time of this log entry; inspect its artifact before closing this handoff.
- Creative limitation: the video is still built primarily from tactical vector diagrams and typography. Camera motion reduces freeze detections but does not create authentic gameplay footage. The result is technically synchronized but not yet accepted as a cinematic VALORANT explainer.
- Next: inspect post-merge main render; then prioritize verified licensed moving gameplay footage, semantic shot variety and audio/video sync diagnostics in media QA.
- Current branch / commit: main / 2bd52e9f0830600718fcb60fc5bd6f5cf6b4677.

## 2026-11-18 — v6 audio fix verified; cinematic camera motion in PR #57

- PR #56 merged into main as 338b55a2bf45e39e096ac722a740f73b9562a5f1 (fix(audio): preserve looped music through narration tail).
- Main CI run #44385444014 passed.
- Downloaded actual render artifact #14466045811 from v6 render #44383766685. QA confirms 60.1s, 1920x1080, 30fps, H.264/AAC stereo, integrated loudness -16.8 LUFS, zero silence intervals and zero black-frame intervals.
- Audio issue is considered fixed based on this full production render; v6 is not accepted as a finished video because nine freeze intervals remain and the visuals are still dominated by original vector diagrams rather than authentic VALORANT gameplay.
- Inspected source: scenes last 300 frames, but many media/graphic animation tracks clamp at frames 70–190. The composition then holds almost static for the rest of each scene. The existing outer decorative ring movement is too subtle and mostly outside the frame.
- Created PR #57: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/57. Adds optional per-scene cameraMotion (zoom/pan), validation bounds, media/graphics/particle camera movement while keeping typography stationary, and alternating camera moves across the six VALORANT scenes. Added schema regression tests.
- CI run #44385753034 is running. Do not merge until green CI and a fresh v7 render confirms the camera movement is visible, reduces freeze warnings and does not crop important content.
- Next: inspect PR #57 CI; fix any type/test/render issues; render v7 and inspect the actual artifact. Then prioritize authentic licensed motion footage and shot-level visual diversity.

## 2026-11-18 — Sidechain fix strict-type correction

- PR #55's first CI run #44383361646 failed at TypeScript typecheck because `AudioTrack.loop` is optional and the helper requires a concrete boolean.
- Corrected the call site to pass `track.loop ?? false`; no tests were skipped or weakened.
- Superseded PR #55 with PR #56 on branch `fix/sidechain-music-tail-v2`, based on the corrected head.
- Next: verify CI for PR #56, run the branch's VALORANT render v6, and inspect the actual audio QA report before merge.

## 2026-11-18 — VALORANT v5 diagnosis and sidechain tail fix (PR #55 in progress)

- Render run #44381103388 completed successfully on main commit `8804c66264f2243378424836c3d74fddb24617ab`; artifact #14462663601 contains the MP4 and `.qa.json` (expires 2026-11-21).
- Downloaded and inspected the actual QA report: 60.1s, 1920x1080, 30fps, H.264/AAC stereo, integrated loudness -16.3 LUFS, no black-frame intervals.
- Confirmed three persistent digital-silence intervals: 46.840–50.063s, 51.256–56.033s, 57.353–60.100s. QA also reported nine frozen-video intervals, including 46.667–50.000s and 55.867–58.133s. The video is not accepted.
- Inspected the source pipeline: the VALORANT music track is a 20-second generated score marked `loop: true`, and is preprocessed with FFmpeg sidechain compression against a shorter generated narration track. The offline preprocessing did not explicitly loop the music input or pad the voice sidechain to the full track timeline. This is the leading root-cause hypothesis for the missing music tail; verify with the next actual render.
- Opened PR #55: [Fix looped music truncation in sidechain processing](https://github.com/DarkonLikesCoffee/ai-video-studio/pull/55). Added reusable FFmpeg input/filter helpers, explicit looping and timeline trimming for looped music, sidechain padding after timeline delay, and four regression tests.
- Reproduced a 20-second music + 46.84-second narration scenario with the proposed FFmpeg filter graph locally. Output was exactly 60.0 seconds and a -50 dB/0.75s silence scan found no silence intervals.
- CI/check-runs for PR #55 had not appeared at the time of this log update. Do not merge until CI/typecheck/tests pass and a fresh VALORANT render confirms the three late silence gaps are gone.
- Next action: get PR #55 CI green; rerender the actual VALORANT project; download and inspect the new MP4/QA report. Then tackle visual stagnation: nine freeze warnings and repeated SVG-only compositions; add real licensed motion footage or a more cinematic motion/shot grammar rather than merely changing text cards.

## 2026-11-18 — Media QA diagnostics merged; VALORANT verification render

- PR #54 merged into main by squash as `8e2049f7dd2a26a64b64431f6c4fb6fed3921a26`.
- CI run #44380704836 passed: Python narration tests, TypeScript typecheck, all Node tests including four media-QA cases, production-plan validation, FFmpeg audio fixture/project preparation, and studio build.
- Added `npm run qa:media -- <rendered.mp4>`, writing a timestamped JSON report with ffprobe metadata, silence intervals, EBU R128 loudness diagnostics, freeze intervals and black-frame intervals.
- Missing audio/video streams or invalid duration fail the command. Silence/freeze/black are warnings for human/creative review, not automatic failures (intentional pauses/cuts can be valid).
- Render workflow runs media diagnostics on the final mastered MP4 and includes the `.qa.json` report in the uploaded artifact.
- PR #51 was closed as obsolete, not merged; its alignment work was superseded by PR #52.
- The previous VALORANT video remains creatively unacceptable (slideshow-like) and had documented late audio gaps. The new diagnostic has not yet been run on a fresh real render; a v5 verification render is being triggered now.
- Next action: inspect its QA report for the three known late audio gaps, trace the root cause to timeline/audio track processing or narration alignment, fix and rerender. After audio repair, return to shot/visual-method variety and real licensed footage; do not call the project finished from technical QA alone.

## 2026-11-18 — First automated media-QA slice (PR #54 in progress)

- Re-read `START_HERE.md`, `AGENTS.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `PROGRESS_LOG.md`, README, production workflow and the relevant creative/audio/Remotion/visual-QA skills.
- Confirmed main CI #44379637013 passed and the latest main VALORANT render #44362064050 completed, but the video still has documented digital-silence gaps and did not meet the cinematic creative brief.
- Closed obsolete PR #51 without merging; its alignment repair was superseded by merged PR #52.
- Opened PR #54: [Add automated rendered-media quality diagnostics](https://github.com/DarkonLikesCoffee/ai-video-studio/pull/54).
- Added `scripts/media-qa.ts` and `scripts/qa-media.ts`: ffprobe metadata, FFmpeg silence detection, EBU R128 diagnostics, freeze detection and black-frame detection; JSON report; missing audio/video or invalid duration are hard failures, while silence/freeze/black are warnings for human review.
- Added four media-QA regression tests and a dedicated skill/README section. Render workflow now runs the diagnostics on each GitHub Actions MP4 and uploads the JSON sidecar.
- First CI run #44380458995 found strict TypeScript nullability in FPS parsing; fixed in `6676c5f`. Follow-up run #44380595061 was cancelled by a superseding push; run #44380631630 was queued at the time of this log update.
- No code has been merged into main from PR #54. No real MP4 has yet been run through the new diagnostics; local execution is unavailable in this GitHub-only session. Do not describe the CI tests as passing until the latest workflow completes.
- Next action: inspect run #44380631630, fix any further failures, then merge PR #54 only after green CI; trigger the VALORANT render request so the new report can inspect the actual artifact and use its timestamps to guide the source-level fix.

## 2026-11-18 — Continuity system created

- Added a universal entry point so a new AI or conversation can resume by reading `START_HERE.md`.
- Added cross-agent operating rules in `AGENTS.md`.
- Added verified project snapshot in `PROJECT_STATE.md` and prioritized roadmap in `ROADMAP.md`.
- This documentation change is being prepared on branch `docs/project-continuity`; update this entry with the PR/merge result after validation.
- Next development work should begin with P0 quality gates, especially diagnosing the VALORANT render's audio silence and creating reusable video/audio QA. Do not build another decorative slideshow showcase as a substitute for the core production workflow.

## 2026-11-18 — VALORANT explainer render and creative QA

- PR #50 added the VALORANT competitive decision-making explainer, original tactical vector assets, production plan, storyboard, narration and render request.
- The first render failed during Kokoro word/phoneme alignment. Several fixes were attempted; the successful repair landed in PR #52.
- PR #52 fixed context-sensitive phoneme alignment and added regression coverage. Branch render run #44360142074 succeeded; the resulting MP4 was retrieved.
- The rendered file was approximately 60.1 seconds, 1920×1080, 30 FPS, H.264 with AAC stereo audio.
- Creative review found that the result did not meet the cinematic brief: it used mostly dark title/reticle/tactical-diagram visuals, lacked authentic gameplay and player-action footage, and felt like animated slides rather than an esports documentary/trailer.
- Audio analysis found unexpected digital-silence intervals near 46.85–50.07s, 51.22–56.03s and 57.22–60.10s. These are defects to diagnose, not acceptable intentional silence unless the creative brief explicitly calls for them.
- Main commit after PR #52: `d1510e5c51d9ce4bd8503e1f5a43248bb450b196`. Main CI run #44362063980 and main render run #44362064050 completed successfully.
- PR #51 remained open on an older alignment-fix branch at the time of inspection. Re-check whether it is obsolete before taking action.
- Lesson: CI and a successful MP4 render prove technical execution, not creative quality. Do not accept future videos without inspecting the actual artifact.

## 2026-11-18 — NASA footage pipeline

- Earlier work added a NASA Image and Video Library asset-manifest workflow, safe HTTPS/rendition selection and per-shot trims from different portions of source footage.
- A narrated NASA/ISS explainer render was reported as completed with multiple source segments, Kokoro narration and a 3D inset.
- The NASA workflow demonstrates licensed-source discovery and compositing for a particular use case; it does not provide universal video generation or arbitrary stock footage access.
- Verify current source code and project artifacts before extending this workflow.

---

## Session handoff template

Append one entry per meaningful development session:

### YYYY-MM-DD — Short title

- **Goal:**
- **Changes:** files/features/commits/PRs.
- **Tests:** exact commands and pass/fail results.
- **Render:** workflow run, artifact ID, duration/resolution/codec.
- **QA:** what was actually inspected/listened to; defects found.
- **Decisions:** durable product/architecture choices.
- **Known issues:**
- **Next action:** one clear highest-priority next step.
- **Current branch / commit:**

## 2026-11-19 — Visual storytelling production guidance (in progress)

- Goal: begin implementing the roadmap direction by making the agent production process explicitly story-first and anti-slideshow, before attempting a broad renderer rewrite.
- Created branch `feature/visual-storytelling-production-guidelines` from roadmap commit `1341df8aa1f391024d5f30d25ecadc6048b9bebb`.
- Updated `agent/skills/creative-director/SKILL.md`: visual storytelling over animating information, concrete events/actions, per-shot visual-method selection, and effects only when motivated.
- Updated `agent/skills/storyboard/SKILL.md`: each shot must define method, action, start→development→end progression, motion, assets/fallback, and a slideshow-risk review before production.
- Updated `agent/README.md`: clarified production-method selection and added a production-intelligence checklist before scene building.
- No renderer or production-plan schema changes yet. This is the first workflow-guidance slice, not an implemented autonomous Director or new engine capability.
- Validation: changes are documentation-only; no tests or render were run. Validate links/content and open PR for review; CI should still be checked before merge.
- Next: open PR, inspect its CI; then build a small testable storyboard-quality validator that can identify missing shot actions/progression and warn about slideshow risk without overclaiming semantic AI QA.
- Current branch: `feature/visual-storytelling-production-guidelines`.

## 2026-11-19 — Production-plan shot requirements added (PR #66, validation pending)

- Added required `visualMethod`, `action`, and `visualProgression` shot fields to `validateProductionPlan`.
- Added regression tests for omitted method, action and progression.
- Enriched all four existing production-plan examples with the new fields. Each shot now describes method selection, a concrete action and start/development/end visual progression.
- The validator currently checks presence/non-empty strings only; it does not claim to judge creative quality or automatically detect slide-like output.
- CI run #44498960909 is validating the latest branch head. No render was performed.
- Next: resolve CI; then consider deterministic storyboard-risk warnings as a separate, testable slice.

## 2026-11-19 — Visual storytelling requirements merged (PR #66)

- PR #66 https://github.com/DarkonLikesCoffee/ai-video-studio/pull/66 merged by squash as `bbfce5c68d9a4c4a84b918285b23ac07f26b52f6`.
- CI run #44499140921 passed for final PR head `8a1bf5bbca568792332972bc89b852c58ef00950`.
- Updated Creative Director, Storyboard and agent production workflow guidance to emphasize concrete visual events, per-shot visual-method selection, start→development→end progression, and slideshow-risk review.
- Validator now requires non-empty `visualMethod`, `action`, and `visualProgression` on every shot. Updated tests cover missing fields; all four checked-in production plans were enriched.
- This validates planning completeness only; it does not semantically judge video/story quality or detect slideshow-like renders.
- No render was run.
- Next: implement a transparent deterministic storyboard-risk report with warnings only, backed by tests.

## 2026-11-19 — Deterministic storyboard risk report (PR pending)

- Started branch `feature/storyboard-risk-report` from current main.
- Added `scripts/storyboard-qa.ts`: warning-only deterministic signals for long shots, explicit static holds, repeated adjacent framing, repeated visual method and repeated camera movement. Output explicitly says these heuristics do not judge story meaning or prove quality.
- Added tests, package command `storyboard:qa`, and CI execution against the example plan.
- Added a roadmap check for this limited deterministic QA slice. The larger semantic storyboard/visual QA milestone remains incomplete.
- Tests/CI not yet confirmed; no video render performed.
- Next: inspect CI and fix failures, then update docs and merge only if green.

## 2026-11-19 — Deterministic storyboard risk report merged (PR #67)

- PR #67 https://github.com/DarkonLikesCoffee/ai-video-studio/pull/67 merged by squash as `40f38b7a7576bb061e5f0318e265358a759829f3`.
- CI run #44499955017 passed typecheck, all tests, four plan validations, storyboard QA CLI against all four production plans, project validation, audio preparation and studio build.
- `npm run storyboard:qa -- <production-plan.json>` now emits warning-only signals for shots 8s+, static camera holds 5s+, adjacent framing repetition, 3+ shot visual-method runs and 3+ camera-movement runs.
- QA output: the launch-film, narrated explainer and SORA plans had no deterministic warnings; VALORANT generated six long-shot pacing warnings for its six 10-second chapters. This is expected as a review prompt, not an automatic defect.
- Documentation added to README and agent guidance. This report is deterministic and does not claim semantic creative judgment or video inspection.
- No render was run.
- Next: improve shot-sequence planning/validation with transparent visual-method distribution and action/progression checks, then evaluate storyboard/animatic review before expanding renderer effects.


## 2026-11-19 — Live repository audit and storyboard review vertical-slice kickoff

- Re-read `START_HERE.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `PROGRESS_LOG.md`, `AGENTS.md`, `README.md`, agent workflow guidance and the relevant Creative Director, Storyboard, Remotion Producer and Visual QA skills.
- Verified live `main` at `a30be87792a5bc0646e4c4dc3b1bf04d42a8dd92`; latest main CI run #44500292909 succeeded. No open PRs were returned. PRs #66 and #67 are merged.
- Read the attached continuation: after #66/#67 the project owner supplied NotebookLM research and chose to treat it as strategic input, not a shopping list. The agreed direction is story-first planning, per-shot visual-method selection and a reviewable sequence before expanding renderer effects.
- Confirmed the current storyboard analyzer is deterministic warning-only QA. It does not semantically judge story content or render previews.
- Confirmed the current production plan already records shot timing, visual method, action, start/development/end progression, framing, camera, transition and audio. The existing schema has no animatic renderer.
- Created branch `feat/storyboard-animatic-preview` from verified main. No application code or render request has been changed yet.
- Chosen next vertical slice: a lightweight, dependency-free storyboard/animatic review artifact derived from an existing production plan. It should show timed shot cards and the authored visual direction, clearly label itself as a planning preview (not a video render), and provide a way to inspect the full sequence before committing to asset production/rendering.
- No render was run in this session. The last reported VALORANT v4 run #44485488551 was technically successful (47.86s, 1080p/30fps); creative acceptance remains open and the uploaded conversation reports frame-based review, not full-timeline playback/audio listening in this session.
- **Next:** inspect the full storyboard/production-plan format and implement the smallest reusable preview generator plus tests, then run CI and inspect the produced preview. Keep the renderer and `render-request.json` untouched unless an end-to-end render becomes necessary for acceptance.
- Current branch: `feat/storyboard-animatic-preview`; base: `a30be87792a5bc0646e4c4dc3b1bf04d42a8dd92`.


## 2026-11-19 — Storyboard planning preview implementation (PR preparation)

- Added `scripts/storyboard-preview.ts`, a dependency-free TypeScript utility that converts an existing production plan into a timeline-ordered HTML review page.
- The preview surfaces shot timing, visual method, purpose, visual description, concrete action, start/development/end progression, framing, camera movement, transition, audio, text and asset references.
- The utility validates the preview's basic sequence bounds (starts at 0, shots ordered/non-overlapping, no shot past runtime, final shot ends at declared runtime) so the review page cannot silently imply an invalid sequence.
- The output explicitly labels itself as a planning preview, not a rendered video or animated animatic. It does not load footage, generate assets or claim semantic creative approval.
- Added `tests/storyboard-preview.test.ts` for data coverage, invalid timing/overlap and HTML escaping. Added `npm run storyboard:preview`.
- Documented the review step in README and agent workflow guidance.
- CI now generates planning previews for the launch-film and VALORANT production plans and uploads them as the `storyboard-planning-previews` artifact (7-day retention).
- This is an inspectable pre-production planning aid; it does not yet show thumbnails or generated motion. The next iteration can add asset thumbnails/representative media only after a reliable, rights-aware preview path exists.
- Branch: `feat/storyboard-animatic-preview`, based on `a30be87792a5bc0646e4c4dc3b1bf04d42a8dd92`.
- Validation: awaiting PR CI. No full video render was initiated because this feature produces a planning artifact only, not a video-producing engine change.
- Next: inspect CI, download and inspect the HTML artifact, resolve any issues, then open/complete the PR review and update state with exact CI/artifact evidence.


## 2026-11-19 — Storyboard planning preview merged (PR #68)

- PR #68: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/68 merged to main using squash.
- Merge commit: `e7988966b6783ff0cf4e0f92bcd656859b9cafc3`.
- Branch CI run #44502735050 passed all steps: Python narration tests, TypeScript typecheck, 151 Node tests, production-plan validations, new storyboard preview generation, storyboard risk reports, FFmpeg/FFprobe setup, media/project validations and studio build.
- CI artifact #14516579993 (`storyboard-planning-previews`) was downloaded and inspected. It contains `launch-film.html` (4 shots) and `valorant.html` (6 shots); both files are non-empty standalone HTML outputs.
- The preview is an HTML pre-production planning page, not an animated animatic or rendered video. It shows the authored shot timeline and creative fields; it does not play the clips or semantically evaluate story quality.
- Tests revealed valid projects can contain transition overlaps. The preview now preserves overlaps instead of rejecting them. The project-wide validator, not this display helper, remains authoritative for timeline legality.
- Roadmap updated to mark the HTML planning-preview milestone complete. Future work remains to create a true visual animatic with representative media/motion, a persistent/assisted Production Director, and actual semantic visual QA.
- Main CI after merge: run #44502943805 was queued at the time of this update; do not mark the post-merge CI complete until its result is checked.
- No MP4 render was started: this PR changes pre-production planning review only and deliberately leaves the render request and renderer untouched.
- Current main at documentation update start: `e7988966b6783ff0cf4e0f92bcd656859b9cafc3`.

## 2026-11-19 — Expanded storyboard quality signals (PR preparation)

- Started `feature/storyboard-quality-signals` from live main `f2f54d121279944a19a5fe187efba6b6aeccc066`.
- Extended `storyboard:qa` with transparent warning-only checks: generic/placeholder visual descriptions, vague actions, missing explicit Start/Development/End progression markers, highly similar adjacent visual descriptions, and long on-screen copy.
- These checks do not fail production plans and are not semantic quality scores. The purpose is to help an agent identify weak shots and rewrite them before asset production.
- Added regression tests for all five signals; existing risk warnings remain unchanged.
- Updated README and agent workflow guidance.
- Pending validation/CI. No render yet; this change affects pre-production review only.


## 2026-11-19 — Expanded storyboard quality signals merged (PR #69)

- PR #69: https://github.com/DarkonLikesCoffee/ai-video-studio/pull/69 merged by squash into main as `ac153121b0f7ec81a02dbec63e8c1b37fb205200`.
- New warning-only heuristics: `VAGUE_VISUAL_DESCRIPTION`, `VAGUE_ACTION`, `INCOMPLETE_VISUAL_PROGRESSION`, `REPEATED_VISUAL_DESCRIPTION` and `TEXT_HEAVY_SHOT`.
- Existing storyboard risk checks retained. No validation is weakened; the warnings do not fail plans.
- CI run #44504229542 passed the full workflow: typecheck, test suite, production-plan validation, storyboard planning previews and QA reports, project validation, FFmpeg/FFprobe setup, audio processing validation and studio build.
- The first CI attempt failed due to a syntax error in the new helper. Fixed regex escaping and the missing function closure; the succeeding full CI run passed. This is recorded rather than hidden.
- PR is merged. No video render was performed because this is a pre-production QA CLI change.
- Limitations: token similarity and phrase patterns can miss weak shots or produce false positives; they do not semantically evaluate story or inspect video.
- Next: improve the quality signals with shot-size/layout change and text-vs-visual balance where measurable, then prototype a review/repair loop. Keep actual rendered video QA separate.


## 2026-11-19 — Shot-scale variety signals merged (PR #70)

- PR #70 https://github.com/DarkonLikesCoffee/ai-video-studio/pull/70 merged by squash as `50a3e81d2bb29e72307772ba96ec22735af10ccb`.
- `storyboard:qa` recognizes common shot-scale descriptions (extreme close-up, macro, close-up, medium, wide) and adds warning-only `REPEATED_SHOT_SCALE` (three adjacent shots) and `LOW_SHOT_SCALE_VARIETY` (5+ shots, at least 60% recognizable, no more than two recognized scales).
- Unknown framings are excluded from scale variety, avoiding warnings based solely on unrecognized terminology.
- Regression tests added; README and agent guide updated.
- CI run #44505337143 passed for final head `b7a3a86f322cfeab5a96556cdfa3131c708b948c`: Python narration tests, typecheck, Node tests, plan validation, storyboard previews and QA, all project validations, FFmpeg/FFprobe/audio checks, and studio build. No render was run (pre-production QA only).
- Next: prototype a separate critique report with prioritized, specific revisions for weak shots. Keep it review-only initially; do not silently rewrite a plan. Validate revised plans with the existing validator and QA, then evaluate an explicit approval/repair loop.
- Main merge commit: `50a3e81d2bb29e72307772ba96ec22735af10ccb`.


## 2026-11-19 — Review-only storyboard critic report merged (PR #71)

- PR #71 https://github.com/DarkonLikesCoffee/ai-video-studio/pull/71 merged by squash as `c18b1be0e79f25e6b14b3d49838f31b9c683044d`.
- Added `scripts/storyboard-critic.ts` and `npm run storyboard:critic -- <production-plan.json> [output.md]`. The command turns deterministic QA warnings into high/medium prioritized actionable revision suggestions.
- Suggestions cover weak visual/action descriptions, missing visual progression, repeated adjacent visual content, text-heavy shots, long shots/static holds and repeated framing/scale/method/camera movement.
- It is strictly review-only: does not mutate source plan, invoke an AI provider, auto-repair or approve the creative. Apply selected revisions to a copy and rerun plan validation and QA.
- Added tests for prioritization, report content, non-mutation and no-findings behavior; CI smoke-generates a critique for the launch-film example. Updated README and agent docs.
- First CI run #44506671305 failed on a test that expected recommendations from the clean example; fixed by deliberately weakening a shot in the test. Final PR CI run #44506823215 succeeded.
- Final run passed typecheck, tests, plan validation, previews, critic report, all storyboard QA checks, project validation, FFmpeg/FFprobe, audio preparation and studio build. No render was performed because this is a pre-production review tool.
- Main merge SHA: `c18b1be0e79f25e6b14b3d49838f31b9c683044d`.
- Next: define a versioned revision artifact that preserves original plan, selected recommendations, applied edits and validation results. Then evaluate model-assisted semantic critique under an explicit no-paid-call constraint; do not implement auto-repair until review and rollback are auditable.


## 2026-11-19 — Repository continuity snapshot reconciliation

- Re-verified live main at `40ffe8fd8a21466fa4cca607ace6ecc422c7ab35`; latest main CI #44507106494 completed successfully; no open PRs.
- Found `PROJECT_STATE.md` was stale and contradicted recent merged milestones. Replaced it with a current, evidence-based snapshot including PRs #66–#71 and explicit limits of the storyboard QA/critic tools.
- Added the traceable storyboard revision artifact as a roadmap item: source plan, critique, selected suggestions, explicit edits and validation result, with original plan preserved.
- This is documentation reconciliation only; no implementation or render was performed.


## 2026-11-19 — Preserve continuity context during snapshot update

- Safety review found the initial PR #72 draft shortened `PROJECT_STATE.md` too aggressively, removing useful architecture, engine capability, limitation, and VALORANT benchmark context.
- Revised the proposed snapshot to preserve sections 1–5 of the existing state document and replace only stale duplicated history with current verified milestones and resume instructions.
- CI must re-run against this updated head before merge. This is a documentation improvement only; no tests or render are claimed.


## 2026-11-19 — Traceable storyboard revision artifact (PR preparation)

- Implemented `scripts/storyboard-revision.ts` with `storyboard:revision init|validate|apply` CLI modes.
- `init` creates a version-1 artifact that preserves the exact source plan text, parsed source object, source SHA-256, critic suggestions (unselected), explicit edit list and empty validation field.
- `validate` and `apply` verify the source file and embedded text still match the original hash, and verify the embedded object matches the preserved text; source drift requires a fresh artifact.
- Edits are explicit per shot (`shotId`, `changeNote`, `fields`). Applying writes a separate revised plan and never overwrites the original. Schema errors and heuristic warnings are recorded separately.
- Added regression tests for source preservation, edits without source mutation, unknown shot IDs, and separating validation errors from QA warnings. Updated CLI docs, agent workflow and roadmap.
- This is a deterministic review/edit artifact, not AI auto-repair or creative approval. CI is required for test/typecheck verification; no render is needed for this pre-production-only capability.


## 2026-11-19 — True-peak measurement in media QA (PR preparation)

- Added extraction of EBU R128 `True peak` from FFmpeg audio-analysis logs into `measurements.truePeakDbfs`.
- Default warning threshold is -1.0 dBFS; readings above it warn, readings above 0.0 dBFS fail. Both values configurable.
- Added tests for safe, warning, and over-limit readings; updated README and roadmap to distinguish partial implementation from full audio QA.
- CI is pending. No render or listening session was performed for this change.


## 2026-11-19 — Trailing silence through EOF (PR preparation)

- Confirmed the silence parser currently pairs only `silence_start` and `silence_end`, leaving an EOF-trailing silence unreported when FFmpeg emits only a final `silence_start`.
- Added a parser path to close unmatched final silence at the probed media duration, preserving interval duration precision and skipping zero-length intervals.
- Added regression tests for a long trailing silence that must fail, a short trailing silence warning, and an EOF zero-length edge case.
- CI pending. No benchmark render or audio listening was performed.


## 2026-11-19 — PR #75 merged; contact-sheet QA utility started

- PR #75 CI passed and was merged to main as `faacfbe097b1ac933052de9e6a7070d5fa9d6d28`. It detects trailing silence with an unmatched final `silence_start` by closing it at EOF.
- Started a reusable FFmpeg contact-sheet CLI on `feat/media-qa-contact-sheet`: samples frames at configurable intervals, creates a JPEG grid and supports interval/columns/width/output options.
- Added unit tests for grid layout and option validation. CI is pending; no real MP4 contact sheet has been generated/inspected in this session yet.


## 2026-11-19 — Contact-sheet CLI merged (PR #76)

- PR #76 https://github.com/DarkonLikesCoffee/ai-video-studio/pull/76 merged by squash as `712b5b864a437f87501a735bfb718293abe9ad62`.
- CI run #44516361047 passed after fixing invalid TypeScript escaping in the CLI output strings. The initial run failed at `scripts/qa-contact-sheet.ts` lines 53–59; the failure was diagnosed from logs, corrected in commit `c1f19f153af097ca8f0f47158476aa72ef26c92e`, and the final CI passed.
- The CLI uses FFprobe to obtain duration and FFmpeg to sample frames into a JPEG grid. Options include interval, columns, thumbnail width and output path. Unit tests cover grid calculation and validation.
- Post-merge main CI run #44516765269 is running; check its result before considering the merge fully verified.
- No real MP4 contact sheet has been generated/visually inspected yet. This is implemented tooling, not completed rendered-video QA.
- Next: verify post-merge main CI; then use the contact-sheet CLI plus existing `qa:media` report on an actual benchmark MP4 and record the artifact/evidence. Improve automation only after validating this real workflow.


## 2026-11-19 — VALORANT v4 real-render media QA and contact-sheet inspection

- PR #77 docs reconciliation merged as `93cec7fec2a4c8917bb6c231519b75181fb54d48`; its CI #44517012780 and post-merge main CI #44517175453 passed.
- Retrieved render run #44485488551 artifact #14511125907 (`valorant-immortal-decision-making-v4.mp4`, 46.7 MB) and its bundled QA report. The MP4 is 47.856s container duration, 1920×1080, 30fps H.264 video and AAC stereo audio at 96kHz. Video stream duration is 47.733s; measured audio/video duration drift is 0.123s.
- QA report: passed; no detected silence intervals, frozen intervals or black-frame intervals. Integrated loudness was -16.0 LUFS. No true-peak reading was present in this older render report, so true peak is not verified for this artifact. Audio was measured, not listened to.
- Generated a 5-second contact sheet (10 sampled frames; 4 columns) and visually inspected it. It shows real gameplay clips under repeated large centered headline overlays. Frame samples indicate composition/framing repetition and text dominance; this is a review finding, not a continuous-motion analysis.
- Contact-sheet image is retained in the current work environment at `/mnt/data/valorant-v4-qa/contact-sheet.jpg`; MP4/QA ZIP at `/mnt/data/valorant-v4-artifact.zip`. These are session artifacts, not repository assets.
- This completes one real-artifact contact-sheet/QA trial, but not full creative acceptance: no full-timeline playback or audio listening occurred, and sparse samples cannot verify motion continuity or shot timing.
- Next: turn the contact-sheet workflow into repeatable evidence/acceptance (including audio listening and true-peak coverage on a fresh render), then prioritize a production change that reduces repetitive text-overlay compositions instead of adding more QA infrastructure.


## 2026-11-19 — Contact-sheet evidence report (PR preparation)

- Added a pure helper to calculate exact sample timestamps, matching the contact-sheet interval/count logic (including short clips and non-multiple durations).
- Extended the CLI with optional `--report report.json`. The JSON evidence report records schema version, input path, duration, frame count, grid rows, exact sampled timestamps, selected options, contact-sheet output path and generator name. Report output is optional; existing CLI use remains unchanged.
- Added unit coverage for timestamp sequence, short clips and invalid intervals. CI is pending; do not claim tests pass until workflow confirms.
- Goal: make sparse visual inspection repeatable and reviewable without pretending it replaces continuous playback or creative QA.

## 2026-11-19 — Visual strategy alternatives report (PR pending)

- Added `scripts/storyboard-strategy.ts` and `npm run storyboard:strategy`, a report-only command that summarizes storyboard visual-method distribution and turns existing deterministic QA signals into shot-specific production alternatives.
- Alternatives are concrete options (e.g. footage, physical/3D demonstration, macro detail, before/after, motivated camera choices) rather than generic "add variety" advice. The report does not modify the plan or claim semantic understanding.
- Added regression tests for method counts, actionable shot alternatives and explicit report limitations.
- Branch: `feat/storyboard-visual-strategy-report`. The first CI run found one assertion mismatch (the recommendation wording omitted the exact phrase expected by the test); TypeScript typecheck passed. Wording was corrected in commit b95bd5f. Local test execution was not possible because the container could not resolve github.com; rerun CI is in progress.

## 2026-11-19 — PR #81 merged; strategy report JSON extension underway

- PR #81 merged at `f621b018facaa1f37ed48d34d35d342fe788b32`. Branch CI passed and post-merge main CI passed.
- `storyboard:strategy` currently emits Markdown by default. New branch `feat/storyboard-strategy-json` adds a versioned JSON output envelope with `schemaVersion`, `reportType`, `planTitle`, the full report payload, and `generatedBy`.
- CLI adds `--json`; optional file output remains supported, enabling future agent/workflow consumption without scraping Markdown.
- Regression test validates JSON envelope and report content. CI pending.


## 2026-11-19 — PR #82 merged; state docs reconciliation

- PR #82 `Add machine-readable storyboard strategy reports` merged by squash to main as `25e946045f00764142fb26c9c8e305bdd511e8c5`.
- PR CI run #44520734383 passed for head `b12bd9cf6ff06442fa6ef91e82bd53f720e5b8ec`; post-merge main CI run #44521207902 passed for merge commit.
- Added `--json` to `storyboard:strategy`, producing a versioned envelope while retaining Markdown default.
- Reconciled PROJECT_STATE's commit snapshot and fixed an earlier escaped-newline formatting artifact in the strategy-report section.
- Next: examine the existing `storyboard:revision` artifact workflow before designing any integration; avoid duplicating the critic's existing suggestions.


## 2026-11-19 — Render contact-sheet evidence integration (PR preparation)

- Added a render-workflow step after media QA to create a 5-second contact sheet (4 columns, 320px thumbnails) and a JSON evidence report using the existing `qa:contact-sheet` CLI.
- Expanded the render artifact to include both evidence files in addition to MP4, credits and media-QA JSON. This avoids manual contact-sheet generation for future GitHub Actions renders.
- No render has been run with this workflow change yet; validation is pending CI. Contact sheets remain sparse review evidence and do not replace full playback or audio listening.
