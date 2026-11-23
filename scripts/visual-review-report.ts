import { createHash } from "node:crypto";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
type ContactSheetReport = { durationSeconds?: number; sampleTimestampsSeconds?: number[] };
type VisualReviewInput = { outputName: string; videoPath: string; contactSheetPath: string; contactSheetReportPath: string; videoSha256: string; contactSheetReport: ContactSheetReport; generatedAt?: string };
export const buildVisualReviewReport = ({ outputName, videoPath, contactSheetPath, contactSheetReportPath, videoSha256, contactSheetReport, generatedAt = new Date().toISOString() }: VisualReviewInput) => ({
  schemaVersion: 1, reportType: "visual-review", status: "pending-review", generatedAt,
  artifact: { name: outputName, videoPath, videoSha256, contactSheetPath, contactSheetReportPath },
  inspection: { method: "not-yet-inspected", fullVideoWatched: false, timestampsReviewedSeconds: [], reviewer: null, reviewedAt: null },
  findings: [], corrections: [],
  decision: { approved: false, rationale: "Visual inspection has not been completed." },
  contactSheet: { durationSeconds: contactSheetReport?.durationSeconds ?? null, sampleTimestampsSeconds: contactSheetReport?.sampleTimestampsSeconds ?? [] },
});
export const sha256Buffer = (buffer: Uint8Array) => createHash("sha256").update(buffer).digest("hex");
const main = async () => {
  const outputName = process.env.OUTPUT_NAME;
  if (!outputName) throw new Error("OUTPUT_NAME is required.");
  const videoPath = resolve(process.env.VIDEO_PATH ?? `render-output/${outputName}.mp4`);
  const sheetReportPath = resolve(process.env.CONTACT_SHEET_REPORT_PATH ?? `render-output/review/${outputName}.contact-sheet.json`);
  const reportPath = resolve(process.env.VISUAL_REVIEW_REPORT_PATH ?? `render-output/review/${outputName}.visual-review.json`);
  const video = await readFile(videoPath);
  const sheetReport = JSON.parse(await readFile(sheetReportPath, "utf8"));
  const report = buildVisualReviewReport({ outputName, videoPath: `${outputName}.mp4`, contactSheetPath: `review/${outputName}.contact-sheet.jpg`, contactSheetReportPath: `review/${outputName}.contact-sheet.json`, videoSha256: sha256Buffer(video), contactSheetReport: sheetReport });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  const summary = `Visual review: PENDING — inspect the actual MP4, then complete ${outputName}.visual-review.json. Contact sheet is sampling evidence only; it does not approve motion or audio.`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
};
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
