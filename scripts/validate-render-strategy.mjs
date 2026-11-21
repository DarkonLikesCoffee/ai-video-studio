import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateRenderRequest } from "./render-request.mjs";

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const extractRegisteredCompositionIds = (rootSource) =>
  [...rootSource.matchAll(/<Composition\s+id="([^"]+)"/g)].map((match) => match[1]);

export const resolveProductionPlanPath = (request) => {
  if (typeof request.productionPlanPath === "string") return request.productionPlanPath;
  if (typeof request.projectPath !== "string") return undefined;
  return path.posix.join(path.posix.dirname(request.projectPath), "production", "production-plan.json");
};

export const validateRenderStrategyAgainstRequest = ({ request, plan, registeredCompositionIds }) => {
  const errors = [];
  if (!registeredCompositionIds.includes(request.compositionId)) {
    errors.push(`compositionId "${request.compositionId}" is not registered in packages/video-engine/src/root.tsx.`);
  }

  if (plan === undefined || plan === null) return errors;
  if (!isRecord(plan.renderStrategy)) {
    errors.push("The linked production plan is missing its required renderStrategy.");
    return errors;
  }

  const strategy = plan.renderStrategy;
  if (strategy.renderer !== "project-video" && strategy.renderer !== "custom-remotion") {
    errors.push("The linked production plan has an unsupported renderer.");
  }
  if (typeof strategy.compositionId !== "string" || !strategy.compositionId.trim()) {
    errors.push("The linked production plan must specify a compositionId.");
  }
  if (typeof strategy.rationale !== "string" || !strategy.rationale.trim()) {
    errors.push("The linked production plan must explain why this composition was selected.");
  }
  if (!Array.isArray(strategy.requiredCapabilities) || strategy.requiredCapabilities.length === 0 ||
      strategy.requiredCapabilities.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push("The linked production plan must list its required capabilities.");
  }
  if (typeof strategy.fallback !== "string" || !strategy.fallback.trim()) {
    errors.push("The linked production plan must specify an honest fallback.");
  }
  if (strategy.availability !== "registered") {
    errors.push("The linked production plan selects a composition marked to-be-built; implement and register it before rendering.");
  }
  if (typeof strategy.compositionId === "string" && !registeredCompositionIds.includes(strategy.compositionId)) {
    errors.push(`production-plan compositionId "${strategy.compositionId}" is not registered in RemotionRoot.`);
  }
  if (strategy.compositionId !== request.compositionId) {
    errors.push(`Render request compositionId "${request.compositionId}" does not match production-plan compositionId "${String(strategy.compositionId)}".`);
  }
  const expectedRenderer = request.compositionId === "ProjectVideo" ? "project-video" : "custom-remotion";
  if (strategy.renderer !== expectedRenderer) {
    errors.push(`Production-plan renderer must be "${expectedRenderer}" for composition "${request.compositionId}".`);
  }
  return errors;
};

const run = async () => {
  const requestPath = process.argv[2] ?? "render-request.json";
  const rootPath = process.argv[3] ?? "packages/video-engine/src/root.tsx";
  const rawRequest = JSON.parse(await readFile(requestPath, "utf8"));
  const requestValidation = validateRenderRequest(rawRequest);
  if (requestValidation.errors.length || !requestValidation.request) {
    throw new Error(requestValidation.errors.join("\n"));
  }
  const request = requestValidation.request;
  const rootSource = await readFile(rootPath, "utf8");
  const registeredCompositionIds = extractRegisteredCompositionIds(rootSource);
  const planPath = resolveProductionPlanPath(request);
  let plan;

  if (planPath) {
    try {
      await access(planPath);
      plan = JSON.parse(await readFile(planPath, "utf8"));
    } catch (error) {
      if (request.productionPlanPath) {
        throw new Error(`Explicit productionPlanPath could not be read: ${planPath} (${error instanceof Error ? error.message : String(error)})`);
      }
      console.log(`No adjacent production plan found at ${planPath}; composition registration is still checked. Legacy render remains supported.`);
    }
  }

  const errors = validateRenderStrategyAgainstRequest({ request, plan, registeredCompositionIds });
  if (errors.length) throw new Error(errors.join("\n"));
  if (plan) {
    console.log(`Accepted Director strategy: ${plan.renderStrategy.renderer} / ${plan.renderStrategy.compositionId} (registered).`);
  } else {
    console.log(`Accepted registered composition ${request.compositionId}; no linked production plan was supplied.`);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
