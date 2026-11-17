export type SceneType = "title" | "content" | "outro";
export type MediaType = "image" | "video";
export type MediaPlacement = "background" | "left" | "right";
export type MediaFit = "cover" | "contain";

export type AnimationProperty =
  | "x" | "y" | "width" | "height"
  | "opacity" | "rotation" | "scaleX" | "scaleY";

export type AnimationEasing =
  | "linear" | "ease-in" | "ease-out" | "ease-in-out"
  | "back" | "bounce" | "elastic" | "spring"
  | { type: "bezier"; x1: number; y1: number; x2: number; y2: number }
  | { type: "spring"; stiffness?: number; damping?: number; mass?: number; overshootClamping?: boolean };

export type AnimationKeyframe = {
  /** Frame relative to the start of this element's own timeline. */
  frame: number;
  value: number;
  /** Easing applied from this keyframe to the next keyframe. */
  easing?: AnimationEasing;
};

export type AnimationTrack = {
  keyframes: AnimationKeyframe[];
};

export type AnimationTracks = Partial<Record<AnimationProperty, AnimationTrack>>;

export type SceneMedia = {
  type: MediaType;
  /** Local paths must be inside the project's assets/ folder. HTTPS URLs are also supported. */
  src: string;
  placement?: MediaPlacement;
  fit?: MediaFit;
  position?: string;
  opacity?: number;
  /** Video source-frame trim, playback speed, and optional embedded audio controls. */
  trimBefore?: number;
  playbackRate?: number;
  muted?: boolean;
  volume?: number;
  /** Optional explicit layer ID. */
  id?: string;
  /** Optional normalized position and size, expressed as percentages of the scene. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  /** Timeline visibility window relative to the start of the scene. */
  startInFrames?: number;
  durationInFrames?: number;
  /** Animated geometry and appearance, evaluated relative to this layer's start. */
  animations?: AnimationTracks;
};

export type VideoScene = {
  id: string;
  type: SceneType;
  durationInFrames: number;
  eyebrow?: string;
  title: string;
  body?: string;
  backgroundColor?: string;
  accentColor?: string;
  /** Legacy single-layer property. Kept for backwards compatibility. */
  media?: SceneMedia;
  /** Up to eight simultaneous composited image/video layers. */
  mediaLayers?: SceneMedia[];
  /** Independent timeline animation tracks for text elements. x/y are percentage translations. */
  eyebrowAnimation?: AnimationTracks;
  titleAnimation?: AnimationTracks;
  bodyAnimation?: AnimationTracks;
};

export type VideoProject = {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  composition: {
    id: "ProjectVideo";
    width: number;
    height: number;
    fps: number;
  };
  scenes: VideoScene[];
  output: {
    format: "mp4";
    codec: "h264";
  };
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const sceneTypes = new Set<SceneType>(["title", "content", "outro"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]);
const videoExtensions = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);

const getExtension = (path: string): string => {
  const cleanPath = path.split(/[?#]/, 1)[0] ?? path;
  const filename = cleanPath.split("/").pop() ?? "";
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot).toLowerCase();
};

const isNonPublicIpv4 = (hostname: string): boolean => {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;

  const [first, second, third] = parts.map(Number);
  if (first === undefined || second === undefined || third === undefined) return false;
  if ([first, second, third, Number(parts[3])].some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0) ||
    (first === 198 && (second === 18 || second === 19 || second === 51)) ||
    (first === 203 && second === 0 && third === 113);
};

const isNonPublicHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    return true;
  }

  if (isNonPublicIpv4(host)) return true;

  if (host.includes(":")) {
    const normalized = host.split("%")[0] ?? host;
    if (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff")
    ) {
      return true;
    }
    if (normalized.startsWith("::ffff:")) {
      return isNonPublicIpv4(normalized.slice("::ffff:".length));
    }
  }

  return false;
};

export const isRemoteMediaUrl = (src: string): boolean => {
  try {
    const url = new URL(src);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !isNonPublicHostname(url.hostname);
  } catch {
    return false;
  }
};

