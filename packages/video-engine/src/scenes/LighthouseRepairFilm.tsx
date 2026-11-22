import { ThreeCanvas } from "@remotion/three";
import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BackSide, Vector3 } from "three";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const smooth = (f:number, a:number, b:number) => interpolate(f,[a,b],[0,1],{...clamp,easing:Easing.inOut(Easing.cubic)});
const point = (angle:number,r:number,y:number):[number,number,number] => [Math.cos(angle)*r,y,Math.sin(angle)*r];
const lensSpin = (frame:number) => frame/31;

const Lighthouse:FC<{frame:number}> = ({frame}) => {
 const beamOn = smooth(frame,470,520);
 return <group position={[2,0,0]}>
  <mesh position={[0,-0.15,0]}><cylinderGeometry args={[1.52,2.05,0.8,48]}/><meshStandardMaterial color="#38434a" roughness={1}/></mesh>
  <mesh position={[0,2.0,0]}><cylinderGeometry args={[0.78,1.15,3.8,48]}/><meshStandardMaterial color="#b9b3a2" roughness={0.86}/></mesh>
  {Array.from({length:12},(_,i)=><mesh key={i} position={point(i*Math.PI/6,0.79,0.55+i*0.27)}><boxGeometry args={[0.09,0.12,0.09]}/><meshStandardMaterial color="#5b6263" roughness={0.9}/></mesh>)}
  <mesh position={[0,4.22,0]}><cylinderGeometry args={[0.88,0.88,0.42,48]}/><meshStandardMaterial color="#273943" metalness={0.7}/></mesh>
  <mesh position={[0,4.62,0]}><cylinderGeometry args={[0.92,0.92,0.07,48]}/><meshStandardMaterial color="#d4bb87" metalness={0.7}/></mesh>
  <group position={[0,4.75,0]}>
   <mesh><cylinderGeometry args={[0.86,0.86,1.2,32,1,true]}/><meshPhysicalMaterial color="#9ac4d0" transparent opacity={0.17} roughness={0.08} side={BackSide}/></mesh>
   <group rotation={[0,lensSpin(frame),0]}>
    <mesh><cylinderGeometry args={[0.55,0.55,0.55,32]}/><meshStandardMaterial color="#d9b66c" emissive="#e7a344" emissiveIntensity={beamOn*3} metalness={0.82} roughness={0.2}/></mesh>
    {Array.from({length:8},(_,i)=><mesh key={i} rotation={[0,i*Math.PI/4,0]}><boxGeometry args={[0.08,0.95,0.08]}/><meshPhysicalMaterial color="#f7d58b" emissive="#ffb44a" emissiveIntensity={beamOn*2.5} transparent opacity={0.85}/></mesh>)}
   </group>
   <pointLight color="#ffc36b" intensity={beamOn*280} distance={24}/>
  </group>
  <mesh position={[0,4.3,0]}><coneGeometry args={[1.0,0.5,48]}/><meshStandardMaterial color="#263a47" metalness={0.65}/></mesh>
  <mesh position={[0,5.65,0]}><coneGeometry args={[1.3,0.5,48]}/><meshStandardMaterial color="#1c2a32" metalness={0.72}/></mesh>
 </group>;
};

