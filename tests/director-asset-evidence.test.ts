import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildAssetEvidenceReport } from "../scripts/director-asset-evidence";

const criteria = ["Criterion one", "Criterion two", "Criterion three"];
const makePlan = () => ({
  schemaVersion: 1,
  assetVisualReviewRequired: false,
  id: "asset-evidence-test",
  title: "Asset Evidence Test",
  delivery: { durationSeconds: 3, width: 1920, height: 1080, fps: 30, format: "mp4" },
  renderStrategy: {
    renderer: "project-video",
    compositionId: "ProjectVideo",
    availability: "registered",
    rationale: "This synthetic asset-evidence fixture uses a structured 2D project, so ProjectVideo is the selected compatibility renderer.",
    requiredCapabilities: ["asset layers", "2D graphics"],
    fallback: "Use a custom Remotion composition if the project requires a different visual grammar or capabilities outside the ProjectVideo schema.",
  },
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
    assert.ok(report.shots.every((shot) => shot.manifestAssets.some((asset) => asset.reference === "shared.svg")));
  });
});

test("unknown manifest shot IDs are reported without being assigned", async () => {
  await withProject(async (root) => {
    const report = await buildAssetEvidenceReport(makePlan(), { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one", "ghost"], provenance: "Test", license: "Original" }] }, { projectRoot: root });
    assert.equal(report.summary.unknownManifestShotIds, 1);
    assert.ok(report.issues.some((issue) => issue.code === "UNKNOWN_MANIFEST_SHOT_ID" && issue.shotId === "ghost"));
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
    plan.shots[0].assets = ["one.svg"];
    plan.shots[1].assets = [];
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
    assert.equal(report.summary.assetCount, 0);
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_MANIFEST_EMPTY"));
  });
});



test("missing criterion coverage is reported when assets exist", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    delete plan.acceptanceCoverage;
    plan.shots[0].assets = ["one.svg"];
    plan.shots[1].assets = [];
    plan.shots[2].assets = [];
    const manifest = { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original" }] };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.equal(report.criteria.length, 0);
    assert.equal(report.summary.status, "criteria-unavailable");
    assert.equal(report.summary.assetCount, 1);
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


test("asset visual review requires an existing preview and complete approval metadata", async () => {
  await withProject(async (root) => {
    await mkdir(path.join(root, "previews"), { recursive: true });
    await writeFile(path.join(root, "previews", "one.svg"), "<svg/>");
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "original artwork",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork.",
        previewPath: "previews/one.svg",
        visualReview: {
          status: "approved",
          reviewer: "Test reviewer",
          reviewedAt: "2026-01-01T00:00:00.000Z",
          notes: "Inspected silhouette, proportions, rendering and clipping; no defects found."
        }
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.previewStatus, "present");
    assert.equal(report.assets[0]?.visualReviewStatus, "approved");
    assert.equal(report.summary.visualReviewApproved, 1);
    assert.equal(report.summary.visualReviewMissing, 0);
    assert.equal(report.summary.missingPreviews, 0);
  });
});

test("missing, pending, rejected, unsafe and unavailable previews are reported without claiming approval", async () => {
  await withProject(async (root) => {
    const plan = makePlan();
    plan.assetVisualReviewRequired = true;
    const manifest = {
      assets: [
        { file: "one.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original", visualReview: { status: "pending" } },
        { file: "two.svg", type: "art", shotIds: ["shot-two"], provenance: "Test", license: "Original", previewPath: "../outside.svg", visualReview: { status: "approved", reviewer: "R", reviewedAt: "2026-01-01T00:00:00Z", notes: "Reviewed." } },
        { file: "missing.svg", type: "art", shotIds: ["shot-three"], provenance: "Test", license: "Original", visualReview: { status: "rejected", reviewer: "R", reviewedAt: "2026-01-01T00:00:00Z", notes: "Malformed preview." } }
      ]
    };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.visualReviewStatus, "pending");
    assert.equal(report.assets[1]?.previewStatus, "unsafe");
    assert.equal(report.assets[1]?.visualReviewStatus, "missing");
    assert.equal(report.assets[2]?.visualReviewStatus, "rejected");
    assert.ok(report.issues.some(issue => issue.code === "ASSET_VISUAL_REVIEW_PENDING"));
    assert.ok(report.issues.some(issue => issue.code === "ASSET_VISUAL_REVIEW_REJECTED"));
    assert.ok(report.issues.some(issue => issue.code === "ASSET_PREVIEW_UNAVAILABLE"));
  });
});


test("visual-review issues are opt-in for backwards compatibility and enforced when the plan requires review", async () => {
  await withProject(async (root) => {
    const manifest = { assets: [{ file: "one.svg", type: "art", shotIds: ["shot-one"], provenance: "Test", license: "Original" }] };
    const legacyReport = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(legacyReport.summary.visualReviewMissing, 1);
    assert.equal(legacyReport.issues.some(issue => issue.code === "ASSET_VISUAL_REVIEW_MISSING"), false);
    const requiredPlan = makePlan();
    requiredPlan.assetVisualReviewRequired = true;
    const requiredReport = await buildAssetEvidenceReport(requiredPlan, manifest, { projectRoot: root });
    assert.ok(requiredReport.issues.some(issue => issue.code === "ASSET_PREVIEW_MISSING"));
    assert.ok(requiredReport.issues.some(issue => issue.code === "ASSET_VISUAL_REVIEW_MISSING"));
  });
});

 
test("audio assets are excluded from the visual preview and approval gate", async () => {
  await withProject(async (root) => {
    await mkdir(path.join(root, "previews"), { recursive: true });
    await mkdir(path.join(root, "assets", "audio"), { recursive: true });
    await writeFile(path.join(root, "previews", "one.svg"), "<svg/>");
    await writeFile(path.join(root, "assets", "audio", "score.wav"), "RIFF-audio-fixture");

    const plan = makePlan();
    plan.assetVisualReviewRequired = true;
    const manifest = {
      assets: [
        {
          file: "one.svg",
          type: "image/svg+xml",
          shotIds: ["shot-one"],
          provenance: "Created for this test.",
          license: "Original project artwork.",
          previewPath: "previews/one.svg",
          visualReview: {
            status: "approved",
            reviewer: "Test reviewer",
            reviewedAt: "2026-01-01T00:00:00.000Z",
            notes: "Inspected the image preview; no defects found."
          }
        },
        {
          file: "assets/audio/score.wav",
          type: "audio/wav",
          shotIds: ["all"],
          provenance: "Original score for this test.",
          license: "Original generated audio."
        }
      ]
    };

    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    const audio = report.assets.find((asset) => asset.reference === "assets/audio/score.wav");
    assert.ok(audio);
    assert.equal(audio.visualReviewApplicable, false);
    assert.equal(audio.previewStatus, "not-required");
    assert.equal(audio.visualReviewStatus, "not-required");
    assert.equal(report.summary.visualReviewApproved, 1);
    assert.equal(report.summary.visualReviewNotRequired, 1);
    assert.equal(report.summary.visualReviewMissing, 0);
    assert.equal(report.summary.missingPreviews, 0);
    assert.equal(report.issues.some((issue) => issue.code === "ASSET_PREVIEW_MISSING" && issue.assetRef === audio.reference), false);
    assert.equal(report.issues.some((issue) => issue.code === "ASSET_VISUAL_REVIEW_MISSING" && issue.assetRef === audio.reference), false);
  });
});


test("required ProjectVideo assets must be referenced by the selected scene data", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({
      scenes: [{ mediaLayers: [{ src: "assets/one.svg" }] }],
      audioTracks: []
    }));
    const plan = makePlan();
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.reusePolicy, "required");
    assert.equal(report.assets[0]?.usageStatus, "referenced");
    assert.deepEqual(report.assets[0]?.usageEvidence, ["scene.json: assets/one.svg"]);
    assert.equal(report.summary.requiredAssetCount, 1);
    assert.equal(report.summary.requiredAssetsReferenced, 1);
    assert.equal(report.summary.requiredAssetsNotReferenced, 0);
    assert.equal(report.issues.some((issue) => issue.code === "ASSET_REQUIRED_NOT_REFERENCED"), false);
  });
});

