import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleRate = 48000;
const channels = 2;
const durationSeconds = 20;
const frames = sampleRate * durationSeconds;
const left = new Float32Array(frames);
const right = new Float32Array(frames);
const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const addTone = (start, duration, frequency, gain, pan = 0, decay = 3, phase = 0) => {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(frames, Math.ceil((start + duration) * sampleRate));
  const lPan = Math.sqrt((1 - pan) * 0.5);
  const rPan = Math.sqrt((1 + pan) * 0.5);
  const attack = Math.max(0.002, Math.min(0.12, duration * 0.12));
  const release = Math.max(0.035, Math.min(0.24, duration * 0.26));
  for (let i = first; i < last; i += 1) {
    const t = i / sampleRate - start;
    const env = Math.min(1, t / attack) * Math.min(1, Math.max(0, (duration - t) / release)) * Math.exp(-decay * t / duration);
    const value = Math.sin(2 * Math.PI * frequency * t + phase) * gain * env;
    left[i] += value * lPan;
    right[i] += value * rPan;
  }
};

const addNoise = (start, duration, gain, pan = 0, seed = 17) => {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(frames, Math.ceil((start + duration) * sampleRate));
  const lPan = Math.sqrt((1 - pan) * 0.5);
  const rPan = Math.sqrt((1 + pan) * 0.5);
  let state = seed >>> 0;
  for (let i = first; i < last; i += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const noise = (state / 0xffffffff) * 2 - 1;
    const t = i / sampleRate - start;
    const env = Math.min(1, t / 0.003) * Math.min(1, (duration - t) / Math.max(0.02, duration * 0.65)) * Math.exp(-7 * t / duration);
    left[i] += noise * gain * env * lPan;
    right[i] += noise * gain * env * rPan;
  }
};

// Continuous orbital drone, slowly opening harmonics and a warm final resolve.
for (let i = 0; i < frames; i += 1) {
  const t = i / sampleRate;
  const slow = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 12.5 - 0.8);
  const ignition = smoothstep(7.7, 9.4, t);
  const bloom = smoothstep(11.9, 15.1, t);
  const finale = smoothstep(15.4, 19.7, t);
  const fade = 1 - smoothstep(19.15, 20, t);
  const drone = 0.092 * Math.sin(2 * Math.PI * 41.2 * t) + 0.034 * Math.sin(2 * Math.PI * 82.4 * t + 0.4) + 0.018 * Math.sin(2 * Math.PI * 123.6 * t + 0.9);
  const pad = 0.02 * Math.sin(2 * Math.PI * (164.8 + slow * 1.8) * t) + 0.017 * Math.sin(2 * Math.PI * 220 * t + 0.3) + 0.012 * Math.sin(2 * Math.PI * 329.6 * t + 1.2);
  const high = bloom * (0.017 * Math.sin(2 * Math.PI * 659.3 * t) + 0.011 * Math.sin(2 * Math.PI * 987.8 * t + 0.4));
  const resolve = finale * (0.024 * Math.sin(2 * Math.PI * 110 * t) + 0.018 * Math.sin(2 * Math.PI * 164.8 * t + 0.3) + 0.013 * Math.sin(2 * Math.PI * 220 * t + 0.7));
  const value = (drone + pad + high + resolve) * fade * (1 + ignition * 0.1);
  const pan = 0.92 + 0.08 * Math.sin(2 * Math.PI * 0.07 * t);
  left[i] += value * pan;
  right[i] += value * (2 - pan);
}

// Sparse station relays and close mechanical ticks.
for (const cue of [1.3, 2.55, 4.55, 5.32, 6.7, 7.22]) {
  addTone(cue, 0.12, 940 + (cue % 2) * 180, 0.072, cue % 2 ? -0.42 : 0.42, 6, 0.2);
  addNoise(cue, 0.045, 0.036, cue % 2 ? 0.38 : -0.38, Math.round(cue * 100));
}

// Core ignition impact, followed by staggered iris locks and shell plate movement.
addTone(8.05, 0.92, 48, 0.34, 0, 2.5, 0.15);
addTone(8.07, 0.58, 73.4, 0.17, -0.1, 4, 0.8);
addNoise(8.02, 0.36, 0.19, 0.05, 99);
for (let i = 0; i < 12; i += 1) {
  const cue = 8.55 + i * 0.205;
  addTone(cue, 0.15 + (i % 3) * 0.035, 220 + (i % 4) * 82.4, 0.1, Math.sin(i) * 0.62, 5.5, i * 0.24);
  if (i % 2 === 0) addNoise(cue, 0.075, 0.064, Math.cos(i) * 0.5, 230 + i);
}

// A fragile glass-like shimmer marks the arrival of living forms.
for (let i = 0; i < 16; i += 1) {
  const cue = 12.05 + i * 0.24;
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
  addTone(cue, 0.75 + (i % 3) * 0.12, notes[i % notes.length], 0.043, Math.sin(i * 0.7) * 0.75, 2.7, i * 0.19);
}
addTone(16.2, 3.6, 55, 0.11, 0, 1.2);
addTone(16.2, 3.6, 110, 0.07, -0.25, 1.2);
addTone(16.2, 3.6, 164.81, 0.055, 0.22, 1.2);
addTone(16.2, 3.6, 220, 0.038, 0.05, 1.2);
addTone(17.55, 1.4, 659.25, 0.032, 0.48, 2.8, 0.3);
addTone(18.1, 1.7, 783.99, 0.024, -0.46, 2.4, 0.7);

const bytes = frames * channels * 2;
const wav = Buffer.alloc(44 + bytes);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + bytes, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(channels, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * channels * 2, 28);
wav.writeUInt16LE(channels * 2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(bytes, 40);

let peak = 0;
let samplesAboveSoftLimit = 0;
for (let i = 0; i < frames; i += 1) {
  const l = Math.max(-0.94, Math.min(0.94, left[i]));
  const r = Math.max(-0.94, Math.min(0.94, right[i]));
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
  if (Math.abs(left[i]) > 0.94 || Math.abs(right[i]) > 0.94) samplesAboveSoftLimit += 1;
  wav.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
await mkdir(here, { recursive: true });
const output = path.join(here, "orbital-bloom.wav");
await writeFile(output, wav);
console.log(JSON.stringify({ output, sampleRate, channels, durationSeconds, frames, format: "PCM 16-bit stereo", peak: Number(peak.toFixed(4)), samplesAboveSoftLimit }));
