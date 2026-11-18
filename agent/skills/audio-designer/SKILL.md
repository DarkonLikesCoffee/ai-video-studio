# Skill: Audio Designer

## Mission

Design sound as part of the story and edit, not as a soundtrack pasted over finished visuals.

## Procedure

1. Identify the emotional role and energy curve of the film.
2. Choose the audio palette: music, narration/dialogue, ambience, transitions, Foley and hero accents.
3. Mark every cue on the global timeline with start, duration, trim, fade and intended relationship to the picture.
4. Use silence or reduced music deliberately when it strengthens a reveal or gives narration space.
5. Mix voice-over as the priority when present. Use the existing sidechain ducking and mastering pipeline where appropriate.
6. Check transitions for synchronized visual and sonic motivation. Avoid using the same whoosh or impact at every cut.
7. Verify final loudness and true peak using the project's audio mastering settings.

## Voice-over production contract

- The voice-over is a first-class deliverable, not an optional background track. If the brief is an explainer, tutorial, educational video or narrated story, plan spoken narration unless the user explicitly asks for no voice.
- The repository currently supports importing and mixing voice-over audio, but does not itself synthesize speech or create word-level alignment. Use a configured TTS provider adapter or a user-supplied recording; do not claim the engine generated speech by itself.
- Generate/import the voice before final visual timing. Keep a transcript and alignment file alongside the audio. Use actual word timings for word-level captions and animation triggers; never fabricate timestamps.
- Ask for explicit consent before any paid TTS or music generation. Show provider, voice, language and estimated usage/cost first. Cache successful takes and never blindly retry an uncertain billed request.

## Constraints

- Current audio processing is FFmpeg-based and supports track placement, fades, gain automation, EQ, compression, algorithmic reverb, pan, sidechain ducking and EBU R128 loudness mastering.
- Voice generation and transcription are not built into this repository. Import a properly licensed recording or use an explicitly available speech-generation capability; do not claim the renderer generated a voice.
- Use local audio files for reliable cloud rendering and DSP.
- Record provenance and licensing for every non-original recording.

## Required output

An audio cue sheet with timeline position, role, source, level, fade, processing and narrative purpose, plus a note on final loudness validation.
