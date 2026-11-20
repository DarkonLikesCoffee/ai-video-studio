import test from "node:test";
import assert from "node:assert/strict";
import {
  EARTH_ORBITAL_PERIOD_DAYS,
  INNER_PLANETS,
  J2000_TO_2025_START_DAYS,
  SOLAR_SYSTEM_PLANETS,
} from "../packages/video-engine/src/solar-system/planetData";
import {
  formatSimulatedDate,
  getMeanLongitudeDeg,
  getOrbitalPeriodDays,
  getOrbitalRadiusPx,
  getSimulationDay,
  normalizeDegrees,
} from "../packages/video-engine/src/solar-system/orbitalMath";
import { getSeededStar } from "../packages/video-engine/src/solar-system/drawSolarSystem";

test("registers the eight major planets in orbital order", () => {
  assert.deepEqual(
    SOLAR_SYSTEM_PLANETS.map((planet) => planet.name),
    ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
  );
});

test("derives Earth's orbital year from the J2000 mean-longitude rate", () => {
  const earth = SOLAR_SYSTEM_PLANETS[2]!;
  assert.ok(Math.abs(getOrbitalPeriodDays(earth) - EARTH_ORBITAL_PERIOD_DAYS) < 1e-10);
  assert.ok(EARTH_ORBITAL_PERIOD_DAYS > 365 && EARTH_ORBITAL_PERIOD_DAYS < 366);
});

test("Earth completes exactly one mean-longitude revolution in one simulated year", () => {
  const earth = SOLAR_SYSTEM_PLANETS[2]!;
  const start = getMeanLongitudeDeg(earth, J2000_TO_2025_START_DAYS);
  const end = getMeanLongitudeDeg(earth, J2000_TO_2025_START_DAYS + EARTH_ORBITAL_PERIOD_DAYS);
  const delta = normalizeDegrees(end - start);
  assert.ok(delta < 1e-8 || Math.abs(delta - 360) < 1e-8);
});

test("applies linear inner-orbit scaling and logarithmic outer-orbit compression", () => {
  assert.equal(getOrbitalRadiusPx(1), 110);
  assert.equal(getOrbitalRadiusPx(1.6), 152);
  assert.ok(getOrbitalRadiusPx(5.2) < 270);
  assert.equal(getOrbitalRadiusPx(1, 2.5), 275);
});

test("simulation timeline reaches its requested endpoint on the final frame", () => {
  assert.equal(getSimulationDay(0, 900, 365), 0);
  assert.equal(getSimulationDay(899, 900, 365), 365);
  assert.equal(getSimulationDay(450, 900, 90), 90 * 450 / 899);
});

test("inner-planet composition contains only Mercury through Mars", () => {
  assert.deepEqual(INNER_PLANETS.map((planet) => planet.name), ["Mercury", "Venus", "Earth", "Mars"]);
});

test("date overlay uses the 2025 calendar and ends on December 31", () => {
  assert.equal(formatSimulatedDate(0), "January 1, 2025");
  assert.equal(formatSimulatedDate(364), "December 31, 2025");
});

test("star positions are deterministic and remain inside the canvas", () => {
  const first = getSeededStar(127);
  const second = getSeededStar(127);
  assert.deepEqual(first, second);
  assert.ok(first.x >= 0 && first.x < 1920);
  assert.ok(first.y >= 0 && first.y < 1080);
  assert.ok(first.radius > 0);
});
