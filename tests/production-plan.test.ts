import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateProductionPlan } from "../scripts/validate-production-plan";
import { analyzeStoryboardRisks } from "../scripts/storyboard-qa";

const example = JSON.parse(
  await readFile(new URL("../projects/examples/production-plan.json", import.meta.url), "utf8")
) as Record<string, unknown>;

test("example production plan passes validation", () => {
  assert.deepEqual(validateProductionPlan(example), []);
});

test("production plan requires a meaningful acceptance checklist", () => {
  const invalid = structuredClone(example);
  invalid.acceptanceCriteria = ["Only one criterion"];
  assert.ok(validateProductionPlan(invalid).some((error) => error.includes("acceptanceCriteria")));
});

test("production plan rejects duplicate shot IDs", () => {
  const invalid = structuredClone(example);
  const shots = invalid.shots as Array<Record<string, unknown>>;
  shots[1]!.id = shots[0]!.id;
  assert.ok(validateProductionPlan(invalid).some((error) => error.includes("unique")));
});

test("production plan rejects shots that exceed the requested runtime", () => {
  const invalid = structuredClone(example);
  const shots = invalid.shots as Array<Record<string, unknown>>;
  shots[3]!.durationSeconds = 8;
  assert.ok(validateProductionPlan(invalid).some((error) => error.includes("extends beyond")));
});

test("production plan rejects out-of-order shots", () => {
  const invalid = structuredClone(example);
  const shots = invalid.shots as Array<Record<string, unknown>>;
  shots[2]!.startSeconds = 2;
  assert.ok(validateProductionPlan(invalid).some((error) => error.includes("ordered")));
});

test("production plan requires a selected visual method for every shot", () => {
  const invalid = structuredClone(example);
  const shots = invalid.shots as Array<Record<string, unknown>>;
  delete shots[0]!.visualMethod;
  assert.ok(validateProductionPlan(invalid).some((error) => error.includes("visualMethod")));
});

test("production plan requires concrete action and visual progression", () => {
  const invalid = structuredClone(example);
  const shots = invalid.shots as Array<Record<string, unknown>>;
  delete shots[1]!.action;
  shots[2]!.visualProgression = " ";
  const errors = validateProductionPlan(invalid);
  assert.ok(errors.some((error) => error.includes("action")));
  assert.ok(errors.some((error) => error.includes("visualProgression")));
});

test("storyboard QA warns about long shots and static camera holds", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[1]!.durationSeconds = 8;
  shots[1]!.cameraMovement = "static locked-off camera";
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "LONG_SHOT" && finding.shotIds.includes("form-reveal")));
  assert.ok(findings.some((finding) => finding.code === "STATIC_HOLD" && finding.shotIds.includes("form-reveal")));
});

test("storyboard QA warns on repeated adjacent framing", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[1]!.framing = shots[0]!.framing;
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "REPEATED_FRAMING" && finding.shotIds.length === 2));
});

test("storyboard QA warns only on long runs of repeated visual method and camera movement", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots.forEach((shot) => {
    shot.visualMethod = "motion graphics";
    shot.cameraMovement = "slow push-in";
  });
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "REPEATED_VISUAL_METHOD" && finding.shotIds.length === 4));
  assert.ok(findings.some((finding) => finding.code === "REPEATED_CAMERA_MOVEMENT" && finding.shotIds.length === 4));
});

test("storyboard QA returns no findings for a varied short sequence", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots.forEach((shot, index) => {
    shot.durationSeconds = 3;
    shot.visualMethod = `method-${index}`;
    shot.framing = `frame-${index}`;
    shot.cameraMovement = `move-${index}`;
  });
  assert.deepEqual(analyzeStoryboardRisks(plan), []);
});
