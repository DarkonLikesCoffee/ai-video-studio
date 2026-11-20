# Skill: Automated Media QA

## Purpose
Run measurable checks on the rendered media artifact, independently of render success. This tool is a first-pass technical gate, not semantic or creative approval.

## Usage
```bash
npm run qa:media -- render-output/video.mp4
```
The command writes a sidecar `video.qa.json` unless a report path is supplied.

## Checks
- Uses ffprobe to report container duration, file size, bitrate, video/audio streams, codecs, resolution, frame rate, frame count when available, audio sample rate and channel count.
- Reports stream start times and signed audio/video start offset when both stream timestamps are available. Positive means audio starts later; negative means it starts earlier. Offsets over 0.5 seconds fail by default; the report builder threshold is configurable.
- Uses FFmpeg silencedetect to locate sustained low-level audio intervals (default -50 dB, minimum 0.75 s).
- Uses FFmpeg ebur128 to include loudness measurements in diagnostic output.
- Uses FFmpeg freezedetect to locate extended frame freezes (default 1.5 s).
- Uses FFmpeg blackdetect to locate sustained black frames (default 0.5 s).
- Reports intervals with timestamps and thresholds for review.

## Real-media integration tests

- `tests/media-qa-ffmpeg.integration.test.ts` generates a moving-pattern MP4 with delayed audio and checks the actual `inspectMedia` pipeline for an A/V start-offset error without conflating it with duration drift.
- `tests/media-qa-silence.integration.test.ts` generates real MP4 fixtures with moderate and excessive silence and verifies warning/failure severity, interval measurement and clean A/V timing.
- `tests/media-qa-video-intervals.integration.test.ts` generates real MP4s with frozen or black middle segments and verifies warning/pass versus excessive/error behavior, while checking unrelated silence and A/V timing measurements remain clean.
- These tests are part of `npm test`. They skip if FFmpeg/FFprobe are unavailable locally. CI must install and verify both binaries before the test step; placing tool setup after `npm test` causes the integration tests to be skipped rather than validated.

## Interpretation
- Missing audio/video stream or invalid duration is a hard failure.
- Audio/video duration differences above 0.5 seconds and start offsets above 0.5 seconds are hard failures by default.
- Silence, freeze and black intervals are warnings or errors according to their duration thresholds; intentional pauses, fades and black transitions may be valid. Compare each timestamp with the production plan and actual rendered media.
- The report does not understand story, asset relevance, shot variety, captions, narration correctness or whether silence is intentional.
- Measurements are not a substitute for listening or watching the video.
- Never mark a video creatively accepted from this report alone.

## Limitations
- Start-time offset is measured only when ffprobe reports `start_time` for both the first video and audio streams.
- A matching stream start time does not prove that the narration or sound is semantically synchronized to picture events. It only checks the initial timestamp offset and stream durations.
