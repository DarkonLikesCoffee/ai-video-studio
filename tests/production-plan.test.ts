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

test("storyboard QA flags placeholder-like visual and action descriptions", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[0]!.visual = "Show this concept";
  shots[0]!.action = "Show the idea";
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "VAGUE_VISUAL_DESCRIPTION" && finding.shotIds.includes("opening-macro")));
  assert.ok(findings.some((finding) => finding.code === "VAGUE_ACTION" && finding.shotIds.includes("opening-macro")));
});

test("storyboard QA warns when progression lacks explicit phases", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[2]!.visualProgression = "A detail moves into frame and the light changes.";
  assert.ok(analyzeStoryboardRisks(plan).some((finding) => finding.code === "INCOMPLETE_VISUAL_PROGRESSION" && finding.shotIds.includes("detail-proof")));
});

test("storyboard QA flags highly similar adjacent visual descriptions", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[1]!.visual = shots[0]!.visual;
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "REPEATED_VISUAL_DESCRIPTION" && finding.shotIds.length === 2));
});

test("storyboard QA warns on unusually long on-screen copy without failing validation", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots[0]!.onScreenText = "A very long headline that may overwhelm the visual and take too long to read on screen";
  assert.ok(analyzeStoryboardRisks(plan).some((finding) => finding.code === "TEXT_HEAVY_SHOT"));
});


test("storyboard QA warns when a long sequence uses only two recognizable shot scales", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots.push({ ...shots[3], id: "extra-shot", startSeconds: 15, durationSeconds: 2 });
  shots.forEach((shot, index) => { shot.framing = index % 2 === 0 ? "Close-up shot" : "Tight close up"; });
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "LOW_SHOT_SCALE_VARIETY" && finding.shotIds.length === 5));
});

test("storyboard QA warns on runs of three adjacent shots with the same recognized scale", () => {
  const plan = structuredClone(example);
  const shots = plan.shots as Array<Record<string, unknown>>;
  shots.forEach((shot) => { shot.framing = "Medium shot with subject left"; });
  const findings = analyzeStoryboardRisks(plan);
  assert.ok(findings.some((finding) => finding.code === "REPEATED_SHOT_SCALE" && finding.shotIds.length === 4));
});
