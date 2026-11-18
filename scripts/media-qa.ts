import { spawn } from "node:child_process";

export type MediaQaOptions = {
  ffmpegPath?: string;
  ffprobePath?: string;
  silenceNoiseDb?: number;
  silenceMinDurationSeconds?: number;
  freezeNoiseDb?: number;
  freezeMinDurationSeconds?: number;
  blackPixelThreshold?: number;
  blackMinDurationSeconds?: number;
};

export type MediaStream = {
  index: number;
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  sample_rate?: string;
  channels?: number;
  duration?: string;
  avg_frame_rate?: string;
  r_frame_rate?: string;
};

export type MediaQaReport = {
  schemaVersion: 1;
  file: string;
  passed: boolean;
  thresholds: {
    silenceNoiseDb: number;
    silenceMinDurationSeconds: number;
    freezeNoiseDb: number;
    freezeMinDurationSeconds: number;
    blackPixelThreshold: number;
    blackMinDurationSeconds: number;
  };
  format: {
    durationSeconds: number;
    sizeBytes: number;
    bitRate?: number;
    formatName?: string;
  };
  streams: MediaStream[];
  video?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    frameCount?: number;
  };
  audio?: {
    codec: string;
    sampleRate: number;
    channels: number;
    durationSeconds?: number;
  };
  findings: Array<{
    severity: "error" | "warning";
    code: string;
    message: string;
    startSeconds?: number;
    endSeconds?: number;
    durationSeconds?: number;
  }>;
  measurements: {
    silenceIntervals: Array<{ startSeconds: number; endSeconds: number; durationSeconds: number }>;
    frozenIntervals: Array<{ startSeconds: number; endSeconds: number; durationSeconds: number }>;
    blackIntervals: Array<{ startSeconds: number; endSeconds: number; durationSeconds: number }>;
    loudnessSummary?: string;
  };
};

const defaults: Required<MediaQaOptions> = {
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
  ffprobePath: process.env.FFPROBE_PATH || "ffprobe",
  silenceNoiseDb: -50,
  silenceMinDurationSeconds: 0.75,
  freezeNoiseDb: -60,
  freezeMinDurationSeconds: 1.5,
  blackPixelThreshold: 0.02,
  blackMinDurationSeconds: 0.5,
};

const run = (command: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", error => reject(new Error(`Could not start ${command}: ${error.message}`)));
    child.on("close", code => code === 0
      ? resolve(stdout + "\n" + stderr)
      : reject(new Error(`${command} exited with code ${code}:\n${stderr.slice(-12000)}`)));
  });

const parseIntervals = (
  output: string,
  expression: RegExp,
): Array<{ startSeconds: number; endSeconds: number; durationSeconds: number }> => {
  const intervals = [];
  for (const match of output.matchAll(expression)) {
    const startSeconds = Number(match[1]);
    const endSeconds = Number(match[2]);
    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) continue;
    intervals.push({
      startSeconds,
      endSeconds,
      durationSeconds: Number((endSeconds - startSeconds).toFixed(3)),
    });
  }
  return intervals;
};

const fpsNumber = (value?: string): number => {
  if (!value) return 0;
  const [numeratorText, denominatorText] = value.split("/");
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);
  if (!numeratorText || !denominatorText ||
      !Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
};

