import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { FC } from "react";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const StarField: FC = () => {
  const frame = useCurrentFrame();
  return <g>{Array.from({ length: 90 }, (_, i) => {
    const x = (i * 137.5 + 17) % 1920, y = (i * 83.7 + 11) % 690;
    const twinkle = 0.25 + ((Math.sin(frame * 0.045 + i * 2.2) + 1) / 2) * 0.75;
    return <circle key={i} cx={x} cy={y} r={i % 9 === 0 ? 2.6 : 1.35} fill={i % 8 === 0 ? "#a9f4ff" : "#d9e8ff"} opacity={twinkle} />;
  })}</g>;
};

const Astronaut: FC<{ x: number; walking: number; opacity: number; scale?: number }> = ({ x, walking, opacity, scale = 1 }) => {
  const stride = Math.sin(walking * Math.PI * 2) * 14;
  const bob = Math.abs(Math.sin(walking * Math.PI * 2)) * 3;
  return <g transform={`translate(${x} ${bob}) scale(${scale})`} opacity={opacity}>
    {/* backpack */}
    <rect x="-41" y="-78" width="30" height="65" rx="13" fill="#b8c6d8" stroke="#e7f2ff" strokeWidth="5"/>
    <rect x="-35" y="-68" width="16" height="48" rx="8" fill="#71839c"/>
    {/* legs */}
    <g transform={`translate(-12 -18) rotate(${stride} 0 0)`}><path d="M-3 0 L-9 37 Q-8 49 -20 53 L-23 60 Q-2 67 12 53 L8 40 L10 0Z" fill="#dce7f4" stroke="#91a6bf" strokeWidth="4"/><rect x="-21" y="49" width="37" height="14" rx="7" fill="#24354d"/></g>
    <g transform={`translate(14 -18) rotate(${-stride} 0 0)`}><path d="M-2 0 L-4 38 Q-1 49 12 53 L14 60 Q-4 67 -18 53 L-13 39 L-12 0Z" fill="#dce7f4" stroke="#91a6bf" strokeWidth="4"/><rect x="-20" y="49" width="37" height="14" rx="7" fill="#24354d"/></g>
    {/* torso */}
    <path d="M-28 -82 Q-34 -56 -26 -22 L-17 -15 L18 -15 L27 -25 Q34 -54 27 -82 Q10 -96 -10 -96Z" fill="#eaf3fc" stroke="#9eb3cb" strokeWidth="5"/>
    <path d="M-14 -70 L14 -70 L17 -38 L-17 -38Z" fill="#54c9e8" opacity=".85"/>
    <circle cx="0" cy="-53" r="7" fill="#eaffff"/>
    {/* arms */}
    <g transform={`rotate(${-18 + Math.sin(walking * 6.28) * 12} -25 -70)`}><path d="M-25 -70 Q-47 -65 -46 -42 L-38 -16 Q-34 -6 -23 -12 L-19 -22 L-30 -42 L-16 -53Z" fill="#e4edf8" stroke="#9eb3cb" strokeWidth="4"/><circle cx="-26" cy="-13" r="10" fill="#c9d6e6"/></g>
    <g transform={`rotate(${18 - Math.sin(walking * 6.28) * 12} 25 -70)`}><path d="M25 -70 Q47 -65 46 -42 L38 -16 Q34 -6 23 -12 L19 -22 L30 -42 L16 -53Z" fill="#e4edf8" stroke="#9eb3cb" strokeWidth="4"/><circle cx="26" cy="-13" r="10" fill="#c9d6e6"/></g>
    {/* helmet and visor */}
    <circle cx="0" cy="-111" r="39" fill="#edf5ff" stroke="#9db2ca" strokeWidth="6"/>
    <ellipse cx="0" cy="-111" rx="29" ry="25" fill="#173d5e" stroke="#61d9ef" strokeWidth="4"/>
    <ellipse cx="-12" cy="-121" rx="10" ry="6" fill="#9cf4ff" opacity=".45"/>
    <path d="M-34 -91 Q0 -72 34 -91" fill="none" stroke="#d8e8f8" strokeWidth="4"/>
    <circle cx="-26" cy="-105" r="4" fill="#f7d58c"/>
  </g>;
};

