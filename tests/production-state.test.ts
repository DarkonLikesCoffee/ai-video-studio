import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PRODUCTION_STAGES, resolveProductionEvidenceFile, validateProductionEvidenceFiles, validateProductionState } from "../scripts/production-state";

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


test("strict production-state validation resolves existing evidence files inside the project", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "production-state-evidence-"));
  const projectRoot = path.join(root, "projects", "lighthouse-repair");
  await mkdir(path.join(projectRoot, "production"), { recursive: true });
  await mkdir(path.join(root, "projects", "outside"), { recursive: true });
  await writeFile(path.join(projectRoot, "production", "creative-brief.md"), "# Brief");
  await writeFile(path.join(projectRoot, "production", "creative-direction.md"), "# Direction");
  await writeFile(path.join(projectRoot, "production", "production-plan.json"), "{}");
  await writeFile(path.join(projectRoot, "production", "asset-manifest.json"), "{}");
  try {
    const state = {
      ...valid,
      evidence: {
        brief: ["production/creative-brief.md"],
        direction: ["production/creative-direction.md"],
        storyboard: ["production/production-plan.json"],
        assets: ["production/asset-manifest.json"]
      }
    };
    assert.deepEqual(await validateProductionEvidenceFiles(state, {
      repositoryRoot: root,
      projectRoot,
      expectedProjectId: "lighthouse-repair",
      requireEvidence: true
    }), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict production-state validation rejects missing evidence files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "production-state-missing-"));
  const projectRoot = path.join(root, "projects", "lighthouse-repair");
  await mkdir(path.join(projectRoot, "production"), { recursive: true });
  await writeFile(path.join(projectRoot, "production", "creative-brief.md"), "# Brief");
  try {
    const state = {
      ...valid,
      evidence: {
        brief: ["production/creative-brief.md"],
        direction: ["production/missing-direction.md"],
        storyboard: ["production/production-plan.json"],
        assets: ["production/asset-manifest.json"]
      }
    };
    const errors = await validateProductionEvidenceFiles(state, {
      repositoryRoot: root,
      projectRoot,
      requireEvidence: true
    });
    assert.ok(errors.some(error => error.includes("missing-direction.md")));
    assert.ok(errors.some(error => error.includes("production-plan.json")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict production-state validation rejects traversal and absolute evidence paths", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "production-state-traversal-"));
  const projectRoot = path.join(root, "projects", "lighthouse-repair");
  await mkdir(path.join(projectRoot, "production"), { recursive: true });
  await writeFile(path.join(projectRoot, "production", "creative-brief.md"), "# Brief");
  await writeFile(path.join(projectRoot, "production", "creative-direction.md"), "# Direction");
  await writeFile(path.join(projectRoot, "production", "production-plan.json"), "{}");
  await writeFile(path.join(projectRoot, "production", "asset-manifest.json"), "{}");
  await writeFile(path.join(root, "outside.txt"), "outside");
  try {
    const state = {
      ...valid,
      evidence: {
        brief: ["../outside.txt"],
        direction: ["/tmp/outside.txt"],
        storyboard: ["production/production-plan.json"],
        assets: ["production/asset-manifest.json"]
      }
    };
    const errors = await validateProductionEvidenceFiles(state, {
      repositoryRoot: root,
      projectRoot,
      requireEvidence: true
    });
    assert.ok(errors.some(error => error.includes("..")));
    assert.ok(errors.some(error => error.includes("/tmp/outside.txt")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict production-state validation rejects symlinks and project roots outside repository", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "production-state-symlink-"));
  const projectRoot = path.join(root, "projects", "lighthouse-repair");
  const outsideRoot = path.join(root, "outside");
  await mkdir(path.join(projectRoot, "production"), { recursive: true });
  await mkdir(outsideRoot, { recursive: true });
  await writeFile(path.join(outsideRoot, "brief.md"), "# Outside");
  await writeFile(path.join(projectRoot, "production", "creative-direction.md"), "# Direction");
  await writeFile(path.join(projectRoot, "production", "production-plan.json"), "{}");
  await writeFile(path.join(projectRoot, "production", "asset-manifest.json"), "{}");
  await symlink(path.join(outsideRoot, "brief.md"), path.join(projectRoot, "production", "brief-link.md"));
  try {
    const state = {
      ...valid,
      evidence: {
        brief: ["production/brief-link.md"],
        direction: ["production/creative-direction.md"],
        storyboard: ["production/production-plan.json"],
        assets: ["production/asset-manifest.json"]
      }
    };
    const errors = await validateProductionEvidenceFiles(state, {
      repositoryRoot: root,
      projectRoot,
      requireEvidence: true
    });
    assert.ok(errors.some(error => error.includes("symbolic links")));
    await symlink(path.join(outsideRoot, "brief.md"), path.join(projectRoot, "production", "production-state.json"));
    await assert.rejects(
      resolveProductionEvidenceFile(projectRoot, "production/production-state.json"),
      /symbolic links/,
    );
    const outsideProjectErrors = await validateProductionEvidenceFiles(state, {
      repositoryRoot: projectRoot,
      projectRoot: outsideRoot,
      requireEvidence: true
    });
    assert.ok(outsideProjectErrors.some(error => error.includes("contained within repositoryRoot")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy production-state validation remains reference-presence-only unless strict file checking is requested", () => {
  assert.deepEqual(validateProductionState(valid, { requireEvidence: true }), []);
});


test("render preflight can require the exact frozen stage", () => {
  const frozen = {
    ...valid,
    stage: "frozen",
    evidence: {
      ...valid.evidence,
      build: ["production/build-report.json"],
      "render-ready": ["production/render-ready.json"],
      frozen: ["production/frozen-candidate.json"],
    },
  };
  assert.deepEqual(validateProductionState(frozen, {
    requireEvidence: true,
    requiredStage: "frozen",
  }), []);

  const notFrozen = validateProductionState(valid, {
    requireEvidence: true,
    requiredStage: "frozen",
  });
  assert.ok(notFrozen.some((error) => error.includes('stage must be exactly "frozen"')));
});

test("strict frozen-stage validation requires and resolves evidence through the frozen candidate", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "production-state-frozen-"));
  const projectRoot = path.join(root, "projects", "lighthouse-repair");
  const productionRoot = path.join(projectRoot, "production");
  await mkdir(productionRoot, { recursive: true });
  const evidence = {
    brief: "creative-brief.md",
    direction: "creative-direction.md",
    storyboard: "production-plan.json",
    assets: "asset-manifest.json",
    build: "build-report.json",
    "render-ready": "render-ready.json",
    frozen: "frozen-candidate.json",
  };
  for (const file of Object.values(evidence)) {
    await writeFile(path.join(productionRoot, file), `evidence: ${file}\n`);
  }
  try {
    const state = {
      ...valid,
      stage: "frozen",
      evidence: Object.fromEntries(
        Object.entries(evidence).map(([stage, file]) => [stage, [`production/${file}`]]),
      ),
    };
    assert.deepEqual(await validateProductionEvidenceFiles(state, {
      repositoryRoot: root,
      projectRoot,
      expectedProjectId: "lighthouse-repair",
      requireEvidence: true,
      requiredStage: "frozen",
    }), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
