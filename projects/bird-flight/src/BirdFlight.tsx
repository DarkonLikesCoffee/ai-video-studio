import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const move = (frame: number, from: number, to: number, start: number, end: number) =>
  interpolate(frame, [start, end], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });

type BirdProps = {
  x: number; y: number; scale?: number; rotation?: number; flap: number;
  color?: string; opacity?: number;
};

const Bird = ({ x, y, scale = 1, rotation = 0, flap, color = "#172D35", opacity = 1 }: BirdProps) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity}>
    <defs>
      <linearGradient id="birdBody" x1="0" y1="-1" x2="0" y2="1">
        <stop offset="0" stopColor="#536D72"/>
        <stop offset=".48" stopColor="#304B54"/>
        <stop offset="1" stopColor="#1B343E"/>
      </linearGradient>
      <linearGradient id="birdBreast" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#F2E7D1"/><stop offset="1" stopColor="#C8B99F"/>
      </linearGradient>
      <linearGradient id="birdWing" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#607A7E"/><stop offset=".55" stopColor="#354F58"/><stop offset="1" stopColor="#203A43"/>
      </linearGradient>
      <linearGradient id="birdBeak" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#F2C66C"/><stop offset="1" stopColor="#C67B3D"/>
      </linearGradient>
    </defs>
    {/* far wing: broad, rounded flight feathers rather than pointed spikes */}
    <g transform={`rotate(${-22 - flap * 34} -12 2)`}>
      <path d="M-15 5 C-39 -20 -65 -52 -87 -91 C-74 -88 -58 -78 -40 -61
        C-51 -83 -56 -103 -49 -122 C-31 -103 -15 -82 1 -59
        C12 -81 31 -101 53 -112 C48 -82 31 -53 13 -31
        C-2 -13 -9 -4 -15 5Z" fill="#182E37" opacity=".94"/>
      <path d="M-40 -61 C-27 -42 -16 -24 -9 -8 M-49 -122 C-35 -90 -25 -58 -14 -26
        M53 -112 C35 -83 20 -54 4 -25" fill="none" stroke="#829A98" strokeWidth="2.2" opacity=".34"/>
    </g>
    {/* tail: three softly tapered feathers */}
    <path d="M-43 5 C-72 1 -105 -8 -137 -26 C-118 -8 -93 8 -60 18Z" fill="#233E47"/>
    <path d="M-43 10 C-76 18 -110 27 -138 42 C-108 39 -82 32 -54 21Z" fill="#29464E"/>
    <path d="M-42 -1 C-72 -16 -101 -32 -120 -52 C-103 -28 -82 -10 -55 11Z" fill="#36535A"/>
    {/* body and shoulder */}
    <path d="M-56 4 C-43 -20 -17 -31 14 -29 C42 -28 62 -16 75 -5
      C88 3 101 0 112 -8 L121 -3 L110 8
      C92 28 63 32 34 24 C4 17 -22 22 -43 17Z" fill="url(#birdBody)"/>
    {/* pale belly and chest */}
    <path d="M-22 13 C-4 20 23 26 49 19 C64 14 74 7 81 2
      C70 20 54 29 35 29 C12 29 -12 22 -22 13Z" fill="url(#birdBreast)" opacity=".92"/>
    {/* head, cheek and throat */}
    <path d="M35 -21 C50 -39 78 -40 95 -26 C105 -17 109 -5 105 7
      C92 18 75 18 61 10 C48 4 39 -6 35 -21Z" fill="url(#birdBody)"/>
    <path d="M44 -6 C54 8 73 16 92 12 C82 22 62 20 49 10Z" fill="#E0D2B8" opacity=".88"/>
    {/* hooked but small beak */}
    <path d="M99 -20 L128 -11 L111 -3 L99 1 L105 -8Z" fill="url(#birdBeak)"/>
    <path d="M100 -19 L121 -12" stroke="#F9D991" strokeWidth="2" opacity=".5"/>
    {/* eye with warm iris */}
    <ellipse cx="82" cy="-23" rx="7.2" ry="7.8" fill="#F2E4C8"/>
    <circle cx="84" cy="-23" r="4.1" fill="#B97D39"/>
    <circle cx="85" cy="-23" r="2.3" fill="#15272D"/>
    <circle cx="86.2" cy="-24.4" r="1" fill="#FFF6E3"/>
    {/* subtle wing coverts on the body */}
    <path d="M-34 -4 C-12 -21 14 -22 37 -12 C17 -4 -2 7 -21 11Z" fill="#263F48" opacity=".55"/>
    <path d="M-14 -10 Q4 -16 24 -12 M-6 -4 Q14 -10 34 -7" fill="none" stroke="#839A94" strokeWidth="2" opacity=".35"/>
    {/* near wing moves with the flap cycle */}
    <g transform={`rotate(${18 + flap * 38} -8 2)`}>
      <path d="M-10 1 C-27 -25 -39 -55 -34 -91
        C-17 -75 -4 -56 8 -35
        C5 -62 12 -91 31 -116
        C34 -82 42 -57 55 -38
        C66 -62 85 -82 108 -91
        C98 -59 77 -30 55 -13
        C34 1 10 8 -10 1Z" fill="url(#birdWing)"/>
      <path d="M-34 -91 C-21 -62 -10 -34 2 -8 M31 -116 C25 -79 18 -44 10 -10
        M108 -91 C83 -63 61 -36 28 -8" fill="none" stroke="#9DB0A4" strokeWidth="2.5" opacity=".3"/>
      <path d="M-8 -1 C14 -13 35 -22 57 -34" fill="none" stroke="#D0D7C7" strokeWidth="3" opacity=".12"/>
    </g>
    {/* tiny legs tucked into the flight silhouette */}
    <path d="M18 22 L10 31 L4 31 M36 22 L29 31 L23 31" fill="none" stroke="#B77D49" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
);
const Cloud = ({ x, y, scale = 1, opacity = .38 }: { x: number; y: number; scale?: number; opacity?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} fill="#FFF8EA">
    <ellipse cx="0" cy="12" rx="88" ry="20"/>
    <ellipse cx="-39" cy="3" rx="40" ry="26"/>
    <ellipse cx="8" cy="-12" rx="53" ry="38"/>
    <ellipse cx="53" cy="3" rx="42" ry="27"/>
  </g>
);

const Pine = ({ x, y, scale = 1, tone = "#314F4D" }: { x: number; y: number; scale?: number; tone?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-4 0 Q-2 -84 2 -236" stroke="#554638" strokeWidth="13" fill="none"/>
    <path d="M0 -238 C-23 -213 -45 -186 -61 -158 C-43 -164 -28 -166 -16 -162
      C-43 -145 -63 -118 -81 -91 C-59 -100 -39 -101 -23 -94
      C-49 -75 -75 -47 -98 -16 L97 -16 C74 -47 49 -75 22 -94
      C42 -101 61 -100 80 -91 C62 -118 43 -145 18 -162
      C35 -166 51 -164 68 -158 C48 -186 26 -213 0 -238Z" fill={tone}/>
    <path d="M0 -195 C-17 -175 -35 -154 -48 -132 C-30 -137 -15 -136 -3 -132
      C-27 -112 -45 -91 -64 -68 C-43 -75 -26 -75 -12 -68
      C-33 -47 -54 -27 -73 -3 L73 -3 C53 -27 32 -47 12 -68
      C29 -75 45 -75 64 -68 C45 -91 26 -112 3 -132
      C18 -136 34 -137 49 -132 C32 -154 17 -175 0 -195Z" fill="#58765F" opacity=".65"/>
    <path d="M0 -210 L-44 -151 M0 -170 L-58 -105 M0 -130 L-70 -59 M0 -90 L-81 -20
      M0 -210 L42 -151 M0 -170 L58 -105 M0 -130 L70 -59 M0 -90 L81 -20"
      stroke="#9AAF8A" strokeWidth="3" strokeLinecap="round" opacity=".16"/>
  </g>
);
const DistantBirds = ({ frame }: { frame: number }) => (
  <g fill="none" stroke="#344A48" strokeWidth="4.5" strokeLinecap="round" opacity=".55">
    {Array.from({ length: 6 }, (_, i) => {
      const dx = (frame * (.12 + i * .012) + i * 83) % 250;
      const x = 1230 + i * 48 + dx;
      const y = 330 + Math.sin(frame / 17 + i) * 12 + i * 19;
      return <path key={i} d={`M${x - 15} ${y} Q${x} ${y - 12} ${x + 15} ${y}`} />;
    })}
  </g>
);

const OpeningShot = ({frame}:{frame:number}) => {
  const launch=move(frame,0,1,66,118);
  const branchSway=Math.sin(frame/22)*5;
  return <AbsoluteFill style={{backgroundColor:"#C7C9B1"}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="openSky" x2="0" y2="1"><stop stopColor="#8EA9A7"/><stop offset=".58" stopColor="#E9CDAA"/><stop offset="1" stopColor="#F4D5AF"/></linearGradient>
        <radialGradient id="openSun"><stop stopColor="#FFF1C9" stopOpacity=".88"/><stop offset="1" stopColor="#FFF1C9" stopOpacity="0"/></radialGradient>
        <linearGradient id="openCliff" x2="0" y2="1"><stop stopColor="#66766A"/><stop offset="1" stopColor="#354A45"/></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#openSky)"/>
      <circle cx="1510" cy="260" r="360" fill="url(#openSun)"/><circle cx="1510" cy="260" r="77" fill="#FFE8BC" opacity=".7"/>
      <path d="M0 610 C180 505 340 480 500 568 C690 438 850 448 1030 535 C1210 475 1415 460 1580 545 C1740 505 1850 485 1920 500 L1920 1080 L0 1080Z" fill="#9AA99A"/>
      <path d="M0 725 C220 630 470 598 710 690 C920 665 1120 640 1350 670 C1580 660 1770 610 1920 620 L1920 1080 L0 1080Z" fill="#778E7C"/>
      <path d="M0 840 C280 760 530 755 770 815 C1010 830 1210 785 1440 780 C1630 785 1800 750 1920 760 L1920 1080 L0 1080Z" fill="url(#openCliff)"/>
      <g opacity=".5"><Cloud x={350-frame*.35} y={360} scale={1.1}/><Cloud x={1050-frame*.2} y={420} scale={.8}/></g>
      <g transform={`translate(0 ${branchSway})`}>
        <path d="M-70 930 Q300 830 550 875 Q780 920 1030 820 Q1150 774 1260 790" fill="none" stroke="#53483B" strokeWidth="43" strokeLinecap="round"/>
        <path d="M460 877 Q565 770 610 650 M835 884 Q905 800 958 745" fill="none" stroke="#584D40" strokeWidth="20" strokeLinecap="round"/>
        <Pine x={330} y={1040} scale={.88} tone="#2C4D48"/>
        <Pine x={590} y={1035} scale={.64} tone="#496B5A"/>
      </g>
      <Bird
        x={move(frame, 760, 1480, 0, 118)}
        y={move(frame, 830, 270, 0, 118)}
        scale={1.5 - move(frame, 0, .42, 0, 118)}
        rotation={-4 - move(frame, 0, 18, 66, 118)}
        flap={Math.sin(frame / 5.6) * (1 - move(frame, 0, .7, 105, 145))}
        color="#263C3C"
      />
    </svg>
  </AbsoluteFill>;
};

const ValleyShot = ({frame}:{frame:number}) => {
  const t=frame-150, x=move(t,280,1530,0,180), y=450-move(t,0,105,0,180)+Math.sin(t/9)*9;
  const flap=Math.sin(t/5.1), cloudX=-t*1.15;
  return <AbsoluteFill style={{backgroundColor:"#A6C6C1"}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="valleySky" x2="0" y2="1"><stop stopColor="#80A9B3"/><stop offset=".52" stopColor="#D7D9C4"/><stop offset="1" stopColor="#F0D5AE"/></linearGradient>
        <linearGradient id="valleyGround" x2="0" y2="1"><stop stopColor="#788E73"/><stop offset="1" stopColor="#344D43"/></linearGradient>
        <linearGradient id="river" x2="0" y2="1"><stop stopColor="#B4D5D0" stopOpacity=".95"/><stop offset="1" stopColor="#7BA7A1" stopOpacity=".2"/></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#valleySky)"/><circle cx="1540" cy="245" r="110" fill="#FFF0CF" opacity=".72"/>
      <Cloud x={350+cloudX*.25} y={250} scale={1.15} opacity={.52}/><Cloud x={1200+cloudX*.18} y={330} scale={.78} opacity={.5}/>
      <path d="M0 570 C110 470 175 415 270 495 C390 360 490 275 590 425 C710 330 820 335 930 510 C1060 370 1180 320 1300 500 C1430 375 1540 305 1660 495 C1780 400 1860 430 1920 510 V1080 H0Z" fill="#81999A"/>
      <path d="M0 670 C140 585 250 520 365 650 C500 520 600 405 710 585 C850 500 970 500 1100 675 C1240 530 1360 470 1490 675 C1640 555 1780 525 1920 605 V1080 H0Z" fill="#607B76"/>
      <path d="M0 780 Q310 670 620 810 T1200 760 T1920 750 V1080 H0Z" fill="url(#valleyGround)"/>
      <path d="M0 820 Q270 740 500 835 Q740 950 970 835 Q1220 710 1440 815 Q1690 920 1920 795" fill="none" stroke="url(#river)" strokeWidth="65" opacity=".62"/>
      {Array.from({length:8},(_,i)=><path key={i} d={`M${i*270-300} 960 q130 -110 260 -15`} fill="none" stroke="#A5B991" strokeWidth="12" opacity=".35"/>)}
      <Bird x={x} y={y} scale={1.12} rotation={-4+Math.sin(t/20)*3} flap={flap} color="#20383B"/>
      <g opacity=".28"><Bird x={x-150} y={y+60} scale={.24} flap={-flap} color="#F0E9D6"/><Bird x={x-235} y={y+10} scale={.18} flap={flap*.8} color="#F0E9D6"/></g>
    </svg>
  </AbsoluteFill>;
};

const ClosePassShot = ({frame}:{frame:number}) => {
  const t=frame-330, x=move(t,-220,2100,0,180), y=520+Math.sin(t/13)*30-move(t,0,80,0,120);
  const s=move(t,.62,1.05,0,95)+move(t,1.05,.48,95,180);
  const flap=Math.sin(t/4.4), sunX=move(t,200,1450,0,180);
  return <AbsoluteFill style={{backgroundColor:"#D7C6A7"}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="passSky" x2="0" y2="1"><stop stopColor="#647E86"/><stop offset=".5" stopColor="#B6B7A2"/><stop offset="1" stopColor="#E5B98A"/></linearGradient>
        <radialGradient id="passSun"><stop stopColor="#FFF3D3" stopOpacity=".9"/><stop offset="1" stopColor="#FFF3D3" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#passSky)"/><circle cx={sunX} cy="255" r="400" fill="url(#passSun)"/>
      <path d="M0 520 C180 435 310 425 410 520 C590 475 700 455 790 485 C960 525 1080 485 1200 520 C1410 470 1510 450 1600 470 C1770 500 1840 475 1920 500 V1080 H0Z" fill="#71867A"/>
      <path d="M0 700 C230 600 370 615 550 730 C750 700 910 650 1050 680 C1280 730 1410 690 1530 710 C1710 690 1840 650 1920 650 V1080 H0Z" fill="#3F5E55"/>
      <path d="M0 860 C220 790 380 790 510 860 C730 840 920 800 1080 830 C1310 860 1420 835 1560 850 C1740 835 1850 795 1920 780 V1080 H0Z" fill="#263F3B"/>
      <g opacity=".72"><Pine x={120} y={920} scale={1.5}/><Pine x={430} y={980} scale={1.1} tone="#405F50"/><Pine x={1640} y={1010} scale={1.7}/><Pine x={1830} y={970} scale={1.22}/></g>
      <Cloud x={1300-t*.9} y={390} scale={1.35} opacity={.35}/>
      <Bird x={x} y={y} scale={s} rotation={-7+Math.sin(t/14)*7} flap={flap} color="#172F35"/>
    </svg>
  </AbsoluteFill>;
};

const HorizonShot = ({frame}:{frame:number}) => {
  const t=frame-510, x=move(t,300,1690,0,210), y=555-move(t,0,175,0,210)+Math.sin(t/12)*5;
  const s=move(t,.88,.32,0,210), flap=Math.sin(t/7.2)*(1-move(t,0,1,110,175));
  const opacity=interpolate(t,[170,210],[1,0],clamp), sunPulse=.72+Math.sin(t/23)*.06;
  return <AbsoluteFill style={{backgroundColor:"#222F3B"}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="finalSky" x2="0" y2="1"><stop stopColor="#293B4D"/><stop offset=".4" stopColor="#A06D65"/><stop offset=".68" stopColor="#E7AF7F"/><stop offset="1" stopColor="#F0D5A8"/></linearGradient>
        <radialGradient id="finalSun"><stop stopColor="#FFF5D9" stopOpacity=".92"/><stop offset=".32" stopColor="#FFDBA1" stopOpacity=".32"/><stop offset="1" stopColor="#FFC58C" stopOpacity="0"/></radialGradient>
        <linearGradient id="finalLand" x2="0" y2="1"><stop stopColor="#47575A"/><stop offset="1" stopColor="#172B31"/></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#finalSky)"/><circle cx="1440" cy="570" r="580" fill="url(#finalSun)" opacity={sunPulse}/>
      <circle cx="1440" cy="590" r="112" fill="#FFF0CB" opacity=".58"/>
      <path d="M0 720 C170 620 280 570 430 695 C590 610 690 510 850 700 C1020 610 1140 560 1300 720 C1480 620 1620 540 1790 700 C1850 680 1890 650 1920 640 V1080 H0Z" fill="#6D7470" opacity=".55"/>
      <path d="M0 830 Q320 720 600 820 T1150 810 T1650 780 T1920 810 V1080 H0Z" fill="url(#finalLand)"/>
      <path d="M0 930 Q360 875 660 910 T1340 895 T1920 920 V1080 H0Z" fill="#14272D"/>
      <g opacity=".26"><Cloud x={360-t*.35} y={450}/><Cloud x={1050-t*.45} y={500} scale={.7}/></g>
      <DistantBirds frame={t}/>
      <g opacity={opacity}><Bird x={x} y={y} scale={s} rotation={-5} flap={flap} color="#142A31"/></g>
      <path d="M0 1022 Q450 980 890 1018 T1920 1000 V1080 H0Z" fill="#0F2026" opacity=".45"/>
    </svg>
  </AbsoluteFill>;
};

export const BirdFlight = () => {
  const frame=useCurrentFrame();
  const segments=[
    {start:0,end:150,component:OpeningShot},
    {start:150,end:330,component:ValleyShot},
    {start:330,end:510,component:ClosePassShot},
    {start:510,end:720,component:HorizonShot},
  ];
  const active=segments.find((s)=>frame>=s.start&&frame<s.end)??segments[3]!;
  const Shot=active.component;
  const darkness=interpolate(frame,[0,18,702,719],[1,0,0,1],clamp);
  return <AbsoluteFill style={{backgroundColor:"#172D35",overflow:"hidden"}}>
    <Shot frame={frame}/>
    <AbsoluteFill style={{pointerEvents:"none",background:"linear-gradient(180deg,rgba(20,34,42,.22),transparent 28%,transparent 74%,rgba(12,28,34,.2))"}}/>
    <AbsoluteFill style={{pointerEvents:"none",opacity:darkness,backgroundColor:"#14242B"}}/>
  </AbsoluteFill>;
};
