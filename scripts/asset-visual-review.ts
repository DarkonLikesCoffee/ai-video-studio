import { execFile } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { AssetReviewProps } from "../packages/video-engine/src/scenes/AssetReview";

const execFileAsync = promisify(execFile);
const IMAGE_EXTENSIONS = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 16;
const DEFAULT_MAX_FILE_SIZE_BYTES = 40 * 1024 * 1024;

export type VisualAssetFile = {
  relativePath: string;
  extension: string;
  sizeBytes: number;
};

export type SkippedVisualAsset = {
  relativePath: string;
  reason: string;
};

export type CollectedVisualAssets = {
  assetsDirectory: string;
  assets: VisualAssetFile[];
  skipped: SkippedVisualAsset[];
};

export type AssetReviewPage = {
  pageNumber: number;
  fileName: string;
  assetPaths: string[];
};

export type AssetVisualReviewManifest = {
  schemaVersion: 1;
  kind: "asset-visual-review";
  project: string;
  generatedAt: string;
  reviewStatus: "pending-visual-inspection";
  summary: {
    assetCount: number;
    skippedCount: number;
    pageCount: number;
  };
  assets: VisualAssetFile[];
  skipped: SkippedVisualAsset[];
  pages: AssetReviewPage[];
  reviewInstructions: string[];
  limitations: string[];
};

export type AssetVisualReviewOptions = {
  projectPath: string;
  outputDirectory?: string;
  pageSize?: number;
  maxFileSizeBytes?: number;
};

export const isPathInside = (parent: string, candidate: string): boolean => {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative));
};

const toPosixPath = (value: string): string => value.split(path.sep).join("/");

export const chunkVisualAssets = <T>(assets: T[], pageSize = DEFAULT_PAGE_SIZE): T[][] => {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error("pageSize must be an integer from 1 to " + MAX_PAGE_SIZE + ".");
  }

  const pages: T[][] = [];
  for (let index = 0; index < assets.length; index += pageSize) {
    pages.push(assets.slice(index, index + pageSize));
  }
  return pages;
};

/**
 * Recursively collect only regular, supported image files in a project's
 * assets directory. Symlinks are never followed. Paths are relative to the
 * project root so they can be passed to Remotion staticFile().
 */
export const collectVisualAssets = async (
  projectPath: string,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
): Promise<CollectedVisualAssets> => {
  if (!Number.isFinite(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error("maxFileSizeBytes must be a positive finite number.");
  }

  const projectRoot = await realpath(path.resolve(projectPath));
  const assetsPath = path.join(projectRoot, "assets");
  const assetsStat = await lstat(assetsPath).catch(() => null);
  if (!assetsStat || !assetsStat.isDirectory() || assetsStat.isSymbolicLink()) {
    throw new Error("Project assets directory is missing or unsafe: " + assetsPath);
  }

  const assetsDirectory = await realpath(assetsPath);
  if (!isPathInside(projectRoot, assetsDirectory)) {
    throw new Error("Project assets directory resolves outside the project root.");
  }

  const assets: VisualAssetFile[] = [];
  const skipped: SkippedVisualAsset[] = [];

  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));
      const fileStat = await lstat(absolutePath);

      if (fileStat.isSymbolicLink()) {
        skipped.push({ relativePath, reason: "Symbolic links are not followed." });
        continue;
      }
      if (fileStat.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!fileStat.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(extension)) continue;

      if (fileStat.size > maxFileSizeBytes) {
        skipped.push({
          relativePath,
          reason: "File is " + fileStat.size + " bytes; limit is " + maxFileSizeBytes + " bytes.",
        });
        continue;
      }

      const resolvedFile = await realpath(absolutePath);
      if (!isPathInside(assetsDirectory, resolvedFile)) {
        skipped.push({ relativePath, reason: "Resolved path is outside the project assets directory." });
        continue;
      }

      assets.push({ relativePath, extension, sizeBytes: fileStat.size });
    }
  };

  await visit(assetsDirectory);
  assets.sort((left, right) =>
    left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0,
  );
  skipped.sort((left, right) =>
    left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0,
  );

  return { assetsDirectory, assets, skipped };
};

