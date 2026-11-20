import {
  EARTH_ORBITAL_PERIOD_DAYS,
  INNER_PLANETS,
  J2000_TO_2025_START_DAYS,
  SOLAR_SYSTEM_PLANETS,
  type PlanetData,
} from "./planetData";
import {
  getMeanLongitudeDeg,
  getOrbitPosition,
  getOrbitalRadiusPx,
} from "./orbitalMath";

export interface SolarSystemDrawOptions {
  frame: number;
  daysElapsed: number;
  zoom: number;
  innerOnly: boolean;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const WIDTH = 1920;
const HEIGHT = 1080;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 555;

const fract = (value: number): number => value - Math.floor(value);

export const getSeededStar = (index: number, width = WIDTH, height = HEIGHT): Star => {
  const xSeed = Math.sin(index * 127.1 + 42) * 43758.5453123;
  const ySeed = Math.sin(index * 311.7 + 18.2) * 24634.634523;
  const sizeSeed = Math.sin(index * 74.7 + 9.1) * 12515.8731;
  return {
    x: fract(xSeed) * width,
    y: fract(ySeed) * height,
    radius: 0.45 + fract(sizeSeed) * 1.25,
    opacity: 0.32 + fract(Math.sin(index * 19.19 + 4.2) * 9341.17) * 0.62,
  };
};

const drawStarField = (context: CanvasRenderingContext2D, frame: number): void => {
  for (let index = 0; index < 500; index += 1) {
    const star = getSeededStar(index);
    const twinkle = 0.82 + 0.18 * Math.sin(frame * 0.018 + index * 1.7);
    context.globalAlpha = star.opacity * twinkle;
    context.fillStyle = index % 13 === 0 ? "#b9d7ff" : "#e8edff";
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
};

const drawBackground = (context: CanvasRenderingContext2D): void => {
  context.fillStyle = "#08090d";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const nebula = context.createRadialGradient(360, 410, 20, 360, 410, 880);
  nebula.addColorStop(0, "rgba(25,44,82,0.22)");
  nebula.addColorStop(0.48, "rgba(13,25,48,0.12)");
  nebula.addColorStop(1, "rgba(8,9,13,0)");
  context.fillStyle = nebula;
  context.fillRect(0, 0, WIDTH, HEIGHT);
};

const drawOrbitPaths = (
  context: CanvasRenderingContext2D,
  planets: PlanetData[],
  zoom: number,
): void => {
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1.1;
  planets.forEach((planet) => {
    context.beginPath();
    context.arc(
      CENTER_X,
      CENTER_Y,
      getOrbitalRadiusPx(planet.semiMajorAxisAU, zoom),
      0,
      Math.PI * 2,
    );
    context.stroke();
  });
  context.restore();
};

const drawSun = (context: CanvasRenderingContext2D, frame: number): void => {
  const pulse = 1 + Math.sin(frame / 38) * 0.018;
  const halo = context.createRadialGradient(CENTER_X, CENTER_Y, 8, CENTER_X, CENTER_Y, 205 * pulse);
  halo.addColorStop(0, "rgba(255,246,204,0.62)");
  halo.addColorStop(0.18, "rgba(255,191,80,0.28)");
  halo.addColorStop(0.52, "rgba(255,125,39,0.09)");
  halo.addColorStop(1, "rgba(255,115,25,0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(CENTER_X, CENTER_Y, 205 * pulse, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(CENTER_X, CENTER_Y);
  for (let ray = 0; ray < 36; ray += 1) {
    const angle = (ray / 36) * Math.PI * 2 + frame * 0.0008;
    const inner = 48;
    const outer = 64 + 7 * Math.sin(ray * 2.37 + frame * 0.025);
    context.strokeStyle = ray % 3 === 0
      ? "rgba(255,214,126,0.23)"
      : "rgba(255,173,76,0.12)";
    context.lineWidth = ray % 3 === 0 ? 1.7 : 1;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }
  context.restore();

  const sun = context.createRadialGradient(
    CENTER_X - 15,
    CENTER_Y - 18,
    2,
    CENTER_X,
    CENTER_Y,
    43,
  );
  sun.addColorStop(0, "#ffffff");
  sun.addColorStop(0.2, "#fff5d2");
  sun.addColorStop(0.54, "#ffd45b");
  sun.addColorStop(0.82, "#ff9a35");
  sun.addColorStop(1, "#d95421");
  context.fillStyle = sun;
  context.beginPath();
  context.arc(CENTER_X, CENTER_Y, 40, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "600 13px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("SUN", CENTER_X, CENTER_Y + 61);
};

const drawPlanetGlow = (
  context: CanvasRenderingContext2D,
  planet: PlanetData,
  x: number,
  y: number,
): void => {
  const glow = context.createRadialGradient(x, y, planet.radiusPx * 0.25, x, y, planet.radiusPx * 3.6);
  glow.addColorStop(0, planet.glowColor);
  glow.addColorStop(0.36, planet.glowColor.replace(/0\.\d+\)/, "0.22)"));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, planet.radiusPx * 3.6, 0, Math.PI * 2);
  context.fill();
};

const drawSaturnRings = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void => {
  context.save();
  context.translate(x, y);
  context.rotate(-0.38);
  context.beginPath();
  context.ellipse(0, 0, radius * 2.05, radius * 0.8, 0, 0, Math.PI * 2);
  context.strokeStyle = "rgba(224,197,145,0.78)";
  context.lineWidth = Math.max(3, radius * 0.34);
  context.stroke();
  context.beginPath();
  context.ellipse(0, 0, radius * 2.25, radius * 0.94, 0, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255,235,191,0.34)";
  context.lineWidth = 1.4;
  context.stroke();
  context.restore();
};

const drawPlanetSphere = (
  context: CanvasRenderingContext2D,
  planet: PlanetData,
  x: number,
  y: number,
): void => {
  const radius = planet.radiusPx;
  const sphere = context.createRadialGradient(
    x - radius * 0.38,
    y - radius * 0.42,
    radius * 0.04,
    x,
    y,
    radius * 1.12,
  );
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.16, planet.color);
  sphere.addColorStop(0.62, planet.color);
  sphere.addColorStop(1, "#151a25");
  context.fillStyle = sphere;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  const highlight = context.createRadialGradient(
    x - radius * 0.4,
    y - radius * 0.42,
    0,
    x - radius * 0.28,
    y - radius * 0.3,
    radius * 0.65,
  );
  highlight.addColorStop(0, "rgba(255,255,255,0.34)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = highlight;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
};

const drawMoon = (
  context: CanvasRenderingContext2D,
  earthX: number,
  earthY: number,
  daysElapsed: number,
): void => {
  const moonOrbitRadius = 22;
  const moonAngle = (daysElapsed / 27.32) * Math.PI * 2;
  context.save();
  context.strokeStyle = "rgba(226,234,247,0.22)";
  context.lineWidth = 0.8;
  context.setLineDash([2, 4]);
  context.beginPath();
  context.arc(earthX, earthY, moonOrbitRadius, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  const moonX = earthX + Math.cos(moonAngle) * moonOrbitRadius;
  const moonY = earthY + Math.sin(moonAngle) * moonOrbitRadius;
  const moonGlow = context.createRadialGradient(moonX, moonY, 0, moonX, moonY, 9);
  moonGlow.addColorStop(0, "rgba(255,255,255,0.42)");
  moonGlow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = moonGlow;
  context.beginPath();
  context.arc(moonX, moonY, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f6f7fb";
  context.beginPath();
  context.arc(moonX, moonY, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawPlanet = (
  context: CanvasRenderingContext2D,
  planet: PlanetData,
  x: number,
  y: number,
): void => {
  drawPlanetGlow(context, planet, x, y);
  if (planet.isSaturn) drawSaturnRings(context, x, y, planet.radiusPx);

  drawPlanetSphere(context, planet, x, y);

  context.save();
  context.textAlign = "center";
  context.font = "500 15px Arial, Helvetica, sans-serif";
  context.fillStyle = "rgba(238,243,255,0.92)";
  context.shadowColor = "rgba(0,0,0,0.9)";
  context.shadowBlur = 7;
  context.fillText(planet.name, x, y - planet.radiusPx - 12);
  context.restore();
};

export const drawSolarSystemScene = (
  context: CanvasRenderingContext2D,
  options: SolarSystemDrawOptions,
): void => {
  const planets = options.innerOnly ? INNER_PLANETS : SOLAR_SYSTEM_PLANETS;
  const daysSinceJ2000 = J2000_TO_2025_START_DAYS + options.daysElapsed;

  context.save();
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(context);
  drawStarField(context, options.frame);
  drawOrbitPaths(context, planets, options.zoom);
  drawSun(context, options.frame);

  planets.forEach((planet) => {
    const longitude = getMeanLongitudeDeg(planet, daysSinceJ2000);
    const orbitRadius = getOrbitalRadiusPx(planet.semiMajorAxisAU, options.zoom);
    const position = getOrbitPosition(CENTER_X, CENTER_Y, orbitRadius, longitude);
    drawPlanet(context, planet, position.x, position.y);
    if (planet.hasMoon) {
      drawMoon(context, position.x, position.y, options.daysElapsed);
    }
  });

  context.restore();
};

export const getOneYearSimulationDays = (): number => EARTH_ORBITAL_PERIOD_DAYS;
