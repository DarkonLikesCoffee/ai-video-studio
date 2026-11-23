import test from "node:test";
import assert from "node:assert/strict";
import { validateVisualReviewReport } from "../scripts/visual-review-validate";

const base = () => ({
  schemaVersion: 2,
  status: "approved",
  artifact: { videoSha256: "a".repeat(64) },
  inspection: {
    method: "full-video",
    fullVideoWatched: true,
    timestampsReviewedSeconds: [0, 5, 10],
    reviewer: "reviewer",
    reviewedAt: "2026-11-23T12:00:00Z",
  },
  findings: [],
  corrections: [],
  renderIterations: [{
    iteration: 1,
    videoSha256: "a".repeat(64),
    previousVideoSha256: null,
    candidateSha: "b".repeat(40),
    sourceCommit: "c".repeat(40),
    requestId: "review-001",
    workflowRunId: "45197957961",
    runUrl: "https://github.com/owner/repo/actions/runs/45197957961",
    renderedAt: "2026-11-23T12:00:00Z",
    correctionIds: [],
  }],
  decision: { approved: true, rationale: "Reviewed the full render; no blocking issues." },
});

test("pending reports validate without implying approval", () => {
  const r = base();
  r.status = "pending-review";
  r.decision.approved = false;
  const value = validateVisualReviewReport(r);
  assert.deepEqual(value.errors, []);
  assert.equal(value.pending, true);
  assert.equal(value.approved, false);
});

test("approval requires full-video inspection", () => {
  const r = base();
  r.inspection.fullVideoWatched = false;
  assert.ok(validateVisualReviewReport(r).errors.some(error => error.includes("fullVideoWatched=true")));
});

test("approval rejects unresolved blockers and open major findings", () => {
  const r = base();
  r.findings = [
    { id: "F1", severity: "blocker", status: "open" },
    { id: "F2", severity: "major", status: "open" },
  ];
  const value = validateVisualReviewReport(r);
  assert.ok(value.errors.some(error => error.includes("blocker")));
  assert.ok(value.errors.some(error => error.includes("major")));
});

test("approval requires correction references and current-render verification evidence", () => {
  const r = base();
  r.findings = [{ id: "F1", severity: "minor", status: "resolved" }];
  r.corrections = [{
    id: "C1",
    findingId: "missing",
    description: "Fix",
    targetPaths: ["projects/demo/src/Scene.tsx"],
    status: "verified",
    appliedInCommit: "d".repeat(40),
    verified: true,
    verification: {
      videoSha256: "f".repeat(64),
      reviewer: "reviewer",
      reviewedAt: "2026-11-23T12:00:00Z",
      timestampsReviewedSeconds: [2],
    },
  }];
  r.renderIterations[0].correctionIds = ["C1"];
  const value = validateVisualReviewReport(r);
  assert.ok(value.errors.some(error => error.includes("existing findingId")));
  assert.ok(value.errors.some(error => error.includes("current artifact video hash")));
});

test("valid approval passes", () => {
  assert.deepEqual(validateVisualReviewReport(base()).errors, []);
});

test("valid correction verification is tied to the current MP4 hash", () => {
  const r = base();
  r.findings = [{ id: "F1", severity: "major", status: "resolved" }];
  r.corrections = [{
    id: "C1",
    findingId: "F1",
    description: "Rebuild the repeated shot with a distinct camera angle.",
    targetPaths: ["projects/demo/src/Scene.tsx", "projects/demo/production/production-plan.json"],
    status: "verified",
    appliedInCommit: "d".repeat(40),
    verified: true,
    verification: {
      videoSha256: "a".repeat(64),
      reviewer: "reviewer",
      reviewedAt: "2026-11-23T12:00:00Z",
      timestampsReviewedSeconds: [4.2, 6.1],
    },
  }];
  r.renderIterations[0].correctionIds = ["C1"];
  assert.deepEqual(validateVisualReviewReport(r).errors, []);
});

test("render iteration history must form a sequential hash chain", () => {
  const r = base();
  r.renderIterations.push({
    ...r.renderIterations[0],
    iteration: 2,
    videoSha256: "d".repeat(64),
    previousVideoSha256: "wrong".padEnd(64, "0"),
  });
  const errors = validateVisualReviewReport(r).errors;
  assert.ok(errors.some(error => error.includes("preceding video hash")));
  assert.ok(errors.some(error => error.includes("latest render iteration")));
});

test("schemaVersion 2 corrections require target files and an application commit", () => {
  const r = base();
  r.findings = [{ id: "F1", severity: "minor", status: "open" }];
  r.corrections = [{
    id: "C1",
    findingId: "F1",
    description: "Correct the shot.",
    targetPaths: ["../outside.tsx"],
    status: "applied",
    appliedInCommit: "bad-sha",
    verified: false,
  }];
  const errors = validateVisualReviewReport(r).errors;
  assert.ok(errors.some(error => error.includes("safe repository-relative targetPaths")));
  assert.ok(errors.some(error => error.includes("full appliedInCommit SHA")));
});

test("invalid hash and duplicate finding ids are rejected", () => {
  const r = base();
  r.artifact.videoSha256 = "bad";
  r.findings = [
    { id: "F", severity: "minor", status: "open" },
    { id: "F", severity: "minor", status: "open" },
  ];
  const errors = validateVisualReviewReport(r).errors;
  assert.ok(errors.some(error => error.includes("SHA-256")));
  assert.ok(errors.some(error => error.includes("Duplicate finding id")));
});
