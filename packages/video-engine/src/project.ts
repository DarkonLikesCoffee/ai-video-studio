export type SceneType = "title" | "content" | "outro";
export type MediaType = "image" | "video";
export type MediaPlacement = "background" | "left" | "right";
export type MediaFit = "cover" | "contain";

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
  media?: SceneMedia;
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

export const isRemoteMediaUrl = (src: string): boolean => {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.username && !url.password;
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

        if (scene.media !== undefined) {
          const media = isRecord(scene.media) ? scene.media : {};
          if (media.type !== "image" && media.type !== "video") {
            errors.push(`${prefix}.media.type must be image or video`);
          }
          if (!isNonEmptyString(media.src)) {
            errors.push(`${prefix}.media.src is required`);
          } else {
            const remote = isRemoteMediaUrl(media.src);
            const local = isSafeProjectAssetPath(media.src);
            if (!remote && !local) {
              errors.push(`${prefix}.media.src must be an HTTPS URL or a safe path under assets/`);
            } else {
              const extension = getExtension(media.src);
              const allowed = media.type === "image" ? imageExtensions : videoExtensions;
              if (!allowed.has(extension)) {
                errors.push(`${prefix}.media.src has an unsupported extension for ${String(media.type)} media`);
              }
            }
          }
          if (media.placement !== undefined &&
              media.placement !== "background" &&
              media.placement !== "left" &&
              media.placement !== "right") {
            errors.push(`${prefix}.media.placement must be background, left, or right`);
          }
          if (media.fit !== undefined && media.fit !== "cover" && media.fit !== "contain") {
            errors.push(`${prefix}.media.fit must be cover or contain`);
          }
          if (media.position !== undefined &&
              (typeof media.position !== "string" ||
               media.position.length > 40 ||
               !/^[A-Za-z0-9% ._-]+$/.test(media.position))) {
            errors.push(`${prefix}.media.position must be a short CSS object-position value`);
          }
          if (media.opacity !== undefined &&
              (!isFiniteNumber(media.opacity) || media.opacity < 0 || media.opacity > 1)) {
            errors.push(`${prefix}.media.opacity must be between 0 and 1`);
          }
          if (media.type === "video") {
            if (media.trimBefore !== undefined &&
                (!isInteger(media.trimBefore) || media.trimBefore < 0 || media.trimBefore > 18000)) {
              errors.push(`${prefix}.media.trimBefore must be an integer between 0 and 18000`);
            }
            if (media.playbackRate !== undefined &&
                (!isFiniteNumber(media.playbackRate) || media.playbackRate < 0.25 || media.playbackRate > 4)) {
              errors.push(`${prefix}.media.playbackRate must be between 0.25 and 4`);
            }
            if (media.muted !== undefined && typeof media.muted !== "boolean") {
              errors.push(`${prefix}.media.muted must be a boolean`);
            }
            if (media.volume !== undefined &&
                (!isFiniteNumber(media.volume) || media.volume < 0 || media.volume > 1)) {
              errors.push(`${prefix}.media.volume must be between 0 and 1`);
            }
          } else if (
            media.trimBefore !== undefined ||
            media.playbackRate !== undefined ||
            media.muted !== undefined ||
            media.volume !== undefined
          ) {
            errors.push(`${prefix}.media video playback options are only valid for video media`);
          }
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
