import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaQaReport, buildMediaQaAudioFilter } from "../scripts/media-qa";

const probe = {
  format: { duration: "60.1", size: "7000000", bit_rate: "900000", format_name: "mov,mp4" },
  streams: [
    { index: 0, codec_type: "video", codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "30/1", duration: "60.1" },
    { index: 1, codec_type: "audio", codec_name: "aac", sample_rate: "48000", channels: 2, duration: "60.1" },
  ],
};

test("media QA reports metadata and clean audio/video", () => {
  const report = buildMediaQaReport("clean.mp4", probe, "", "");
  assert.equal(report.passed, true);
  assert.equal(report.video?.fps, 30);
  assert.equal(report.audio?.sampleRate, 48000);
  assert.equal(report.findings.length, 0);
});

test("media QA detects long digital silence intervals with timestamps", () => {
  const report = buildMediaQaReport(
    "gapped.mp4",
    probe,
    "[silencedetect] silence_start: 46.850\n[silencedetect] silence_end: 50.070 | silence_duration: 3.220\n",
    "",
  );
  assert.equal(report.passed, false);
  assert.deepEqual(report.measurements.silenceIntervals, [
    { startSeconds: 46.85, endSeconds: 50.07, durationSeconds: 3.22 },
  ]);
  assert.equal(report.findings[0]?.code, "silence");
  assert.equal(report.findings[0]?.severity, "error");
});

test("media QA keeps short silence as a warning but rejects excessive A/V drift", () => {
  const shortSilence = buildMediaQaReport(
    "brief-pause.mp4",
    probe,
    "[silencedetect] silence_start: 4.0" + String.fromCharCode(10) + "[silencedetect] silence_end: 5.0 | silence_duration: 1.0",
    "",
  );
  assert.equal(shortSilence.passed, true);
  assert.equal(shortSilence.findings[0]?.severity, "warning");

  const mismatchedProbe = {
    ...probe,
    streams: [
      probe.streams[0]!,
      { ...probe.streams[1]!, duration: "58.9" },
    ],
  };
  const mismatch = buildMediaQaReport("mismatch.mp4", mismatchedProbe, "", "");
  assert.equal(mismatch.passed, false);
  assert.ok(Math.abs((mismatch.measurements.audioVideoDurationDriftSeconds ?? 0) - 1.2) < 0.001);
  assert.ok(mismatch.findings.some((finding) => finding.code === "audio-video-duration-mismatch"));
});

test("media QA detects frozen video and black intervals", () => {
  const report = buildMediaQaReport(
    "bad-video.mp4",
    probe,
    "",
    "[freezedetect] freeze_start: 12.0\n[freezedetect] freeze_end: 15.0 | freeze_duration: 3.0\n[blackdetect] black_start:20.000 black_end:22.500 black_duration:2.500\n",
  );
  assert.equal(report.measurements.frozenIntervals[0]?.durationSeconds, 3);
  assert.equal(report.measurements.blackIntervals[0]?.durationSeconds, 2.5);
  assert.deepEqual(report.findings.map(f => f.code), ["frozen-video", "black-video"]);
  assert.ok(report.findings.every((finding) => finding.severity === "error"));
  assert.equal(report.passed, false);
});

test("media QA fails when video or audio stream is missing", () => {
  const report = buildMediaQaReport("silent.mp4", { ...probe, streams: [probe.streams[0]!] }, "", "");
  assert.equal(report.passed, false);
  assert.ok(report.findings.some(f => f.code === "missing-audio-stream"));
});


test("media QA reports true peak and warns above -1 dBFS without failing", () => {
  const report = buildMediaQaReport("near-peak.mp4", probe, "Integrated loudness: -16.0 LUFS\nTrue peak: -0.5 dBFS\n", "");
  assert.equal(report.measurements.truePeakDbfs, -0.5);
  assert.equal(report.passed, true);
  assert.ok(report.findings.some(f => f.code === "true-peak-near-limit" && f.severity === "warning"));
});

test("media QA fails true peak above 0 dBFS ceiling", () => {
  const report = buildMediaQaReport("clipped.mp4", probe, "Integrated loudness: -15.0 LUFS\nTrue peak: 0.3 dBFS\n", "");
  assert.equal(report.measurements.truePeakDbfs, 0.3);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some(f => f.code === "true-peak-over-limit" && f.severity === "error"));
});

test("media QA parses FFmpeg EBU R128 true peak summary format", () => {
  const report = buildMediaQaReport(
    "ebu-summary.mp4",
    probe,
    "Integrated loudness:\\n  I: -16.0 LUFS\\n\\nTrue peak:\\n  Peak: -1.5 dBFS\\n",
    "",
  );
  assert.equal(report.measurements.truePeakDbfs, -1.5);
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
});

test("media QA enables true-peak measurement and keeps silence thresholds configurable", () => {
  assert.match(buildMediaQaAudioFilter(), /ebur128=peak=true:framelog=verbose/);
  assert.match(buildMediaQaAudioFilter(), /silencedetect=noise=-50dB:d=0.75/);
  assert.equal(
    buildMediaQaAudioFilter({ silenceNoiseDb: -42, silenceMinDurationSeconds: 0.5 }),
    "silencedetect=noise=-42dB:d=0.5,ebur128=peak=true:framelog=verbose",
  );
});

test("media QA accepts true peak at or below recommended ceiling", () => {
  const report = buildMediaQaReport("safe-peak.mp4", probe, "True peak: -1.2 dBFS\n", "");
  assert.equal(report.measurements.truePeakDbfs, -1.2);
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
});


test("media QA detects trailing silence that has no silence_end at EOF", () => {
  const report = buildMediaQaReport(
    "trailing-silence.mp4",
    probe,
    "[silencedetect] silence_start: 55.0\\n",
    "",
  );
  assert.deepEqual(report.measurements.silenceIntervals, [
    { startSeconds: 55, endSeconds: 60.1, durationSeconds: 5.1 },
  ]);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some(f => f.code === "silence" && f.severity === "error"));
});

test("media QA closes short trailing silence at EOF and skips zero-length trailing intervals", () => {
  const short = buildMediaQaReport("short-trailing.mp4", probe, "silence_start: 58.2\\n", "");
  assert.deepEqual(short.measurements.silenceIntervals, [
    { startSeconds: 58.2, endSeconds: 60.1, durationSeconds: 1.9 },
  ]);
  assert.equal(short.passed, true);
  const zeroLength = buildMediaQaReport("zero-trailing.mp4", probe, "silence_start: 60.1\\n", "");
  assert.deepEqual(zeroLength.measurements.silenceIntervals, []);
});
