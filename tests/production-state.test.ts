import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTION_STAGES, validateProductionState } from "../scripts/production-state";

const valid = {
  schemaVersion: 1,
  projectId: "lighthouse-repair",
  stage: "assets",
  updatedAt: "2026-11-23T10:00:00.000Z",
  evidence: {
    brief: ["production/creative-brief.md"],
    direction: ["production/creative-direction.md"],
    storyboard: ["production/production-plan.json"],
    assets: ["production/asset-manifest.json"],
  },
};

test("valid production state accepts ordered stages and artifact evidence", () => {
  assert.deepEqual(validateProductionState(valid, { requireEvidence: true }), []);
});

test("production stages are an explicit ordered workflow", () => {
  assert.deepEqual(PRODUCTION_STAGES, [
    "brief", "direction", "storyboard", "assets", "build",
    "render-ready", "frozen", "rendered", "qa", "accepted", "delivered",
  ]);
});

test("production state rejects unknown stages", () => {
  const invalid = { ...valid, stage: "almost-done" };
  assert.ok(validateProductionState(invalid).some((error) => error.includes("stage must be one of")));
});

test("production state rejects malformed or missing evidence", () => {
  const invalid = { ...valid, evidence: { brief: [" "], assets: [] } };
  const errors = validateProductionState(invalid, { requireEvidence: true });
  assert.ok(errors.some((error) => error.includes("evidence.brief")));
  assert.ok(errors.some((error) => error.includes('evidence for completed stage "direction"')));
});

test("production state can be tied to the project it belongs to", () => {
  assert.ok(validateProductionState(valid, { expectedProjectId: "another-project" })
    .some((error) => error.includes("does not match expected project")));
});

test("production state rejects invalid timestamps and unknown evidence keys", () => {
  const invalid = { ...valid, updatedAt: "yesterday", evidence: { ...valid.evidence, mystery: ["file"] } };
  const errors = validateProductionState(invalid);
  assert.ok(errors.some((error) => error.includes("updatedAt")));
  assert.ok(errors.some((error) => error.includes('unknown stage "mystery"')));
});
