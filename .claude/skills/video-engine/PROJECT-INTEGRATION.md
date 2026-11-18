# Integration notes for AI Video Studio

The upstream video-engine skill is vendored under this folder at commit cf35b05a9ecf3e878eff30c9ffaa8a911248d7c5 (MIT; see LICENSE). Keep its source and attribution intact. These notes define how to use it safely in this repository.

## Existing project rules take precedence

- Read the repository root README and agent/README.md first.
- Use this skill for voice-first production methodology, scripts, alignment, timeline planning, sound design and QA.
- The current project uses Remotion 4 workspaces and GitHub Actions. Do not assume upstream CLI commands such as npm run video or npm run saga exist here.
- ProjectVideo is a limited compatibility renderer. For expressive motion design, write a custom Remotion composition in the existing video-engine workspace and register it with the current renderer.
- Existing project types and validation are in packages/video-engine/src/project.ts.

## Voice provider boundary

- No TTS provider or API key is configured by this repository by default.
- Accept a user-supplied narration file or use a separately configured provider adapter.
- Before a paid provider request, show a dry-run and ask for explicit approval. Never infer consent from a general request to make a video.
- If no voice source is available, stop the voice-dependent render and clearly report the blocker. Do not silently produce a music-only video when narration is required.
- Keep the original audio, transcript, word/phrase alignment and provider metadata as separate project assets.

## Asset and rendering boundary

- Keep final render assets local under the project folder and record provenance/license.
- The GitHub Actions render workflow currently generates synthetic audio fixtures and mixes declared audio tracks; it does not generate speech or align words.
- Do not commit secrets or provider credentials. Use GitHub Actions secrets only after the user explicitly configures them.
- Apply the repository's visual QA skill and inspect the actual MP4 before delivery.
