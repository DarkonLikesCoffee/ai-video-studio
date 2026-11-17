import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sampleRate = 22_050;
const bitsPerSample = 16;
const bytesPerSample = bitsPerSample / 8;

const writeMonoWav = async (
  filePath: string,
  durationSeconds: number,
  sampleAt: (timeSeconds: number) => number
): Promise<void> => {
  const sampleCount = Math.ceil(sampleRate * durationSeconds);
  const dataBytes = sampleCount * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const timeSeconds = index / sampleRate;
    const sample = Math.max(-1, Math.min(1, sampleAt(timeSeconds)));
    buffer.writeInt16LE(Math.round(sample * 32_767), 44 + index * bytesPerSample);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
};

const assetDirectory = resolve("projects/examples/three-scene-story/assets/audio");
const musicDuration = 10;
const musicPath = resolve(assetDirectory, "ambient-bed.wav");
const chimePath = resolve(assetDirectory, "transition-chime.wav");

await writeMonoWav(musicPath, musicDuration, (time) => {
  const fadeIn = Math.min(1, time / 1.6);
  const fadeOut = Math.min(1, (musicDuration - time) / 1.8);
  const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
  const pulse = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.12 * time);
  const chord =
    Math.sin(2 * Math.PI * 130.81 * time) * 0.34 +
    Math.sin(2 * Math.PI * 155.56 * time) * 0.26 +
    Math.sin(2 * Math.PI * 196 * time) * 0.22 +
    Math.sin(2 * Math.PI * 261.63 * time) * 0.12;
  const shimmer = Math.sin(2 * Math.PI * 523.25 * time + Math.sin(time * 0.7)) * 0.06;
  return (chord + shimmer) * pulse * envelope * 0.24;
});

await writeMonoWav(chimePath, 1.6, (time) => {
  const attack = Math.min(1, time / 0.012);
  const decay = Math.exp(-time * 3.8);
  const fundamental = Math.sin(2 * Math.PI * 880 * time);
  const overtone = Math.sin(2 * Math.PI * 1320 * time) * 0.38;
  const sparkle = Math.sin(2 * Math.PI * 1760 * time) * 0.16;
  return (fundamental + overtone + sparkle) * attack * decay * 0.42;
});

console.log("Generated original audio fixtures:");
console.log(`- ${musicPath}`);
console.log(`- ${chimePath}`);
