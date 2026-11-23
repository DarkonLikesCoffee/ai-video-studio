import { readFile, writeFile } from "node:fs/promises";
import { stat, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateProductionPlan } from "./validate-production-plan";

type RecordValue = Record<string, unknown>;
type Issue = { code: string; severity: "warning" | "error"; message: string; shotId?: string; criterion?: string; assetRef?: string };
type LocalStatus = "present" | "missing" | "empty" | "unsafe" | "not-local";
type AssetEvidence = {
  id: string;
  reference: string;
  aliases: string[];
  type: string | null;
  shotIds: string[];
  path: string | null;
  localStatus: LocalStatus;
  provenanceStatus: "documented" | "missing";
  rightsStatus: "documented" | "missing";
  provenance: string | null;
  rights: string | null;
  previewPath: string | null;
  previewStatus: LocalStatus;
  visualReviewStatus: "approved" | "pending" | "rejected" | "missing";
  visualReview: { reviewer: string | null; reviewedAt: string | null; notes: string | null };
};
type ShotEvidence = {
  shotId: string;
  plannedAssetRefs: string[];
  matchedPlannedAssetRefs: string[];
  unresolvedPlannedAssetRefs: string[];
  manifestAssets: AssetEvidence[];
};
type CriterionEvidence = {
  criterion: string;
  shotIds: string[];
  linkedShotCount: number;
  unlinkedShotIds: string[];
  assetStatus: "linked" | "partial" | "unlinked" | "invalid";
  readiness: "ready" | "needs-review" | "no-assets";
  assets: AssetEvidence[];
};
export type AssetEvidenceReport = {
  schemaVersion: 1;
  reportType: "production-asset-evidence";
  generatedAt: string;
  generatedBy: "ai-video-studio/director:asset-evidence";
  project: { id: string; title: string };
  source: { planPath: string | null; manifestPath: string | null; projectRoot: string };
  summary: {
    status: "ready" | "needs-review" | "invalid" | "no-assets" | "criteria-unavailable";
    shotCount: number;
    assetCount: number;
    shotsWithAssets: number;
    unlinkedShots: number;
    criterionCount: number;
    linkedCriteria: number;
    partialCriteria: number;
    unlinkedCriteria: number;
    missingFiles: number;
    assetsNotLocal: number;
    emptyFiles: number;
    unsafePaths: number;
    missingProvenance: number;
    missingRights: number;
    unresolvedPlannedAssetRefs: number;
    unknownManifestShotIds: number;
    visualReviewApproved: number;
    visualReviewPending: number;
    visualReviewRejected: number;
    visualReviewMissing: number;
    missingPreviews: number;
  };
  shots: ShotEvidence[];
  assets: AssetEvidence[];
  criteria: CriterionEvidence[];
  issues: Issue[];
};