export const buildAssetReviewPages = (pages: VisualAssetFile[][]): AssetReviewPage[] =>
  pages.map((assets, index) => ({
    pageNumber: index + 1,
    fileName: "asset-review-" + String(index + 1).padStart(2, "0") + ".png",
    assetPaths: assets.map(asset => asset.relativePath),
  }));

export const buildAssetVisualReviewManifest = (
  projectName: string,
  collected: CollectedVisualAssets,
  pages: AssetReviewPage[],
): AssetVisualReviewManifest => ({
  schemaVersion: 1,
  kind: "asset-visual-review",
  project: projectName,
  generatedAt: new Date().toISOString(),
  reviewStatus: "pending-visual-inspection",
  summary: {
    assetCount: collected.assets.length,
    skippedCount: collected.skipped.length,
    pageCount: pages.length,
  },
  assets: collected.assets,
  skipped: collected.skipped,
  pages,
  reviewInstructions: [
    "Open and inspect every generated PNG page; do not judge the artwork from SVG source code alone.",
    "Check silhouette, proportions, composition, visual style, detail quality, transparency, cropping and suitability for the intended shot.",
    "Revise weak source assets, regenerate the previews and inspect again before using those assets in scenes.",
    "Record the assistant's actual visual findings in the project's production notes.",
  ],
  limitations: [
    "This tool renders static image files in the project assets directory; it does not inspect inline SVG/JSX drawings, videos, 3D models or animation.",
    "The tool does not call an AI model, score visual quality or approve assets. Review is performed by the assistant or a human who can inspect the PNGs.",
    "A good asset preview does not prove that its animation, composition or final video is good; inspect the rendered video separately.",
  ],
});

const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

export const buildAssetReviewHtml = (
  projectName: string,
  manifest: AssetVisualReviewManifest,
): string => {
  const pageSections = manifest.pages.map(page => (
    '<section class="page"><div class="page-heading"><h2>Preview page ' + page.pageNumber +
    '</h2><a href="' + escapeHtml(page.fileName) +
    '" target="_blank" rel="noreferrer">Open full resolution</a></div><img src="' +
    escapeHtml(page.fileName) + '" alt="Rendered asset preview page ' + page.pageNumber +
    '"><p>' + page.assetPaths.map(escapeHtml).join(" · ") + "</p></section>"
  )).join("\n");

  const assetList = manifest.assets.map(asset =>
    "<li><code>" + escapeHtml(asset.relativePath) + "</code> · " +
    (asset.sizeBytes / 1024).toFixed(1) + " KB</li>",
  ).join("\n");
  const skippedList = manifest.skipped.map(asset =>
    "<li><code>" + escapeHtml(asset.relativePath) + "</code> — " +
    escapeHtml(asset.reason) + "</li>",
  ).join("\n");

  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Asset visual review — " + escapeHtml(projectName) + "</title>" +
    "<style>:root{color-scheme:dark;background:#0d121a;color:#edf2f8;font:15px/1.5 Inter,system-ui,sans-serif}" +
    "*{box-sizing:border-box}body{margin:0;padding:28px}main{max-width:1400px;margin:auto}" +
    "h1{font-size:30px;margin:4px 0}h2{font-size:19px;margin:0}.muted{color:#a5b3c4}" +
    ".status{display:inline-block;padding:5px 10px;border:1px solid #8d6738;border-radius:999px;color:#f0ca91;font-size:12px}" +
    ".notice{padding:14px 16px;border:1px solid #75592f;border-radius:10px;background:#251e14;margin:20px 0}" +
    ".page{margin:22px 0 34px;padding:16px;border:1px solid #344153;border-radius:12px;background:#151d29}" +
    ".page-heading{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:12px}" +
    "a{color:#8bd7ff}.page img{display:block;max-width:100%;height:auto;border:1px solid #3a4657;border-radius:8px}" +
    ".page p{color:#a5b3c4;font-size:12px;overflow-wrap:anywhere}details{margin:18px 0;border:1px solid #344153;border-radius:10px;padding:12px 16px}" +
    "li{margin:5px 0}code{overflow-wrap:anywhere;color:#c7e3ff}</style></head><body><main>" +
    '<div class="status">Pending visual inspection — not approved</div>' +
    "<h1>Asset review: " + escapeHtml(projectName) + "</h1>" +
    '<p class="muted">' + manifest.summary.assetCount + " image assets · " +
    manifest.summary.pageCount + " preview pages · " + manifest.summary.skippedCount +
    ' skipped files</p><div class="notice"><strong>Required next step:</strong> open and inspect every preview page. ' +
    "The tool only renders the assets; it does not judge whether they look good. Correct weak source assets and regenerate the previews before building scenes.</div>" +
    (pageSections || "<p>No supported static image assets were found in the project's assets directory.</p>") +
    "<details><summary>Included image files (" + manifest.assets.length + ")</summary><ul>" +
    assetList + "</ul></details><details><summary>Skipped files (" + manifest.skipped.length +
    ")</summary><ul>" + skippedList + "</ul></details><details><summary>Review limitations</summary><ul>" +
    manifest.limitations.map(item => "<li>" + escapeHtml(item) + "</li>").join("") +
    "</ul></details></main></body></html>";
};

