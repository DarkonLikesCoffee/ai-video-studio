import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export type StoryboardRiskCode =
  | "LONG_SHOT"
  | "STATIC_HOLD"
  | "REPEATED_VISUAL_METHOD"
  | "REPEATED_FRAMING"
  | "REPEATED_CAMERA_MOVEMENT";

export type StoryboardRiskFinding = {
  code: StoryboardRiskCode;
  severity: "warning";
  shotIds: string[];
  message: string;
};

type ShotLike = Record<string, unknown>;
type PlanLike = Record<string, unknown> & { shots?: unknown };

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";

const getShots = (plan: unknown): ShotLike[] => {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return [];
  const shots = (plan as PlanLike).shots;
  return Array.isArray(shots) ? shots.filter((shot): shot is ShotLike => !!shot && typeof shot === "object" && !Array.isArray(shot)) : [];
};

const getShotId = (shot: ShotLike, index: number): string =>
  typeof shot.id === "string" && shot.id.trim() ? shot.id : `shot-${index + 1}`;

const repeatedAdjacent = (
  shots: ShotLike[],
  field: "visualMethod" | "framing" | "cameraMovement",
  minimumRun: number,
  code: StoryboardRiskCode,
  label: string,
): StoryboardRiskFinding[] => {
  const findings: StoryboardRiskFinding[] = [];
  let runStart = 0;
  while (runStart < shots.length) {
    const value = normalize(shots[runStart]?.[field]);
    if (!value) {
      runStart += 1;
      continue;
    }
    let runEnd = runStart + 1;
    while (runEnd < shots.length && normalize(shots[runEnd]?.[field]) === value) runEnd += 1;
    if (runEnd - runStart >= minimumRun) {
      findings.push({
        code,
        severity: "warning",
        shotIds: shots.slice(runStart, runEnd).map(getShotId),
        message: `Adjacent shots repeat the same ${label} (${runEnd - runStart} shots). Review whether the repetition is intentional.`,
      });
    }
    runStart = runEnd;
  }
  return findings;
};

/**
 * Deterministic storyboard heuristics. These are review prompts, not a semantic
 * quality score and never prove that a shot or sequence is creatively weak.
 */
export const analyzeStoryboardRisks = (plan: unknown): StoryboardRiskFinding[] => {
  const shots = getShots(plan);
  const findings: StoryboardRiskFinding[] = [];

  shots.forEach((shot, index) => {
    const duration = Number(shot.durationSeconds);
    const id = getShotId(shot, index);
    if (Number.isFinite(duration) && duration >= 8) {
      findings.push({
        code: "LONG_SHOT",
        severity: "warning",
        shotIds: [id],
        message: `Shot lasts ${duration}s (8s or longer). Review visual development and pacing; long shots can be intentional.`,
      });
    }

    const camera = normalize(shot.cameraMovement);
    if (Number.isFinite(duration) && duration >= 5 && /\b(static|stationary|locked[- ]off|no movement|still camera|fixed camera)\b/.test(camera)) {
      findings.push({
        code: "STATIC_HOLD",
        severity: "warning",
        shotIds: [id],
        message: `Shot describes a static camera for ${duration}s. Review whether the hold is motivated and whether the visual itself develops.`,
      });
    }
  });

  findings.push(...repeatedAdjacent(shots, "visualMethod", 3, "REPEATED_VISUAL_METHOD", "visual method"));
  findings.push(...repeatedAdjacent(shots, "framing", 2, "REPEATED_FRAMING", "framing"));
  findings.push(...repeatedAdjacent(shots, "cameraMovement", 3, "REPEATED_CAMERA_MOVEMENT", "camera movement"));

  return findings;
};

const runCli = async (): Promise<void> => {
  const inputPath = process.argv[2];
  if (!inputPath) {
    process.stderr.write("Usage: npm run storyboard:qa -- <production-plan.json>\n");
    process.exitCode = 2;
    return;
  }

  try {
    const plan: unknown = JSON.parse(await readFile(inputPath, "utf8"));
    const findings = analyzeStoryboardRisks(plan);
    if (findings.length === 0) {
      process.stdout.write(`No deterministic storyboard-risk patterns detected: ${inputPath}\n`);
      process.stdout.write("This does not replace creative or visual review.\n");
      return;
    }
    process.stdout.write(`Storyboard risk review: ${inputPath}\n`);
    for (const finding of findings) {
      process.stdout.write(`- [${finding.code}] ${finding.shotIds.join(", ")}: ${finding.message}\n`);
    }
    process.stdout.write(`\n${findings.length} warning(s). Warnings do not fail production-plan validation.\n`);
    process.stdout.write("These deterministic signals do not judge story meaning or prove poor quality.\n");
  } catch (error) {
    process.stderr.write(`Could not analyze storyboard: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
