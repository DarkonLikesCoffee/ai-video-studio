import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export type RenderProvider = "github-actions" | "circleci";

export type RenderRequest = {
  provider: RenderProvider;
  compositionId: string;
  outputName: string;
  requestId: string;
  projectPath?: string;
};

export type RenderRequestValidation = {
  errors: string[];
  request?: RenderRequest;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProjectPath = (value: string): boolean =>
  /^projects\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.json$/.test(value);

/**
 * Validate the request envelope independently of the selected composition.
 * Remotion remains the source of truth for whether compositionId is registered.
 */
export const validateRenderRequest = (value: unknown): RenderRequestValidation => {
  if (!isRecord(value)) return { errors: ["Render request must be a JSON object."] };

  const errors: string[] = [];
  const provider = value.provider;
  const compositionId = value.compositionId;
  const outputName = value.outputName;
  const requestId = value.requestId;
  const projectPath = value.projectPath;

  if (provider !== "github-actions" && provider !== "circleci") {
    errors.push("provider must be github-actions or circleci.");
  }

  if (typeof compositionId !== "string" ||
      !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(compositionId)) {
    errors.push("compositionId must be a safe Remotion composition identifier.");
  }

  if (typeof outputName !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9-]{0,59}$/.test(outputName)) {
    errors.push("outputName must contain 1-60 letters, numbers, or hyphens.");
  }

  if (typeof requestId !== "string" ||
      !/^[A-Za-z0-9._-]{1,80}$/.test(requestId)) {
    errors.push("requestId must be a unique 1-80 character identifier.");
  }

  if (projectPath !== undefined &&
      (typeof projectPath !== "string" || !isProjectPath(projectPath))) {
    errors.push("projectPath, when supplied, must point to a JSON file inside projects/.");
  }

  if (compositionId === "ProjectVideo" && typeof projectPath !== "string") {
    errors.push("ProjectVideo requires projectPath.");
  }

  if (errors.length > 0) return { errors };

  return {
    errors,
    request: {
      provider: provider as RenderProvider,
      compositionId: compositionId as string,
      outputName: outputName as string,
      requestId: requestId as string,
      ...(typeof projectPath === "string" ? { projectPath } : {}),
    },
  };
};

const run = async (): Promise<void> => {
  const requestPath = process.argv[2] ?? "render-request.json";
  let input: unknown;

  try {
    input = JSON.parse(await readFile(requestPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read render request ${requestPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const validation = validateRenderRequest(input);
  if (validation.errors.length > 0 || !validation.request) {
    throw new Error(validation.errors.join("\n"));
  }

  const request = validation.request;
  if (request.projectPath) {
    let project: unknown;
    try {
      project = JSON.parse(await readFile(request.projectPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read project props ${request.projectPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (request.compositionId === "ProjectVideo") {
      if (!isRecord(project) || !isRecord(project.composition) ||
          project.composition.id !== "ProjectVideo") {
        throw new Error("The selected project composition ID must match ProjectVideo.");
      }
    }
  }

  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    await appendFile(output, [
      `provider=${request.provider}`,
      `project_path=${request.projectPath ?? ""}`,
      `composition_id=${request.compositionId}`,
      `output_name=${request.outputName}`,
      `request_id=${request.requestId}`,
    ].join("\n") + "\n");
  }

  console.log(`Accepted render request ${request.requestId} for ${request.provider} / ${request.compositionId}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