export const TinyAstronautCrystalCave2D: FC = () => {
  const f = useCurrentFrame();
  const landing = interpolate(f, [0, 100], [1, 0], clamp);
  const walk = interpolate(f, [90, 315], [0, 1], clamp);
  const astronautX = interpolate(f, [0, 120, 320, 470, 600], [480, 480, 1020, 1270, 1270], clamp);
  const astronautOpacity = interpolate(f, [0, 30], [0, 1], clamp) * interpolate(f, [560, 600], [1, 0.65], clamp);
  const caveReveal = interpolate(f, [210, 360], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  
  const crystalScale = 1 + Math.sin(f * 0.06) * 0.025;
  const podY = interpolate(f, [0, 125], [420, 360], clamp);
  const podOpacity = interpolate(f, [0, 25], [0, 1], clamp) * interpolate(f, [85, 160], [1, 0], clamp);
  const shootingStar = interpolate(f, [40, 95], [0, 1], clamp);
  const crystalLight = interpolate(f, [350, 420], [0, 1], clamp) * interpolate(f, [520, 600], [1, 0.45], clamp);
  return <AbsoluteFill style={{ backgroundColor: "#070d20" }}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081027"/><stop offset=".58" stopColor="#15254b"/><stop offset="1" stopColor="#39294e"/></linearGradient>
        <linearGradient id="horizon" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#394e7a"/><stop offset="1" stopColor="#182441"/></linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#364466"/><stop offset="1" stopColor="#10192f"/></linearGradient>
        <linearGradient id="pod" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f1f6ff"/><stop offset="1" stopColor="#778ca9"/></linearGradient>
        <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e8ffff"/><stop offset=".28" stopColor="#82f7ff"/><stop offset=".65" stopColor="#4ab4f4"/><stop offset="1" stopColor="#8b6cff"/></linearGradient>
        <radialGradient id="crystalAura"><stop stopColor="#9afaff" stopOpacity=".85"/><stop offset=".35" stopColor="#54cfff" stopOpacity=".38"/><stop offset="1" stopColor="#4564ff" stopOpacity="0"/></radialGradient>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      <rect width="1920" height="1080" fill="url(#sky)"/>
      <StarField/>
      {/* distant planets */}
      <circle cx="1530" cy="220" r="110" fill="#8b73b7" opacity=".13"/>
      <circle cx="1530" cy="220" r="135" fill="none" stroke="#b3a3dc" strokeWidth="3" opacity=".13"/>
      <path d="M0 650 Q180 510 370 570 T760 525 T1160 590 T1550 520 T1920 580 L1920 900 L0 900Z" fill="#23304f"/>
      <path d="M0 720 Q220 600 440 650 T820 625 T1250 665 T1650 630 T1920 660 L1920 950 L0 950Z" fill="url(#horizon)"/>
      {/* rolling ground and scattered rocks */}
      <path d="M0 790 Q260 700 520 740 Q820 790 1080 740 Q1320 680 1570 740 Q1760 785 1920 730 L1920 1080 L0 1080Z" fill="url(#ground)"/>
      {Array.from({length:18},(_,i)=><g key={i} opacity=".35"><path d={`M${i*119-20} 840 l${25+(i%4)*10} -${15+i%3*9} l${45} ${12+i%3*8} l-${35} ${30+i%4*6}Z`} fill={i%2?"#8190ac":"#222f4d"}/></g>)}
      {/* wind ribbons */}
      <g fill="none" stroke="#a6d9ff" strokeWidth="3" opacity=".15"><path d="M90 570 Q360 540 530 575"/><path d="M1230 460 Q1490 420 1780 470"/><path d="M60 610 Q240 600 420 620"/></g>
      {/* landing pod */}
      <g opacity={podOpacity} transform={`translate(470 ${podY})`}>
        <ellipse cx="0" cy="170" rx="170" ry="25" fill="#020714" opacity=".45"/>
        <path d="M-75 80 L-110 155 L-94 166 L-44 112 M75 80 L110 155 L94 166 L44 112" stroke="#d7e6fa" strokeWidth="12" fill="none"/>
        <path d="M-90 -60 Q-125 -20 -120 40 Q-95 105 0 120 Q95 105 120 40 Q125 -20 90 -60 Q0 -115 -90 -60Z" fill="url(#pod)" stroke="#e9f5ff" strokeWidth="8"/>
        <ellipse cx="0" cy="-20" rx="74" ry="48" fill="#3e769c" stroke="#a5f0ff" strokeWidth="8"/>
        <ellipse cx="0" cy="-20" rx="54" ry="32" fill="#17334e"/>
        <path d="M-40 -22 L0 -58 L40 -22 L0 15Z" fill="#8aeaff" opacity=".7"/>
        <path d="M-75 62 L75 62" stroke="#f0f5ff" strokeWidth="6"/>
        <circle cx="-85" cy="22" r="10" fill="#f8d18a"/><circle cx="85" cy="22" r="10" fill="#f8d18a"/>
        <path d="M-130 155 Q-160 165 -180 198 L-145 190 L-110 172 M130 155 Q160 165 180 198 L145 190 L110 172" fill="#f9b86b" opacity=".7"/>
      </g>
      {/* cave cliff silhouette */}
      <path d="M1110 0 L1920 0 L1920 820 Q1770 775 1660 820 Q1540 850 1430 815 Q1310 790 1210 840 L1090 870 L1050 790 Q1080 650 1090 500 Q1085 330 1110 0Z" fill="#10182b"/>
      <path d="M1180 120 Q1420 55 1610 115 Q1790 200 1850 430 Q1890 630 1810 790 L1570 825 L1360 800 Q1260 730 1250 590 Q1230 380 1180 120Z" fill="#26324c"/>
      {/* cave opening */}
      <path d="M1260 810 Q1190 700 1210 530 Q1240 350 1390 310 Q1550 270 1690 410 Q1810 555 1760 810 Q1610 885 1450 865Z" fill="#070a18" opacity={caveReveal}/>
      <path d="M1285 810 Q1225 685 1250 535 Q1285 390 1405 365 Q1535 330 1650 455 Q1745 575 1715 805" fill="none" stroke="#6b7792" strokeWidth="18" opacity={caveReveal*.4}/>
      {/* crystal chamber */}
      <g opacity={caveReveal}>
        <ellipse cx="1515" cy="740" rx="350" ry="250" fill="url(#crystalAura)" opacity={crystalLight}/>
        <ellipse cx="1515" cy="750" rx="280" ry="190" fill="#182842" opacity=".5"/>
        <g transform={`translate(1510 690) scale(${crystalScale})`}>
          <path d="M-145 110 L-110 -95 L-30 -210 L75 -160 L160 65 L85 150 L-60 170Z" fill="#5f8fcd" opacity=".8" stroke="#b5faff" strokeWidth="8"/>
          <path d="M-110 -95 L-30 -210 L0 15 L-145 110Z" fill="#d4ffff" opacity=".8"/>
          <path d="M-30 -210 L75 -160 L160 65 L0 15Z" fill="url(#crystal)" stroke="#c4ffff" strokeWidth="4"/>
          <path d="M0 15 L160 65 L85 150 L-60 170Z" fill="#5e8ae9" opacity=".7"/>
          <path d="M-145 110 L0 15 L-60 170Z" fill="#2c68a9"/>
          <path d="M-30 -210 L0 15 L-110 -95Z" fill="#f3ffff" opacity=".65"/>
          <path d="M-30 -210 L75 -160 L0 15Z" fill="#b6ffff" opacity=".6"/>
          <path d="M-110 -95 L-30 -210 L-145 110Z" fill="#80f5ff" opacity=".42"/>
        </g>
        {/* smaller shards */}
        <path d="M1320 800 L1360 665 L1410 800Z" fill="#77d8f4" opacity=".65"/>
        <path d="M1635 810 L1680 705 L1710 810Z" fill="#a5bfff" opacity=".55"/>
        <path d="M1440 835 L1470 770 L1500 840Z" fill="#6bbff1" opacity=".45"/>
        <circle cx="1510" cy="690" r="210" fill="#8cfaff" opacity={crystalLight*.22} filter="url(#glow)"/>
      </g>
      {/* cave foreground lips, with opening kept clear */}
      <path d="M1080 870 Q1170 800 1280 830 Q1400 880 1540 860 Q1710 825 1880 850 L1920 1080 L1050 1080Z" fill="#141d34"/>
      <path d="M1180 900 Q1260 850 1370 880 Q1510 920 1670 870 Q1790 850 1890 895" fill="none" stroke="#465574" strokeWidth="12" opacity=".5"/>
      {/* astronaut in foreground journey */}
      <g transform="translate(0 0)">
        <Astronaut x={astronautX} walking={walk} opacity={astronautOpacity}/>
      </g>
      {/* crystal beams, only during reveal */}
      <g opacity={crystalLight*.7} stroke="#8df9ff" strokeWidth="4" fill="none">
        <path d="M1510 470 L1510 325"/><path d="M1340 540 L1260 465"/><path d="M1680 540 L1780 465"/>
      </g>
      {/* moving meteor streak */}
      <g opacity={shootingStar}>
        <path d="M340 120 L520 50" stroke="#9eeeff" strokeWidth="3" opacity=".8"/>
        <circle cx="340" cy="120" r="5" fill="#e9ffff"/>
      </g>
      {/* ground glow */}
      <ellipse cx="1520" cy="900" rx="320" ry="85" fill="#62d7ff" opacity={crystalLight*.16} filter="url(#softGlow)"/>
    </svg>
    {/* atmospheric foreground haze */}
    <AbsoluteFill style={{background:"linear-gradient(180deg, transparent 58%, rgba(16,22,42,.12) 72%, rgba(7,11,24,.38))",pointerEvents:"none"}}/>
  </AbsoluteFill>;
};
