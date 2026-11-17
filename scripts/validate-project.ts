import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { isRemoteMediaUrl, validateProjectDefinition } from "../packages/video-engine/src/project";

const input = process.argv[2];
if (!input) {
  console.error("Usage: tsx scripts/validate-project.ts <scene.json>");
  process.exit(2);
}

const projectPath = resolve(input);
let project: unknown;
try {
  project = JSON.parse(await readFile(projectPath, "utf8")) as unknown;
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
  scenes?: Array<{ durationInFrames: number; media?: { src: string }; mediaLayers?: Array<{ src: string }> }>;
};
const durationInFrames = metadata.composition.id === "ProjectVideo"
  ? metadata.scenes?.reduce((total, scene) => total + scene.durationInFrames, 0) ?? 0
  : metadata.composition.durationInFrames ?? 0;

if (metadata.composition.id === "ProjectVideo") {
  const projectDirectory = await realpath(dirname(projectPath));
  for (const [index, scene] of (metadata.scenes ?? []).entries()) {
    const mediaItems = scene.mediaLayers ?? (scene.media ? [scene.media] : []);
    for (const [layerIndex, media] of mediaItems.entries()) {
      const source = media.src;
      if (!source || isRemoteMediaUrl(source)) continue;

      try {
        const assetPath = await realpath(resolve(projectDirectory, source));
        if (!assetPath.startsWith(projectDirectory + sep)) {
          throw new Error("asset resolves outside the project directory");
        }
        const assetInfo = await stat(assetPath);
        if (!assetInfo.isFile()) throw new Error("asset is not a file");
      } catch (error) {
        const mediaLabel = scene.mediaLayers ? `mediaLayers[${layerIndex}].src` : "media.src";
        console.error(`Project asset validation failed for scenes[${index}].${mediaLabel} (${source}):`, error);
        process.exit(1);
      }
    }
  }
}

console.log(`Valid project: ${metadata.title} — ${durationInFrames} frames`);
