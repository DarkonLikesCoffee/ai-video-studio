import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const PRODUCTION_STAGES = [
  "brief",
  "direction",
  "storyboard",
  "assets",
  "build",
  "render-ready",
  "frozen",
  "rendered",
  "qa",
  "accepted",
  "delivered",
] as const;

export type ProductionStage = typeof PRODUCTION_STAGES[number];

export type ProductionState = {
  schemaVersion: 1;
  projectId: string;
  stage: ProductionStage;
  updatedAt: string;
  evidence: Partial<Record<ProductionStage, string[]>>;
};

export type StateValidationOptions = {
  expectedProjectId?: string;
  requireEvidence?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateProductionState = (
  value: unknown,
  options: StateValidationOptions = {},
): string[] => {
  const errors: string[] = [];
  if (!isRecord(value)) return ["Production state must be a JSON object."];
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (typeof value.projectId !== "string" || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(value.projectId)) {
    errors.push("projectId must be a lowercase slug (2–64 characters).");
  }
  if (options.expectedProjectId && value.projectId !== options.expectedProjectId) {
    errors.push(`projectId "${String(value.projectId)}" does not match expected project "${options.expectedProjectId}".`);
  }
  if (typeof value.stage !== "string" || !PRODUCTION_STAGES.includes(value.stage as ProductionStage)) {
    errors.push(`stage must be one of: ${PRODUCTION_STAGES.join(", ")}.`);
  }
  if (typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) {
    errors.push("updatedAt must be a valid ISO-compatible timestamp.");
  }
  if (!isRecord(value.evidence)) {
    errors.push("evidence must be an object keyed by production stage.");
  } else {
    for (const [stage, refs] of Object.entries(value.evidence)) {
      if (!PRODUCTION_STAGES.includes(stage as ProductionStage)) {
        errors.push(`evidence contains unknown stage "${stage}".`);
        continue;
      }
      if (!Array.isArray(refs) || refs.length === 0 || refs.some((ref) => typeof ref !== "string" || !ref.trim() || ref.length > 240)) {
        errors.push(`evidence.${stage} must contain one or more non-empty artifact references (maximum 240 characters each).`);
      }
    }
    const currentStage = value.stage;
    if (options.requireEvidence && typeof currentStage === "string" &&
        PRODUCTION_STAGES.includes(currentStage as ProductionStage) &&
        !Array.isArray(value.evidence[currentStage])) {
      errors.push(`evidence for current stage "${currentStage}" is required when --require-evidence is used.`);
    }
    const stageIndex = PRODUCTION_STAGES.indexOf(value.stage as ProductionStage);
    for (let index = 0; index <= stageIndex && index >= 0; index += 1) {
      const completed = PRODUCTION_STAGES[index]!;
      if (options.requireEvidence && !Array.isArray(value.evidence[completed])) {
        errors.push(`evidence for completed stage "${completed}" is missing.`);
      }
    }
  }
  return errors;
};

const run = async (): Promise<void> => {
  const path = process.argv[2];
  const expectedProjectId = process.argv[3];
  const requireEvidence = process.argv.includes("--require-evidence");
  if (!path) {
    process.stderr.write("Usage: tsx scripts/production-state.ts <production-state.json> [expected-project-id] [--require-evidence]\n");
    process.exitCode = 2;
    return;
  }
  try {
    const value: unknown = JSON.parse(await readFile(resolve(path), "utf8"));
    const errors = validateProductionState(value, { expectedProjectId, requireEvidence });
    if (errors.length) {
      process.stderr.write(errors.map((error) => `- ${error}`).join("\n") + "\n");
      process.exitCode = 1;
      return;
    }
    const state = value as ProductionState;
    process.stdout.write(`Production state valid: ${state.projectId} / ${state.stage}\n`);
  } catch (error) {
    process.stderr.write(`Could not validate production state: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await run();
}
