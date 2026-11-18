import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

type ManifestAsset = {
  type?: unknown;
  title?: unknown;
  file?: unknown;
  creator?: unknown;
  attribution?: unknown;
  sourcePage?: unknown;
  license?: unknown;
  licenseUrl?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const clean = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export const buildFootageCredits = (manifest: unknown): string => {
  const assets = isRecord(manifest) && Array.isArray(manifest.assets)
    ? manifest.assets.filter((item): item is ManifestAsset =>
        isRecord(item) && item.type === "licensed video footage")
    : [];

  if (assets.length === 0) {
    return "Footage attribution\n\nNo third-party video footage was used in this render.\n";
  }

  const entries = assets.map((asset, index) => {
    const title = clean(asset.title) || clean(asset.file) || "Untitled video";
    const creator = clean(asset.attribution) || clean(asset.creator) || "Creator not identified";
    const source = clean(asset.sourcePage) || "Source page not recorded";
    const license = clean(asset.license) || "License not recorded";
    const licenseUrl = clean(asset.licenseUrl);
    return [
      `${index + 1}. ${title}`,
      `   Creator / attribution: ${creator}`,
      `   Source: ${source}`,
      `   License: ${license}${licenseUrl ? ` (${licenseUrl})` : ""}`,
      "   Changes: trimmed to the storyboard shot, cropped/reframed with a slow push, and source audio muted.",
    ].join("\n");
  });

  return [
    "Footage attribution",
    "",
    "Third-party footage credits for the accompanying video render.",
    "Clips have been trimmed, cropped/reframed, and muted; no source audio is included.",
    "",
    ...entries,
    "",
    "Include these credits with any public redistribution of the video.",
  ].join("\n") + "\n";
};

const run = async () => {
  const [manifestPath, outputPath] = process.argv.slice(2);
  if (!manifestPath || !outputPath) {
    throw new Error("Usage: tsx scripts/write-footage-credits.ts <asset-manifest.json> <output.txt>");
  }

  let manifest: unknown = {};
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  } catch (error) {
    if (!isRecord(error) || error.code !== "ENOENT") throw error;
  }

  await writeFile(outputPath, buildFootageCredits(manifest), "utf8");
  console.log(`Wrote footage attribution credits to ${outputPath}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
