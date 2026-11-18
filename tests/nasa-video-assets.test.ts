import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchNasaVideoWithRetries,
  getNasaRetryDelayMs,
  isSafeNasaSvsUrl,
  isSafeNasaLibraryVideoUrl,
  resolveNasaLibraryVideoUrl,
  validateNasaSelection,
} from "../scripts/nasa-video-assets.mjs";

const selection = {
  assets: [{
    id: "earth-iss",
    title: "Earth Illuminated",
    creator: "NASA's Goddard Space Flight Center",
    sourcePage: "https://svs.gsfc.nasa.gov/11474",
    url: "https://svs.gsfc.nasa.gov/vis/a010000/a011400/a011474/Earth_Illuminated-540-MASTER_high.mp4",
    mime: "video/mp4",
    license: "Public domain",
    shotIds: ["solar-spectrum"],
  }],
};

test("allows only direct NASA SVS video assets on the approved host", () => {
  assert.equal(isSafeNasaSvsUrl(selection.assets[0].url), true);
  assert.equal(isSafeNasaSvsUrl("https://upload.wikimedia.org/video.mp4"), false);
  assert.equal(isSafeNasaSvsUrl("http://svs.gsfc.nasa.gov/vis/video.mp4"), false);
  assert.equal(isSafeNasaSvsUrl("https://svs.gsfc.nasa.gov.evil.example/vis/video.mp4"), false);
  assert.equal(isSafeNasaSvsUrl("https://svs.gsfc.nasa.gov/11474"), false);
});

test("validates public-domain selection metadata and storyboard shot IDs", () => {
  assert.equal(validateNasaSelection(selection).length, 1);
  assert.throws(() => validateNasaSelection({ assets: [{ ...selection.assets[0], license: "CC BY-NC 4.0" }] }), /Public domain/);
  assert.throws(() => validateNasaSelection({ assets: [{ ...selection.assets[0], sourcePage: "https://example.com" }] }), /source page/);
  assert.throws(() => validateNasaSelection({ assets: [{ ...selection.assets[0], shotIds: [] }] }), /shotId/);
});

test("bounds and parses NASA Retry-After delays", () => {
  assert.equal(getNasaRetryDelayMs("2", 0, 0), 2000);
  assert.equal(getNasaRetryDelayMs(null, 2), 4000);
  assert.equal(getNasaRetryDelayMs(null, 20), 15000);
});

test("retries temporary NASA download failures", async () => {
  let calls = 0;
  const waits: number[] = [];
  const response = await fetchNasaVideoWithRetries(
    selection.assets[0].url,
    async () => {
      calls += 1;
      return calls === 1
        ? new Response("rate limited", { status: 429, headers: { "retry-after": "1" } })
        : new Response("video", { status: 200 });
    },
    async (delay) => { waits.push(delay); },
  );
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(waits, [1000]);
});

test("only accepts NASA Images Library media URLs on the approved video host", () => {
  assert.equal(isSafeNasaLibraryVideoUrl("https://images-assets.nasa.gov/video/ID/ID~orig.mp4"), true);
  assert.equal(isSafeNasaLibraryVideoUrl("https://images-assets.nasa.gov/image/ID/ID~orig.jpg"), false);
  assert.equal(isSafeNasaLibraryVideoUrl("https://evil.example/video/ID.mp4"), false);
});

test("resolves the original MP4 from a NASA Images API asset manifest", async () => {
  const result = await resolveNasaLibraryVideoUrl("NASA VIDEO ID", async (url) => {
    assert.equal(String(url), "https://images-api.nasa.gov/asset/NASA%20VIDEO%20ID");
    return new Response(JSON.stringify({
      collection: {
        items: [
          { href: "https://images-assets.nasa.gov/video/NASA%20VIDEO%20ID/NASA%20VIDEO%20ID~thumb.mp4" },
          { href: "https://images-assets.nasa.gov/video/NASA%20VIDEO%20ID/NASA%20VIDEO%20ID~orig.mp4" },
          { href: "https://images-assets.nasa.gov/video/NASA%20VIDEO%20ID/NASA%20VIDEO%20ID.srt" },
        ],
      },
    }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.equal(result, "https://images-assets.nasa.gov/video/NASA%20VIDEO%20ID/NASA%20VIDEO%20ID~orig.mp4");
});

test("rejects NASA asset manifests containing no approved video files", async () => {
  await assert.rejects(
    resolveNasaLibraryVideoUrl("NASA VIDEO ID", async () =>
      new Response(JSON.stringify({ collection: { items: [
        { href: "https://images-assets.nasa.gov/image/ID/ID~orig.jpg" },
        { href: "https://evil.example/video/ID.mp4" },
      ] } }), { status: 200 })),
    /no supported images-assets/,
  );
});
