import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { AudioTrack, VideoProject } from "../packages/video-engine/src/project";
import { getProjectDurationInFrames, validateProjectDefinition } from "../packages/video-engine/src/project";
import { buildNarrationSubtitles, type NarrationAlignedWord, type NarrationSubtitleOptions } from "../packages/video-engine/src/narration";

const projectArg = process.argv[2];
const configArg = process.argv[3];
const alignmentArg = process.argv[4];
if (!projectArg || !configArg || !alignmentArg) {
  console.error("Usage: npm run narration:apply -- <project.json> <narration.json> <narration-alignment.json>");
  process.exit(2);
}

const projectPath = resolve(projectArg);
const configPath = resolve(configArg);
const alignmentPath = resolve(alignmentArg);
const projectDirectory = dirname(projectPath);
const project = JSON.parse(await readFile(projectPath, "utf8")) as VideoProject;
const config = JSON.parse(await readFile(configPath, "utf8")) as {
  subtitle?: NarrationSubtitleOptions;
  speaker?: string;
};
const alignment = JSON.parse(await readFile(alignmentPath, "utf8")) as {
  schemaVersion?: number;
  durationSeconds?: number;
  words?: NarrationAlignedWord[];
};

if (project.composition.id !== "ProjectVideo") {
  throw new Error("Generated narration can only be applied to a ProjectVideo project.");
}
if (alignment.schemaVersion !== 1 || !Number.isFinite(alignment.durationSeconds) ||
    !Array.isArray(alignment.words) || alignment.words.length === 0) {
  throw new Error("Narration alignment file is missing valid duration or word timestamps.");
}

const narrationAsset = resolve(projectDirectory, "assets/audio/narration.wav");
await access(narrationAsset);
const fps = project.composition.fps;
const projectDurationInFrames = getProjectDurationInFrames(project);
const narrationDurationInFrames = Math.ceil(alignment.durationSeconds! * fps);
if (narrationDurationInFrames > projectDurationInFrames) {
  throw new Error(
    `Narration is ${alignment.durationSeconds!.toFixed(2)}s but the project is only ${(projectDurationInFrames / fps).toFixed(2)}s. ` +
    "Extend the storyboard; the narration will not be sped up or cut off automatically."
  );
}

const existingTracks = project.audioTracks ?? [];
if (existingTracks.some((track) => track.role === "voiceover")) {
  throw new Error("This project already has a voiceover track. Remove it before adding generated narration.");
}
const voiceTrackId = "generated-narration";
const voiceTrack: AudioTrack = {
  id: voiceTrackId,
  role: "voiceover",
  src: "assets/audio/narration.wav",
  startInFrames: 0,
  durationInFrames: narrationDurationInFrames,
  volume: 1,
  preservePitch: true,
  loop: false,
};
const audioTracks: AudioTrack[] = [
  ...existingTracks.map((track) => track.role === "music"
    ? {
        ...track,
        ducking: {
          ...(track.ducking ?? {}),
          sidechainTrackIds: [...new Set([...(track.ducking?.sidechainTrackIds ?? []), voiceTrackId])],
          thresholdDb: track.ducking?.thresholdDb ?? -28,
          ratio: track.ducking?.ratio ?? 7,
          attackMs: track.ducking?.attackMs ?? 20,
          releaseMs: track.ducking?.releaseMs ?? 280,
        },
      }
    : track),
  voiceTrack,
];

const subtitleOptions: NarrationSubtitleOptions = {
  ...(config.subtitle ?? {}),
  ...(config.speaker ? { speaker: config.speaker } : {}),
};
const generatedSubtitles = buildNarrationSubtitles(
  alignment.words,
  fps,
  projectDurationInFrames,
  subtitleOptions,
);
const existingSubtitleIds = new Set((project.subtitles ?? []).map((cue) => cue.id));
for (const cue of generatedSubtitles) {
  if (existingSubtitleIds.has(cue.id)) {
    throw new Error(`Generated subtitle ID conflicts with an existing cue: ${cue.id}`);
  }
}

const narratedProject: VideoProject = {
  ...project,
  audioTracks,
  subtitles: [...(project.subtitles ?? []), ...generatedSubtitles],
};
const validationErrors = validateProjectDefinition(narratedProject);
if (validationErrors.length > 0) {
  throw new Error("Generated narrated project failed validation:\n" + validationErrors.join("\n"));
}

const outputPath = resolve(projectDirectory, ".narrated-project.json");
await writeFile(outputPath, JSON.stringify(narratedProject, null, 2) + "\n", "utf8");
console.log(`Applied generated voice-over and ${generatedSubtitles.length} timed caption cues.`);
console.log(`Narrated project: ${outputPath}`);
