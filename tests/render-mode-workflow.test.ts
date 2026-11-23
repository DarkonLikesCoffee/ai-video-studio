import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const githubWorkflow = await readFile(new URL("../.github/workflows/render.yml", import.meta.url), "utf8");
const circleCiWorkflow = await readFile(new URL("../.circleci/config.yml", import.meta.url), "utf8");
const strategyScript = await readFile(new URL("../scripts/validate-render-strategy.mjs", import.meta.url), "utf8");

test("GitHub Actions resolves the catalogue mode and routes 2D separately from WebGL", () => {
  assert.ok(githubWorkflow.includes("id: strategy"));
  assert.ok(githubWorkflow.includes("RENDER_MODE: ${{ steps.strategy.outputs.render_mode }}"));
  assert.ok(githubWorkflow.includes('elif [[ "$RENDER_MODE" == "2d" ]]; then'));
  assert.ok(githubWorkflow.includes('"--gl=swangle"'));
});

test("CircleCI runs the same composition preflight and consumes its resolved render mode", () => {
  assert.ok(circleCiWorkflow.includes("node scripts/validate-render-strategy.mjs /tmp/circleci-render-request.json"));
  assert.ok(strategyScript.includes('process.env.CIRCLECI === "true" && process.env.BASH_ENV'));
  assert.ok(circleCiWorkflow.includes('if [[ "$RENDER_MODE" == "2d" ]]; then'));
  assert.ok(circleCiWorkflow.includes('"--gl=swangle"'));
});

test("both providers use the explicit 2D branch instead of composition-name exceptions", () => {
  assert.ok(githubWorkflow.includes('elif [[ "$RENDER_MODE" == "2d" ]]'));
  assert.ok(circleCiWorkflow.includes('elif [[ "$RENDER_MODE" == "2d" ]]'));
  assert.ok(!githubWorkflow.includes('COMPOSITION_ID" == "LighthouseRepairFilm'));
  assert.ok(!githubWorkflow.includes('COMPOSITION_ID" == "MadridTrip"'));
});
