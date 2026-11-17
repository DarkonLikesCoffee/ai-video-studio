# Skill: Remotion Producer

## Mission

Translate the approved storyboard and asset manifest into a valid, deterministic Remotion project that this repository can render.

## Preflight

- Read the current `README.md` and the project types/validator in `packages/video-engine/src/project.ts`.
- Confirm composition ID, dimensions, FPS and total frame budget.
- Confirm every local media path is under the project's `assets/` folder and exists.
- Confirm all scene, media, graphics, subtitle, particle and audio limits.
- Run `npm run typecheck`, `npm test`, and `npm run validate:project -- <project>/scene.json`.

## Build rules

- Use `ProjectVideo` for work expressible by its supported schema.
- Use a custom Remotion composition only when a genuine capability gap requires it (for example real 3D geometry, custom shaders or procedural camera work). Keep it scoped and reusable.
- Prefer actual visual assets and deliberate compositing over piles of generic vector shapes.
- Use varied shot sizes, subject placement and movement. A single static composition with changing text is not a cinematic sequence.
- Use keyframes with purposeful easing; avoid arbitrary oscillation and constant motion.
- Keep typography legible, aligned to safe areas and consistent with the art direction.
- Use transitions sparingly and motivate each one.
- Place music, voice, ambience and effects on the project timeline. Mix so dialogue remains intelligible and effects do not dominate.
- Do not add dependencies for novelty. Justify every new renderer, package or workflow dependency.
- Keep project JSON as data; keep renderer logic reusable and type-safe.

## Render discipline

- Render only the target project during creative iteration. The main CI workflow should validate legacy projects without rendering every showcase.
- Use a unique render request ID and descriptive output name.
- Do not create duplicate artifacts for unchanged content.
- Preserve reproducibility: pinned package versions, local assets, deterministic animation and explicit render settings.
- Never call a video "finished" based only on a successful build or composition discovery.
