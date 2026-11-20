export interface PlanetData {
  name: string;
  semiMajorAxisAU: number;
  meanLongitudeJ2000Deg: number;
  meanLongitudeRateDegPerCentury: number;
  color: string;
  glowColor: string;
  radiusPx: number;
  isSaturn?: boolean;
  hasMoon?: boolean;
}

// JPL approximate planetary positions, Table 1 (1800–2050), referred to J2000.
export const SOLAR_SYSTEM_PLANETS: PlanetData[] = [
  {
    name: "Mercury",
    semiMajorAxisAU: 0.38709927,
    meanLongitudeJ2000Deg: 252.2503235,
    meanLongitudeRateDegPerCentury: 149472.67411175,
    color: "#aeb5bd",
    glowColor: "rgba(174,181,189,0.72)",
    radiusPx: 6.5,
  },
  {
    name: "Venus",
    semiMajorAxisAU: 0.72333566,
    meanLongitudeJ2000Deg: 181.9790995,
    meanLongitudeRateDegPerCentury: 58517.81538729,
    color: "#e8bd7d",
    glowColor: "rgba(232,189,125,0.7)",
    radiusPx: 9,
  },
  {
    // JPL Table 1 labels this row "EM Bary" (Earth–Moon barycenter).
    name: "Earth",
    semiMajorAxisAU: 1.00000261,
    meanLongitudeJ2000Deg: 100.46457166,
    meanLongitudeRateDegPerCentury: 35999.37244981,
    color: "#478fe0",
    glowColor: "rgba(71,143,224,0.76)",
    radiusPx: 9.5,
    hasMoon: true,
  },
  {
    name: "Mars",
    semiMajorAxisAU: 1.52371034,
    meanLongitudeJ2000Deg: -4.55343205,
    meanLongitudeRateDegPerCentury: 19140.30268499,
    color: "#d8795e",
    glowColor: "rgba(216,121,94,0.72)",
    radiusPx: 7.7,
  },
  {
    name: "Jupiter",
    semiMajorAxisAU: 5.202887,
    meanLongitudeJ2000Deg: 34.39644051,
    meanLongitudeRateDegPerCentury: 3034.74612775,
    color: "#d4ae8b",
    glowColor: "rgba(212,174,139,0.68)",
    radiusPx: 20,
  },
  {
    name: "Saturn",
    semiMajorAxisAU: 9.53667594,
    meanLongitudeJ2000Deg: 49.95424423,
    meanLongitudeRateDegPerCentury: 1222.49362201,
    color: "#d9c18e",
    glowColor: "rgba(217,193,142,0.7)",
    radiusPx: 17,
    isSaturn: true,
  },
  {
    name: "Uranus",
    semiMajorAxisAU: 19.18916464,
    meanLongitudeJ2000Deg: 313.23810451,
    meanLongitudeRateDegPerCentury: 428.48202785,
    color: "#7ccbd0",
    glowColor: "rgba(124,203,208,0.68)",
    radiusPx: 14,
  },
  {
    name: "Neptune",
    semiMajorAxisAU: 30.06992276,
    meanLongitudeJ2000Deg: -55.12002969,
    meanLongitudeRateDegPerCentury: 218.45945325,
    color: "#537bdc",
    glowColor: "rgba(83,123,220,0.72)",
    radiusPx: 13.5,
  },
];

export const INNER_PLANETS = SOLAR_SYSTEM_PLANETS.slice(0, 4);
export const J2000_TO_2025_START_DAYS = 9131.5;
export const DAYS_PER_JULIAN_CENTURY = 36525;
export const EARTH_ORBITAL_PERIOD_DAYS =
  (360 * DAYS_PER_JULIAN_CENTURY) /
  SOLAR_SYSTEM_PLANETS[2]!.meanLongitudeRateDegPerCentury;
export const INNER_PLANETS_SIMULATION_DAYS = 90;
export const VIDEO_DURATION_IN_FRAMES = 900;
export const VIDEO_FPS = 30;
