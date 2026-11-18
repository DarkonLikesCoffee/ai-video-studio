import assert from "node:assert/strict";
import test from "node:test";
import { buildFootageCredits } from "../scripts/write-footage-credits";

test("writes creator, source, license and modifications for video footage", () => {
  const credits = buildFootageCredits({
    assets: [
      {
        type: "licensed video footage",
        title: "Cloud timelapse.webm",
        creator: "John Fowler",
        attribution: "John Fowler (away)",
        sourcePage: "https://commons.wikimedia.org/wiki/File:Cloud_timelapse.webm",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      },
    ],
  });
  assert.match(credits, /John Fowler \(away\)/);
  assert.match(credits, /commons\.wikimedia\.org/);
  assert.match(credits, /CC BY 2\.0/);
  assert.match(credits, /cropped\/reframed/);
});

test("omits unrelated assets and handles an empty manifest", () => {
  const credits = buildFootageCredits({
    assets: [{ type: "image", title: "Still image" }],
  });
  assert.match(credits, /No third-party video footage/);
  assert.doesNotMatch(credits, /Still image/);
});
