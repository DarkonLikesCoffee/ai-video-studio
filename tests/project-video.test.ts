import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getProjectDurationInFrames, validateProjectDefinition, type VideoProject } from "../packages/video-engine/src/project";

const readExample = async (): Promise<VideoProject> =>
  JSON.parse(await readFile(new URL("../projects/examples/three-scene-story/scene.json", import.meta.url), "utf8")) as VideoProject;

test("three-scene example is a valid ProjectVideo project with image and video media", async () => {
  const project = await readExample();
  assert.deepEqual(validateProjectDefinition(project), []);
  assert.equal(project.composition.id, "ProjectVideo");
  assert.equal(project.scenes.length, 3);
  assert.equal(getProjectDurationInFrames(project), 300);
  assert.equal(project.scenes[0]!.media?.type, "image");
  assert.equal(project.scenes[0]!.media?.source, "public");
  assert.equal(project.scenes[1]!.media?.type, "video");
  assert.equal(project.scenes[1]!.media?.source, "remote");
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

test("validator rejects insecure remote media URLs", async () => {
  const project = await readExample();
  const media = project.scenes[1]!.media as unknown as { src: string };
  media.src = "http://example.com/clip.mp4";
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("public HTTPS URL")));
});

test("validator rejects path traversal in local media", async () => {
  const project = await readExample();
  const media = project.scenes[0]!.media as unknown as { src: string };
  media.src = "assets/../../secrets.png";
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("safe path")));
});

test("validator rejects incompatible local file extensions and playback rates", async () => {
  const project = await readExample();
  const imageMedia = project.scenes[0]!.media as unknown as { src: string };
  const videoMedia = project.scenes[1]!.media as unknown as { playbackRate: number };
  imageMedia.src = "assets/not-an-image.mp4";
  videoMedia.playbackRate = 9;
  const errors = validateProjectDefinition(project);
  assert.ok(errors.some((error) => error.includes("supported image extension")));
  assert.ok(errors.some((error) => error.includes("playbackRate must be between 0.25 and 4")));
});

test("validator rejects private or credentialed remote URLs", async () => {
  const project = await readExample();
  const media = project.scenes[1]!.media as unknown as { src: string };
  media.src = "https://user:password@example.com/clip.mp4";
  assert.ok(validateProjectDefinition(project).some((error) => error.includes("public HTTPS URL")));
});
