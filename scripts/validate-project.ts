import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
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
if (errors.length === 0 && typeof project === "object" && project !== null) {
  const scenes = (project as { scenes?: Array<{ media?: { source?: string; src?: string } }> }).scenes ?? [];
  const publicRoot = resolve("packages/video-engine/public");

  for (const [index, scene] of scenes.entries()) {
    const media = scene.media;
    if (media?.source !== "public" || typeof media.src !== "string") continue;

    const assetPath = resolve(publicRoot, media.src);
    const assetRelativePath = relative(publicRoot, assetPath);
    if (assetRelativePath.startsWith(".." + sep) || assetRelativePath === ".." || isAbsolute(assetRelativePath)) {
      errors.push(`scenes[${index}].media.src resolves outside the public assets directory`);
      continue;
    }

    try {
      const details = await stat(assetPath);
      if (!details.isFile()) errors.push(`scenes[${index}].media.src must point to a file`);
    } catch {
      errors.push(`scenes[${index}].media.src file was not found: ${media.src}`);
    }
  }
}

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
const sceneCount = metadata.scenes?.length ?? 1;
console.log(`Valid project: ${metadata.title} — ${sceneCount} scenes, ${durationInFrames} frames`);