test("required assets absent from the composition are blocking evidence errors", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({
      scenes: [{ mediaLayers: [{ src: "assets/two.svg" }] }]
    }));
    const plan = makePlan();
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.usageStatus, "not-referenced");
    assert.equal(report.summary.requiredAssetsNotReferenced, 1);
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_REQUIRED_NOT_REFERENCED" && issue.severity === "error"));
    assert.equal(report.summary.status, "invalid");
  });
});

test("reference-only design studies do not need to appear in the runtime composition", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({ scenes: [] }));
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        usageRole: "design-reference",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.reusePolicy, "reference-only");
    assert.equal(report.assets[0]?.usageStatus, "not-required");
    assert.equal(report.summary.requiredAssetCount, 0);
    assert.equal(report.issues.some((issue) => issue.code.startsWith("ASSET_REQUIRED_")), false);
  });
});

test("required custom-composition assets are found through local source imports", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "asset-usage-source-"));
  const projectRoot = path.join(root, "projects", "custom-film");
  const engineScenes = path.join(root, "packages", "video-engine", "src", "scenes");
  await mkdir(path.join(projectRoot, "assets"), { recursive: true });
  await mkdir(engineScenes, { recursive: true });
  await writeFile(path.join(projectRoot, "assets", "one.svg"), "<svg/>");
  await writeFile(path.join(root, "packages", "video-engine", "src", "root.tsx"), [
    'import { Composition } from "remotion";',
    'import { TestFilm } from "./scenes/TestFilm";',
    'export const Root = () => <Composition id="LighthouseRepairFilm" component={TestFilm} durationInFrames={30} fps={30} width={1920} height={1080} />;',
    ""
  ].join("\n"));
  await writeFile(path.join(engineScenes, "TestFilm.tsx"), [
    'import { getHeroAsset } from "./asset-helper";',
    'export const TestFilm = () => getHeroAsset();',
    ""
  ].join("\n"));
  await writeFile(path.join(engineScenes, "asset-helper.ts"), [
    'import { staticFile } from "remotion";',
    'export const getHeroAsset = () => staticFile("assets/one.svg");',
    ""
  ].join("\n"));
  try {
    const plan = makePlan();
    plan.renderStrategy.renderer = "custom-remotion";
    plan.renderStrategy.compositionId = "LighthouseRepairFilm";
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(plan, manifest, { projectRoot, repositoryRoot: root });
    assert.equal(report.assets[0]?.usageStatus, "referenced");
    assert.ok(report.assets[0]?.usageEvidence.some((entry) => entry.endsWith("asset-helper.ts: assets/one.svg")));
    assert.equal(report.summary.requiredAssetsReferenced, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid reusePolicy is reported as an error", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({ scenes: [] }));
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "must-use-maybe",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_REUSE_POLICY_INVALID" && issue.severity === "error"));
  });
});


