import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildRenderProvenance, collectArtifactFiles, summarizeMediaQa } from "../scripts/render-provenance";

test("render provenance records source, request, project, artifact hashes and QA", () => {
  const mediaQa = {
    passed: true,
    format: { durationSeconds: 12.5, sizeBytes: 4096, formatName: "mov,mp4" },
    video: { codec: "h264", width: 1920, height: 1080, fps: 30 },
    audio: { codec: "aac", sampleRate: 48000, channels: 2 },
    findings: [],
    measurements: { silenceIntervals: [], frozenIntervals: [], blackIntervals: [], truePeakDbfs: -1.5, audioVideoStartOffsetSeconds: 0 },
  };
  const result = buildRenderProvenance({
    request: { provider: "github-actions", compositionId: "ProjectVideo", outputName: "benchmark-v5", requestId: "benchmark-v5-2026", projectPath: "projects/benchmark/scene.json" },
    metadata: { repository: "owner/repo", commit: "abc123", branch: "fix/benchmark", workflow: "Render video", actor: "owner", runId: "42", runAttempt: "2", runUrl: "https://github.com/owner/repo/actions/runs/42" },
    sourceProjectPath: "projects/benchmark/scene.json",
    renderProjectPath: "projects/benchmark/.narrated-project.json",
    sourceProject: { id: "benchmark", title: "Benchmark" },
    renderProject: { id: "benchmark", title: "Benchmark rendered" },
    files: [{ path: "render-output/benchmark-v5.mp4", sizeBytes: 4096, sha256: "a".repeat(64) }],
    mediaQa,
    mediaQaPath: "render-output/benchmark-v5.qa.json",
    contactSheet: { durationSeconds: 12.5, frameCount: 3, rows: 1, sampleTimestampsSeconds: [0, 5, 10], options: { intervalSeconds: 5, columns: 4, thumbnailWidth: 320 } },
    contactSheetImagePath: "render-output/review/benchmark-v5.contact-sheet.jpg",
    contactSheetReportPath: "render-output/review/benchmark-v5.contact-sheet.json",
    generatedAt: "2026-11-20T00:00:00.000Z",
  });

  assert.equal(result.schemaVersion, 1);
  assert.equal(result.reportType, "render-provenance");
  assert.equal(result.source.commit, "abc123");
  assert.equal(result.source.workflowRun.id, "42");
  assert.equal(result.source.workflowRun.attempt, "2");
  assert.equal(result.request.requestId, "benchmark-v5-2026");
  assert.equal(result.project.source.id, "benchmark");
  assert.equal(result.project.rendered.path, "projects/benchmark/.narrated-project.json");
  assert.equal(result.artifact.files[0].sha256, "a".repeat(64));
  assert.equal(result.mediaQa.passed, true);
  assert.equal(result.mediaQa.measurements.truePeakDbfs, -1.5);
  assert.deepEqual(result.contactSheet.sampleTimestampsSeconds, [0, 5, 10]);
});

test("media QA summary preserves failure findings and A/V measurements", () => {
  const result = summarizeMediaQa({
    passed: false,
    format: { durationSeconds: 3, sizeBytes: 1000 },
    findings: [{ severity: "error", code: "audio-video-start-offset", message: "audio is late", startSeconds: 0.6 }],
    measurements: { audioVideoStartOffsetSeconds: 0.6, silenceIntervals: [], frozenIntervals: [], blackIntervals: [] },
  }, "qa.json");
  assert.equal(result.passed, false);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, "audio-video-start-offset");
  assert.equal(result.measurements.audioVideoStartOffsetSeconds, 0.6);
});

test("artifact file collection hashes required files and ignores missing optional files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "render-provenance-"));
  try {
    const file = join(directory, "evidence.txt");
    await writeFile(file, "render evidence", "utf8");
    const files = await collectArtifactFiles([
      { filePath: file, artifactPath: "render-output/evidence.txt", required: true },
      { filePath: join(directory, "optional.txt"), artifactPath: "render-output/optional.txt", required: false },
    ]);
    assert.equal(files.length, 1);
    assert.equal(files[0].sizeBytes, Buffer.byteLength("render evidence"));
    assert.equal(files[0].sha256, createHash("sha256").update("render evidence").digest("hex"));
    await assert.rejects(
      collectArtifactFiles([{ filePath: join(directory, "missing.mp4"), artifactPath: "render-output/missing.mp4", required: true }]),
      /Required render artifact file is missing/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
