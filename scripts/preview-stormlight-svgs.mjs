import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { chromium } from "playwright";

const files = ["projects/stormlight-keeper/assets/beacon-beam.svg","projects/stormlight-keeper/assets/beacon-mechanism.svg","projects/stormlight-keeper/assets/distant-vessel.svg","projects/stormlight-keeper/assets/lighthouse-door.svg","projects/stormlight-keeper/assets/lighthouse-lens.svg","projects/stormlight-keeper/assets/lighthouse-main.svg","projects/stormlight-keeper/assets/robot-hands.svg","projects/stormlight-keeper/assets/robot-main.svg","projects/stormlight-keeper/assets/spiral-stair.svg","projects/stormlight-keeper/assets/storm-sea.svg"];
await mkdir("review-output/svg-previews", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const results = [];
for (const file of files) {
  const svg = await readFile(file, "utf8");
  await page.setContent(svg);
  const root = await page.locator("svg").count();
  const dims = await page.locator("svg").evaluate(el => ({ viewBox: el.getAttribute("viewBox"), width: el.getAttribute("width"), height: el.getAttribute("height") }));
  const preview = resolve("review-output/svg-previews", file.split("/").pop().replace(".svg", ".png"));
  await page.locator("svg").screenshot({ path: preview, omitBackground: true });
  const imageSize = await page.locator("svg").evaluate(el => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
  });
  results.push({ file, validRoot: root === 1, ...dims, imageSize, preview });
}
await browser.close();
await writeFile("review-output/svg-previews/report.json", JSON.stringify({ schemaVersion: 1, previews: results }, null, 2));
console.log(JSON.stringify(results, null, 2));