const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const asText = (value: unknown): string | null => typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
const normalizeRef = (value: string) => value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^assets\//i, "").toLowerCase();
const basename = (value: string) => value.replace(/\\/g, "/").split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
const isWithin = (root: string, target: string) => {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

const resolveLocalPath = async (asset: RecordValue, projectRoot: string): Promise<{ path: string | null; status: LocalStatus }> => {
  const rawPath = asText(asset.path);
  const rawFile = asText(asset.file);
  const raw = rawPath ?? rawFile;
  if (!raw) return { path: null, status: "not-local" };
  const normalized = raw.replace(/\\/g, "/");
  if (path.isAbsolute(raw) || /^[a-zA-Z]:/.test(normalized) || normalized.split("/").includes("..")) {
    return { path: null, status: "unsafe" };
  }
  const relativePath = rawPath
    ? normalized.replace(/^\.\//, "")
    : normalized.startsWith("assets/") ? normalized : "assets/" + normalized;
  const absolute = path.resolve(projectRoot, relativePath);
  if (!isWithin(projectRoot, absolute)) return { path: null, status: "unsafe" };
  try {
    const [rootReal, assetReal, details] = await Promise.all([realpath(projectRoot), realpath(absolute), stat(absolute)]);
    if (!isWithin(rootReal, assetReal)) return { path: null, status: "unsafe" };
    if (!details.isFile()) return { path: relativePath, status: "missing" };
    return { path: relativePath, status: details.size > 0 ? "present" : "empty" };
  } catch {
    return { path: relativePath, status: "missing" };
  }
};

const getAliases = (asset: RecordValue): string[] => [...new Set([asset.id, asset.assetId, asset.file, asset.path]
  .map(asText).filter((value): value is string => value !== null))];
const getReference = (asset: RecordValue, index: number): string => asText(asset.path) ?? asText(asset.file) ?? asText(asset.id) ?? `asset-${index + 1}`;
const hasProvenance = (asset: RecordValue) => Boolean(asText(asset.provenance) || asText(asset.sourcePage) || asText(asset.sourceUrl) || asText(asset.creator) || asText(asset.attribution));
const hasRights = (asset: RecordValue) => Boolean(asText(asset.license) || (asText(asset.rightsBasis) && asText(asset.rightsNote)));
const describeProvenance = (asset: RecordValue) => asText(asset.provenance) ?? asText(asset.sourcePage) ?? asText(asset.sourceUrl) ?? asText(asset.creator) ?? asText(asset.attribution);
const describeRights = (asset: RecordValue) => asText(asset.license) ?? (asText(asset.rightsBasis) && asText(asset.rightsNote) ? `${asset.rightsBasis}: ${asset.rightsNote}` : null);

const assetMatchesRef = (asset: AssetEvidence, reference: string): boolean => {
  const target = normalizeRef(reference);
  return asset.aliases.some((alias) => normalizeRef(alias) === target || basename(alias) === basename(reference));
};

export const buildAssetEvidenceReport = async (
  planValue: unknown,
  manifestValue: unknown,
  options: { projectRoot: string; planPath?: string; manifestPath?: string; generatedAt?: string },
): Promise<AssetEvidenceReport> => {
  if (!isRecord(planValue) || !Array.isArray(planValue.shots)) throw new Error("Production plan must contain a shots array.");
  const planErrors = validateProductionPlan(planValue);
  if (planErrors.length) throw new Error("Production plan invalid:\\n" + planErrors.map((error) => "- " + error).join("\\n"));
  if (!isRecord(manifestValue) || !Array.isArray(manifestValue.assets)) throw new Error("Asset manifest must contain an assets array.");
  const projectRoot = path.resolve(options.projectRoot);
  const shotsInput = planValue.shots.filter(isRecord);
  const shotIds = shotsInput.map((shot) => asText(shot.id)).filter((id): id is string => id !== null);
  const knownShots = new Set(shotIds);
  const issues: Issue[] = [];
  const addIssue = (issue: Issue) => issues.push(issue);
  const assets: AssetEvidence[] = [];
  const unknownShotIds = new Set<string>();
  if (manifestValue.assets.length === 0) addIssue({ code: "ASSET_MANIFEST_EMPTY", severity: "warning", message: "Asset manifest contains no assets." });

  for (const [index, value] of manifestValue.assets.entries()) {
    if (!isRecord(value)) {
      addIssue({ code: "INVALID_ASSET_ENTRY", severity: "error", message: `assets[${index}] must be an object.` });
      continue;
    }
    const reference = getReference(value, index);
    const aliases = getAliases(value);
    if (!asText(value.type)) addIssue({ code: "ASSET_TYPE_MISSING", severity: "warning", message: `Asset "${reference}" has no type.`, assetRef: reference });
    const local = await resolveLocalPath(value, projectRoot);
    const previewRaw = asText(value.previewPath) ?? asText(value.preview);
    const previewLocal = previewRaw ? await resolveLocalPath({ path: previewRaw }, projectRoot) : { path: null, status: "not-local" as LocalStatus };
    const reviewRaw = isRecord(value.visualReview) ? value.visualReview : {};
    const reviewStatus = ["approved", "pending", "rejected"].includes(String(reviewRaw.status))
      ? reviewRaw.status as "approved" | "pending" | "rejected"
      : "missing";
    const reviewer = asText(reviewRaw.reviewer);
    const reviewedAt = asText(reviewRaw.reviewedAt);
    const reviewNotes = asText(reviewRaw.notes);
    const reviewMetadataValid = Boolean(reviewer && reviewedAt && Number.isFinite(Date.parse(reviewedAt)) && reviewNotes);
    const visualReviewStatus = reviewStatus === "approved" && reviewMetadataValid && previewLocal.status === "present"
      ? "approved"
      : reviewStatus === "rejected" ? "rejected"
      : reviewStatus === "pending" ? "pending"
      : "missing";
    const provenanceStatus = hasProvenance(value) ? "documented" : "missing";
    const rightsStatus = hasRights(value) ? "documented" : "missing";
    const assetShotIds = Array.isArray(value.shotIds) ? value.shotIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim()) : [];
    if (!assetShotIds.length) addIssue({ code: "ASSET_SHOT_IDS_MISSING", severity: "warning", message: `Asset "${reference}" has no valid shotIds.`, assetRef: reference });
    for (const shotId of assetShotIds) {
      if (shotId !== "all" && !knownShots.has(shotId)) {
        unknownShotIds.add(shotId);
        addIssue({ code: "UNKNOWN_MANIFEST_SHOT_ID", severity: "warning", message: `Asset "${reference}" references unknown shot "${shotId}".`, shotId, assetRef: reference });
      }
    }
    if (local.status === "not-local") addIssue({ code: "ASSET_LOCAL_PATH_MISSING", severity: "warning", message: `Asset "${reference}" has no local file or path.`, assetRef: reference });
    else if (local.status === "unsafe") addIssue({ code: "ASSET_PATH_UNSAFE", severity: "error", message: `Asset "${reference}" resolves outside the project root or uses an absolute path.`, assetRef: reference });
    else if (local.status === "missing") addIssue({ code: "ASSET_FILE_MISSING", severity: "warning", message: `Asset "${reference}" does not exist at ${local.path ?? "its declared path"}.`, assetRef: reference });
    else if (local.status === "empty") addIssue({ code: "ASSET_FILE_EMPTY", severity: "warning", message: `Asset "${reference}" exists but is empty.`, assetRef: reference });
    if (provenanceStatus === "missing") addIssue({ code: "ASSET_PROVENANCE_MISSING", severity: "warning", message: `Asset "${reference}" has no source/provenance note or URL.`, assetRef: reference });
    if (rightsStatus === "missing") addIssue({ code: "ASSET_RIGHTS_MISSING", severity: "warning", message: `Asset "${reference}" has no license or explicit rights basis and note.`, assetRef: reference });
    if (previewLocal.status === "not-local") addIssue({ code: "ASSET_PREVIEW_MISSING", severity: "warning", message: `Asset "${reference}" has no declared preview file.`, assetRef: reference });
    else if (previewLocal.status !== "present") addIssue({ code: "ASSET_PREVIEW_UNAVAILABLE", severity: "warning", message: `Asset "${reference}" preview is ${previewLocal.status}.`, assetRef: reference });
    if (visualReviewStatus === "missing") addIssue({ code: "ASSET_VISUAL_REVIEW_MISSING", severity: "warning", message: `Asset "${reference}" has no complete visual-review approval.`, assetRef: reference });
    else if (visualReviewStatus === "pending") addIssue({ code: "ASSET_VISUAL_REVIEW_PENDING", severity: "warning", message: `Asset "${reference}" visual review is pending.`, assetRef: reference });
    else if (visualReviewStatus === "rejected") addIssue({ code: "ASSET_VISUAL_REVIEW_REJECTED", severity: "warning", message: `Asset "${reference}" was rejected during visual review.`, assetRef: reference });
    assets.push({
      id: asText(value.id) ?? reference,
      reference,
      aliases,
      type: asText(value.type),
      shotIds: assetShotIds,
      path: local.path,
      localStatus: local.status,
      provenanceStatus,
      rightsStatus,
      provenance: describeProvenance(value),
      rights: describeRights(value),
      previewPath: previewLocal.path,
      previewStatus: previewLocal.status,
      visualReviewStatus,
      visualReview: { reviewer, reviewedAt, notes: reviewNotes },
    });
  }

  const assetsByShot = new Map<string, AssetEvidence[]>();
  for (const shotId of shotIds) assetsByShot.set(shotId, []);
  for (const asset of assets) {
    for (const shotId of asset.shotIds) {
      if (shotId === "all") {
        for (const knownShotId of shotIds) assetsByShot.get(knownShotId)?.push(asset);
      } else assetsByShot.get(shotId)?.push(asset);
    }
  }

  const shots: ShotEvidence[] = shotsInput.map((shot) => {
    const shotId = asText(shot.id) ?? "unknown-shot";
    const plannedAssetRefs = Array.isArray(shot.assets) ? shot.assets.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [];
    const shotManifestAssets = assetsByShot.get(shotId) ?? [];
    const matchedPlannedAssetRefs = plannedAssetRefs.filter((reference) => shotManifestAssets.some((asset) => assetMatchesRef(asset, reference)));
    const unresolvedPlannedAssetRefs = plannedAssetRefs.filter((reference) => !matchedPlannedAssetRefs.includes(reference));
    for (const reference of unresolvedPlannedAssetRefs) {
      addIssue({ code: "PLAN_ASSET_UNRESOLVED", severity: "warning", message: `Shot "${shotId}" planned asset "${reference}" is not found in the manifest.`, shotId, assetRef: reference });
    }
    return { shotId, plannedAssetRefs, matchedPlannedAssetRefs, unresolvedPlannedAssetRefs, manifestAssets: shotManifestAssets };
  });

  const criteria: CriterionEvidence[] = [];
  const coverageInput = planValue.acceptanceCoverage;
  if (Array.isArray(coverageInput)) {
    for (const [index, value] of coverageInput.entries()) {
      if (!isRecord(value) || !asText(value.criterion) || !Array.isArray(value.shotIds)) {
        addIssue({ code: "INVALID_ACCEPTANCE_COVERAGE", severity: "error", message: `acceptanceCoverage[${index}] is malformed.` });
        continue;
      }
      const criterion = asText(value.criterion)!;
      const criterionShotIds = value.shotIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim());
      if (!criterionShotIds.length) addIssue({ code: "CRITERION_SHOTS_MISSING", severity: "error", message: `Criterion "${criterion}" must reference at least one shot.`, criterion });
      const unknown = criterionShotIds.filter((id) => !knownShots.has(id));
      unknown.forEach((shotId) => addIssue({ code: "CRITERION_UNKNOWN_SHOT", severity: "error", message: `Criterion "${criterion}" references unknown shot "${shotId}".`, shotId, criterion }));
      const linkedShotIds = criterionShotIds.filter((id) => (assetsByShot.get(id)?.length ?? 0) > 0);
      const unlinkedShotIds = criterionShotIds.filter((id) => !linkedShotIds.includes(id));
      const assetStatus: CriterionEvidence["assetStatus"] = unknown.length || !criterionShotIds.length ? "invalid" : linkedShotIds.length === criterionShotIds.length ? "linked" : linkedShotIds.length ? "partial" : "unlinked";
      const linkedAssets = [...new Set(criterionShotIds.flatMap((id) => assetsByShot.get(id) ?? []))];
      const readiness: CriterionEvidence["readiness"] = linkedAssets.length === 0 ? "no-assets" : linkedAssets.every((asset) => asset.localStatus === "present" && asset.provenanceStatus === "documented" && asset.rightsStatus === "documented") ? "ready" : "needs-review";
      if (assetStatus === "unlinked") addIssue({ code: "CRITERION_ASSET_UNLINKED", severity: "warning", message: `Criterion "${criterion}" maps to shots with no manifest assets; this may be intentional for procedural visuals.`, criterion });
      criteria.push({ criterion, shotIds: criterionShotIds, linkedShotCount: linkedShotIds.length, unlinkedShotIds, assetStatus, readiness, assets: linkedAssets });
    }
  }

  const missingFiles = assets.filter((asset) => asset.localStatus === "missing").length;
  const visualReviewApproved = assets.filter((asset) => asset.visualReviewStatus === "approved").length;
  const visualReviewPending = assets.filter((asset) => asset.visualReviewStatus === "pending").length;
  const visualReviewRejected = assets.filter((asset) => asset.visualReviewStatus === "rejected").length;
  const visualReviewMissing = assets.filter((asset) => asset.visualReviewStatus === "missing").length;
  const missingPreviews = assets.filter((asset) => asset.previewStatus !== "present").length;
  const assetsNotLocal = assets.filter((asset) => asset.localStatus === "not-local").length;
  const emptyFiles = assets.filter((asset) => asset.localStatus === "empty").length;
  const unsafePaths = assets.filter((asset) => asset.localStatus === "unsafe").length;
  const missingProvenance = assets.filter((asset) => asset.provenanceStatus === "missing").length;
  const missingRights = assets.filter((asset) => asset.rightsStatus === "missing").length;
  const unresolvedPlannedAssetRefs = shots.reduce((sum, shot) => sum + shot.unresolvedPlannedAssetRefs.length, 0);
  const linkedCriteria = criteria.filter((criterion) => criterion.assetStatus === "linked").length;
  const partialCriteria = criteria.filter((criterion) => criterion.assetStatus === "partial").length;
  const unlinkedCriteria = criteria.filter((criterion) => criterion.assetStatus === "unlinked").length;
  const shotsWithAssets = shots.filter((shot) => shot.manifestAssets.length > 0).length;
  const hasWarnings = issues.some((issue) => issue.severity === "warning");
  const hasErrors = issues.some((issue) => issue.severity === "error");
  const criteriaUnavailable = !Array.isArray(coverageInput) || coverageInput.length === 0;
  const status: AssetEvidenceReport["summary"]["status"] = hasErrors ? "invalid" : !assets.length ? "no-assets" : hasWarnings ? "needs-review" : criteriaUnavailable ? "criteria-unavailable" : "ready";
  return {
    schemaVersion: 1,
    reportType: "production-asset-evidence",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generatedBy: "ai-video-studio/director:asset-evidence",
    project: { id: asText(planValue.id) ?? "unknown", title: asText(planValue.title) ?? "Untitled" },
    source: { planPath: options.planPath ?? null, manifestPath: options.manifestPath ?? null, projectRoot },
    summary: {
      status,
      shotCount: shots.length,
      assetCount: assets.length,
      shotsWithAssets,
      unlinkedShots: shots.length - shotsWithAssets,
      criterionCount: criteria.length,
      linkedCriteria,
      partialCriteria,
      unlinkedCriteria,
      missingFiles,
      assetsNotLocal,
      emptyFiles,
      unsafePaths,
      missingProvenance,
      missingRights,
      unresolvedPlannedAssetRefs,
      unknownManifestShotIds: unknownShotIds.size,
      visualReviewApproved,
      visualReviewPending,
      visualReviewRejected,
      visualReviewMissing,
      missingPreviews,
    },
    shots,
    assets,
    criteria,
    issues,
  };
};

