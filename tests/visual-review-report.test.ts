import test from "node:test";
import assert from "node:assert/strict";
import { buildVisualReviewReport, sha256Buffer } from "../scripts/visual-review-report";
test("report starts pending and never claims full-video inspection", () => {
 const report = buildVisualReviewReport({ outputName:"demo", videoPath:"demo.mp4", contactSheetPath:"sheet.jpg", contactSheetReportPath:"sheet.json", videoSha256:"a".repeat(64), contactSheetReport:{durationSeconds:8,sampleTimestampsSeconds:[0,5]}, generatedAt:"2026-11-23T00:00:00Z" });
 assert.equal(report.status,"pending-review"); assert.equal(report.inspection.method,"not-yet-inspected"); assert.equal(report.inspection.fullVideoWatched,false); assert.equal(report.decision.approved,false); assert.deepEqual(report.contactSheet.sampleTimestampsSeconds,[0,5]); assert.equal(report.artifact.videoSha256,"a".repeat(64));
});
test("review fields start empty and unapproved", () => {
 const report=buildVisualReviewReport({outputName:"x",videoPath:"x.mp4",contactSheetPath:"s.jpg",contactSheetReportPath:"s.json",videoSha256:"b".repeat(64),contactSheetReport:{}});
 assert.deepEqual(report.findings,[]); assert.deepEqual(report.corrections,[]); assert.equal(report.inspection.reviewer,null); assert.equal(report.decision.approved,false);
});
test("sha256 helper produces deterministic digest",()=>assert.equal(sha256Buffer(Buffer.from("test")),"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"));
