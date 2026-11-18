# AI Video Studio — Agent Production System

This directory defines the operating procedure for an AI agent producing complete videos with this repository. It is an orchestration layer, not a replacement renderer or an autonomous model runtime.

## Production pipeline

1. **Brief** — extract objective, audience, platform, duration, format, constraints and success criteria.
2. **Creative direction** — choose one coherent concept, visual language, narrative arc and emotional progression.
3. **Storyboard** — plan every shot with purpose, duration, composition, camera/motion, transitions, text and sound.
4. **Asset production** — generate or source the required footage, images, illustrations, 3D elements, voice and sound; record provenance.
5. **Build** — translate the approved plan into a valid `VideoProject` (`projects/<slug>/scene.json`) and local assets.
6. **Render** — submit a unique `render-request.json` and wait for the selected provider.
7. **Visual QA** — inspect the actual MP4, not only CI status; review a contact sheet, keyframes, motion, pacing, audio and technical metadata.
8. **Iterate** — fix the highest-impact issues, rerender only the target project, and repeat until it passes.
9. **Deliver** — provide the MP4/artifact, a concise change log and known limitations.

## Skills

Use these skill files as focused playbooks. Apply all relevant skills; do not treat them as independent agents that can silently contradict one another.

- `skills/creative-director/SKILL.md`
- `skills/storyboard/SKILL.md`
- `skills/asset-producer/SKILL.md`
- `skills/remotion-producer/SKILL.md`
- `skills/audio-designer/SKILL.md`
- `skills/visual-qa/SKILL.md`
- `skills/narrated-video-producer/SKILL.md` — mandatory for explainers, educational videos, stories and short-form videos with narration.
- `EXTERNAL_SKILLS.md` — reviewed upstream skill references, installation guidance and license notes.

## Source of truth and boundaries

- The existing Remotion project schema and validator in `packages/video-engine/src/project.ts` are authoritative for what `ProjectVideo` can render. `ProjectVideo` is a compatibility renderer, not the creative ceiling: use a custom Remotion composition when the brief needs richer camera work, kinetic typography, layered footage, complex motion or narration-synchronized scenes.
- Read `README.md` before building. Do not invent engine capabilities or silently add unsupported fields to `scene.json`.
- A storyboard is a production plan, not a renderable project. Keep it separate from `scene.json`.
- Keep source assets inside each project's `assets/` directory. Prefer local, reproducible assets over remote URLs.
- Never claim an asset was generated, licensed, downloaded, rendered or inspected unless that action actually succeeded.
- Do not use copyrighted characters, logos, music or footage as if they were cleared. Record source, creator, license/permission and any restrictions.
- Never expose API keys, tokens or private user data in project files, prompts, logs or artifacts.

## Autonomy and decision policy

Make ordinary creative and technical decisions without interrupting the user. Ask one concise question only when a missing requirement materially changes the deliverable (for example, the requested product/brand is unknown and must be depicted accurately). Otherwise state sensible assumptions in the brief and proceed.

Do not ask the user whether to merge a PR. Merge only after required tests pass and the final rendered video has been visually inspected and meets the acceptance criteria. If quality fails, revise and rerender.

## Quality principle

A successful render is not necessarily a successful video. CI proves reproducibility and technical validity; visual QA proves whether the result communicates, looks and sounds intentional. For narrated work, the voice track is the timing master: align the actual spoken audio first, then build shots, captions and SFX around it. Do not ship slide-like sequences, repeated static title cards or music-only output when narration is part of the brief. Optimize for the brief and audience, not for the number of effects, scenes or technologies used.
