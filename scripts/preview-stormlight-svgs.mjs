import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const files = ["projects/stormlight-keeper/assets/beacon-beam.svg","projects/stormlight-keeper/assets/beacon-mechanism.svg","projects/stormlight-keeper/assets/distant-vessel.svg","projects/stormlight-keeper/assets/lighthouse-door.svg","projects/stormlight-keeper/assets/lighthouse-lens.svg","projects/stormlight-keeper/assets/lighthouse-main.svg","projects/stormlight-keeper/assets/robot-hands.svg","projects/stormlight-keeper/assets/robot-main.svg","projects/stormlight-keeper/assets/spiral-stair.svg","projects/stormlight-keeper/assets/storm-sea.svg"];
await mkdir("review-output/svg-previews", { recursive: true });
const results = [];
for (const file of files) {
  const svg = await readFile(file, "utf8");
  const svgRoot = svg.match(/<svg\\b[^>]*>/i)?.[0] ?? "";
  const viewBox = svgRoot.match(/viewBox=["']([^"']+)["']/i)?.[1] ?? null;
  if (!svgRoot || !viewBox) throw new Error(`SVG root or viewBox missing: ${file}`);
  const [viewWidth, viewHeight] = viewBox.trim().split(/[ ,]+/).slice(2).map(Number);
  if (!(viewWidth > 0 && viewHeight > 0)) throw new Error(`Invalid viewBox: ${file}`);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: Math.min(1920, Math.max(800, Math.round(viewWidth))) } });
  const rendered = resvg.render();
  const preview = resolve("review-output/svg-previews", file.split("/").pop().replace(".svg", ".png"));
  await writeFile(preview, rendered.asPng());
  const pngSize = { width: rendered.width, height: rendered.height };
  results.push({ file, validRoot: true, viewBox, pngSize, bytes: rendered.asPng().byteLength, preview });
}
await writeFile("review-output/svg-previews/report.json", JSON.stringify({ schemaVersion: 1, previews: results }, null, 2));
console.log(JSON.stringify(results, null, 2));