const main = async () => {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const positional = args.filter((arg) => arg !== "--strict");
  const planPath = positional[0];
  const manifestPathArg = positional[1];
  const outputPath = positional[2];
  if (!planPath || positional.length > 3) {
    process.stderr.write("Usage: npm run director:asset-evidence -- <production-plan.json> [asset-manifest.json] [report.json] [--strict]\n");
    process.exitCode = 2;
    return;
  }
  try {
    const absolutePlanPath = path.resolve(planPath);
    const plan = JSON.parse(await readFile(absolutePlanPath, "utf8")) as unknown;
    const validationErrors = validateProductionPlan(plan);
    if (validationErrors.length) throw new Error("Production plan invalid:\n" + validationErrors.map((error) => "- " + error).join("\n"));
    const configuredManifestPath = isRecord(plan) ? asText(plan.assetManifestPath) : null;
    const manifestPath = path.resolve(manifestPathArg ?? configuredManifestPath ?? path.join(path.dirname(absolutePlanPath), "asset-manifest.json"));
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
    const manifestDirectory = path.dirname(manifestPath);
    const projectRoot = path.basename(manifestDirectory).toLowerCase() === "production" ? path.dirname(manifestDirectory) : manifestDirectory;
    const report = await buildAssetEvidenceReport(plan, manifest, {
      projectRoot,
      planPath: path.relative(process.cwd(), absolutePlanPath),
      manifestPath: path.relative(process.cwd(), manifestPath),
    });
    const output = JSON.stringify(report, null, 2) + "\n";
    if (outputPath) {
      await writeFile(path.resolve(outputPath), output, "utf8");
      process.stdout.write(`Asset evidence report written: ${outputPath}\n`);
    } else process.stdout.write(output);
    if (strict && (report.issues.some((issue) => issue.severity === "warning" || issue.severity === "error") || report.summary.status === "criteria-unavailable" || report.summary.status === "no-assets")) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`Could not create asset evidence report: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
