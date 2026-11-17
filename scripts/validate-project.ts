import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Project = {
  schemaVersion: number;
  id: string;
  title: string;
  composition: {
    id: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  };
  output: { format: string; codec: string };
};

const input = process.argv[2];
if (!input) {
  console.error("Usage: tsx scripts/validate-project.ts <scene.json>");
  process.exit(2);
}

let project: Project;
try {
  project = JSON.parse(await readFile(resolve(input), "utf8")) as Project;
} catch (error) {
  console.error("Could not parse project JSON:", error);
  process.exit(1);
}

const errors: string[] = [];
if (project.schemaVersion !== 1) errors.push("schemaVersion must equal 1");
if (!project.id?.trim()) errors.push("id is required");
if (!project.title?.trim()) errors.push("title is required");

const composition = project.composition;
if (!composition?.id?.trim()) errors.push("composition.id is required");
if (!Number.isInteger(composition?.width) || composition.width <= 0) errors.push("width must be a positive integer");
if (!Number.isInteger(composition?.height) || composition.height <= 0) errors.push("height must be a positive integer");
if (!Number.isInteger(composition?.fps) || composition.fps < 1 || composition.fps > 60) errors.push("fps must be between 1 and 60");
if (!Number.isInteger(composition?.durationInFrames) || composition.durationInFrames < 1 || composition.durationInFrames > 1800) errors.push("durationInFrames must be between 1 and 1800");
if (project.output?.format !== "mp4") errors.push("output.format must be mp4");

if (errors.length) {
  console.error("Project validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  process.exit(1);
}
console.log(`Valid project: ${project.title} — ${composition.durationInFrames} frames`);
