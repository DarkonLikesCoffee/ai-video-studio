import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { validateRenderStrategy } from "../scripts/director-compositions";
import { validateProductionPlan } from "../scripts/validate-production-plan";

const plan = JSON.parse(await readFile(new URL("../projects/orbital-bloom/production/production-plan.json", import.meta.url), "utf8"));
const props = JSON.parse(await readFile(new URL("../projects/orbital-bloom/scene.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../projects/orbital-bloom/production/asset-manifest.json", import.meta.url), "utf8"));
const rootSource = await readFile(new URL("../packages/video-engine/src/root.tsx", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/render.yml", import.meta.url), "utf8");
const source = await readFile(new URL("../projects/orbital-bloom/assets/OrbitalBloom3D.tsx", import.meta.url), "utf8");

test("ORBITAL BLOOM production plan validates and selects a registered custom composition", () => {
  assert.deepEqual(validateProductionPlan(plan), []);
  assert.deepEqual(validateRenderStrategy(plan.renderStrategy), []);
  assert.equal(plan.renderStrategy.renderer, "custom-remotion");
  assert.equal(plan.renderStrategy.compositionId, "OrbitalBloom3D");
  assert.equal(plan.renderStrategy.availability, "registered");
});

test("the five story beats fill exactly 600 contiguous frames at 30fps", () => {
  assert.equal(plan.delivery.durationSeconds, 20);
  assert.equal(plan.delivery.width, 1920);
  assert.equal(plan.delivery.height, 1080);
  assert.equal(plan.delivery.fps, 30);
  assert.equal(props.composition.id, "OrbitalBloom3D");
  assert.equal(props.composition.durationInFrames, 600);
  assert.equal(plan.shots.length, 5);
  let nextFrame = 0;
  for (const shot of plan.shots) {
    assert.equal(shot.startSeconds * 30, nextFrame);
    nextFrame += shot.durationSeconds * 30;
  }
  assert.equal(nextFrame, 600);
});

test("criterion coverage is complete and procedural assets have local provenance and rights", async () => {
  assert.equal(plan.acceptanceCriteria.length, 6);
  assert.equal(plan.acceptanceCoverage.length, plan.acceptanceCriteria.length);
  const assets = new Map(manifest.assets.map((asset: { id: string }) => [asset.id, asset]));
  for (const shot of plan.shots) {
    for (const ref of shot.assets) {
      const asset = assets.get(ref) as { file: string; shotIds: string[]; provenance: string; rightsBasis: string; rightsNote: string } | undefined;
      assert.ok(asset, `Missing manifest asset ${ref}`);
      assert.ok(asset!.shotIds.includes("all") || asset!.shotIds.includes(shot.id));
      assert.ok(asset!.provenance);
      assert.equal(asset!.rightsBasis, "original-content");
      assert.ok(asset!.rightsNote);
      assert.ok((await stat(new URL(`../projects/orbital-bloom/${asset!.file}`, import.meta.url))).isFile());
    }
  }
});

test("Remotion root and render workflow register, generate and master Orbital Bloom", () => {
  assert.match(rootSource, /import \{ OrbitalBloom3D \} from .*orbital-bloom/);
  assert.match(rootSource, /id="OrbitalBloom3D"/);
  assert.match(workflow, /composition_id == 'OrbitalBloom3D'/);
  assert.match(workflow, /generate-soundscape\.mjs/);
  assert.match(workflow, /Master Orbital Bloom soundtrack/);
  const orbitalRenderBranch = workflow.split('elif [[ "$COMPOSITION_ID" == "OrbitalBloom3D" ]]; then')[1]?.split('elif [[ -n "$PROJECT_PATH" ]]; then')[0] ?? "";
  assert.match(orbitalRenderBranch, /--concurrency=1/);
  assert.match(orbitalRenderBranch, /--gl=swangle/);
  assert.match(source, /assets\/audio\/orbital-bloom\.wav/);
});

test("the custom composition includes procedural hard-surface, iris, organic and camera systems", () => {
  for (const feature of ["sphereGeometry", "torusGeometry", "ExtrudeGeometry", "tubeGeometry", "Dome", "Planet", "Seed", "Plant", "cameraYaw", "cameraPitch", "transmission"]) {
    assert.ok(source.includes(feature), `Expected 3D feature missing: ${feature}`);
  }
});