export const parseAssetVisualReviewArgs = (args: string[]): {
  projectPath: string;
  outputDirectory?: string;
  pageSize: number;
  maxFileSizeBytes: number;
} => {
  const projectPath = args.find(argument => !argument.startsWith("--"));
  if (!projectPath) {
    throw new Error(
      "Usage: npm run assets:visual-review -- projects/<slug> [--output-dir <directory>] [--page-size 1-16] [--max-file-size-mb <number>]",
    );
  }

  let outputDirectory: string | undefined;
  let pageSize = DEFAULT_PAGE_SIZE;
  let maxFileSizeMb = DEFAULT_MAX_FILE_SIZE_BYTES / (1024 * 1024);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === projectPath) continue;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error("Missing value for " + argument + ".");

    if (argument === "--output-dir") outputDirectory = value;
    else if (argument === "--page-size") pageSize = Number(value);
    else if (argument === "--max-file-size-mb") maxFileSizeMb = Number(value);
    else throw new Error("Unknown option: " + argument + ".");
    index += 1;
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error("--page-size must be an integer from 1 to " + MAX_PAGE_SIZE + ".");
  }
  if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb <= 0 || maxFileSizeMb > 500) {
    throw new Error("--max-file-size-mb must be greater than 0 and no more than 500.");
  }

  return {
    projectPath,
    ...(outputDirectory ? { outputDirectory } : {}),
    pageSize,
    maxFileSizeBytes: Math.floor(maxFileSizeMb * 1024 * 1024),
  };
};

