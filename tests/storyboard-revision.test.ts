import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStoryboardRevision, applyStoryboardRevisionEdits, validateStoryboardRevision } from "../scripts/storyboard-revision";

const example = JSON.parse(await readFile(new URL("../projects/examples/production-plan.json", import.meta.url), "utf8"));

test("revision artifact preserves the complete source plan and starts suggestions unselected", () => {
  const source = JSON.stringify(example, null, 2);
  const artifact = createStoryboardRevision("example.json", source);
  assert.deepEqual(artifact.sourcePlan, example);
  assert.equal(artifact.sourcePlanSha256.length, 64);
  assert.equal(artifact.sourcePlanText, source);
  assert.ok(artifact.suggestions.every((suggestion) => suggestion.selected === false));
  assert.deepEqual(artifact.edits, []);
  assert.equal(artifact.validation, null);
});

test("applies explicit edits to a copy without mutating the embedded original", () => {
  const artifact = createStoryboardRevision("example.json", JSON.stringify(example));
  artifact.edits.push({ shotId: "opening-macro", changeNote: "Clarify reveal", fields: { visual: "A close-up reveals the metal edge." } });
  const revised = applyStoryboardRevisionEdits(artifact) as Record<string, any>;
  assert.equal(revised.shots[0].visual, "A close-up reveals the metal edge.");
  assert.equal((artifact.sourcePlan as Record<string, any>).shots[0].visual, example.shots[0].visual);
});

test("rejects edits referencing unknown shots", () => {
  const artifact = createStoryboardRevision("example.json", JSON.stringify(example));
  artifact.edits.push({ shotId: "missing-shot", changeNote: "No such shot", fields: { visual: "Test" } });
  assert.throws(() => applyStoryboardRevisionEdits(artifact), /unknown shot ID/);
});

test("revision validation reports schema errors and heuristic warnings separately", () => {
  const artifact = createStoryboardRevision("example.json", JSON.stringify(example));
  artifact.edits.push({ shotId: "opening-macro", changeNote: "Make visual vague", fields: { visual: "Show this concept" } });
  const result = validateStoryboardRevision(artifact);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((warning) => warning.includes("VAGUE_VISUAL_DESCRIPTION")));
  assert.deepEqual(result.errors, []);
});
