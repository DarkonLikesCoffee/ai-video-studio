import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const move = (frame: number, from: number, to: number, start: number, end: number) =>
  interpolate(frame, [start, end], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });

type BirdProps = { x: number; y: number; scale?: number; rotation?: number; flap: number; color?: string; opacity?: number };

const Bird = ({ x, y, scale = 1, rotation = 0, flap, color = "#172D35", opacity = 1 }: BirdProps) => (
  <g transform={\`translate(\${x} \${y}) rotate(\${rotation}) scale(\${scale})\`} opacity={opacity}>
    <path d="M-28 4 Q-74 -2 -109 19 Q-84 23 -57 16 Q-88 37 -114 35 Q-69 44 -30 20Z" fill={color}/>
    <path d="M-45 0 C-28 -23 12 -24 39 -9 C54 -1 62 7 78 4 L102 -4 L86 11 C68 30 26 31 -11 17 C-28 12 -39 8 -45 0Z" fill={color}/>
    <path d="M42 -7 Q71 -21 92 -12 L111 -5 L91 1 Q67 4 49 5Z" fill={color}/>
    <path d="M101 -5 L124 -9 L108 2Z" fill="#D89A52"/>
    <circle cx="78" cy="-11" r="3.1" fill="#F4E8D1"/><circle cx="79" cy="-11" r="1.35" fill="#14242B"/>
    <g transform={\`rotate(\${10 + flap * 38} -16 -2)\`}>
      <path d="M-20 0 Q-16 -65 -56 -136 Q-49 -75 -39 -35 Q-66 -99 -97 -119 Q-75 -65 -48 -27 Q-88 -75 -125 -83 Q-94 -42 -50 -12 Q-79 -29 -112 -31 Q-69 2 -20 12Z" fill="#29434A"/>
      <path d="M-34 -20 Q-64 -84 -93 -104 M-37 -16 Q-82 -61 -112 -68 M-34 -12 Q-81 -34 -104 -34" fill="none" stroke="#78918E" strokeWidth="2.2" opacity=".45"/>
    </g>
    <g transform={\`rotate(\${-12 - flap * 48} -15 1)\`}>
      <path d="M-20 2 Q-13 -62 8 -132 Q8 -74 0 -33 Q18 -94 46 -121 Q35 -65 8 -24 Q45 -70 82 -79 Q56 -32 10 -7 Q48 -24 78 -22 Q35 13 -20 14Z" fill={color}/>
      <path d="M-1 -22 Q22 -80 37 -108 M1 -16 Q42 -56 70 -65 M2 -10 Q47 -28 67 -27" fill="none" stroke="#8DA19A" strokeWidth="2.4" opacity=".42"/>
    </g>
  </g>
);

const Cloud = ({x,y,s=1,opacity=.38}:{x:number;y:number;s?:number;opacity?:number}) => (
  <g transform={\`translate(\${x} \${y}) scale(\${s})\`} opacity={opacity} fill="#FFF8EA">
    <ellipse cx="0" cy="12" rx="88" ry="20"/><ellipse cx="-39" cy="3" rx="40" ry="26"/>
    <ellipse cx="8" cy="-12" rx="53" ry="38"/><ellipse cx="53" cy="3" rx="42" ry="27"/>
  </g>
);

const Pine = ({x,y,s=1,tone="#314F4D"}:{x:number;y:number;s?:number;tone?:string}) => (
  <g transform={\`translate(\${x} \${y}) scale(\${s})\`}>
    <path d="M0 0 V-250" stroke="#4D4638" strokeWidth="16"/>
    <path d="M0 -252 L-86 -118 -39 -132 -107 -43 106 -43 37 -132 84 -118Z" fill={tone}/>
    <path d="M0 -208 L-72 -94 -28 -105 -88 -34 90 -34 30 -105 71 -94Z" fill="#52705D" opacity=".72"/>
  </g>
);

const DistantBirds = ({frame}:{frame:number}) => (
  <g fill="none" stroke="#344A48" strokeWidth="4.5" strokeLinecap="round" opacity=".55">
    {Array.from({length:6},(_,i)=>{
      const dx=(frame*(.12+i*.012)+i*83)%250;
      const x=1230+i*48+dx, y=330+Math.sin(frame/17+i)*12+i*19;
      return <path key={i} d={\`M\${x-15} \${y} Q\${x} \${y-12} \${x+15} \${y}\`}/>;
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
      <path d="M0 610 Q300 460 520 570 T1030 520 T1530 565 T1920 490 L1920 1080 L0 1080Z" fill="#9AA99A"/>
      <path d="M0 725 Q360 590 710 690 T1350 670 T1920 620 L1920 1080 L0 1080Z" fill="#778E7C"/>
      <path d="M0 840 Q410 745 770 815 T1440 780 T1920 760 L1920 1080 L0 1080Z" fill="url(#openCliff)"/>
      <g opacity=".5"><Cloud x={350-frame*.35} y={360} s={1.1}/><Cloud x={1050-frame*.2} y={420} s={.8}/></g>
      <g transform={\`translate(0 \${branchSway})\`}>
        <path d="M-70 930 Q300 830 550 875 Q780 920 1030 820 Q1150 774 1260 790" fill="none" stroke="#53483B" strokeWidth="43" strokeLinecap="round"/>
        <path d="M460 877 Q565 770 610 650 M835 884 Q905 800 958 745" fill="none" stroke="#584D40" strokeWidth="20" strokeLinecap="round"/>
        <Pine x={330} y={1040} s={.88} tone="#2C4D48"/><Pine x={590} y={1035} s={.64} tone="#496B5A"/>
      </g>
      <Bird x={760} y={830} s={1.5} flap={Math.sin(frame/5.8)*1.1} color="#263C3C"/>
      {launch>0&&<Bird x={move(frame,1290,1820,70,150)} y={move(frame,585,180,70,150)} s={1.35-launch*.25} rotation={-22-launch*8} flap={Math.sin(frame/5.6)} color="#20383B" opacity={launch}/>}
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
      <Cloud x={350+cloudX*.25} y={250} s={1.15} opacity={.52}/><Cloud x={1200+cloudX*.18} y={330} s={.78} opacity={.5}/>
      <path d="M0 570 L170 430 320 520 540 300 730 560 980 360 1190 540 1400 325 1600 540 1800 390 1920 510 V1080 H0Z" fill="#81999A"/>
      <path d="M0 670 L180 550 360 650 580 425 780 700 1000 510 1220 700 1420 470 1640 700 1840 535 1920 605 V1080 H0Z" fill="#607B76"/>
      <path d="M0 780 Q310 670 620 810 T1200 760 T1920 750 V1080 H0Z" fill="url(#valleyGround)"/>
      <path d="M0 820 Q270 740 500 835 Q740 950 970 835 Q1220 710 1440 815 Q1690 920 1920 795" fill="none" stroke="url(#river)" strokeWidth="65" opacity=".62"/>
      {Array.from({length:8},(_,i)=><path key={i} d={\`M\${i*270-300} 960 q130 -110 260 -15\`} fill="none" stroke="#A5B991" strokeWidth="12" opacity=".35"/>)}
      <Bird x={x} y={y} s={1.12} rotation={-4+Math.sin(t/20)*3} flap={flap} color="#20383B"/>
      <g opacity=".28"><Bird x={x-150} y={y+60} s={.24} flap={-flap} color="#F0E9D6"/><Bird x={x-235} y={y+10} s={.18} flap={flap*.8} color="#F0E9D6"/></g>
    </svg>
  </AbsoluteFill>;
};

const ClosePassShot = ({frame}:{frame:number}) => {
  const t=frame-330, x=move(t,-360,2260,0,180), y=520+Math.sin(t/13)*36-move(t,0,120,0,120);
  const s=move(t,.7,2.5,0,95)+move(t,2.5,.58,95,180);
  const flap=Math.sin(t/4.4), sunX=move(t,200,1450,0,180);
  return <AbsoluteFill style={{backgroundColor:"#D7C6A7"}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="passSky" x2="0" y2="1"><stop stopColor="#647E86"/><stop offset=".5" stopColor="#B6B7A2"/><stop offset="1" stopColor="#E5B98A"/></linearGradient>
        <radialGradient id="passSun"><stop stopColor="#FFF3D3" stopOpacity=".9"/><stop offset="1" stopColor="#FFF3D3" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#passSky)"/><circle cx={sunX} cy="255" r="400" fill="url(#passSun)"/>
      <path d="M0 520 Q220 420 410 520 T790 485 T1200 520 T1600 470 T1920 500 V1080 H0Z" fill="#71867A"/>
      <path d="M0 700 Q310 580 550 730 T1050 680 T1530 710 T1920 650 V1080 H0Z" fill="#3F5E55"/>
      <path d="M0 860 Q260 770 510 860 T1080 830 T1560 850 T1920 780 V1080 H0Z" fill="#263F3B"/>
      <g opacity=".72"><Pine x={120} y={920} s={1.5}/><Pine x={430} y={980} s={1.1} tone="#405F50"/><Pine x={1640} y={1010} s={1.7}/><Pine x={1830} y={970} s={1.22}/></g>
      <Cloud x={1300-t*.9} y={390} s={1.35} opacity={.35}/>
      <Bird x={x} y={y} s={s} rotation={-7+Math.sin(t/14)*7} flap={flap} color="#172F35"/>
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
      <path d="M0 720 L230 580 430 695 650 525 900 735 1110 585 1300 720 1540 535 1790 700 1920 640 V1080 H0Z" fill="#6D7470" opacity=".55"/>
      <path d="M0 830 Q320 720 600 820 T1150 810 T1650 780 T1920 810 V1080 H0Z" fill="url(#finalLand)"/>
      <path d="M0 930 Q360 875 660 910 T1340 895 T1920 920 V1080 H0Z" fill="#14272D"/>
      <g opacity=".26"><Cloud x={360-t*.35} y={450}/><Cloud x={1050-t*.45} y={500} s={.7}/></g>
      <DistantBirds frame={t}/>
      <g opacity={opacity}><Bird x={x} y={y} s={s} rotation={-5} flap={flap} color="#142A31"/></g>
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
