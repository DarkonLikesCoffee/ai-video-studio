import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProjectPath = (value) =>
  /^projects\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.json$/.test(value);

export const matchesCompositionMetadata = (project, compositionId) =>
  isRecord(project) && isRecord(project.composition) &&
  project.composition.id === compositionId;

/**
 * Validate the request envelope independently of the selected composition.
 * Remotion remains the source of truth for whether compositionId is registered.
 */
export const validateRenderRequest = (value) => {
  if (!isRecord(value)) return { errors: ["Render request must be a JSON object."] };

  const errors = [];
  const { provider, compositionId, outputName, requestId, projectPath, narrationPath } = value;

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

  if ((compositionId === "ProjectVideo" || compositionId === "NarratedSkyExplainer") &&
      typeof projectPath !== "string") {
    errors.push(compositionId + " requires projectPath.");
  }

  if (narrationPath !== undefined &&
      (typeof narrationPath !== "string" || !isProjectPath(narrationPath))) {
    errors.push("narrationPath, when supplied, must point to a JSON file inside projects/.");
  }
  if (narrationPath !== undefined &&
      compositionId !== "ProjectVideo" && compositionId !== "NarratedSkyExplainer") {
    errors.push("narrationPath is currently supported only for ProjectVideo and NarratedSkyExplainer.");
  }

  if (errors.length > 0) return { errors };

  return {
    errors,
    request: {
      provider,
      compositionId,
      outputName,
      requestId,
      ...(typeof projectPath === "string" ? { projectPath } : {}),
      ...(typeof narrationPath === "string" ? { narrationPath } : {}),
    },
  };
};

const run = async () => {
  const requestPath = process.argv[2] ?? "render-request.json";
  let input;

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
    let project;
    try {
      project = JSON.parse(await readFile(request.projectPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read project props ${request.projectPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if ((request.compositionId === "ProjectVideo" || request.compositionId === "NarratedSkyExplainer") &&
        !matchesCompositionMetadata(project, request.compositionId)) {
      throw new Error("The selected project composition ID must match " + request.compositionId + ".");
    }
  }

  if (request.narrationPath) {
    let narration;
    try {
      narration = JSON.parse(await readFile(request.narrationPath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read narration config ${request.narrationPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!isRecord(narration) || narration.schemaVersion !== 1 ||
        typeof narration.text !== "string" || !narration.text.trim()) {
      throw new Error("Narration config must have schemaVersion: 1 and non-empty text.");
    }
  }

  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    await appendFile(output, [
      `provider=${request.provider}`,
      `project_path=${request.projectPath ?? ""}`,
      `narration_path=${request.narrationPath ?? ""}`,
      `composition_id=${request.compositionId}`,
      `output_name=${request.outputName}`,
      `request_id=${request.requestId}`,
    ].join("\n") + "\n");
  }

  console.log(`Accepted render request ${request.requestId} for ${request.provider} / ${request.compositionId}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