test("a same-basename reference from a different folder does not satisfy required asset usage", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({
      scenes: [{ mediaLayers: [{ src: "assets/alternate/one.svg" }] }]
    }));
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.usageStatus, "not-referenced");
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_REQUIRED_NOT_REFERENCED"));
  });
});

test("required asset usage respects case-sensitive paths", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({
      scenes: [{ mediaLayers: [{ src: "assets/One.svg" }] }]
    }));
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.usageStatus, "not-referenced");
    assert.equal(report.summary.requiredAssetsNotReferenced, 1);
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_REQUIRED_NOT_REFERENCED" && issue.severity === "error"));
  });
});

test("ProjectVideo usage ignores filenames mentioned outside rendered media sources", async () => {
  await withProject(async (root) => {
    await writeFile(path.join(root, "scene.json"), JSON.stringify({
      title: "Design reference: assets/one.svg",
      scenes: [{ title: "Mentioned in copy only: assets/one.svg", mediaLayers: [] }],
      audioTracks: []
    }));
    const manifest = {
      assets: [{
        file: "one.svg",
        type: "image/svg+xml",
        reusePolicy: "required",
        shotIds: ["shot-one"],
        provenance: "Created for this test.",
        license: "Original project artwork."
      }]
    };
    const report = await buildAssetEvidenceReport(makePlan(), manifest, { projectRoot: root });
    assert.equal(report.assets[0]?.usageStatus, "not-referenced");
    assert.equal(report.summary.requiredAssetsNotReferenced, 1);
    assert.ok(report.issues.some((issue) => issue.code === "ASSET_REQUIRED_NOT_REFERENCED" && issue.severity === "error"));
  });
});
