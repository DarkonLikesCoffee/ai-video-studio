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

const legacyAudioDirectory = resolve("projects/examples/three-scene-story/assets/audio");
await writeMonoWav(resolve(legacyAudioDirectory, "ambient-bed.wav"), 10, (time) => {
  const envelope = Math.max(0, Math.min(1, time / 1.6, (10 - time) / 1.8));
  const chord =
    Math.sin(2 * Math.PI * 130.81 * time) * 0.34 +
    Math.sin(2 * Math.PI * 155.56 * time) * 0.26 +
    Math.sin(2 * Math.PI * 196 * time) * 0.22 +
    Math.sin(2 * Math.PI * 261.63 * time) * 0.12;
  const shimmer = Math.sin(2 * Math.PI * 523.25 * time + Math.sin(time * 0.7)) * 0.06;
  return (chord + shimmer) * envelope * 0.24;
});
await writeMonoWav(resolve(legacyAudioDirectory, "transition-chime.wav"), 1.6, (time) => {
  const envelope = Math.min(1, time / 0.012) * Math.exp(-time * 3.8);
  const partials =
    Math.sin(2 * Math.PI * 880 * time) +
    Math.sin(2 * Math.PI * 1320 * time) * 0.38 +
    Math.sin(2 * Math.PI * 1760 * time) * 0.16;
  return partials * envelope * 0.34;
});

const showcaseDirectory = resolve("projects/showcase-motion/assets/audio");
const showcaseDuration = 16;
const chordSets = [
  [110, 164.81, 220, 261.63],
  [98, 146.83, 196, 246.94],
  [123.47, 185, 246.94, 293.66],
  [110, 164.81, 220, 261.63],
];

await writeMonoWav(resolve(showcaseDirectory, "score.wav"), showcaseDuration, (time) => {
  const fadeIn = Math.min(1, time / 1.1);
  const fadeOut = Math.min(1, (showcaseDuration - time) / 1.5);
  const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
  const chord = chordSets[Math.min(3, Math.floor(time / 4))]!;
  const pad = chord.reduce((sum, frequency, index) => {
    const slowDetune = Math.sin(2 * Math.PI * (frequency * (index % 2 === 0 ? 1 : 1.003)) * time);
    return sum + slowDetune * (0.16 - index * 0.018);
  }, 0);
  const beat = time % (60 / 92);
  const kickEnvelope = Math.exp(-beat * 28);
  const kickFrequency = 48 + 42 * Math.exp(-beat * 18);
  const kick = Math.sin(2 * Math.PI * kickFrequency * beat) * kickEnvelope * 0.16;
  const pulse = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.115 * time);
  const highTexture =
    Math.sin(2 * Math.PI * 440 * time) * 0.028 +
    Math.sin(2 * Math.PI * 659.25 * time + Math.sin(time * 0.6)) * 0.024 +
    Math.sin(2 * Math.PI * 880 * time) * 0.012;
  return (pad + kick + highTexture) * pulse * envelope * 0.72;
});

await writeMonoWav(resolve(showcaseDirectory, "transition-whoosh.wav"), 1.35, (time) => {
  const envelope = Math.pow(Math.sin(Math.PI * time / 1.35), 1.7);
  const noise =
    Math.sin(time * 1281.7) * 0.36 +
    Math.sin(time * 1997.3) * 0.28 +
    Math.sin(time * 2873.1) * 0.2 +
    Math.sin(time * 4079.9) * 0.16;
  const tonalSweep = Math.sin(2 * Math.PI * (160 + 850 * time) * time) * 0.2;
  return (noise + tonalSweep) * envelope * 0.28;
});

await writeMonoWav(resolve(showcaseDirectory, "impact.wav"), 1.1, (time) => {
  const envelope = Math.exp(-time * 5.6);
  const frequency = 78 - 26 * (1 - Math.exp(-time * 9));
  const body = Math.sin(2 * Math.PI * frequency * time) * 0.7;
  const click = Math.sin(2 * Math.PI * 1480 * time) * Math.exp(-time * 65) * 0.3;
  return (body + click) * envelope * 0.48;
});

await writeMonoWav(resolve(showcaseDirectory, "transition-chime.wav"), 1.55, (time) => {
  const envelope = Math.min(1, time / 0.012) * Math.exp(-time * 3.1);
  const chord =
    Math.sin(2 * Math.PI * 659.25 * time) * 0.42 +
    Math.sin(2 * Math.PI * 880 * time) * 0.32 +
    Math.sin(2 * Math.PI * 1318.5 * time) * 0.22 +
    Math.sin(2 * Math.PI * 1760 * time) * 0.12;
  return chord * envelope * 0.42;
});

// This muted test signal is used only as the sidechain key for automatic music ducking.
await writeMonoWav(resolve(showcaseDirectory, "ducking-key.wav"), showcaseDuration, (time) => {
  const phrases = [[5.1, 6.7], [10.0, 11.2]];
  const active = phrases.some(([start, end]) => time >= start! && time <= end!);
  if (!active) return 0;
  const pulse = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin((time - Math.floor(time * 3.2) / 3.2) * Math.PI * 3.2)), 2);
  const syllable = Math.sin(2 * Math.PI * 185 * time) * 0.62 +
    Math.sin(2 * Math.PI * 370 * time) * 0.25 +
    Math.sin(2 * Math.PI * 555 * time) * 0.13;
  return syllable * pulse * 0.34;
});

console.log("Generated legacy samples and original Aether showcase audio fixtures.");