const Robot:FC<{frame:number;position:[number,number,number];scale?:number;repair?:number}> = ({frame,position,scale=1,repair=0})=>{
 const stride=Math.sin(frame/5)*0.18;
 const arm=interpolate(repair,[0,0.45,0.75,1],[0.15,-0.55,0.8,0.05],{...clamp});
 return <group position={position} scale={scale} rotation={[0,Math.sin(frame/37)*0.06,0]}>
  <mesh position={[0,0.58,0]}><capsuleGeometry args={[0.3,0.52,6,12]}/><meshPhysicalMaterial color="#c4c0ad" metalness={0.42} roughness={0.42}/></mesh>
  <mesh position={[0,1.08,0.02]}><boxGeometry args={[0.52,0.38,0.42]}/><meshPhysicalMaterial color="#dfd5bd" metalness={0.35} roughness={0.35}/></mesh>
  <mesh position={[0,1.13,0.24]}><boxGeometry args={[0.34,0.12,0.035]}/><meshStandardMaterial color="#162a35" emissive="#eeb56a" emissiveIntensity={1.6}/></mesh>
  <mesh position={[0,1.13,0.29]}><sphereGeometry args={[0.055,16,12]}/><meshBasicMaterial color="#ffe0a0"/></mesh>
  {[-1,1].map((side)=><group key={side} position={[side*0.34,0.8,0]}>
   <mesh rotation={[0,0,side*0.12]}><cylinderGeometry args={[0.085,0.085,0.43,12]}/><meshStandardMaterial color="#8f9b9b" metalness={0.7}/></mesh>
   <mesh position={[side*0.015,-0.23,0]} rotation={[0,0,side===1?arm:0.2]}><cylinderGeometry args={[0.065,0.065,0.38,12]}/><meshStandardMaterial color="#d2b879" metalness={0.8}/></mesh>
   <mesh position={[side*0.02,-0.45,0.07]}><sphereGeometry args={[0.095,12,8]}/><meshStandardMaterial color="#d5b979" metalness={0.8}/></mesh>
  </group>)}
  {[-1,1].map((side)=><group key={side} position={[side*0.17,0.28,0]}>
   <mesh position={[0,-0.13,0]} rotation={[0,0,side*stride]}><cylinderGeometry args={[0.09,0.12,0.32,12]}/><meshStandardMaterial color="#4c5d63" metalness={0.7}/></mesh>
   <mesh position={[0,-0.31,0.07]}><boxGeometry args={[0.22,0.12,0.34]}/><meshStandardMaterial color="#293d45" metalness={0.55}/></mesh>
  </group>)}
  <mesh position={[0,1.36,0]}><torusGeometry args={[0.12,0.035,8,24]}/><meshBasicMaterial color="#e5a95c"/></mesh>
 </group>;
};

const Storm:FC<{frame:number}> = ({frame})=>{
 const drops=Array.from({length:180},(_,i)=>{const x=((i*73)%160)/10-8;const y=((i*47)%90)/10-4.5;const z=((i*29)%100)/10-5;return {x,y,z,phase:i*0.31}});
 return <group>{drops.map((d,i)=>{const fall=(frame*0.13+d.phase)%9;return <mesh key={i} position={[d.x+fall*0.23,d.y+fall,d.z]} rotation={[0,0,-0.28]}><cylinderGeometry args={[0.008,0.008,0.22,5]}/><meshBasicMaterial color="#9bbdcb" transparent opacity={0.22}/></mesh>})}
 {Array.from({length:12},(_,i)=><mesh key={i} position={[-7+i*1.28,-1.7+Math.sin(frame/18+i)*0.12,-2]} scale={[1,0.18+0.05*Math.sin(frame/13+i),1]}><sphereGeometry args={[1,16,8]}/><meshBasicMaterial color="#31556a" transparent opacity={0.24}/></mesh>)}
 </group>;
};

