import { Easing, interpolate } from "remotion";
import type { AnimationEasing, AnimationKeyframe, AnimationTrack, AnimationTracks } from "./project";

const easingPresets = {
  linear: Easing.linear,
  "ease-in": Easing.in(Easing.cubic),
  "ease-out": Easing.out(Easing.cubic),
  "ease-in-out": Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back()),
  bounce: Easing.out(Easing.bounce),
  elastic: Easing.out(Easing.elastic()),
  spring: Easing.spring(),
};

const resolveEasing = (easing: AnimationEasing | undefined) => {
  if (easing === undefined) return Easing.linear;
  if (typeof easing === "string") return easingPresets[easing];

  if (easing.type === "bezier") {
    return Easing.bezier(easing.x1, easing.y1, easing.x2, easing.y2);
  }

  return Easing.spring({
    ...(easing.stiffness === undefined ? {} : { stiffness: easing.stiffness }),
    ...(easing.damping === undefined ? {} : { damping: easing.damping }),
    ...(easing.mass === undefined ? {} : { mass: easing.mass }),
    ...(easing.overshootClamping === undefined ? {} : { overshootClamping: easing.overshootClamping }),
  });
};

/**
 * Resolve a numeric animation track at a local frame.
 * The easing declared on a keyframe applies to the segment leading to the next keyframe.
 */
export const evaluateAnimationTrack = (
  frame: number,
  track: AnimationTrack | undefined,
  fallback: number
): number => {
  if (!track || track.keyframes.length === 0) return fallback;

  const keyframes: AnimationKeyframe[] = track.keyframes;
  if (keyframes.length === 1) return keyframes[0]!.value;

  return interpolate(
    frame,
    keyframes.map((keyframe) => keyframe.frame),
    keyframes.map((keyframe) => keyframe.value),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: keyframes.slice(0, -1).map((keyframe) => resolveEasing(keyframe.easing)),
    }
  );
};

export const evaluateAnimationTracks = (
  frame: number,
  tracks: AnimationTracks | undefined,
  defaults: Partial<Record<keyof AnimationTracks, number>>
): Partial<Record<keyof AnimationTracks, number>> => {
  if (!tracks) return {};
  const values: Partial<Record<keyof AnimationTracks, number>> = {};

  for (const [property, track] of Object.entries(tracks)) {
    values[property as keyof AnimationTracks] = evaluateAnimationTrack(
      frame,
      track,
      defaults[property as keyof AnimationTracks] ?? 0
    );
  }

  return values;
};