export const buildMediaQaReport = (
  file: string,
  probe: { streams?: MediaStream[]; format?: Record<string, string | number> },
  audioLog: string,
  videoLog: string,
  options: MediaQaOptions = {},
): MediaQaReport => {
  const config = { ...defaults, ...options };
  const streams = probe.streams ?? [];
  const format = probe.format ?? {};
  const durationSeconds = Number(format.duration ?? 0);
  const sizeBytes = Number(format.size ?? 0);
  const videoStream = streams.find(stream => stream.codec_type === "video");
  const audioStream = streams.find(stream => stream.codec_type === "audio");
  const silenceIntervals = parseIntervals(
    audioLog,
    /silence_start:\s*(-?[0-9.]+)[\s\S]*?silence_end:\s*([0-9.]+)/g,
  );
  const frozenIntervals = parseIntervals(
    videoLog,
    /freeze_start:\s*([0-9.]+)[\s\S]*?freeze_end:\s*([0-9.]+)/g,
  );
  const blackIntervals = parseIntervals(
    videoLog,
    /black_start:\s*([0-9.]+)[\s\S]*?black_end:\s*([0-9.]+)/g,
  );

  const findings: MediaQaReport["findings"] = [];
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    findings.push({ severity: "error", code: "invalid-duration", message: "The file has no valid positive duration." });
  }
  if (!videoStream) {
    findings.push({ severity: "error", code: "missing-video-stream", message: "The MP4 contains no video stream." });
  }
  if (!audioStream) {
    findings.push({ severity: "error", code: "missing-audio-stream", message: "The MP4 contains no audio stream." });
  }
  for (const interval of silenceIntervals) {
    findings.push({
      severity: "warning",
      code: "silence",
      message: `Audio silence detected for ${interval.durationSeconds.toFixed(2)} seconds.`,
      ...interval,
    });
  }
  for (const interval of frozenIntervals) {
    findings.push({
      severity: "warning",
      code: "frozen-video",
      message: `Video freeze detected for ${interval.durationSeconds.toFixed(2)} seconds.`,
      ...interval,
    });
  }
  for (const interval of blackIntervals) {
    findings.push({
      severity: "warning",
      code: "black-video",
      message: `Black frame interval detected for ${interval.durationSeconds.toFixed(2)} seconds.`,
      ...interval,
    });
  }

  const loudnessSummary = audioLog.match(/Integrated loudness:\s*([^\n]+)/)?.[1]?.trim();
  const video = videoStream ? {
    codec: videoStream.codec_name ?? "unknown",
    width: Number(videoStream.width ?? 0),
    height: Number(videoStream.height ?? 0),
    fps: fpsNumber(videoStream.avg_frame_rate || videoStream.r_frame_rate),
    ...(Number.isFinite(Number(videoStream.duration)) && Number(videoStream.duration) > 0
      ? { frameCount: Math.round(Number(videoStream.duration) * fpsNumber(videoStream.avg_frame_rate || videoStream.r_frame_rate)) }
      : {}),
  } : undefined;
  const audio = audioStream ? {
    codec: audioStream.codec_name ?? "unknown",
    sampleRate: Number(audioStream.sample_rate ?? 0),
    channels: Number(audioStream.channels ?? 0),
    ...(Number.isFinite(Number(audioStream.duration)) && Number(audioStream.duration) > 0
      ? { durationSeconds: Number(audioStream.duration) }
      : {}),
  } : undefined;

  return {
    schemaVersion: 1,
    file,
    passed: !findings.some(finding => finding.severity === "error"),
    thresholds: {
      silenceNoiseDb: config.silenceNoiseDb,
      silenceMinDurationSeconds: config.silenceMinDurationSeconds,
      freezeNoiseDb: config.freezeNoiseDb,
      freezeMinDurationSeconds: config.freezeMinDurationSeconds,
      blackPixelThreshold: config.blackPixelThreshold,
      blackMinDurationSeconds: config.blackMinDurationSeconds,
    },
    format: {
      durationSeconds,
      sizeBytes,
      ...(Number.isFinite(Number(format.bit_rate)) ? { bitRate: Number(format.bit_rate) } : {}),
      ...(typeof format.format_name === "string" ? { formatName: format.format_name } : {}),
    },
    streams,
    ...(video ? { video } : {}),
    ...(audio ? { audio } : {}),
    findings,
    measurements: { silenceIntervals, frozenIntervals, blackIntervals, ...(loudnessSummary ? { loudnessSummary } : {}) },
  };
};

export const inspectMedia = async (
  file: string,
  options: MediaQaOptions = {},
): Promise<MediaQaReport> => {
  const config = { ...defaults, ...options };
  const probeRaw = await run(config.ffprobePath, [
    "-v", "error", "-show_streams", "-show_format", "-of", "json", file,
  ]);
  const probe = JSON.parse(probeRaw) as { streams?: MediaStream[]; format?: Record<string, string | number> };
  const hasAudio = (probe.streams ?? []).some(stream => stream.codec_type === "audio");
  const hasVideo = (probe.streams ?? []).some(stream => stream.codec_type === "video");

  const audioLog = hasAudio ? await run(config.ffmpegPath, [
    "-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af",
    `silencedetect=noise=${config.silenceNoiseDb}dB:d=${config.silenceMinDurationSeconds},ebur128=framelog=verbose`,
    "-f", "null", "-",
  ]) : "";
  const videoLog = hasVideo ? await run(config.ffmpegPath, [
    "-hide_banner", "-nostats", "-i", file, "-map", "0:v:0", "-vf",
    `freezedetect=n=-${Math.abs(config.freezeNoiseDb)}dB:d=${config.freezeMinDurationSeconds},blackdetect=d=${config.blackMinDurationSeconds}:pix_th=${config.blackPixelThreshold}`,
    "-an", "-f", "null", "-",
  ]) : "";

  return buildMediaQaReport(file, probe, audioLog, videoLog, options);
};
