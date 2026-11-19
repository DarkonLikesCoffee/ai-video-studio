import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateCreativeBrief } from "./director-brief";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};

export const buildStoryboardDirectorPrompt = (brief: RecordValue): string => {
  const delivery = record(brief.delivery);
  const duration = Number(delivery.durationSeconds);
  const minShots = Math.max(3, Math.ceil(duration / 5));
  const maxShots = Math.max(minShots, Math.floor(duration / 2));
  const briefJson = JSON.stringify(brief, null, 2);
  return [
    "# AI Video Studio — Storyboard Director Handoff",
    "",
    "You are the film director and editor. Convert the supplied Creative Brief into a production-minded, visually specific storyboard. Do not restate the brief; make creative decisions.",
    "",
    "## Non-negotiable creative rules",
    "- Tell a visual story with a clear opening promise, progression, and payoff. Every shot must change the viewer's understanding, emotion, subject, environment, or visual state.",
    "- Do not default to text cards, diagrams, abstract backgrounds, or generic camera movement. Use them only when the subject and story justify them.",
    "- Choose the best visual method shot-by-shot: live-action/stock footage, generated footage, still photography, 2D animation, motion graphics, typography, 3D, simulation, or a hybrid. Be specific and explain the choice through the shot's visual description.",
    "- Make each shot filmable/renderable: describe subject, environment, foreground/background, lighting, composition, action, and what visibly changes over time. Avoid vague adjectives without concrete visual direction.",
    "- Vary shot scale, angle, composition and movement with intent. Avoid repeating the same framing or technique in adjacent shots unless repetition is a deliberate motif.",
    "- Protect the brief's factual constraints and acceptance criteria. Never invent product facts, sources, footage availability, or asset licenses. Mark unknowns as needs.",
    "- Sound is editorial: give each shot a purposeful sound cue/ambience/music change or intentional silence; avoid generic whooshes.",
    "- Respect runtime exactly. Use contiguous shot timing with no gaps/overlaps, start at 0, and end at delivery.durationSeconds. Every boundary must be frame-aligned for the supplied fps.",
    "",
    "## Timing and scope",
    `- Delivery duration: ${duration}s at ${String(delivery.fps)} fps.`,
    `- Target approximately ${minShots}–${maxShots} shots. This is guidance, not a hard limit; justify departures.`,
    "- Build a coherent sequence, not a checklist that mechanically assigns one emotional-arc item to each shot.",
    "- Ensure the first shot creates curiosity or tension, the middle develops/reframes/escalates, and the final shot resolves the promise. Adapt this structure to the format.",
    "",
    "## Output contract",
    "Return ONLY valid JSON, no Markdown fences, using this exact top-level shape:",
    `{
  "schemaVersion": 1,
  "id": "lowercase-slug",
  "title": "Storyboard title",
  "delivery": { "durationSeconds": ${duration}, "width": ${delivery.width}, "height": ${delivery.height}, "fps": ${delivery.fps}, "format": "mp4" },
  "creativeDirection": {
    "objective": "string",
    "audience": "string",
    "concept": "string",
    "visualSystem": { "palette": ["string"], "typography": "string", "composition": "string", "lighting": "string", "texture": "string" },
    "motionLanguage": "string",
    "soundDirection": "string"
  },
  "shots": [{
    "id": "shot-01",
    "startSeconds": 0,
    "durationSeconds": 3,
    "narrativeBeat": "hook|setup|context|development|escalation|reveal|payoff|cta|transition|pause",
    "purpose": "why this shot exists",
    "visual": "specific scene and subject description",
    "visualMethod": "chosen production method",
    "action": "visible subject action",
    "visualProgression": "what changes from start to end",
    "framing": "shot size, angle and composition",
    "cameraMovement": "motivated movement or static",
    "onScreenText": "optional short copy",
    "transition": "edit into next shot",
    "audio": "sound/ambience/music/intentional silence",
    "assets": [],
    "engineApproach": "practical implementation notes"
  }],
  "acceptanceCoverage": [{
    "criterion": "Exact criterion text copied from the Creative Brief",
    "shotIds": ["shot-01"],
    "rationale": "Specific visible evidence in the referenced shot(s)"
  }]
}`,
    "",
    "## Required self-review before returning JSON",
    "- Recalculate shot timing and total runtime; confirm frame alignment.",
    "- Remove shots that merely repeat information or exist only to fill time.",
    "- Check the sequence for meaningful visual progression, strong visual specificity and shot variety.",
    "- Check that no unsupported facts or assets are assumed available.",
    "- Include exactly one acceptanceCoverage entry per Creative Brief acceptance criterion. Copy the criterion text verbatim, reference one or more existing shot IDs, and provide a specific visual rationale. Do not omit or invent criteria.",
    "- Make production notes honest: distinguish asset needs from assets already available.",
    "",
    "## Creative Brief (source of truth)",
    "",
    "```json",
    briefJson,
    "```",
    ""
  ].join("\n");
};

const main = async (): Promise<void> => {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input) {
    process.stderr.write("Usage: npm run director:storyboard-prompt -- <creative-brief.json> [handoff.md]\n");
    process.exitCode = 2;
    return;
  }
  try {
    const brief = JSON.parse(await readFile(input, "utf8")) as unknown;
    const errors = validateCreativeBrief(brief);
    if (errors.length) {
      process.stderr.write(errors.map((error) => `- ${error}`).join("\n") + "\n");
      process.exitCode = 1;
      return;
    }
    const prompt = buildStoryboardDirectorPrompt(brief as RecordValue);
    if (output) await writeFile(output, prompt + "\n", "utf8");
    else process.stdout.write(prompt + "\n");
  } catch (error) {
    process.stderr.write(`Could not build storyboard handoff: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
};
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
