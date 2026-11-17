import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getProjectDurationInFrames,
  isRemoteMediaUrl,
  isSafeProjectAssetPath,
  validateProjectDefinition,
  type VideoProject
} from "../packages/video-engine/src/project";

const readExample = async (): Promise<VideoProject> =>
  JSON.parse(await readFile(new URL("../projects/examples/three-scene-story/scene.json", import.meta.url), "utf8")) as VideoProject;

test("three-scene example is a valid ProjectVideo project with image and video media", async () => {
  const project = await readExample();
  assert.deepEqual(validateProjectDefinition(project), []);
  assert.equal(project.composition.id, "ProjectVideo");
  assert.equal(project.scenes.length, 3);
  assert.equal(getProjectDurationInFrames(project), 300);
  assert.equal(project.scenes[0]!.media?.type, "image");
  assert.equal(project.scenes[1]!.media?.type, "video");
});

test("project duration is derived from all scene durations", async () => {
  const project = await readExample();
  project.scenes[1]!.durationInFrames = 150;
  assert.equal(getProjectDurationInFrames(project), 330);
});

test("validator rejects duplicate scene IDs", async () => {
  const project = await readExample();
  project.scenes[1]!.id = project.scenes[0]!.id;
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("id must be unique")));
});

test("validator rejects unsupported scene types and invalid colors", async () => {
  const project = await readExample();
  const scene = project.scenes[0] as unknown as { type: string; accentColor: string };
  scene.type = "video";
  scene.accentColor = "purple";
  const errors = validateProjectDefinition(project);
  assert.ok(errors.some((error) => error.includes("type must be title, content, or outro")));
  assert.ok(errors.some((error) => error.includes("accentColor must be a six-digit hex color")));
});

test("validator caps total project duration at 60 seconds", async () => {
  const project = await readExample();
  project.scenes[0]!.durationInFrames = 900;
  project.scenes[1]!.durationInFrames = 900;
  project.scenes[2]!.durationInFrames = 900;
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("total scene duration")));
});

test("local media paths must stay below the project assets directory", () => {
  assert.equal(isSafeProjectAssetPath("assets/connection-map.svg"), true);
  assert.equal(isSafeProjectAssetPath("assets/photos/frame-01.webp"), true);
  assert.equal(isSafeProjectAssetPath("../secret.png"), false);
  assert.equal(isSafeProjectAssetPath("assets/../../secret.png"), false);
  assert.equal(isSafeProjectAssetPath("/assets/photo.png"), false);
  assert.equal(isSafeProjectAssetPath(String.raw`assets\\photo.png`), false);
});

test("remote media sources must use HTTPS and have no embedded credentials", () => {
  assert.equal(isRemoteMediaUrl("https://example.com/clip.mp4"), true);
  assert.equal(isRemoteMediaUrl("http://example.com/clip.mp4"), false);
  assert.equal(isRemoteMediaUrl("https://user:pass@example.com/clip.mp4"), false);
});

test("validator rejects media with unsafe paths or mismatched file types", async () => {
  const project = await readExample();
  project.scenes[0]!.media!.src = "assets/../../outside.svg";
  project.scenes[1]!.media!.src = "https://example.com/poster.png";
  const errors = validateProjectDefinition(project);
  assert.ok(errors.some((error) => error.includes("safe path under assets/")));
  assert.ok(errors.some((error) => error.includes("unsupported extension for video media")));
});

test("validator rejects video playback controls on image media", async () => {
  const project = await readExample();
  const media = project.scenes[0]!.media as unknown as { volume: number };
  media.volume = 0.5;
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("video playback options")));
});
