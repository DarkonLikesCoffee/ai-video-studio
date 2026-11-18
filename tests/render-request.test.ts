import assert from "node:assert/strict";
import test from "node:test";
import { validateRenderRequest } from "../scripts/render-request.mjs";

const validProjectRequest = {
  provider: "github-actions",
  projectPath: "projects/demo/scene.json",
  compositionId: "ProjectVideo",
  outputName: "demo-video",
  requestId: "test-001",
};

test("accepts the existing ProjectVideo request format", () => {
  const result = validateRenderRequest(validProjectRequest);
  assert.deepEqual(result.errors, []);
  assert.equal(result.request?.compositionId, "ProjectVideo");
  assert.equal(result.request?.projectPath, "projects/demo/scene.json");
});

test("accepts custom compositions without a project JSON file", () => {
  const result = validateRenderRequest({
    provider: "github-actions",
    compositionId: "CinematicAdBenchmark",
    outputName: "cinematic-ad",
    requestId: "custom-001",
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.request?.projectPath, undefined);
});

test("allows a custom composition to receive JSON props from a project folder", () => {
  const result = validateRenderRequest({
    ...validProjectRequest,
    compositionId: "CinematicAdBenchmark",
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.request?.projectPath, "projects/demo/scene.json");
});

test("requires projectPath for ProjectVideo", () => {
  const result = validateRenderRequest({
    provider: "github-actions",
    compositionId: "ProjectVideo",
    outputName: "demo-video",
    requestId: "test-002",
  });
  assert.ok(result.errors.includes("ProjectVideo requires projectPath."));
});

test("rejects unsafe composition identifiers", () => {
  const result = validateRenderRequest({
    ...validProjectRequest,
    compositionId: "$(touch /tmp/pwned)",
  });
  assert.ok(result.errors.some((error) => error.startsWith("compositionId")));
});

test("rejects paths outside the projects directory and traversal", () => {
  for (const projectPath of ["../secret.json", "packages/video-engine/project.json", "projects/../secret.json"]) {
    const result = validateRenderRequest({ ...validProjectRequest, projectPath });
    assert.ok(result.errors.some((error) => error.startsWith("projectPath")), projectPath);
  }
});

test("rejects malformed provider, output and request identifiers", () => {
  const result = validateRenderRequest({
    ...validProjectRequest,
    provider: "unknown",
    outputName: "../output",
    requestId: "bad request id",
  });
  assert.equal(result.errors.length, 3);
});

test("accepts an optional narration request for ProjectVideo", () => {
  const result = validateRenderRequest({
    ...validProjectRequest,
    narrationPath: "projects/demo/production/narration.json",
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.request?.narrationPath, "projects/demo/production/narration.json");
});

test("rejects narration for custom compositions and unsafe config paths", () => {
  const customComposition = validateRenderRequest({
    ...validProjectRequest,
    compositionId: "CinematicAdBenchmark",
    narrationPath: "projects/demo/production/narration.json",
  });
  assert.ok(customComposition.errors.includes("narrationPath is currently supported only for ProjectVideo."));

  const unsafePath = validateRenderRequest({
    ...validProjectRequest,
    narrationPath: "projects/../private.json",
  });
  assert.ok(unsafePath.errors.some((error) => error.startsWith("narrationPath")));
});
