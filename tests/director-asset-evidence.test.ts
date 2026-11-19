import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildAssetEvidenceReport } from "../scripts/director-asset-evidence";

const criteria = ["Criterion one", "Criterion two", "Criterion three"];
const makePlan = () => ({
  schemaVersion: 1,
  id: "asset-evidence-test",
  title: "Asset Evidence Test",
  delivery: { durationSeconds: 3, width: 1920, height: 1080, fps: 30, format: "mp4" },
  creativeDirection: {
    objective: "Demonstrate evidence linking.",
    audience: "Reviewers",
    concept: "Link criteria to authored shots and assets.",
    visualSystem: { palette: ["#000000", "#FFFFFF"], typography: "Sans", composition: "Balanced", lighting: "Neutral" },
    motionLanguage: "Simple deterministic movement",
    soundDirection: "Minimal original sound",
  },
  shots: [
    { id: "shot-one", startSeconds: 0, durationSeconds: 1, purpose: "First beat", visual: "First visual", visualMethod: "Original artwork", action: "Reveal one detail", visualProgression: "Start hidden, reveal, settle", framing: "Macro", cameraMovement: "Push", transition: "Cut", audio: "Soft cue", assets: ["one.svg"] },
    { id: "shot-two", startSeconds: 1, durationSeconds: 1, purpose: "Second beat", visual: "Second visual", visualMethod: "Original artwork", action: "Show the second detail", visualProgression: "Start wide, move closer, resolve", framing: "Medium", cameraMovement: "Slide", transition: "Cut", audio: "Soft cue", assets: ["assets/two.svg"] },
    { id: "shot-three", startSeconds: 2, durationSeconds: 1, purpose: "Final beat", visual: "Final visual", visualMethod: "Original artwork", action: "Resolve the sequence", visualProgression: "Start moving, settle, hold", framing: "Wide", cameraMovement: "Pull back", transition: "Fade", audio: "Resolve", assets: ["missing.svg"] },
  ],
  acceptanceCriteria: criteria,
  acceptanceCoverage: [
    { criterion: criteria[0], shotIds: ["shot-one"], rationale: "The first detail is shown." },
    { criterion: criteria[1], shotIds: ["shot-two"], rationale: "The second detail is shown." },
    { criterion: criteria[2], shotIds: ["shot-three"], rationale: "The ending is shown." },
  ],
});

const makeManifest = () => ({
  project: "asset-evidence-test",
  assets: [
    { file: "one.svg", type: "original artwork", shotIds: ["shot-one"], provenance: "Created for this test.", license: "Original project artwork." },
    { path: "assets/two.svg", type: "licensed image", shotIds: ["shot-two"], sourcePage: "https://example.com/source", license: "CC BY 4.0" },
    { file: "missing.svg", type: "placeholder", shotIds: ["shot-three"] },
  ],
});

const withProject = async (run: (root: string) => Promise<void>) => {
  const root = await mkdtemp(path.join(tmpdir(), "asset-evidence-"));
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "assets", "one.svg"), "<svg/>");
  await writeFile(path.join(root, "assets", "two.svg"), "<svg/>");
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
};

test("links acceptance criteria to shot assets and verifies local files/provenance", async () => {
  await withProject(async (root) => {
    const report = await buildAssetEvidenceReport(makePlan(), makeManifest(), { projectRoot: root, generatedAt: "2026-01-01T00:00:00.000Z" });
    assert.equal(report.reportType, "production-asset-evidence");
    assert.equal(report.summary.shotCount, 3);
    assert.equal(report.summary.assetCount, 3);
    assert.equal(report.summary.shotsWithAssets, 3);
    assert.equal(report.summary.linkedCriteria, 3);
    assert.equal(report.criteria[0]?.readiness, "ready");
    assert.equal(report.criteria[1]?.readiness, "ready");
    assert.equal(report.criteria[2]?.readiness, "needs-review");
    assert.equal(report.assets[0]?.localStatus, "present");
    assert.equal(report.shots[0]?.manifestAssets[0]?.localStatus, "present");
    assert.equal(report.shots[1]?.manifestAssets[0]?.path, "assets/two.svg");
    assert.equal(report.summary.missingFiles, 1);
    assert.equal(report.summary.missingProvenance, 1);
    assert.equal(report.summary.missingRights, 1);
    assert.equal(report.summary.status, "needs-review");
  });
});

