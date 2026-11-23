import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type JsonRecord = Record<string, unknown>;
type Finding = { id?: unknown; severity?: unknown; status?: unknown };

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const isCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);
const isDate = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
const isTimestampList = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(item => typeof item === "number" && Number.isFinite(item) && item >= 0);
const isSafeRepoPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("/") &&
  !value.includes("\\") &&
  value.split("/").every(part => part.length > 0 && part !== "." && part !== "..");

export const validateVisualReviewReport = (report: unknown) => {
  const errors: string[] = [];
  if (!isRecord(report)) {
    return { errors: ["Visual review report must be a JSON object."], approved: false, pending: false };
  }

  const version = report.schemaVersion === undefined ? 1 : report.schemaVersion;
  if (version !== 1 && version !== 2) errors.push("schemaVersion must be 1 or 2.");
  if (report.status !== "pending-review" && report.status !== "approved" && report.status !== "rejected") {
    errors.push("status must be pending-review, approved, or rejected.");
  }

  const artifact = isRecord(report.artifact) ? report.artifact : undefined;
  if (!artifact || !isSha256(artifact.videoSha256)) {
    errors.push("artifact.videoSha256 must be a valid SHA-256 hash.");
  }

  const inspection = isRecord(report.inspection) ? report.inspection : undefined;
  if (!inspection) errors.push("inspection must be an object.");

  if (!Array.isArray(report.findings)) errors.push("findings must be an array.");
  if (!Array.isArray(report.corrections)) errors.push("corrections must be an array.");
  const findingsInput = Array.isArray(report.findings) ? report.findings : [];
  const correctionsInput = Array.isArray(report.corrections) ? report.corrections : [];
  if (findingsInput.some(item => !isRecord(item))) errors.push("Every finding must be a JSON object.");
  if (correctionsInput.some(item => !isRecord(item))) errors.push("Every correction must be a JSON object.");

  const decision = isRecord(report.decision) ? report.decision : undefined;
  if (!decision || typeof decision.approved !== "boolean") {
    errors.push("decision.approved must be a boolean.");
  }

  const findings = findingsInput.filter(isRecord) as Finding[];
  const findingIds = new Set<string>();
  for (const finding of findings) {
    if (typeof finding.id !== "string" || !finding.id.trim()) {
      errors.push("Every finding needs a non-empty id.");
    } else if (findingIds.has(finding.id)) {
      errors.push(`Duplicate finding id: ${finding.id}`);
    } else {
      findingIds.add(finding.id);
    }

    if (!["blocker", "major", "minor"].includes(String(finding.severity))) {
      errors.push(`Finding ${String(finding.id)} has invalid severity.`);
    }
    if (!["open", "resolved", "accepted"].includes(String(finding.status))) {
      errors.push(`Finding ${String(finding.id)} must have status open, resolved, or accepted.`);
    }
  }

  const corrections = correctionsInput.filter(isRecord);
  const correctionIds = new Set<string>();
  for (const correction of corrections) {
    if (typeof correction.findingId !== "string" || !findingIds.has(correction.findingId)) {
      errors.push("Each correction must reference an existing findingId.");
    }
    if (typeof correction.description !== "string" || !correction.description.trim()) {
      errors.push("Each correction needs a description.");
    }
    if (typeof correction.verified !== "boolean") {
      errors.push("Each correction needs verified boolean.");
    }

    if (version === 2) {
      if (typeof correction.id !== "string" || !correction.id.trim()) {
        errors.push("Each schemaVersion 2 correction needs a non-empty id.");
      } else if (correctionIds.has(correction.id)) {
        errors.push(`Duplicate correction id: ${correction.id}`);
      } else {
        correctionIds.add(correction.id);
      }

      if (!Array.isArray(correction.targetPaths) ||
          correction.targetPaths.length === 0 ||
          !correction.targetPaths.every(isSafeRepoPath)) {
        errors.push(`Correction ${String(correction.id)} needs one or more safe repository-relative targetPaths.`);
      }
      if (!["planned", "applied", "verified"].includes(String(correction.status))) {
        errors.push(`Correction ${String(correction.id)} status must be planned, applied, or verified.`);
      }
      if ((correction.status === "applied" || correction.status === "verified") &&
          !isCommitSha(correction.appliedInCommit)) {
        errors.push(`Correction ${String(correction.id)} needs a full appliedInCommit SHA.`);
      }
      if (correction.verified === true) {
        if (correction.status !== "verified") {
          errors.push(`Verified correction ${String(correction.id)} must have status verified.`);
        }
        if (!isRecord(correction.verification)) {
          errors.push(`Verified correction ${String(correction.id)} needs verification evidence.`);
        } else {
          const verification = correction.verification;
          if (!isSha256(verification.videoSha256) ||
              !artifact ||
              verification.videoSha256 !== artifact.videoSha256) {
            errors.push(`Correction ${String(correction.id)} verification must match the current artifact video hash.`);
          }
          if (typeof verification.reviewer !== "string" || !verification.reviewer.trim()) {
            errors.push(`Correction ${String(correction.id)} verification needs a reviewer.`);
          }
          if (!isDate(verification.reviewedAt)) {
            errors.push(`Correction ${String(correction.id)} verification needs a valid reviewedAt timestamp.`);
          }
          if (!isTimestampList(verification.timestampsReviewedSeconds)) {
            errors.push(`Correction ${String(correction.id)} verification needs non-negative reviewed timestamps.`);
          }
        }
      } else if (correction.status === "verified") {
        errors.push(`Correction ${String(correction.id)} with status verified must set verified=true.`);
      }
    }
  }

  if (version === 2) {
    if (!Array.isArray(report.renderIterations) || report.renderIterations.length === 0) {
      errors.push("schemaVersion 2 reports need a non-empty renderIterations history.");
    } else {
      const inputIterations = report.renderIterations;
      if (inputIterations.some(item => !isRecord(item))) {
        errors.push("Every render iteration must be a JSON object.");
      }

      const iterations = inputIterations.filter(isRecord);
      const seenVideoHashes = new Set<string>();
      for (const [index, iteration] of iterations.entries()) {
        if (iteration.iteration !== index + 1) {
          errors.push("renderIterations must use sequential iteration numbers starting at 1.");
        }
        if (!isSha256(iteration.videoSha256)) {
          errors.push(`Render iteration ${index + 1} needs a valid videoSha256.`);
        } else if (seenVideoHashes.has(iteration.videoSha256)) {
          errors.push("renderIterations cannot contain duplicate video hashes.");
        } else {
          seenVideoHashes.add(iteration.videoSha256);
        }

        if (index === 0) {
          if (iteration.previousVideoSha256 !== null) {
            errors.push("The first render iteration must have previousVideoSha256=null.");
          }
        } else {
          const previous = iterations[index - 1];
          if (!previous || iteration.previousVideoSha256 !== previous.videoSha256) {
            errors.push(`Render iteration ${index + 1} must reference the preceding video hash.`);
          }
        }

        if (iteration.legacy !== true && !isCommitSha(iteration.candidateSha)) {
          errors.push(`Render iteration ${index + 1} needs a full candidateSha.`);
        }
        if (iteration.legacy !== true && !isCommitSha(iteration.sourceCommit)) {
          errors.push(`Render iteration ${index + 1} needs a full sourceCommit.`);
        }
        if (typeof iteration.requestId !== "string" || !iteration.requestId.trim()) {
          errors.push(`Render iteration ${index + 1} needs a requestId.`);
        }
        if (typeof iteration.workflowRunId !== "string" || !iteration.workflowRunId.trim()) {
          errors.push(`Render iteration ${index + 1} needs a workflowRunId.`);
        }
        if (!isDate(iteration.renderedAt)) {
          errors.push(`Render iteration ${index + 1} needs a valid renderedAt timestamp.`);
        }
        if (!Array.isArray(iteration.correctionIds) ||
            !iteration.correctionIds.every(id => typeof id === "string")) {
          errors.push(`Render iteration ${index + 1} correctionIds must be an array of strings.`);
        } else {
          for (const id of iteration.correctionIds) {
            if (!correctionIds.has(id)) {
              errors.push(`Render iteration ${index + 1} references unknown correction ${id}.`);
            }
          }
        }
      }

      const latestIteration = iterations.at(-1);
      if (artifact && latestIteration && latestIteration.videoSha256 !== artifact.videoSha256) {
        errors.push("artifact.videoSha256 must match the latest render iteration.");
      }
    }
  }

  const pending = report.status === "pending-review";
  const approved = report.status === "approved" && decision?.approved === true;
  if (approved) {
    if (!inspection || inspection.fullVideoWatched !== true) {
      errors.push("Approval requires fullVideoWatched=true; contact sheets alone are insufficient.");
    }
    if (!inspection || typeof inspection.reviewer !== "string" || !inspection.reviewer.trim()) {
      errors.push("Approval requires a reviewer.");
    }
    if (!inspection || !isDate(inspection.reviewedAt)) {
      errors.push("Approval requires a valid reviewedAt timestamp.");
    }
    if (!inspection || !isTimestampList(inspection.timestampsReviewedSeconds)) {
      errors.push("Approval requires reviewed timestamps.");
    }
    if (findings.some(finding => finding.severity === "blocker" && finding.status !== "resolved")) {
      errors.push("Approval is blocked by unresolved blocker findings.");
    }
    if (findings.some(finding => finding.severity === "major" && finding.status === "open")) {
      errors.push("Approval is blocked by open major findings.");
    }
    if (corrections.some(correction => correction.verified !== true)) {
      errors.push("Approval is blocked by unverified corrections.");
    }
    if (typeof decision?.rationale !== "string" || !decision.rationale.trim()) {
      errors.push("Approval requires a decision rationale.");
    }
  }

  if (report.status === "rejected" && decision?.approved !== false) {
    errors.push("Rejected report must set decision.approved=false.");
  }
  if (report.status === "approved" && decision?.approved !== true) {
    errors.push("Approved report must set decision.approved=true.");
  }

  return { errors, approved, pending };
};

const main = async () => {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Usage: npm run qa:visual-review-validate -- report.json");
  const report = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const result = validateVisualReviewReport(report);
  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(result.pending
    ? "Visual review is pending; report structure is valid."
    : "Visual review report structure is valid.");
  if (result.approved) console.log("Report is approved, subject to all review rules.");
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
