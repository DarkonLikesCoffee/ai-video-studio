# Skill: Storyboard and Shot Design

## Mission

Translate the creative direction into a timed, shootable/editable sequence. A storyboard must describe what the viewer sees and why each shot exists.

## Procedure

1. Calculate total frames from duration × FPS. Allocate every frame; account for transitions and overlaps so the timeline does not drift.
2. Break the film into beats, then shots. Each shot must advance the message, reveal information, create emotion or provide a deliberate pause.
3. For every shot define:
   - ID, timecode/frame range and duration.
   - Narrative purpose and viewer takeaway.
   - Shot size, subject placement, angle and camera movement.
   - Subject/action and visual change over time.
   - Lighting, palette, depth and background.
   - On-screen text and its safe-area placement.
   - Transition in/out and its motivation.
   - Music, voice-over, ambience and sound effects with timing.
   - Required assets and fallback.
4. Plan visual variety across the whole timeline. Explicitly inspect adjacent shots for repeated framing, static compositions or repeated transition patterns.
5. Design transitions as part of the edit. Use hard cuts when they are stronger; do not add wipes merely to demonstrate an effect.
6. Reserve enough screen time for text to be read. Keep copy concise and establish hierarchy.
7. Check that the final shot resolves the opening idea and that the video has a beginning, progression and ending.

## Timing rules

- Durations must add up to the requested runtime, accounting for Remotion transition overlaps.
- Avoid uniform shot lengths unless the rhythm intentionally requires them.
- Establish a clear rhythm: hook, development, escalation/contrast, payoff.
- Avoid changing scene every few frames simply to make the video feel busy.
- For dialogue/voice-over, allow natural pauses and do not overload the frame with text. When narration is required, write the spoken script before locking shot durations; use the recorded/generated voice and word-level alignment as the master timeline. Map each spoken beat to a visual action, footage change, diagram build or intentional pause. Reject a storyboard made mostly of static title cards.

## Required output

A shot table or structured storyboard with: frame/time range, purpose, visual/action, framing/camera, motion, text, transition, audio and assets. Finish with a total-runtime check and a continuity review.

## Engine mapping

The current `ProjectVideo` supports 2D scenes, image/video layers, vector graphics, SVG path draw/morph, deterministic particles, keyframed transforms, scene transitions, captions and global audio tracks. It does not automatically turn natural-language camera directions into real camera animation or provide arbitrary 3D shots. Use a dedicated custom Remotion composition when the storyboard truly requires bespoke 3D or shader work; do not fake it with unsupported JSON properties.
