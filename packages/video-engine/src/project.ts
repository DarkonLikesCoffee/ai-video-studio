export type SceneType = "title" | "content" | "outro";
export type MediaFit = "cover" | "contain";
export type MediaPosition = "center" | "top" | "bottom" | "left" | "right" | "top left" | "top right" | "bottom left" | "bottom right";

type SceneMediaBase = {
  source: "public" | "remote";
  src: string;
  fit?: MediaFit;
  position?: MediaPosition;
};

export type SceneMedia =
  | (SceneMediaBase & { type: "image"; alt?: string })
  | (SceneMediaBase & { type: "video"; muted?: boolean; loop?: boolean; playbackRate?: number });

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

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const sceneTypes = new Set<SceneType>(["title", "content", "outro"]);
const mediaTypes = new Set(["image", "video"]);
const mediaSources = new Set(["public", "remote"]);
const mediaFits = new Set<MediaFit>(["cover", "contain"]);
const mediaPositions = new Set<MediaPosition>([
  "center", "top", "bottom", "left", "right",
  "top left", "top right", "bottom left", "bottom right"
]);

const validateMedia = (value: unknown, prefix: string): string[] => {
  if (!isRecord(value)) return [`${prefix}.media must be an object`];

  const errors: string[] = [];
  if (typeof value.type !== "string" || !mediaTypes.has(value.type)) {
    errors.push(`${prefix}.media.type must be image or video`);
  }
  if (typeof value.source !== "string" || !mediaSources.has(value.source)) {
    errors.push(`${prefix}.media.source must be public or remote`);
  }
  if (!isNonEmptyString(value.src) || value.src.length > 2048) {
    errors.push(`${prefix}.media.src is required and must be at most 2048 characters`);
  } else if (value.source === "public") {
    const segments = value.src.split("/");
    const extension = value.src.split(".").pop()?.toLowerCase();
    const validImageExtension = ["png", "jpg", "jpeg", "webp", "svg"].includes(extension ?? "");
    const validVideoExtension = ["mp4", "webm", "mov"].includes(extension ?? "");

    if (!value.src.startsWith("assets/") ||
        value.src.startsWith("/") ||
        value.src.includes("\\") ||
        segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
        !/^[A-Za-z0-9._/-]+$/.test(value.src)) {
      errors.push(`${prefix}.media.src must be a safe path inside packages/video-engine/public/assets/`);
    } else if (value.type === "image" && !validImageExtension) {
      errors.push(`${prefix}.media.src must use a supported image extension (png, jpg, jpeg, webp, svg)`);
    } else if (value.type === "video" && !validVideoExtension) {
      errors.push(`${prefix}.media.src must use a supported video extension (mp4, webm, mov)`);
    }
  } else if (value.source === "remote" && isNonEmptyString(value.src)) {
    try {
      const url = new URL(value.src);
      const hostname = url.hostname.toLowerCase();
      const isPrivateHost =
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        hostname === "0.0.0.0" ||
        hostname === "[::1]" ||
        hostname.startsWith("[fc") ||
        hostname.startsWith("[fd") ||
        hostname.startsWith("[fe80:");

      if (url.protocol !== "https:" || !url.hostname || url.username || url.password || isPrivateHost) {
        errors.push(`${prefix}.media.src must be a public HTTPS URL without embedded credentials`);
      }
    } catch {
      errors.push(`${prefix}.media.src must be a valid HTTPS URL`);
    }
  }

  if (value.fit !== undefined && (typeof value.fit !== "string" || !mediaFits.has(value.fit as MediaFit))) {
    errors.push(`${prefix}.media.fit must be cover or contain`);
  }
  if (value.position !== undefined &&
      (typeof value.position !== "string" || !mediaPositions.has(value.position as MediaPosition))) {
    errors.push(`${prefix}.media.position must be a supported position keyword`);
  }

  if (value.type === "image") {
    if (value.alt !== undefined && (typeof value.alt !== "string" || value.alt.length > 200)) {
      errors.push(`${prefix}.media.alt must be text of at most 200 characters`);
    }
    for (const field of ["muted", "loop", "playbackRate"] as const) {
      if (value[field] !== undefined) errors.push(`${prefix}.media.${field} is only supported for video media`);
    }
  }

  if (value.type === "video") {
    for (const field of ["muted", "loop"] as const) {
      if (value[field] !== undefined && typeof value[field] !== "boolean") {
        errors.push(`${prefix}.media.${field} must be a boolean`);
      }
    }
    if (value.playbackRate !== undefined &&
        (typeof value.playbackRate !== "number" || !Number.isFinite(value.playbackRate) ||
         value.playbackRate < 0.25 || value.playbackRate > 4)) {
      errors.push(`${prefix}.media.playbackRate must be between 0.25 and 4`);
    }
    if (value.alt !== undefined) errors.push(`${prefix}.media.alt is only supported for image media`);
  }

  return errors;
};

export const getProjectDurationInFrames = (project: Pick<VideoProject, "scenes">): number =>
  project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);

/**
 * Validate the project formats supported by the renderer.
 * DemoVideo is retained as the original M1 compatibility composition.
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
        if (scene.media !== undefined) errors.push(...validateMedia(scene.media, prefix));
      });

      if (totalFrames > 1800) errors.push("total scene duration must not exceed 1800 frames (60 seconds at 30 FPS)");
    }
  }

  const output = isRecord(value.output) ? value.output : {};
  if (output.format !== "mp4") errors.push("output.format must be mp4");
  if (output.codec !== "h264") errors.push("output.codec must be h264");

  return errors;
};
