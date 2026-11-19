# AI Video Studio — Agent Production System

This directory defines the operating procedure for an AI agent producing complete videos with this repository. It is an orchestration layer, not a replacement renderer or an autonomous model runtime.

## Production pipeline

1. **Brief** — extract objective, audience, platform, duration, format, constraints and success criteria.
2. **Creative direction** — choose one coherent concept, visual language, narrative arc and emotional progression; decide what the audience will actually see happen.
3. **Storyboard** — plan every shot with purpose, concrete subject/action and visual progression, production method, duration, composition, camera/motion, transitions, text rationale and sound.
4. **Method selection** — choose per shot from verified available methods (footage, generated media, 2D, motion graphics, diagrams, typography, 3D, simulation or hybrid). The method is chosen to serve the story, not applied uniformly.
5. **Asset production** — generate or source the required footage, images, illustrations, 3D elements, voice and sound; record provenance. For supported Spanish/US English narration, a Kokoro ONNX adapter can generate speech and phoneme-derived word timings on the render worker.
6. **Build** — translate the approved plan into a valid `VideoProject` (`projects/<slug>/scene.json`) and local assets.
7. **Render** — submit a unique `render-request.json` and wait for the selected provider.
8. **Visual QA** — inspect the actual MP4, not only CI status; review a contact sheet, keyframes, motion, pacing, audio and technical metadata. Specifically check for slideshow-like repeated layouts, shots without meaningful action/progression, and generic/unmotivated effects.
9. **Iterate** — fix the highest-impact issues, rerender only the target project, and repeat until it passes.
10. **Deliver** — provide the MP4/artifact, a concise change log and known limitations.

## Pre-production storyboard review

Before full production, generate a lightweight HTML planning preview with `npm run storyboard:preview -- <production-plan.json> <output.html>`. It lays out the authored shots in timeline order and exposes their action, progression, visual method, framing, camera, transitions and audio cues. It is not a rendered or animated video and does not inspect assets or semantically approve the story. Use it as a review checkpoint, then revise the plan before asset production/rendering.

## Deterministic storyboard risk review

The `npm run storyboard:qa -- <production-plan.json>` command provides warning-only signals for long shots, static camera holds and repeated adjacent visual method/framing/camera movement. It is a transparent heuristic review aid, not semantic QA or a creative verdict. Do not automatically fail or rewrite a plan from these warnings alone.


## Production intelligence checklist

Before building scenes, the plan must answer:
- What is the audience supposed to understand, feel or do?
- What is the creative thesis and narrative progression?
- What visually happens in each shot? What changes from its start to end?
- Why is this visual method selected for this shot?
- How do framing, camera, subject motion, timing and audio support the shot?
- How does this shot contrast with and connect to its neighbors?
- What capabilities or assets are missing, and how are they honestly handled?

Avoid producing a video by defaulting to title cards, static diagrams, a background image with text, or repeated layouts. Do not add movement or SFX indiscriminately. The production plan is not a renderable project; it must be translated into supported engine capabilities and validated.

## Skills

Use these skill files as focused playbooks. Apply all relevant skills; do not treat them as independent agents that can silently contradict one another.

- `skills/creative-director/SKILL.md`
- `skills/storyboard/SKILL.md`
- `skills/asset-producer/SKILL.md`
- `skills/remotion-producer/SKILL`
- `skills/audio-designer/SKILL.md`
- `skills/visual-qa/SKILL.md`
- `skills/narrated-video-producer/SKILL.md` — mandatory for explainers, educational videos, stories and short-form videos with narration.
- `EXTERNAL_SKILLS.md` — reviewed upstream skill references, installation guidance and license notes.
- `.claude/skills/video-engine/` — vendored MIT video-engine skill and repository-specific integration notes, automatically discoverable by Claude Code.

## Source of truth and boundaries

- The existing Remotion project schema and validator in `packages/video-engine/src/project.ts` are authoritative for what `ProjectVideo` can render. `ProjectVideo` is a compatibility renderer, not the creative ceiling: use a custom Remotion composition when the brief needs richer camera work, kinetic typography, layered footage, complex motion or narration-synchronized scenes.
- Read `README.md` before building. Do not invent engine capabilities or silently add unsupported fields to `scene.json`.
- A storyboard is a production plan, not a renderable project. Keep it separate from `scene.json`.
- Keep source assets inside each project's `assets/` directory. Prefer local, reproducible assets over remote URLs.
- Request generated narration by adding a `narrationPath` pointing to a version-1 narration config under `projects/`. This adapter currently supports Spanish and US English; see the root README. Do not add an existing voice-over track to the same request.
- Never claim an asset was generated, licensed, downloaded, rendered or inspected unless that action actually succeeded.
- Do not use copyrighted characters, logos, music or footage as if they were cleared. Record source, creator, license/permission and any restrictions.
- Never expose API keys, tokens or private user data in project files, prompts, logs or artifacts.

## Autonomy and decision policy

Make ordinary creative and technical decisions without interrupting the user. Ask one concise question only when a missing requirement materially changes the deliverable (for example, the requested product/brand is unknown and must be depicted accurately). Otherwise state sensible assumptions in the brief and proceed.

Do not ask the user whether to merge a PR. Merge only after required tests pass and the final rendered video has been visually inspected and meets the acceptance criteria. If quality fails, revise and rerender.

## Quality principle

A successful render is not necessarily a successful video. CI proves reproducibility and technical validity; visual QA proves whether the result communicates, looks and sounds intentional. For narrated work, the voice track is the timing master: align the actual spoken audio first, then build shots, captions and SFX around it. Do not ship slide-like sequences, repeated static title cards or music-only output when narration is part of the brief. Optimize for the brief and audience, not for the number of effects, scenes or technologies used.

## Expanded deterministic storyboard quality review

The storyboard QA CLI includes warning-only signals for potentially vague visual/action descriptions, progression that lacks explicit Start/Development/End phases, highly similar adjacent visual descriptions and lengthy on-screen copy. Treat these as prompts to rewrite the weakest shots—not hard rules. The heuristics cannot understand narrative intent or judge rendered creative quality.
