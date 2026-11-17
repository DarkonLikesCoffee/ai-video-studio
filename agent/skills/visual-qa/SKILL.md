# Skill: Visual QA and Iteration

## Mission

Judge the actual rendered video as an editor, cinematographer, motion designer and audience member. Passing CI is necessary but insufficient.

## Technical inspection

- Confirm MP4 exists and can be decoded from beginning to end.
- Check resolution, FPS, frame count, duration, video/audio codecs and audio stream presence.
- Check for missing media, black frames, corrupted frames, clipping, unexpected freeze frames and abrupt audio endings.
- Listen to the full audio or representative sections; inspect loudness/peaks when tools are available.

## Visual inspection

1. Extract a contact sheet at regular intervals (typically 1 frame per second for short videos).
2. Extract keyframes at every shot boundary and at the most important action/reveal moments.
3. Inspect the images. Do not infer visual quality from source code or render logs.
4. Watch the complete MP4 when playback is available. Contact sheets cannot reveal bad motion, timing, stutter or audio sync.
5. Evaluate:
   - Does the opening hook the intended audience?
   - Is the message clear without reading the production notes?
   - Does every shot change meaningfully over time?
   - Is there visual variety in scale, angle, depth, subject placement and movement?
   - Are subjects and products visible, coherent and consistent?
   - Are typography, contrast, safe areas and reading time correct?
   - Do cuts/transitions feel motivated and rhythmically intentional?
   - Does sound support the picture without masking speech?
   - Does the ending deliver a memorable payoff?
6. Compare against the creative brief and acceptance criteria, not personal taste alone.

## Issue triage

For each issue record: timestamp/frame, severity (blocker/major/minor), observable symptom, likely cause, proposed correction and how to verify the fix.

Fix blockers first, then major issues. Prefer a small number of high-impact corrections over random parameter tweaking. Change one coherent set of variables per iteration so improvements can be attributed.

## Acceptance gate

Do not mark a video complete unless:
- All technical checks pass.
- No unresolved blocker or major issue remains.
- The creative acceptance criteria are met.
- The actual rendered MP4 has been visually inspected.
- The final artifact is traceable to the exact source commit and render run.

If it fails, report that it failed and iterate. Never equate a green CI check with professional visual quality.
