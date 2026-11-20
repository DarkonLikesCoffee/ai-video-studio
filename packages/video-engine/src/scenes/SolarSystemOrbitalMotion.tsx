import { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { FC } from "react";
import {
  EARTH_ORBITAL_PERIOD_DAYS,
  INNER_PLANETS_SIMULATION_DAYS,
} from "../solar-system/planetData";
import { drawSolarSystemScene } from "../solar-system/drawSolarSystem";
import {
  formatSimulatedDate,
  getSimulationDay,
} from "../solar-system/orbitalMath";
import { SolarSystemOverlays } from "./SolarSystemOverlays";

export interface SolarSystemOrbitalMotionProps {
  zoom?: number;
  simulationDays?: number;
  innerOnly?: boolean;
}

export const SolarSystemOrbitalMotion: FC<SolarSystemOrbitalMotionProps> = ({
  zoom = 1,
  simulationDays = EARTH_ORBITAL_PERIOD_DAYS,
  innerOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const daysElapsed = getSimulationDay(frame, durationInFrames, simulationDays);
  const finalCalendarDay = innerOnly ? 89 : 364;
  const dateLabel = formatSimulatedDate(Math.min(daysElapsed, finalCalendarDay));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;

    drawSolarSystemScene(context, {
      frame,
      daysElapsed,
      zoom,
      innerOnly,
    });
  }, [frame, daysElapsed, zoom, innerOnly]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#08090d", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      <SolarSystemOverlays dateLabel={dateLabel} innerOnly={innerOnly} />
      <Audio src={staticFile("audio/solar-system-score.wav")} volume={0.72} />
    </AbsoluteFill>
  );
};

export const INNER_PLANETS_DEFAULT_PROPS: SolarSystemOrbitalMotionProps = {
  zoom: 2.5,
  simulationDays: INNER_PLANETS_SIMULATION_DAYS,
  innerOnly: true,
};
