import {
  DAYS_PER_JULIAN_CENTURY,
  type PlanetData,
} from "./planetData";

export const normalizeDegrees = (degrees: number): number =>
  ((degrees % 360) + 360) % 360;

export const getMeanLongitudeDeg = (
  planet: PlanetData,
  daysSinceJ2000: number,
): number =>
  normalizeDegrees(
    planet.meanLongitudeJ2000Deg +
      (planet.meanLongitudeRateDegPerCentury * daysSinceJ2000) /
        DAYS_PER_JULIAN_CENTURY,
  );

export const getOrbitalPeriodDays = (planet: PlanetData): number =>
  (360 * DAYS_PER_JULIAN_CENTURY) /
  planet.meanLongitudeRateDegPerCentury;

export const getOrbitalRadiusPx = (semiMajorAxisAU: number, zoom = 1): number => {
  if (!Number.isFinite(semiMajorAxisAU) || semiMajorAxisAU < 0) {
    throw new Error("Orbital distance must be a finite non-negative AU value.");
  }
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new Error("Orbital zoom must be a finite positive number.");
  }

  const unscaledRadius =
    semiMajorAxisAU <= 1.6
      ? 40 + semiMajorAxisAU * 70
      : 40 + 1.6 * 70 + Math.log2(semiMajorAxisAU / 1.6) * 58;

  return unscaledRadius * zoom;
};

export const getSimulationDay = (
  frame: number,
  durationInFrames: number,
  simulationDays: number,
): number => {
  if (!Number.isFinite(frame) || !Number.isFinite(durationInFrames) || durationInFrames < 2) {
    throw new Error("A valid frame and a duration of at least two frames are required.");
  }
  if (!Number.isFinite(simulationDays) || simulationDays < 0) {
    throw new Error("Simulation duration must be a finite non-negative number of days.");
  }

  const progress = Math.max(0, Math.min(1, frame / (durationInFrames - 1)));
  return progress * simulationDays;
};

export const getOrbitPosition = (
  centerX: number,
  centerY: number,
  radius: number,
  meanLongitudeDeg: number,
): { x: number; y: number } => {
  const angle = (meanLongitudeDeg * Math.PI) / 180;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
};

export const formatSimulatedDate = (dayOffset: number): string => {
  const date = new Date(Date.UTC(2025, 0, 1) + Math.max(0, dayOffset) * 86_400_000);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};
