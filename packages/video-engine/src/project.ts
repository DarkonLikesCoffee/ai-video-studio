export type SceneType = "title" | "content" | "outro";

export type VideoScene = {
  id: string;
  type: SceneType;
  durationInFrames: number;
  eyebrow?: string;
  title: string;
  body?: string;
  backgroundColor?: string;
  accentColor?: string;
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

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const sceneTypes = new Set<SceneType>(["title", "content", "outro"]);

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
  if (!Number.isInteger(composition.width) || Number(composition.width) < 1 || Number(composition.width) > 3840) {
    errors.push("composition.width must be an integer between 1 and 3840");
  }
  if (!Number.isInteger(composition.height) || Number(composition.height) < 1 || Number(composition.height) > 2160) {
    errors.push("composition.height must be an integer between 1 and 2160");
  }
  if (!Number.isInteger(composition.fps) || Number(composition.fps) < 1 || Number(composition.fps) > 60) {
    errors.push("composition.fps must be an integer between 1 and 60");
  }

  if (compositionId === "DemoVideo") {
    if (!Number.isInteger(composition.durationInFrames) ||
        Number(composition.durationInFrames) < 1 ||
        Number(composition.durationInFrames) > 1800) {
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
        if (!Number.isInteger(scene.durationInFrames) ||
            Number(scene.durationInFrames) < 30 ||
            Number(scene.durationInFrames) > 900) {
          errors.push(`${prefix}.durationInFrames must be between 30 and 900`);
        } else {
          totalFrames += Number(scene.durationInFrames);
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
      });

      if (totalFrames > 1800) errors.push("total scene duration must not exceed 1800 frames (60 seconds at 30 FPS)");
    }
  }

  const output = isRecord(value.output) ? value.output : {};
  if (output.format !== "mp4") errors.push("output.format must be mp4");
  if (output.codec !== "h264") errors.push("output.codec must be h264");

  return errors;
};
