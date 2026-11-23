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
        <stop offset="0" stopColor="#58747A"/><stop offset=".55" stopColor="#334E57"/><stop offset="1" stopColor="#1C343D"/>
      </linearGradient>
      <linearGradient id="birdBreast" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#F3E9D7"/><stop offset="1" stopColor="#C7B79E"/>
      </linearGradient>
      <linearGradient id="birdWing" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#789093"/><stop offset=".55" stopColor="#3E5962"/><stop offset="1" stopColor="#263F48"/>
      </linearGradient>
      <linearGradient id="birdBeak" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#F5D17B"/><stop offset="1" stopColor="#C9803E"/>
      </linearGradient>
    </defs>
    {/* far wing: a rounded, broad shape, kept behind the body */}
    <g transform={`rotate(${-18 - flap * 30} -8 0)`}>
      <path d="M-16 5 C-38 -18 -58 -42 -72 -68 C-59 -63 -45 -51 -33 -38
        C-43 -56 -43 -74 -34 -89 C-20 -72 -7 -51 7 -31
        C16 -47 31 -64 48 -73 C42 -48 26 -25 8 -10 C-3 -1 -10 4 -16 5Z"
        fill="#1C333B" opacity=".9"/>
      <path d="M-34 -89 C-22 -64 -12 -38 -3 -10 M48 -73 C30 -48 14 -27 2 -8"
        fill="none" stroke="#829B99" strokeWidth="2" opacity=".32"/>
    </g>
    {/* tail feathers with rounded, tapered tips */}
    <path d="M-44 3 C-72 0 -93 -10 -117 -24 C-101 -5 -80 10 -58 17Z" fill={color}/>
    <path d="M-44 8 C-70 16 -92 24 -115 39 C-88 35 -66 27 -52 18Z" fill="#29454D"/>
    <path d="M-42 -2 C-67 -15 -88 -30 -105 -48 C-90 -27 -71 -10 -53 10Z" fill="#3B5760"/>
    {/* compact body */}
    <path d="M-55 3 C-42 -18 -17 -29 11 -28 C37 -28 60 -17 75 -5
      C87 3 99 1 111 -7 L120 -2 L110 9
      C92 26 64 31 36 24 C7 18 -20 22 -43 16Z" fill="url(#birdBody)"/>
    <path d="M-19 13 C1 21 25 26 48 19 C64 14 75 7 82 1
      C69 21 53 29 35 29 C13 29 -7 22 -19 13Z" fill="url(#birdBreast)"/>
    {/* head and softly curved throat */}
    <path d="M34 -20 C49 -38 77 -40 94 -26 C104 -17 109 -5 105 6
      C93 17 76 17 61 10 C48 4 39 -7 34 -20Z" fill="url(#birdBody)"/>
    <path d="M43 -4 C54 9 73 16 91 11 C80 22 61 19 49 9Z" fill="#E1D4BD" opacity=".9"/>
    {/* short beak and eye */}
    <path d="M98 -20 L127 -11 L111 -4 L100 1 L105 -8Z" fill="url(#birdBeak)"/>
    <path d="M100 -19 L121 -12" stroke="#F8DEA1" strokeWidth="2" opacity=".45"/>
    <ellipse cx="81" cy="-23" rx="7.4" ry="8" fill="#F2E5CA"/>
    <circle cx="83" cy="-23" r="4.2" fill="#B77C3C"/><circle cx="84.2" cy="-23" r="2.2" fill="#16272E"/>
    <circle cx="85.4" cy="-24.5" r="1" fill="#FFF7E8"/>
    {/* wing-coverts */}
    <path d="M-34 -4 C-11 -20 13 -22 37 -12 C17 -4 -2 7 -21 11Z" fill="#273F48" opacity=".46"/>
    <path d="M-15 -10 Q5 -16 24 -12 M-7 -4 Q13 -10 34 -7" fill="none" stroke="#9AAFA5" strokeWidth="2" opacity=".25"/>
    {/* near wing with gently scalloped feather ends; flap rotates as one mass */}
    <g transform={`rotate(${20 + flap * 34} -8 2)`}>
      <path d="M-10 1 C-28 -17 -46 -38 -54 -61
        C-42 -58 -30 -47 -20 -35
        C-29 -53 -31 -70 -22 -84
        C-9 -68 3 -48 16 -29
        C22 -45 36 -60 52 -69
        C49 -44 34 -23 14 -8
        C2 2 -7 5 -10 1Z" fill="url(#birdWing)"/>
      <path d="M-54 -61 C-36 -38 -23 -20 -9 -2 M-22 -84 C-10 -58 2 -33 9 -10
        M52 -69 C34 -43 22 -24 8 -7" fill="none" stroke="#C1C9B8" strokeWidth="2.5" opacity=".26"/>
      <path d="M-7 -3 C12 -12 30 -24 43 -39" fill="none" stroke="#D9DFD0" strokeWidth="3" opacity=".1"/>
    </g>
    {/* legs tucked close to the body */}
    <path d="M18 22 L10 31 L4 31 M36 22 L29 31 L23 31" fill="none" stroke="#B77D49" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
);
const Cloud = ({ x, y, scale = 1, opacity = .38 }: { x: number; y: number; scale?: number; opacity?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path d="M-82 17 C-104 17 -116 5 -109 -9 C-102 -22 -84 -22 -71 -13
      C-70 -35 -47 -51 -24 -44 C-8 -66 24 -60 39 -42
      C65 -48 86 -28 82 -9 C104 -8 119 8 106 20 C96 30 72 29 52 28
      L-72 28 C-83 28 -88 24 -82 17Z" fill="#FFF8EA"/>
    <path d="M-68 13 C-54 18 -24 17 5 13 C29 18 54 15 82 12" fill="none" stroke="#D6E0DA" strokeWidth="3" opacity=".3"/>
  </g>
);
const Pine = ({ x, y, scale = 1, tone = "#314F4D" }: { x: number; y: number; scale?: number; tone?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-3 0 Q-1 -92 3 -230" stroke="#514435" strokeWidth="11" fill="none"/>
    <path d="M0 -230 C-13 -211 -26 -193 -38 -175 C-22 -179 -12 -177 0 -170
      C-24 -151 -42 -129 -58 -106 C-39 -112 -25 -111 -10 -104
      C-31 -83 -52 -62 -70 -40 C-49 -46 -30 -45 -13 -36
      C-30 -20 -46 -8 -58 0 L58 0 C46 -8 30 -20 13 -36
      C30 -45 49 -46 70 -40 C52 -62 31 -83 10 -104
      C25 -111 39 -112 58 -106 C42 -129 24 -151 0 -170
      C12 -177 22 -179 38 -175 C26 -193 13 -211 0 -230Z" fill={tone}/>
    <path d="M0 -183 C-12 -165 -24 -149 -35 -133 C-20 -137 -10 -136 0 -130
      C-19 -111 -35 -91 -48 -72 C-30 -76 -18 -75 -5 -67
      C-22 -48 -38 -30 -52 -10 L52 -10 C38 -30 22 -48 5 -67
      C18 -75 30 -76 48 -72 C35 -91 19 -111 0 -130
      C10 -136 20 -137 35 -133 C24 -149 12 -165 0 -183Z" fill="#69856B" opacity=".5"/>
    <path d="M0 -206 L-28 -166 M0 -170 L-42 -128 M0 -134 L-50 -91 M0 -96 L-58 -51
      M0 -206 L28 -166 M0 -170 L42 -128 M0 -134 L50 -91 M0 -96 L58 -51"
      stroke="#A8B895" strokeWidth="3" strokeLinecap="round" opacity=".15"/>
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
