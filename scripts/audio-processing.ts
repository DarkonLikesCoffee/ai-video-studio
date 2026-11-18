import type { AudioTrack } from "../packages/video-engine/src/project";

export const buildAudioInputArgs = (track: Pick<AudioTrack, "src" | "loop">): string[] => [
  ...(track.loop ? ["-stream_loop", "-1"] : []),
  "-i",
  track.src,
];

export const getSidechainTailSeconds = (
  trackDurationInFrames: number,
  sidechainDelayMs: number,
  fps: number,
): number => {
  if (!Number.isFinite(trackDurationInFrames) || trackDurationInFrames < 0 ||
      !Number.isFinite(sidechainDelayMs) || sidechainDelayMs < 0 ||
      !Number.isFinite(fps) || fps <= 0) {
    throw new Error("Sidechain timeline values must be finite and non-negative, with a positive FPS.");
  }
  return Math.max(0, trackDurationInFrames / fps - sidechainDelayMs / 1000);
};

export const buildMainAudioFilter = (durationSeconds: number, loop: boolean): string => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Audio track duration must be a positive finite number.");
  }
  const filters = ["aresample=48000"];
  if (loop) filters.push(`atrim=duration=${durationSeconds.toFixed(5)}`);
  filters.push("aformat=sample_fmts=fltp:channel_layouts=stereo");
  return `[0:a]${filters.join(",")}[main0]`;
};

export const buildSidechainTailFilter = (durationSeconds: number): string[] => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Sidechain duration must be a positive finite number.");
  }
  return [
    `apad=whole_dur=${durationSeconds.toFixed(5)}`,
    `atrim=duration=${durationSeconds.toFixed(5)}`,
  ];
};