export const isSafeProjectAssetPath = (src: string): boolean => {
  if (!src.startsWith("assets/") || src.includes("\\") || src.includes("?") || src.includes("#")) {
    return false;
  }
  const segments = src.split("/");
  return segments.length >= 2 &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..") &&
    /^[A-Za-z0-9._/-]+$/.test(src);
};


const animationProperties = new Set<AnimationProperty>([
  "x", "y", "width", "height", "opacity", "rotation", "scaleX", "scaleY"
]);
const easingNames = new Set(["linear", "ease-in", "ease-out", "ease-in-out", "back", "bounce", "elastic", "spring"]);

const validateEasing = (value: unknown, prefix: string): string[] => {
  if (typeof value === "string") {
    return easingNames.has(value) ? [] : [`${prefix} has an unsupported easing preset`];
  }
  if (!isRecord(value)) return [`${prefix} must be a supported easing preset or object`];

  const errors: string[] = [];
  if (value.type === "bezier") {
    for (const field of ["x1", "y1", "x2", "y2"] as const) {
      if (!isFiniteNumber(value[field])) errors.push(`${prefix}.${field} must be a finite number`);
    }
    if (isFiniteNumber(value.x1) && (value.x1 < 0 || value.x1 > 1)) errors.push(`${prefix}.x1 must be between 0 and 1`);
    if (isFiniteNumber(value.x2) && (value.x2 < 0 || value.x2 > 1)) errors.push(`${prefix}.x2 must be between 0 and 1`);
    if (isFiniteNumber(value.y1) && (value.y1 < -2 || value.y1 > 2)) errors.push(`${prefix}.y1 must be between -2 and 2`);
    if (isFiniteNumber(value.y2) && (value.y2 < -2 || value.y2 > 2)) errors.push(`${prefix}.y2 must be between -2 and 2`);
    return errors;
  }

  if (value.type === "spring") {
    for (const field of ["stiffness", "damping", "mass"] as const) {
      if (value[field] !== undefined &&
          (!isFiniteNumber(value[field]) || value[field] <= 0 || value[field] > 1000)) {
        errors.push(`${prefix}.${field} must be greater than 0 and at most 1000`);
      }
    }
    if (value.overshootClamping !== undefined && typeof value.overshootClamping !== "boolean") {
      errors.push(`${prefix}.overshootClamping must be a boolean`);
    }
    return errors;
  }

  return [`${prefix}.type must be bezier or spring`];
};

export const validateAnimationTracks = (
  value: unknown,
  prefix: string,
  maxFrames: number
): string[] => {
  if (!isRecord(value)) return [`${prefix} must be an object of animation tracks`];
  const errors: string[] = [];

  for (const [property, trackValue] of Object.entries(value)) {
    if (!animationProperties.has(property as AnimationProperty)) {
      errors.push(`${prefix}.${property} is not an animatable property`);
      continue;
    }

    const track = isRecord(trackValue) ? trackValue : {};
    if (!Array.isArray(track.keyframes) || track.keyframes.length < 1 || track.keyframes.length > 30) {
      errors.push(`${prefix}.${property}.keyframes must contain between 1 and 30 keyframes`);
      continue;
    }

    let previousFrame = -1;
    track.keyframes.forEach((keyframeValue, index) => {
      const keyframe = isRecord(keyframeValue) ? keyframeValue : {};
      const keyframePrefix = `${prefix}.${property}.keyframes[${index}]`;

      if (!isInteger(keyframe.frame) || keyframe.frame < 0 || keyframe.frame >= maxFrames) {
        errors.push(`${keyframePrefix}.frame must be between 0 and ${Math.max(0, maxFrames - 1)}`);
      } else if (keyframe.frame <= previousFrame) {
        errors.push(`${keyframePrefix}.frame must be strictly greater than the previous frame`);
      } else {
        previousFrame = keyframe.frame;
      }

      if (!isFiniteNumber(keyframe.value)) {
        errors.push(`${keyframePrefix}.value must be a finite number`);
      } else if (property === "opacity" && (keyframe.value < 0 || keyframe.value > 1)) {
        errors.push(`${keyframePrefix}.value for opacity must be between 0 and 1`);
      } else if ((property === "width" || property === "height") &&
                 (keyframe.value <= 0 || keyframe.value > 100)) {
        errors.push(`${keyframePrefix}.value for ${property} must be greater than 0 and at most 100`);
      } else if ((property === "x" || property === "y") &&
                 (keyframe.value < 0 || keyframe.value > 100)) {
        errors.push(`${keyframePrefix}.value for ${property} must be between 0 and 100`);
      } else if (property === "rotation" && (keyframe.value < -3600 || keyframe.value > 3600)) {
        errors.push(`${keyframePrefix}.value for rotation must be between -3600 and 3600`);
      } else if ((property === "scaleX" || property === "scaleY") &&
                 (keyframe.value < 0 || keyframe.value > 20)) {
        errors.push(`${keyframePrefix}.value for ${property} must be between 0 and 20`);
      }

      if (keyframe.easing !== undefined) {
        errors.push(...validateEasing(keyframe.easing, `${keyframePrefix}.easing`));
      }
    });
  }

  return errors;
};

