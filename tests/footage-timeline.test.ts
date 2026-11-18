import assert from "node:assert/strict";
import test from "node:test";
import { buildNarratedFootageTimeline } from "../packages/video-engine/src/footage";

const plan = {
  shots: [
    { id: "opening", startSeconds: 0, durationSeconds: 4 },
    { id: "middle", startSeconds: 4, durationSeconds: 3.5 },
    { id: "closing", startSeconds: 7.5, durationSeconds: 2.5 },
  ],
};

test("maps reviewed local footage assets to exact storyboard frame ranges", () => {
  const manifest = {
    assets: [
      { file: "sunrise-12345678.mp4", license: "CC BY 4.0", shotIds: ["opening", "middle"], trimBeforeSecondsByShotId: { opening: 0, middle: 12.5 } },
      { file: "horizon-abcd1234.webm", license: "CC0", shotIds: ["closing"] },
    ],
  };
  assert.deepEqual(buildNarratedFootageTimeline(manifest, plan, 30), [
    { id: "footage-opening-0", src: "assets/sunrise-12345678.mp4", startInFrames: 0, durationInFrames: 120 },
    { id: "footage-middle-0", src: "assets/sunrise-12345678.mp4", startInFrames: 120, durationInFrames: 105, trimBefore: 375 },
    { id: "footage-closing-1", src: "assets/horizon-abcd1234.webm", startInFrames: 225, durationInFrames: 75 },
  ]);
});

test("uses only the first selected asset for each shot and skips unknown shot IDs", () => {
  const manifest = {
    assets: [
      { file: "first.mp4", license: "Public domain", shotIds: ["opening", "not-in-plan"] },
      { file: "second.mp4", license: "CC BY 3.0", shotIds: ["opening", "middle"] },
    ],
  };
  const clips = buildNarratedFootageTimeline(manifest, plan, 24);
  assert.equal(clips.length, 2);
  assert.equal(clips[0]?.src, "assets/first.mp4");
  assert.equal(clips[1]?.src, "assets/second.mp4");
});

test("does not emit unsafe paths or unsupported file extensions", () => {
  const manifest = {
    assets: [
      { file: "../secret.mp4", license: "CC0", shotIds: ["opening"] },
      { file: "still.jpg", license: "CC0", shotIds: ["middle"] },
      { file: "unlicensed.mp4", license: "CC BY-SA 4.0", shotIds: ["opening"] },
      { file: "safe.mov", license: "CC BY 2.0", shotIds: ["closing"] },
    ],
  };
  const clips = buildNarratedFootageTimeline(manifest, plan, 30);
  assert.deepEqual(clips.map((clip) => clip.src), ["assets/safe.mov"]);
});

test("rejects invalid frame rates and malformed inputs", () => {
  assert.throws(() => buildNarratedFootageTimeline({ assets: [] }, plan, 0), /fps/);
  assert.throws(() => buildNarratedFootageTimeline({}, plan, 30), /assets array/);
  assert.throws(() => buildNarratedFootageTimeline({ assets: [] }, {}, 30), /shots array/);
});

test("maps per-shot source trim offsets from the selected NASA clip", () => {
  const manifest = {
    assets: [{
      file: "Earth-Views.mp4",
      license: "Public domain",
      shotIds: ["opening", "middle"],
      trimBeforeSecondsByShotId: { opening: 12, middle: 48.5 },
    }],
  };
  const clips = buildNarratedFootageTimeline(manifest, plan, 30);
  assert.deepEqual(clips.map((clip) => clip.trimBefore ?? 0), [360, 1455]);
});
