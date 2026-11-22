import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildAssetReviewHtml,
  buildAssetReviewPages,
  buildAssetVisualReviewManifest,
  chunkVisualAssets,
  collectVisualAssets,
  parseAssetVisualReviewArgs,
} from "../scripts/asset-visual-review";

test("collects supported image assets recursively in stable order", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "asset-visual-review-"));
  try {
    await mkdir(path.join(root, "assets", "nested"), { recursive: true });
    await writeFile(path.join(root, "assets", "z.png"), "png");
    await writeFile(path.join(root, "assets", "nested", "tree.svg"), "<svg/>");
    await writeFile(path.join(root, "assets", "audio.wav"), "audio");
    await writeFile(path.join(root, "assets", "clip.mp4"), "video");

    const result = await collectVisualAssets(root);
    assert.deepEqual(result.assets.map(asset => asset.relativePath), [
      "assets/nested/tree.svg",
      "assets/z.png",
    ]);
    assert.deepEqual(result.skipped, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not follow symbolic links and reports oversized image files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "asset-visual-review-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "asset-visual-review-outside-"));
  try {
    await mkdir(path.join(root, "assets"), { recursive: true });
    await writeFile(path.join(root, "assets", "large.svg"), "123456");
    await writeFile(path.join(outside, "outside.svg"), "<svg/>");
    await symlink(path.join(outside, "outside.svg"), path.join(root, "assets", "linked.svg"));

    const result = await collectVisualAssets(root, 4);
    assert.deepEqual(result.assets, []);
    assert.deepEqual(result.skipped.map(item => item.relativePath), [
      "assets/large.svg",
      "assets/linked.svg",
    ]);
    assert.match(result.skipped[0]!.reason, /limit/);
    assert.match(result.skipped[1]!.reason, /Symbolic links/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("chunks assets into bounded deterministic pages", () => {
  assert.deepEqual(chunkVisualAssets([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunkVisualAssets([], 12), []);
  assert.throws(() => chunkVisualAssets([1], 17), /pageSize/);
});

test("review manifest is explicitly pending and never claims visual approval", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "asset-visual-review-"));
  try {
    await mkdir(path.join(root, "assets"), { recursive: true });
    await writeFile(path.join(root, "assets", "tree.svg"), "<svg/>");
    const collected = await collectVisualAssets(root);
    const pages = buildAssetReviewPages(chunkVisualAssets(collected.assets));
    const manifest = buildAssetVisualReviewManifest("forest", collected, pages);
    assert.equal(manifest.reviewStatus, "pending-visual-inspection");
    assert.equal(manifest.summary.assetCount, 1);
    assert.match(manifest.limitations.join(" "), /does not call an AI model/);
    const html = buildAssetReviewHtml("forest", manifest);
    assert.match(html, /Pending visual inspection/);
    assert.match(html, /asset-review-01\.png/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("review HTML escapes project and asset names", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "asset-visual-review-"));
  try {
    await mkdir(path.join(root, "assets"), { recursive: true });
    await writeFile(path.join(root, "assets", "<bad>.svg"), "<svg/>");
    const collected = await collectVisualAssets(root);
    const manifest = buildAssetVisualReviewManifest(
      "<forest>",
      collected,
      buildAssetReviewPages([collected.assets]),
    );
    const html = buildAssetReviewHtml("<forest>", manifest);
    assert.match(html, /&lt;forest&gt;/);
    assert.match(html, /&lt;bad&gt;\.svg/);
    assert.doesNotMatch(html, /<bad>/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parses CLI defaults and rejects invalid values", () => {
  assert.deepEqual(parseAssetVisualReviewArgs(["projects/demo"]), {
    projectPath: "projects/demo",
    pageSize: 12,
    maxFileSizeBytes: 40 * 1024 * 1024,
  });
  assert.deepEqual(parseAssetVisualReviewArgs([
    "projects/demo", "--output-dir", "review", "--page-size", "8", "--max-file-size-mb", "20",
  ]), {
    projectPath: "projects/demo",
    outputDirectory: "review",
    pageSize: 8,
    maxFileSizeBytes: 20 * 1024 * 1024,
  });
  assert.throws(() => parseAssetVisualReviewArgs(["projects/demo", "--page-size", "0"]), /page-size/);
});
