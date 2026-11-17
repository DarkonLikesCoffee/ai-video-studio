import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateProjectDefinition } from "../packages/video-engine/src/project";

const input = process.argv[2];
if (!input) {
  console.error("Usage: tsx scripts/validate-project.ts <scene.json>");
  process.exit(2);
}

let project: unknown;
try {
  project = JSON.parse(await readFile(resolve(input), "utf8")) as unknown;
} catch (error) {
  console.error("Could not parse project JSON:", error);
  process.exit(1);
}

const errors = validateProjectDefinition(project);
if (errors.length > 0) {
  console.error("Project validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  process.exit(1);
}

const metadata = project as {
  title: string;
  composition: { id: string; durationInFrames?: number };
  scenes?: Array<{ durationInFrames: number }>;
};
const durationInFrames = metadata.composition.id === "ProjectVideo"
  ? metadata.scenes?.reduce((total, scene) => total + scene.durationInFrames, 0) ?? 0
  : metadata.composition.durationInFrames ?? 0;
console.log(`Valid project: ${metadata.title} — ${durationInFrames} frames`);
