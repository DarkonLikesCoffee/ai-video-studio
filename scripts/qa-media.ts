import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectMedia } from "./media-qa";

const input = process.argv[2];
const outputArg = process.argv[3];
if (!input) {
  process.stderr.write("Usage: npm run qa:media -- <rendered.mp4> [report.json]\n");
  process.exit(2);
}
const inputPath = resolve(input);
const outputPath = resolve(outputArg ?? inputPath.replace(/\\.mp4$/i, "") + ".qa.json");
try {
  const report = await inspectMedia(inputPath);
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  process.stdout.write(`Media QA report: ${outputPath}\n`);
  process.stdout.write(`Duration: ${report.format.durationSeconds.toFixed(2)}s | ${report.video?.width ?? 0}x${report.video?.height ?? 0} | ${report.video?.fps ?? 0}fps\n`);
  process.stdout.write(`Audio: ${report.audio ? `${report.audio.codec}, ${report.audio.sampleRate}Hz, ${report.audio.channels}ch` : "missing"}\n`);
  process.stdout.write(`Findings: ${report.findings.length}\n`);
  for (const finding of report.findings) {
    const timestamp = finding.startSeconds === undefined ? "" : ` @ ${finding.startSeconds.toFixed(2)}s`;
    process.stdout.write(`- [${finding.severity.toUpperCase()}] ${finding.code}${timestamp}: ${finding.message}\n`);
  }
  if (!report.passed) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`Media QA failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
