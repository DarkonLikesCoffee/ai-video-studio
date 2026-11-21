# ORBITAL BLOOM — Audio Cue Sheet

**20-second original stereo soundscape · PCM 48 kHz source · AAC in MP4**  
No voice-over, dialogue or third-party samples.

| Time | Layer | Treatment | Purpose |
|---|---|---|---|
| 00:00–00:20 | Orbital station drone | Continuous low 41 Hz fundamental with restrained upper harmonics and slow stereo drift; natural tail. | Establish the sealed, empty station. |
| 00:01–00:08 | Relay ticks | Sparse high metallic notes with short noise transients, alternating left/right. | Suggest dormant containment equipment and reward macro detail. |
| 00:08–00:09 | Activation impact | Low 48/73 Hz layered hit, short noise burst and controlled decay. | Sync with amber ignition and latch release. |
| 00:08–00:11 | Iris and shell mechanics | Staggered metallic tones and broadband transients with changing pan positions. | Give independent mechanical components tactile weight. |
| 00:12–00:16 | Bloom harmonics | Glassy high-register tones with long decays and wide panning. | Shift from cold machinery to living organic forms. |
| 00:16–00:20 | Resolution | Warm 55/110/165/220 Hz chord, delicate upper chimes and smooth tail. | Support the greenhouse reveal and final resonance. |

## Generation and mix
- `generate-soundscape.mjs` synthesises deterministic 16-bit PCM WAV using Node built-ins.
- GitHub Actions generates the WAV before rendering. It stays in the runner workspace and is embedded by Remotion.
- FFmpeg applies EBU R128 normalisation to the final MP4, retaining video and encoding AAC stereo at 192 kb/s.
- QA checks stream existence, duration, silence, loudness, true peak and A/V timing. Technical measurement does not replace listening.