test("shotIds all links a manifest asset to every shot", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    const manifest = { assets: [{ file: "shared.svg", type: "shared original", shotIds: ["all"], provenance: "Shared test asset", license: "Original project artwork." }] };
    await writeFile(path.join(root, "assets", "shared.svg"), "<svg/>");
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.equal(report.summary.shotsWithAssets, 3);
    assert.ok(report.shots.every((shot) => shot.manifestAssets.some((asset) => asset.reference === "shared.svg"));
  });
});

test("unknown manifest shot IDs are reported without being assigned", async () => {
  await withProject(async (root) => {
    const report = await buildAssetEvidenceReport(makePlan(), { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one", "ghost"], provenance: "Test", license: "Original" }] }, { projectRoot: root });
    assert.equal(report.summary.unknownManifestShotIds, 1);
    assert.ok(report.issues.some((issue) => issue.code === "UNKNOWN_MANIFEST_SHOT_ID" && issue.shotId === "ghost");
    assert.equal(report.shots[0]?.manifestAssets.length, 1);
    assert.equal(report.shots[1]?.manifestAssets.length, 0);
  });
});

test("unsafe asset paths are rejected before filesystem access", async () => {
  await withProject(async (root) => {
    const report = await buildAssetEvidenceReport(makePlan(), { assets: [{ path: "../outside.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original" }] }, { projectRoot: root });
    assert.equal(report.summary.unsafePaths, 1);
    assert.equal(report.summary.status, "invalid");
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_PATH_UNSAFE" && issue.severity === "error"));
    assert.equal(report.shots[0]?.manifestAssets[0]?.localStatus, "unsafe");
  });
});

test("planned asset references absent from the manifest are reported", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    plan.shots[2].assets = ["unlisted.svg"];
    const report = await buildAssetEvidenceReport(plan, { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original" }] }, { projectRoot: root });
    assert.equal(report.summary.unresolvedPlannedAssetRefs, 1);
    assert.ok(report.issues.some((issue) => issue.code === "PLAN_ASSET_UNRESOLVED" && issue.shotId === "shot-three"));
  });
});

test("planned reference must be assigned to the same shot", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    plan.shots[1].assets = ["one.svg"];
    const manifest = { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original" }] };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.deepEqual(report.shots[1]?.matchedPlannedAssetRefs, []);
    assert.deepEqual(report.shots[1]?.unresolvedPlannedAssetRefs, ["one.svg"]);
    assert.ok(report.issues.some((issue) => issue.code === "PLAN_ASSET_UNRESOLVED" && issue.shotId === "shot-two"));
  });
});

test("missing criterion coverage and empty manifest remain explicit", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    delete plan.acceptanceCoverage;
    const report = await buildAssetEvidenceReport(plan, { assets: [] }, { projectRoot: root });
    assert.equal(report.criteria.length, 0);
    assert.equal(report.summary.status, "no-assets");
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_MANIFEST_EMPTY"));
  });
});

test("whitespace-only shot and asset references are ignored", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    plan.shots[1].assets = [" ", ""];
    const manifest = { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one", " ", ""], provenance: "Test", license: "Original" }] };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.deepEqual(report.assets[0]?.shotIds, ["shot-one"]);
    assert.deepEqual(report.shots[1]?.plannedAssetRefs, []);
    assert.deepEqual(report.shots[1]?.unresolvedPlannedAssetRefs, []);
    assert.equal(report.summary.unknownManifestShotIds, 0);
  });
});
