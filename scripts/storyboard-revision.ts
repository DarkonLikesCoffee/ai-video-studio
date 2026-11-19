import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { critiqueStoryboard } from "./storyboard-critic";
import { validateProductionPlan } from "./validate-production-plan";
import { analyzeStoryboardRisks } from "./storyboard-qa";

export type StoryboardRevisionEdit = {
  shotId: string;
  changeNote: string;
  fields: Record<string, unknown>;
};

export type StoryboardRevisionArtifact = {
  schemaVersion: 1;
  sourcePlanPath: string;
  sourcePlanSha256: string;
  sourcePlanText: string;
  sourcePlan: unknown;
  suggestions: Array<{ id: string; selected: boolean; item: ReturnType<typeof critiqueStoryboard>[number] }>;
  edits: StoryboardRevisionEdit[];
  validation: null | { valid: boolean; errors: string[]; warnings: string[] };
};

const sha256 = (content: string): string => createHash("sha256").update(content).digest("hex");

export const createStoryboardRevision = (sourcePath: string, sourceContent: string): StoryboardRevisionArtifact => {
  const sourcePlan = JSON.parse(sourceContent) as unknown;
  const critique = critiqueStoryboard(sourcePlan);
  return {
    schemaVersion: 1,
    sourcePlanPath: sourcePath,
    sourcePlanSha256: sha256(sourceContent),
    sourcePlanText: sourceContent,
    sourcePlan,
    suggestions: critique.map((item, index) => ({ id: `suggestion-${String(index + 1).padStart(3, "0")}`, selected: false, item })),
    edits: [],
    validation: null,
  };
};

export const applyStoryboardRevisionEdits = (artifact: StoryboardRevisionArtifact): unknown => {
  const plan = structuredClone(artifact.sourcePlan) as Record<string, unknown>;
  if (!Array.isArray(plan.shots)) throw new Error("Source plan has no shots array");
  const shots = plan.shots as Array<Record<string, unknown>>;
  for (const edit of artifact.edits) {
    const shot = shots.find((candidate) => candidate.id === edit.shotId);
    if (!shot) throw new Error(`Edit references unknown shot ID: ${edit.shotId}`);
    for (const [field, value] of Object.entries(edit.fields)) {
      shot[field] = value;
    }
  }
  return plan;
};

export const validateStoryboardRevision = (artifact: StoryboardRevisionArtifact) => {
  const revisedPlan = applyStoryboardRevisionEdits(artifact);
  const errors = validateProductionPlan(revisedPlan);
  const warnings = analyzeStoryboardRisks(revisedPlan).map((finding) => `${finding.code}: ${finding.message}`);
  return { valid: errors.length === 0, errors, warnings, revisedPlan };
};

const run = async (): Promise<void> => {
  const [command, input, output] = process.argv.slice(2);
  try {
    if (command === "init") {
      if (!input || !output) throw new Error("Usage: npm run storyboard:revision -- init <production-plan.json> <revision.json>");
      const source = await readFile(input, "utf8");
      const artifact = createStoryboardRevision(input, source);
      await writeFile(output, JSON.stringify(artifact, null, 2) + "\n", "utf8");
      process.stdout.write(`Revision artifact created: ${output} (source preserved; ${artifact.suggestions.length} suggestions)\n`);
      return;
    }
    if (command === "apply" || command === "validate") {
      if (!input || (command === "apply" && !output)) throw new Error(command === "apply"
        ? "Usage: npm run storyboard:revision -- apply <revision.json> <revised-plan.json>"
        : "Usage: npm run storyboard:revision -- validate <revision.json>");
      const artifact = JSON.parse(await readFile(input, "utf8")) as StoryboardRevisionArtifact;
      const source = await readFile(artifact.sourcePlanPath, "utf8");
      if (sha256(source) !== artifact.sourcePlanSha256 || sha256(artifact.sourcePlanText) !== artifact.sourcePlanSha256) throw new Error("Source plan changed or embedded source text was altered since artifact creation; create a new revision artifact to avoid silently overwriting newer work.");
      if (JSON.stringify(JSON.parse(artifact.sourcePlanText)) !== JSON.stringify(artifact.sourcePlan)) throw new Error("Embedded source plan object does not match the preserved source text.");
      const result = validateStoryboardRevision(artifact);
      artifact.validation = { valid: result.valid, errors: result.errors, warnings: result.warnings };
      await writeFile(input, JSON.stringify(artifact, null, 2) + "\n", "utf8");
      if (command === "apply") {
        if (!result.valid) {
          process.stderr.write("Revised plan has validation errors; output was not written. Fix the edits and retry.\n");
          process.exitCode = 1;
          return;
        }
        await writeFile(output, JSON.stringify(result.revisedPlan, null, 2) + "\n", "utf8");
        process.stdout.write(`Revised plan written: ${output}\n`);
      } else {
        process.stdout.write(`Revision validation: ${result.valid ? "PASS" : "FAIL"}; ${result.errors.length} errors; ${result.warnings.length} warnings\n`);
      }
      if (!result.valid) process.exitCode = 1;
      return;
    }
    throw new Error("Usage: npm run storyboard:revision -- <init|apply|validate> ...");
  } catch (error) {
    process.stderr.write(`Storyboard revision failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
