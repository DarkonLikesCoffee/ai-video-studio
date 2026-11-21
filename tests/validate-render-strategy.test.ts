import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  extractRegisteredCompositionIds,
  resolveProductionPlanPath,
  validateRenderStrategyAgainstRequest,
} from "../scripts/validate-render-strategy.mjs";
import { COMPOSITION_REGISTRY } from "../scripts/director-compositions";

const rootSource = await readFile(new URL("../packages/video-engine/src/root.tsx", import.meta.url), "utf8");
const registered = extractRegisteredCompositionIds(rootSource);
const request = { compositionId: "ProjectVideo", projectPath: "projects/demo/scene.json" };
const plan = {
  renderStrategy: {
    renderer: "project-video",
    compositionId: "ProjectVideo",
    availability: "registered",
    rationale: "A structured 2D explainer is appropriate.",
    requiredCapabilities: ["layers", "keyframes"],
    fallback: "Build a custom composition if the requested visual language exceeds the schema.",
  },
};

test("composition catalogue entries are all registered in RemotionRoot", () => {
  assert.ok(COMPOSITION_REGISTRY.every((entry) => registered.includes(entry.id)));
});

test("resolves the conventional plan beside a project's scene file", () => {
  assert.equal(resolveProductionPlanPath(request), "projects/demo/production/production-plan.json");
  assert.equal(resolveProductionPlanPath({ compositionId: "MadridTrip" }), undefined);
});

test("accepts an explicitly selected registered composition matching the render request", () => {
  assert.deepEqual(validateRenderStrategyAgainstRequest({ request, plan, registeredCompositionIds: registered }), []);
});

test("rejects a render request that differs from the Director's chosen composition", () => {
  const errors = validateRenderStrategyAgainstRequest({
    request: { ...request, compositionId: "NarratedSkyExplainer" },
    plan,
    registeredCompositionIds: registered,
  });
  assert.ok(errors.some((error) => error.includes("does not match production-plan")));
});

test("rejects a composition proposed as to-be-built until it is implemented and registered", () => {
  const errors = validateRenderStrategyAgainstRequest({
    request,
    plan: { renderStrategy: { ...plan.renderStrategy, availability: "to-be-built" } },
    registeredCompositionIds: registered,
  });
  assert.ok(errors.some((error) => error.includes("to-be-built")));
});

test("rejects a composition ID not registered in RemotionRoot", () => {
  const errors = validateRenderStrategyAgainstRequest({
    request: { ...request, compositionId: "ImaginaryRenderer" },
    plan: { renderStrategy: { ...plan.renderStrategy, compositionId: "ImaginaryRenderer", renderer: "custom-remotion" } },
    registeredCompositionIds: registered,
  });
  assert.ok(errors.some((error) => error.includes("not registered")));
});

test("legacy projects without a production plan still receive composition-registration validation", () => {
  assert.deepEqual(validateRenderStrategyAgainstRequest({ request, plan: undefined, registeredCompositionIds: registered }), []);
});


test("rejects incomplete Director composition decisions", () => {
  const errors = validateRenderStrategyAgainstRequest({
    request,
    plan: { renderStrategy: { renderer: "project-video", compositionId: "ProjectVideo", availability: "registered" } },
    registeredCompositionIds: registered,
  });
  assert.ok(errors.some((error) => error.includes("rationale")));
  assert.ok(errors.some((error) => error.includes("required capabilities")));
  assert.ok(errors.some((error) => error.includes("fallback")));
});