const validateSceneMedia = (value: unknown, prefix: string, sceneDuration: number): string[] => {
  const errors: string[] = [];
  const media = isRecord(value) ? value : {};

  if (media.type !== "image" && media.type !== "video") {
    errors.push(`${prefix}.type must be image or video`);
  }

  if (!isNonEmptyString(media.src)) {
    errors.push(`${prefix}.src is required`);
  } else {
    const remote = isRemoteMediaUrl(media.src);
    const local = isSafeProjectAssetPath(media.src);
    if (!remote && !local) {
      errors.push(`${prefix}.src must be an HTTPS URL or a safe path under assets/`);
    } else {
      const extension = getExtension(media.src);
      const allowed = media.type === "image" ? imageExtensions : videoExtensions;
      if (!allowed.has(extension)) {
        errors.push(`${prefix}.src has an unsupported extension for ${String(media.type)} media`);
      }
    }
  }

  if (media.id !== undefined &&
      (typeof media.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(media.id))) {
    errors.push(`${prefix}.id must contain 1-40 letters, numbers, underscores, or hyphens`);
  }
  if (media.placement !== undefined &&
      media.placement !== "background" &&
      media.placement !== "left" &&
      media.placement !== "right") {
    errors.push(`${prefix}.placement must be background, left, or right`);
  }
  if (media.fit !== undefined && media.fit !== "cover" && media.fit !== "contain") {
    errors.push(`${prefix}.fit must be cover or contain`);
  }
  if (media.position !== undefined &&
      (typeof media.position !== "string" ||
       media.position.length > 40 ||
       !/^[A-Za-z0-9% ._-]+$/.test(media.position))) {
    errors.push(`${prefix}.position must be a short CSS object-position value`);
  }
  if (media.opacity !== undefined &&
      (!isFiniteNumber(media.opacity) || media.opacity < 0 || media.opacity > 1)) {
    errors.push(`${prefix}.opacity must be between 0 and 1`);
  }

  const geometryFields = ["x", "y", "width", "height"] as const;
  const hasGeometry = geometryFields.some((field) => media[field] !== undefined);
  if (hasGeometry) {
    for (const field of geometryFields) {
      const value = media[field];
      if (!isFiniteNumber(value) || value < 0 || value > 100) {
        errors.push(`${prefix}.${field} must be between 0 and 100 when custom geometry is used`);
      }
    }
    if (isFiniteNumber(media.width) && media.width <= 0) {
      errors.push(`${prefix}.width must be greater than 0`);
    }
    if (isFiniteNumber(media.height) && media.height <= 0) {
      errors.push(`${prefix}.height must be greater than 0`);
    }
    if (isFiniteNumber(media.x) && isFiniteNumber(media.width) && media.x + media.width > 100) {
      errors.push(`${prefix}.x + width cannot exceed 100`);
    }
    if (isFiniteNumber(media.y) && isFiniteNumber(media.height) && media.y + media.height > 100) {
      errors.push(`${prefix}.y + height cannot exceed 100`);
    }
  }

  if (media.rotation !== undefined &&
      (!isFiniteNumber(media.rotation) || media.rotation < -360 || media.rotation > 360)) {
    errors.push(`${prefix}.rotation must be between -360 and 360 degrees`);
  }
  if (media.zIndex !== undefined &&
      (!isInteger(media.zIndex) || media.zIndex < -20 || media.zIndex > 20)) {
    errors.push(`${prefix}.zIndex must be an integer between -20 and 20`);
  }

  const start = media.startInFrames === undefined ? 0 : media.startInFrames;
  const duration = media.durationInFrames === undefined ? sceneDuration - (isInteger(start) ? start : 0) : media.durationInFrames;
  if (!isInteger(start) || start < 0 || start >= sceneDuration) {
    errors.push(`${prefix}.startInFrames must be between 0 and the last frame of the scene`);
  }
  if (!isInteger(duration) || duration < 1) {
    errors.push(`${prefix}.durationInFrames must be a positive integer`);
  } else if (isInteger(start) && start >= 0 && start + duration > sceneDuration) {
    errors.push(`${prefix} timeline window cannot extend beyond its scene`);
  }

  if (media.animations !== undefined) {
    const effectiveDuration = isInteger(media.durationInFrames)
      ? media.durationInFrames
      : sceneDuration - (isInteger(media.startInFrames) ? media.startInFrames : 0);
    errors.push(...validateAnimationTracks(media.animations, `${prefix}.animations`, effectiveDuration));
  }

  if (media.type === "video") {
    if (media.trimBefore !== undefined &&
        (!isInteger(media.trimBefore) || media.trimBefore < 0 || media.trimBefore > 18000)) {
      errors.push(`${prefix}.trimBefore must be an integer between 0 and 18000`);
    }
    if (media.playbackRate !== undefined &&
        (!isFiniteNumber(media.playbackRate) || media.playbackRate < 0.25 || media.playbackRate > 4)) {
      errors.push(`${prefix}.playbackRate must be between 0.25 and 4`);
    }
    if (media.muted !== undefined && typeof media.muted !== "boolean") {
      errors.push(`${prefix}.muted must be a boolean`);
    }
    if (media.volume !== undefined &&
        (!isFiniteNumber(media.volume) || media.volume < 0 || media.volume > 1)) {
      errors.push(`${prefix}.volume must be between 0 and 1`);
    }
  } else if (
    media.trimBefore !== undefined ||
    media.playbackRate !== undefined ||
    media.muted !== undefined ||
    media.volume !== undefined
  ) {
    errors.push(`${prefix} video playback options are only valid for video media`);
  }

  return errors;
};

