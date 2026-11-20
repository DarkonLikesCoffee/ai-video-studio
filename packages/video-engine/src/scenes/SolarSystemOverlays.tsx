import type { FC } from "react";

export interface SolarSystemOverlaysProps {
  dateLabel: string;
  innerOnly: boolean;
}

export const SolarSystemOverlays: FC<SolarSystemOverlaysProps> = ({
  dateLabel,
  innerOnly,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        top: 34,
        left: 0,
        width: "100%",
        textAlign: "center",
        color: "#f3f5fa",
        pointerEvents: "none",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 27,
          lineHeight: 1.15,
          fontWeight: 700,
          letterSpacing: 5.2,
          textShadow: "0 2px 20px rgba(0,0,0,0.85)",
        }}
      >
        {innerOnly ? "INNER PLANETS" : "SOLAR SYSTEM ORBITAL MOTION"}
      </div>
      <div
        style={{
          marginTop: 9,
          color: "rgba(214,222,239,0.72)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 3.4,
        }}
      >
        {innerOnly ? "A 90-DAY CLOSE-UP OF THE INNER SOLAR SYSTEM" : "ONE ORBITAL YEAR / 2025"}
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 34,
        transform: "translateX(-50%)",
        padding: "12px 24px",
        borderRadius: 999,
        border: "1px solid rgba(243,194,91,0.26)",
        background: "rgba(12,15,23,0.72)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.26)",
        color: "#f1c76b",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: 0.5,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {dateLabel}
    </div>
  </>
);
