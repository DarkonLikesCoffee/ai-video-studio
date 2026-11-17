import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getProjectDurationInFrames, validateProjectDefinition, type VideoProject } from "../packages/video-engine/src/project";

const readExample = async (): Promise<VideoProject> =>
  JSON.parse(await readFile(new URL("../projects/examples/three-scene-story/scene.json", import.meta.url), "utf8")) as VideoProject;

test("three-scene example is a valid ProjectVideo project", async () => {
  const project = await readExample();
  assert.deepEqual(validateProjectDefinition(project), []);
  assert.equal(project.composition.id, "ProjectVideo");
  assert.equal(project.scenes.length, 3);
  assert.equal(getProjectDurationInFrames(project), 300);
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
