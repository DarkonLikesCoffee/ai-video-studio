import type { VideoProject } from "./project";

const FRAME_FIELDS = new Set([
  "startInFrames",
  "durationInFrames",
  "fadeInFrames",
  "fadeOutFrames",
  "lifeInFrames",
]);

const scaleFrameValue = (value: number, ratio: number, field: string): number => {
  const scaled = Math.round(value * ratio);
  return field === "startInFrames" ? Math.max(0, scaled) : Math.max(1, scaled);
};

const scaleTimelineValue = (value: unknown, ratio: number, parentKey = ""): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => scaleTimelineValue(item, ratio, parentKey));
  }
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => {
      if (typeof child === "number" && FRAME_FIELDS.has(key)) {
        return [key, scaleFrameValue(child, ratio, key)];
      }
      if (typeof child === "number" && key === "frame" && parentKey === "keyframes") {
        return [key, Math.max(0, Math.round(child * ratio))];
      }
      return [key, scaleTimelineValue(child, ratio, key)];
    }),
  );
};

/**
 * Retimes every scene, transition, animation, particle lifetime, subtitle and
 * non-generated audio event onto a new common frame timeline. Source-media
 * trims and playback rates are deliberately left untouched.
 */
export const retimeProjectToDuration = (
  project: VideoProject,
  targetDurationInFrames: number,
): VideoProject => {
  if (!Number.isInteger(targetDurationInFrames) || targetDurationInFrames < 1) {
    throw new Error("Target timeline duration must be a positive integer frame count.");
  }
  const currentDuration = project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
  if (currentDuration < 1) throw new Error("Cannot retime a project with an empty timeline.");

  const ratio = targetDurationInFrames / currentDuration;
  const retimed = scaleTimelineValue(project, ratio) as VideoProject;
  const retimedDuration = retimed.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
  const lastScene = retimed.scenes.at(-1);
  if (!lastScene) throw new Error("Cannot retime a project without scenes.");
  lastScene.durationInFrames += targetDurationInFrames - retimedDuration;
  if (lastScene.durationInFrames < 1) {
    throw new Error("Target duration is too short to preserve every scene.");
  }
  return retimed;
};