const Coast:FC<{frame:number}> = ({frame})=>{
 return <group>
  <mesh position={[0,-2.55,-2]}><boxGeometry args={[32,1.2,13]}/><meshStandardMaterial color="#192a32" roughness={1}/></mesh>
  {Array.from({length:20},(_,i)=><mesh key={i} position={[-12+i*1.3,-2.9+Math.sin(frame/11+i)*0.13,-1-i%4]} scale={[1.3,0.22,1]}><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color="#294b5c" roughness={0.3} transparent opacity={0.8}/></mesh>)}
  <mesh position={[0,-3.35,-3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[45,25]}/><meshStandardMaterial color="#071622" roughness={0.45}/></mesh>
  {Array.from({length:9},(_,i)=><mesh key={i} position={[-7+i*1.8,-1.85,-3-Math.sin(i*4)*0.8]} rotation={[0,0,Math.sin(i)*0.3]}><coneGeometry args={[0.65,1.4,5]}/><meshStandardMaterial color="#26353a" roughness={1}/></mesh>)}
 </group>;
};

const ShotScene:FC<{frame:number;shot:number}> = ({frame,shot})=>{
 const lightning = Math.max(0,interpolate(frame,[43,45,49],[0,1,0],clamp),interpolate(frame,[178,180,184],[0,0.9,0],clamp));
 const robotX = shot===0? -4.2+smooth(frame,0,110)*2.2 : shot===1? -0.9 : shot===2? -1.35 : shot===3? -0.15 : shot===4? 1.25 : -3;
 const robotY = shot===0?-1.9:shot===2?-2.2:shot===3?-1.15:shot===4?-0.85:-1.95;
 const repair = smooth(frame,360,455);
 const cam = shot===0?new Vector3(-5.2,2.0,11.8):shot===1?new Vector3(-2.9,-0.8,5.7):shot===2?new Vector3(0.2,5.8,5.1):shot===3?new Vector3(-0.3,0.5,3.1):shot===4?new Vector3(0.3,0.4,6.2):new Vector3(-7,-0.2,13);
 const target=shot===0?new Vector3(0,0,0):shot===1?new Vector3(-0.1,0.4,0):shot===2?new Vector3(2,2,0):shot===3?new Vector3(2,4.7,0):shot===4?new Vector3(2,3.6,0):new Vector3(0,0,0);
 const local=frame-(shot*120);
 const camMove=shot===0?new Vector3(Math.sin(frame/44)*0.65,Math.sin(frame/30)*0.16,0):shot===1?new Vector3(Math.sin(frame/30)*0.25,0,0):shot===2?new Vector3(Math.sin(frame/60)*0.35,0,0):shot===3?new Vector3(Math.sin(frame/28)*0.08,0,0):shot===4?new Vector3(Math.sin(frame/34)*0.22,0,0):new Vector3(Math.sin(frame/55)*0.8,0,0);
 const cameraPos=cam.clone().add(camMove);
 return <ThreeCanvas camera={{position:cameraPos.toArray(),fov:shot===3?42:shot===2?45:shot===0?48:40}} width={1920} height={1080} style={{width:"100%",height:"100%"}}>
  <color attach="background" args={["#071321"]}/>
  <fog attach="fog" args={["#142b38",shot===3?5:shot===0?12:9,28]}/>
  <ambientLight intensity={shot===4?0.62:0.27} color="#7894a6"/>
  <directionalLight position={[-5,7,5]} intensity={0.85+lightning*2.4} color={lightning>0.1?"#d7efff":"#8ba7ba"}/>
  <pointLight position={[2,4,1]} intensity={shot>=4?220:8} color={shot>=4?"#ffb85e":"#8cb1c4"} distance={22}/>
  <Storm frame={frame}/><Coast frame={frame}/>
  <Lighthouse frame={frame}/>
  {shot!==0 && <Robot frame={frame} position={[robotX,robotY,shot===5?0.1:0.45]} scale={shot===3?0.62:shot===2?0.8:shot===5?0.5:0.86} repair={repair}/>}
  {shot===0 && <Robot frame={frame} position={[robotX,robotY,0.5]} scale={0.45}/>}
  {shot===2 && <group position={[2,0,0]}>{Array.from({length:18},(_,i)=><mesh key={i} position={point(i*Math.PI/9,0.68,4.6)}><boxGeometry args={[0.035,0.5,0.035]}/><meshStandardMaterial color="#9a9c93" metalness={0.6}/></mesh>)}</group>}
  {shot===3 && <group position={[2,4.75,0]} rotation={[0,lensSpin(frame),0]}>{[0,1,2,3,4,5].map(i=><mesh key={i} rotation={[0,i*Math.PI/3,0]}><boxGeometry args={[0.09,0.85,0.08]}/><meshStandardMaterial color={frame>430?"#ffc26c":"#766d5d"} emissive={frame>430?"#ef8f38":"#000000"} emissiveIntensity={frame>430?3:0}/></mesh>)}</group>}
  {shot===4 && <mesh position={[2,5.0,-1.5]} rotation={[0,frame/30,0]}><coneGeometry args={[0.7,12,32,1,true]}/><meshBasicMaterial color="#ffcc7a" transparent opacity={0.12} side={BackSide}/></mesh>}
  {shot===5 && <mesh position={[2,5.0,-2]} rotation={[Math.PI/2,frame/31,0]}><coneGeometry args={[2.1,22,32,1,true]}/><meshBasicMaterial color="#ffd08a" transparent opacity={0.13} side={BackSide}/></mesh>}
 </ThreeCanvas>;
};

export const LighthouseRepairFilm:FC=()=>{
 const frame=useCurrentFrame();
 const {width,height}=useVideoConfig();
 const shot=Math.min(5,Math.floor(frame/120));
 const fadeIn=interpolate(frame,[0,22],[0,1],clamp);
 const fadeOut=interpolate(frame,[698,720],[1,0],clamp);
 return <AbsoluteFill style={{background:"#071321",opacity:fadeIn*fadeOut}}>
  <ShotScene frame={frame} shot={shot}/>
  <AbsoluteFill style={{pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 48%, rgba(1,7,13,.56) 100%)"}}/>
  <AbsoluteFill style={{pointerEvents:"none",background:"linear-gradient(180deg,rgba(3,12,20,.08),transparent 24%,transparent 72%,rgba(2,9,15,.35))"}}/>
 </AbsoluteFill>;
};