export const getProjectDurationInFrames = (project: Pick<VideoProject, "scenes">): number =>
  project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);

/**
 * Validate the supported project schema. Remote assets must use HTTPS; local assets
 * are restricted to a safe relative path under the project's assets/ directory.
 */
export const validateProjectDefinition = (value: unknown): string[] => {
  const errors: string[] = [];
  if (!isRecord(value)) return ["project must be a JSON object"];

  if (value.schemaVersion !== 1) errors.push("schemaVersion must equal 1");
  if (!isNonEmptyString(value.id)) errors.push("id is required");
  if (!isNonEmptyString(value.title)) errors.push("title is required");

  const composition = isRecord(value.composition) ? value.composition : {};
  const compositionId = composition.id;
  if (compositionId !== "DemoVideo" && compositionId !== "ProjectVideo") {
    errors.push("composition.id must be DemoVideo or ProjectVideo");
  }
  if (!isInteger(composition.width) || composition.width < 1 || composition.width > 3840) {
    errors.push("composition.width must be an integer between 1 and 3840");
  }
  if (!isInteger(composition.height) || composition.height < 1 || composition.height > 2160) {
    errors.push("composition.height must be an integer between 1 and 2160");
  }
  if (!isInteger(composition.fps) || composition.fps < 1 || composition.fps > 60) {
    errors.push("composition.fps must be an integer between 1 and 60");
  }

  if (compositionId === "DemoVideo") {
    if (!isInteger(composition.durationInFrames) ||
        composition.durationInFrames < 1 ||
        composition.durationInFrames > 1800) {
      errors.push("DemoVideo composition.durationInFrames must be between 1 and 1800");
    }
  }

  if (compositionId === "ProjectVideo") {
    if (!Array.isArray(value.scenes) || value.scenes.length < 1 || value.scenes.length > 20) {
      errors.push("ProjectVideo must contain between 1 and 20 scenes");
    } else {
      const ids = new Set<string>();
      let totalFrames = 0;

      value.scenes.forEach((entry, index) => {
        const scene = isRecord(entry) ? entry : {};
        const prefix = `scenes[${index}]`;

        if (!isNonEmptyString(scene.id) || !/^[A-Za-z0-9_-]{1,40}$/.test(scene.id)) {
          errors.push(`${prefix}.id must contain 1-40 letters, numbers, underscores, or hyphens`);
        } else if (ids.has(scene.id)) {
          errors.push(`${prefix}.id must be unique`);
        } else {
          ids.add(scene.id);
        }

        if (typeof scene.type !== "string" || !sceneTypes.has(scene.type as SceneType)) {
          errors.push(`${prefix}.type must be title, content, or outro`);
        }
        if (!isInteger(scene.durationInFrames) ||
            scene.durationInFrames < 30 ||
            scene.durationInFrames > 900) {
          errors.push(`${prefix}.durationInFrames must be between 30 and 900`);
        } else {
          totalFrames += scene.durationInFrames;
        }
        if (!isNonEmptyString(scene.title) || scene.title.length > 120) {
          errors.push(`${prefix}.title is required and must be at most 120 characters`);
        }
        for (const field of ["eyebrow", "body"] as const) {
          const text = scene[field];
          const limit = field === "eyebrow" ? 60 : 400;
          if (text !== undefined && (typeof text !== "string" || text.length > limit)) {
            errors.push(`${prefix}.${field} must be text of at most ${limit} characters`);
          }
        }
        for (const field of ["backgroundColor", "accentColor"] as const) {
          const color = scene[field];
          if (color !== undefined && !isHexColor(color)) {
            errors.push(`${prefix}.${field} must be a six-digit hex color`);
          }
        }

        for (const field of ["eyebrowAnimation", "titleAnimation", "bodyAnimation"] as const) {
          if (scene[field] !== undefined) {
            errors.push(...validateAnimationTracks(
              scene[field],
              `${prefix}.${field}`,
              isInteger(scene.durationInFrames) ? scene.durationInFrames : 0
            ));
          }
        }

        const hasLegacyMedia = scene.media !== undefined;
        const hasMediaLayers = scene.mediaLayers !== undefined;

        if (hasLegacyMedia && hasMediaLayers) {
          errors.push(`${prefix} cannot define both media and mediaLayers`);
        }
        if (hasMediaLayers) {
          if (!Array.isArray(scene.mediaLayers) || scene.mediaLayers.length < 1 || scene.mediaLayers.length > 8) {
            errors.push(`${prefix}.mediaLayers must contain between 1 and 8 layers`);
          } else {
            const layerIds = new Set<string>();
            scene.mediaLayers.forEach((layer, layerIndex) => {
              const layerPrefix = `${prefix}.mediaLayers[${layerIndex}]`;
              const layerRecord = isRecord(layer) ? layer : {};
              if (typeof layerRecord.id === "string") {
                if (layerIds.has(layerRecord.id)) errors.push(`${layerPrefix}.id must be unique within the scene`);
                layerIds.add(layerRecord.id);
              }
              errors.push(...validateSceneMedia(layer, layerPrefix, isInteger(scene.durationInFrames) ? scene.durationInFrames : 0));
            });
          }
        } else if (hasLegacyMedia) {
          errors.push(...validateSceneMedia(
            scene.media,
            `${prefix}.media`,
            isInteger(scene.durationInFrames) ? scene.durationInFrames : 0
          ));
        }
      });

      if (totalFrames > 1800) errors.push("total scene duration must not exceed 1800 frames (60 seconds at 30 FPS)");
    }
  }

  const output = isRecord(value.output) ? value.output : {};
  if (output.format !== "mp4") errors.push("output.format must be mp4");
  if (output.codec !== "h264") errors.push("output.codec must be h264");

  return errors;
};