const findRepositoryRoot = async (startDirectory: string): Promise<string> => {
  let current = startDirectory;
  while (true) {
    try {
      const packageJson = JSON.parse(await readFile(path.join(current, "package.json"), "utf8")) as { name?: string };
      if (packageJson.name === "ai-video-studio") return current;
    } catch {
      // Keep walking upwards until the repository root is found.
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Could not locate the AI Video Studio repository root.");
    current = parent;
  }
};

const renderPage = async (
  repositoryRoot: string,
  projectRoot: string,
  outputPath: string,
  propsPath: string,
): Promise<void> => {
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath
    ? process.execPath
    : process.platform === "win32" ? "npm.cmd" : "npm";
  const npmArgs = npmExecPath ? [npmExecPath] : [];
  const args = [
    ...npmArgs,
    "run",
    "render:asset-review",
    "--workspace",
    "@ai-video-studio/video-engine",
    "--",
    outputPath,
    "--props=" + propsPath,
    "--public-dir=" + projectRoot,
    "--log=error",
  ];

  try {
    await execFileAsync(command, args, {
      cwd: repositoryRoot,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    });
  } catch (error) {
    const failure = error as { message?: string; stderr?: string; stdout?: string };
    throw new Error(
      "Remotion could not render asset preview " + path.basename(outputPath) + ".\n" +
      (failure.stderr || failure.stdout || failure.message || String(error)),
    );
  }
};

export const runAssetVisualReview = async (options: AssetVisualReviewOptions): Promise<{
  projectRoot: string;
  outputDirectory: string;
  manifestPath: string;
  htmlPath: string;
  previews: string[];
  assetCount: number;
  skippedCount: number;
}> => {
  const projectRoot = await realpath(path.resolve(options.projectPath));
  const repositoryRoot = await findRepositoryRoot(projectRoot);
  if (!isPathInside(repositoryRoot, projectRoot) || repositoryRoot === projectRoot) {
    throw new Error("Project path must be a directory inside the AI Video Studio repository.");
  }

  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const collected = await collectVisualAssets(projectRoot, options.maxFileSizeBytes);
  const assetGroups = chunkVisualAssets(collected.assets, pageSize);
  const pages = buildAssetReviewPages(assetGroups);
  const projectName = path.basename(projectRoot);
  const outputDirectory = options.outputDirectory
    ? path.resolve(options.outputDirectory)
    : await mkdtemp(path.join(os.tmpdir(), "ai-video-studio-" + projectName + "-asset-review-"));

  await mkdir(outputDirectory, { recursive: true });

  const manifest = buildAssetVisualReviewManifest(projectName, collected, pages);
  const manifestPath = path.join(outputDirectory, "manifest.json");
  const htmlPath = path.join(outputDirectory, "review.html");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  await writeFile(htmlPath, buildAssetReviewHtml(projectName, manifest), "utf8");

  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "ai-video-studio-asset-review-props-"));
  const previewPaths: string[] = [];
  try {
    for (const [index, assets] of assetGroups.entries()) {
      const pageNumber = index + 1;
      const fileName = pages[index]!.fileName;
      const outputPath = path.join(outputDirectory, fileName);
      const props: AssetReviewProps = {
        projectTitle: projectName,
        pageNumber,
        totalPages: pages.length,
        assets,
      };
      const propsPath = path.join(temporaryDirectory, "page-" + pageNumber + ".json");
      await writeFile(propsPath, JSON.stringify(props), "utf8");
      await renderPage(repositoryRoot, projectRoot, outputPath, propsPath);
      previewPaths.push(outputPath);
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }

  return {
    projectRoot,
    outputDirectory,
    manifestPath,
    htmlPath,
    previews: previewPaths,
    assetCount: collected.assets.length,
    skippedCount: collected.skipped.length,
  };
};

const runCli = async (): Promise<void> => {
  try {
    const parsed = parseAssetVisualReviewArgs(process.argv.slice(2));
    const result = await runAssetVisualReview({
      projectPath: parsed.projectPath,
      ...(parsed.outputDirectory ? { outputDirectory: parsed.outputDirectory } : {}),
      pageSize: parsed.pageSize,
      maxFileSizeBytes: parsed.maxFileSizeBytes,
    });

    process.stdout.write("Asset preview review created for " + path.basename(result.projectRoot) + ".\n");
    process.stdout.write("Assets: " + result.assetCount + "; skipped: " + result.skippedCount +
      "; preview pages: " + result.previews.length + ".\n");
    for (const preview of result.previews) process.stdout.write("- " + preview + "\n");
    process.stdout.write("Review page: " + result.htmlPath + "\nManifest: " + result.manifestPath + "\n");
    process.stdout.write("REQUIRED: inspect every PNG visually and correct weak assets before building or rendering the video. This command does not approve assets.\n");
  } catch (error) {
    process.stderr.write("Asset visual review failed: " +
      (error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await runCli();
}
