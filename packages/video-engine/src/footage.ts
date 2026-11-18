export type NarratedFootageShot = {
  id: string;
  startSeconds: number;
  durationSeconds: number;
};

export type NarratedFootageAsset = {
  file: string;
  license: string;
  shotIds: string[];
};

export type NarratedFootageTimelineClip = {
  id: string;
  src: string;
  startInFrames: number;
  durationInFrames: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSafeFootageFilename = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:mp4|webm|mov|ogv)$/i.test(value);

/**
 * Resolve reviewed local footage assets onto the matching storyboard shots.
 * The first manifest asset assigned to a shot wins, so duplicate selections
 * cannot stack several full-frame clips over one another accidentally.
 */
export const buildNarratedFootageTimeline = (
  manifestValue: unknown,
  planValue: unknown,
  fps: number,
): NarratedFootageTimelineClip[] => {
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) {
    throw new Error("Narrated footage fps must be an integer between 1 and 120.");
  }
  if (!isRecord(manifestValue) || !Array.isArray(manifestValue.assets)) {
    throw new Error("Narrated footage manifest must contain an assets array.");
  }
  if (!isRecord(planValue) || !Array.isArray(planValue.shots)) {
    throw new Error("Narrated footage plan must contain a shots array.");
  }

  const shots = new Map<string, NarratedFootageShot>();
  for (const value of planValue.shots) {
    if (!isRecord(value) || typeof value.id !== "string" ||
        typeof value.startSeconds !== "number" || !Number.isFinite(value.startSeconds) ||
        typeof value.durationSeconds !== "number" || !Number.isFinite(value.durationSeconds) ||
        value.startSeconds < 0 || value.durationSeconds <= 0) {
      continue;
    }
    shots.set(value.id, {
      id: value.id,
      startSeconds: value.startSeconds,
      durationSeconds: value.durationSeconds,
    });
  }

  const assignedShots = new Set<string>();
  const clips: NarratedFootageTimelineClip[] = [];
  for (const [assetIndex, value] of manifestValue.assets.entries()) {
    if (!isRecord(value) || !isSafeFootageFilename(value.file) ||
        !isAllowedFootageLicense(value.license) || !Array.isArray(value.shotIds)) {
      continue;
    }
    for (const shotId of value.shotIds) {
      if (typeof shotId !== "string" || assignedShots.has(shotId)) continue;
      const shot = shots.get(shotId);
      if (!shot) continue;
      const startInFrames = Math.round(shot.startSeconds * fps);
      const durationInFrames = Math.round(shot.durationSeconds * fps);
      if (durationInFrames < 1) continue;
      clips.push({
        id: "footage-" + shot.id + "-" + assetIndex,
        src: "assets/" + value.file,
        startInFrames,
        durationInFrames,
      });
      assignedShots.add(shotId);
    }
  }
  return clips.sort((a, b) => a.startInFrames - b.startInFrames);
};
