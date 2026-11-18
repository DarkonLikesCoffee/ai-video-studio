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
- Uses FFmpeg silencedetect to locate sustained low-level audio intervals (default -50 dB, minimum 0.75 s).
- Uses FFmpeg ebur128 to include loudness measurements in diagnostic output.
- Uses FFmpeg freezedetect to locate extended frame freezes (default 1.5 s).
- Uses FFmpeg blackdetect to locate sustained black frames (default 0.5 s).
- Reports intervals with timestamps and thresholds for review.

## Interpretation
- Missing audio/video stream or invalid duration is a hard failure.
- Silence, freeze and black intervals are warnings, not automatic failures: intentional pauses, fades and black transitions may be valid. Compare each timestamp with the production plan and actual rendered media.
- The report does not understand story, asset relevance, shot variety, captions, narration correctness or whether silence is intentional.
- Measurements are not a substitute for listening or watching the video.
- Never mark a video creatively accepted from this report alone.
