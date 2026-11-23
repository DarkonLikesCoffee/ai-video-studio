import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Finding = { id?: unknown; severity?: unknown; status?: unknown };
type Report = {
  schemaVersion?: unknown;
  status?: unknown;
  artifact?: Record<string, unknown>;
  inspection?: Record<string, unknown>;
  findings?: unknown;
  corrections?: unknown;
  renderIterations?: unknown;
  decision?: Record<string, unknown>;
};
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isSha256 = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/i.test(v);
const isCommitSha = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{40}$/i.test(v);
const isDate = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && !Number.isNaN(Date.parse(v));
const isTimestampList = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length > 0 && v.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0);
const isSafeRepoPath = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && !v.startsWith("/") && !v.includes("\\") &&
  v.split("/").every(part => part.length > 0 && part !== "." && part !== "..");

export const validateVisualReviewReport = (report: unknown) => {
  const errors: string[] = [];
  if (!isRecord(report)) return { errors: ["Visual review report must be a JSON object."], approved: false, pending: false };
  const r = report as Report;
  const version = r.schemaVersion === undefined ? 1 : r.schemaVersion;
  if (version !== 1 && version !== 2) errors.push("schemaVersion must be 1 or 2.");
  if (r.status !== "pending-review" && r.status !== "approved" && r.status !== "rejected") {
    errors.push("status must be pending-review, approved, or rejected.");
  }
  if (!isRecord(r.artifact) || !isSha256(r.artifact.videoSha256)) {
    errors.push("artifact.videoSha256 must be a valid SHA-256 hash.");
  }
  if (!isRecord(r.inspection)) errors.push("inspection must be an object.");
  if (!Array.isArray(r.findings)) errors.push("findings must be an array.");
  if (!Array.isArray(r.corrections)) errors.push("corrections must be an array.");
  if (!isRecord(r.decision) || typeof r.decision.approved !== "boolean") {
    errors.push("decision.approved must be a boolean.");
  }

  const findings = Array.isArray(r.findings) ? r.findings.filter(isRecord) as Finding[] : [];
  const ids = new Set<string>();
  for (const f of findings) {
    if (typeof f.id !== "string" || !f.id.trim()) errors.push("Every finding needs a non-empty id.");
    else if (ids.has(f.id)) errors.push(`Duplicate finding id: ${f.id}`);
    else ids.add(f.id);
    if (!["blocker", "major", "minor"].includes(String(f.severity))) errors.push(`Finding ${String(f.id)} has invalid severity.`);
    if (!["open", "resolved", "accepted"].includes(String(f.status))) errors.push(`Finding ${String(f.id)} must have status open, resolved, or accepted.`);
  }

  const corrections = Array.isArray(r.corrections) ? r.corrections.filter(isRecord) : [];
  const correctionIds = new Set<string>();
  for (const c of corrections) {
    if (typeof c.findingId !== "string" || !ids.has(c.findingId)) errors.push("Each correction must reference an existing findingId.");
    if (typeof c.description !== "string" || !c.description.trim()) errors.push("Each correction needs a description.");
    if (typeof c.verified !== "boolean") errors.push("Each correction needs verified boolean.");
    if (version === 2) {
      if (typeof c.id !== "string" || !c.id.trim()) errors.push("Each schemaVersion 2 correction needs a non-empty id.");
      else if (correctionIds.has(c.id)) errors.push(`Duplicate correction id: ${c.id}`);
      else correctionIds.add(c.id);
      if (!Array.isArray(c.targetPaths) || c.targetPaths.length === 0 || !c.targetPaths.every(isSafeRepoPath)) {
        errors.push(`Correction ${String(c.id)} needs one or more safe repository-relative targetPaths.`);
      }
      if (!["planned", "applied", "verified"].includes(String(c.status))) {
        errors.push(`Correction ${String(c.id)} status must be planned, applied, or verified.`);
      }
      if ((c.status === "applied" || c.status === "verified") && !isCommitSha(c.appliedInCommit)) {
        errors.push(`Correction ${String(c.id)} needs a full appliedInCommit SHA.`);
      }
      if (c.verified === true) {
        if (c.status !== "verified") errors.push(`Verified correction ${String(c.id)} must have status verified.`);
        if (!isRecord(c.verification)) errors.push(`Verified correction ${String(c.id)} needs verification evidence.`);
        else {
          if (!isSha256(c.verification.videoSha256) || !isRecord(r.artifact) || c.verification.videoSha256 !== r.artifact.videoSha256) {
            errors.push(`Correction ${String(c.id)} verification must match the current artifact video hash.`);
          }
          if (typeof c.verification.reviewer !== "string" || !c.verification.reviewer.trim()) {
            errors.push(`Correction ${String(c.id)} verification needs a reviewer.`);
          }
          if (!isDate(c.verification.reviewedAt)) errors.push(`Correction ${String(c.id)} verification needs a valid reviewedAt timestamp.`);
          if (!isTimestampList(c.verification.timestampsReviewedSeconds)) {
            errors.push(`Correction ${String(c.id)} verification needs non-negative reviewed timestamps.`);
          }
        }
      }
    }
  }

  if (version === 2) {
    if (!Array.isArray(r.renderIterations) || r.renderIterations.length === 0) {
      errors.push("schemaVersion 2 reports need a non-empty renderIterations history.");
    } else {
      const hashes = new Set<string>();
      const iterations = r.renderIterations.filter(isRecord);
      for (let index = 0; index < iterations.length; index++) {
        const item = iterations[index];
        if (item.iteration !== index + 1) errors.push("renderIterations must use sequential iteration numbers starting at 1.");
        if (!isSha256(item.videoSha256)) errors.push(`Render iteration ${index + 1} needs a valid videoSha256.`);
        else if (hashes.has(item.videoSha256)) errors.push("renderIterations cannot contain duplicate video hashes.");
        else hashes.add(item.videoSha256);
        if (index === 0) {
          if (item.previousVideoSha256 !== null) errors.push("The first render iteration must have previousVideoSha256=null.");
        } else if (item.previousVideoSha256 !== iterations[index - 1].videoSha256) {
          errors.push(`Render iteration ${index + 1} must reference the preceding video hash.`);
        }
        if (item.legacy !== true && !isCommitSha(item.candidateSha)) errors.push(`Render iteration ${index + 1} needs a full candidateSha.`);
        if (item.legacy !== true && !isCommitSha(item.sourceCommit)) errors.push(`Render iteration ${index + 1} needs a full sourceCommit.`);
        if (typeof item.requestId !== "string" || !item.requestId.trim()) errors.push(`Render iteration ${index + 1} needs a requestId.`);
        if (typeof item.workflowRunId !== "string" || !item.workflowRunId.trim()) errors.push(`Render iteration ${index + 1} needs a workflowRunId.`);
        if (!isDate(item.renderedAt)) errors.push(`Render iteration ${index + 1} needs a valid renderedAt timestamp.`);
        if (!Array.isArray(item.correctionIds) || !item.correctionIds.every(id => typeof id === "string")) {
          errors.push(`Render iteration ${index + 1} correctionIds must be an array of strings.`);
        } else {
          for (const id of item.correctionIds) {
            if (!correctionIds.has(id)) errors.push(`Render iteration ${index + 1} references unknown correction ${id}.`);
          }
        }
      }
      const last = iterations[iterations.length - 1];
      if (isRecord(r.artifact) && last && last.videoSha256 !== r.artifact.videoSha256) {
        errors.push("artifact.videoSha256 must match the latest render iteration.");
      }
    }
  }

  const pending = r.status === "pending-review";
  const approved = r.status === "approved" && isRecord(r.decision) && r.decision.approved === true;
  if (approved) {
    const i = r.inspection;
    if (!isRecord(i) || i.fullVideoWatched !== true) errors.push("Approval requires fullVideoWatched=true; contact sheets alone are insufficient.");
    if (!isRecord(i) || typeof i.reviewer !== "string" || !i.reviewer.trim()) errors.push("Approval requires a reviewer.");
    if (!isRecord(i) || !isDate(i.reviewedAt)) errors.push("Approval requires a valid reviewedAt timestamp.");
    if (!isRecord(i) || !isTimestampList(i.timestampsReviewedSeconds)) errors.push("Approval requires reviewed timestamps.");
    if (findings.some(f => f.severity === "blocker" && f.status !== "resolved")) errors.push("Approval is blocked by unresolved blocker findings.");
    if (findings.some(f => f.severity === "major" && f.status === "open")) errors.push("Approval is blocked by open major findings.");
    if (corrections.some(c => c.verified !== true)) errors.push("Approval is blocked by unverified corrections.");
    if (!isRecord(r.decision) || typeof r.decision.rationale !== "string" || !r.decision.rationale.trim()) {
      errors.push("Approval requires a decision rationale.");
    }
  }
  if (r.status === "rejected" && (!isRecord(r.decision) || r.decision.approved !== false)) {
    errors.push("Rejected report must set decision.approved=false.");
  }
  if (r.status === "approved" && (!isRecord(r.decision) || r.decision.approved !== true)) {
    errors.push("Approved report must set decision.approved=true.");
  }
  return { errors, approved, pending };
};

const main = async () => {
  const path = resolve(process.argv[2] ?? "");
  if (!process.argv[2]) throw new Error("Usage: npm run qa:visual-review-validate -- report.json");
  const report = JSON.parse(await readFile(path, "utf8"));
  const result = validateVisualReviewReport(report);
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(result.pending ? "Visual review is pending; report structure is valid." : "Visual review report structure is valid.");
  if (result.approved) console.log("Report is approved, subject to all review rules.");
};
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
}
