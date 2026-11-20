import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill, Audio, Easing, interpolate, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import type { FC } from "react";
import * as THREE from "three";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Wheel: FC<{ x: number; z: number; frame: number }> = ({ x, z, frame }) => (
  <group position={[x, -0.48, z]} rotation={[0, 0, -frame * 0.035]}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.43, 0.43, 0.28, 48]} />
      <meshPhysicalMaterial color="#090c11" roughness={0.88} />
    </mesh>
    <mesh position={[Math.sign(x) * 0.151, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.285, 0.285, 0.018, 12]} />
      <meshPhysicalMaterial color="#aeb8c4" metalness={0.94} roughness={0.2} />
    </mesh>
    <mesh position={[Math.sign(x) * 0.166, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.11, 0.11, 0.024, 32]} />
      <meshStandardMaterial color="#1c2632" metalness={0.72} roughness={0.28} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[Math.sign(x) * 0.18, 0, 0]} rotation={[i * Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.025, 0.51, 0.045]} />
        <meshStandardMaterial color="#d5dde5" metalness={0.9} roughness={0.22} />
      </mesh>
    ))}
    <mesh position={[Math.sign(x) * 0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.055, 0.055, 0.03, 24]} />
      <meshStandardMaterial color="#5c6877" metalness={0.85} roughness={0.22} />
    </mesh>
  </group>
);

const SportsCar: FC<{ frame: number }> = ({ frame }) => {
  const paint = new THREE.MeshPhysicalMaterial({ color: "#d20b24", metalness: 0.78, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#101e2b", metalness: 0.34, roughness: 0.12, transmission: 0.12, transparent: true, opacity: 0.92, clearcoat: 1 });
  const trim = new THREE.MeshStandardMaterial({ color: "#080c12", metalness: 0.62, roughness: 0.34 });
  const chrome = new THREE.MeshStandardMaterial({ color: "#aebac5", metalness: 0.96, roughness: 0.18 });
  return (
    <group position={[0, 0.18, 0]}>
      <mesh position={[0, -0.05, 0]} scale={[1, 0.55, 2.1]} material={paint}>
        <sphereGeometry args={[1, 64, 40]} />
      </mesh>
      <mesh position={[0, -0.2, 0.13]} scale={[0.96, 0.34, 1.93]} material={paint}>
        <boxGeometry args={[2, 1, 1.9, 8, 2, 16]} />
      </mesh>
      <mesh position={[0, 0.24, 1.15]} scale={[0.93, 0.24, 0.94]} material={paint}>
        <boxGeometry args={[1.8, 0.55, 1.8, 8, 2, 8]} />
      </mesh>
      <mesh position={[0, 0.26, -1.24]} scale={[0.98, 0.28, 0.73]} material={paint}>
        <boxGeometry args={[1.85, 0.5, 1.2, 8, 2, 6]} />
      </mesh>
      <mesh position={[0, 0.72, -0.12]} scale={[0.72, 0.46, 0.92]} material={paint}>
        <boxGeometry args={[1.8, 1, 1.9, 8, 4, 8]} />
      </mesh>
      <mesh position={[0, 0.76, 0.12]} scale={[0.735, 0.36, 0.81]} material={glass}>
        <boxGeometry args={[1.8, 1, 1.8]} />
      </mesh>
      <mesh position={[0, 1.08, -0.14]} scale={[0.68, 0.07, 0.52]} material={paint}>
        <boxGeometry args={[1.8, 0.2, 1.4]} />
      </mesh>
      <mesh position={[0, 0.72, 0.84]} rotation={[0.3, 0, 0]} scale={[0.69, 0.32, 0.035]} material={glass}>
        <planeGeometry args={[1.8, 1]} />
      </mesh>
      <mesh position={[0, 0.71, -1.03]} rotation={[-0.26, 0, 0]} scale={[0.67, 0.28, 0.035]} material={glass}>
        <planeGeometry args={[1.8, 1]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.737, 0.78, -0.12]} rotation={[0, side * Math.PI / 2, 0]} material={glass}>
            <planeGeometry args={[1.43, 0.45]} />
          </mesh>
          <mesh position={[side * 0.89, -0.12, -0.1]} material={trim}>
            <boxGeometry args={[0.025, 0.012, 1.1]} />
          </mesh>
          <mesh position={[side * 0.91, 0.24, 0.46]} rotation={[0, 0, side * 0.12]} material={chrome}>
            <boxGeometry args={[0.12, 0.055, 0.18]} />
          </mesh>
          <mesh position={[side * 0.91, 0.53, 0.43]} rotation={[0, 0, side * 0.2]} material={trim}>
            <boxGeometry args={[0.09, 0.035, 0.22]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.12, 2.04]} material={trim}><boxGeometry args={[1.08, 0.23, 0.12]} /></mesh>
      <mesh position={[0, -0.12, 2.105]} material={chrome}><boxGeometry args={[0.76, 0.018, 0.018]} /></mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.65, 0.12, 1.99]} rotation={[0, side * -0.12, 0]}>
            <boxGeometry args={[0.43, 0.065, 0.045]} />
            <meshBasicMaterial color="#e8f7ff" />
          </mesh>
          <mesh position={[side * 0.82, -0.22, 1.99]} rotation={[0, side * -0.2, 0]} material={trim}>
            <boxGeometry args={[0.18, 0.06, 0.08]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.13, -2.03]}><boxGeometry args={[1.48, 0.055, 0.04]} /><meshBasicMaterial color="#ff263e" /></mesh>
      <mesh position={[0, -0.27, -2.02]} material={trim}><boxGeometry args={[1.4, 0.18, 0.18]} /></mesh>
      {[-0.67, 0.67].map((side) => (
        <mesh key={side} position={[side, -0.2, -2.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.08, 32]} />
          <meshStandardMaterial color="#687583" metalness={0.95} roughness={0.16} />
        </mesh>
      ))}
      <mesh position={[0, -0.39, 2.12]} material={trim}><boxGeometry args={[1.9, 0.045, 0.28]} /></mesh>
      <group position={[0, 0.64, -1.78]}>
        <mesh position={[0, 0.12, 0]} material={trim}><boxGeometry args={[1.55, 0.06, 0.34]} /></mesh>
        {[-0.58, 0.58].map((x) => <mesh key={x} position={[x, -0.02, 0]} material={chrome}><boxGeometry args={[0.045, 0.22, 0.06]} /></mesh>)}
      </group>
      {[-0.91, 0.91].flatMap((x) => [-1.33, 1.31].map((z) => <Wheel key={x + ":" + z} x={x} z={z} frame={frame} />))}
    </group>
  );
};

const Studio: FC<{ frame: number }> = ({ frame }) => {
  const sweep = Math.sin(frame / 56) * 3.5;
  return (
    <>
      <color attach="background" args={["#070a12"]} />
      <fog attach="fog" args={["#070a12", 9, 24]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#dcecff", "#101722", 1.1]} />
      <directionalLight position={[3, 7, 5]} intensity={2.4} />
      <spotLight position={[-4 + sweep, 4, 5]} angle={0.48} penumbra={0.82} intensity={125} color="#ff3152" />
      <spotLight position={[4, 3, -4]} angle={0.58} penumbra={0.9} intensity={100} color="#42b9ff" />
      <pointLight position={[0, 1, 5]} intensity={28} color="#fff1dc" />
      <pointLight position={[0, 2, -5]} intensity={24} color="#eb1741" />
      <mesh position={[0, -1.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a111d" metalness={0.48} roughness={0.42} />
      </mesh>
      <gridHelper args={[28, 56, "#213342", "#111f2b"]} position={[0, -1.125, 0]} />
      <SportsCar frame={frame} />
    </>
  );
};

export const SportsCarCinematic: FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const camera = interpolate(frame, [0, 90, 180, 270, 360, 450, 540, 630, 720], [5.7, 6.4, 5.2, 4.8, 5.8, 5.4, 4.9, 5.8, 5.7], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const yaw = interpolate(frame, [0, 90, 180, 270, 360, 450, 540, 630, 720], [0.95, 0.45, -0.1, -0.85, -1.7, -2.55, -3.4, -4.7, -5.25], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pitch = interpolate(frame, [0, 180, 360, 540, 720], [0.16, 0.06, 0.24, 0.08, 0.14], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const titleOpacity = interpolate(frame, [16, 48, 630, 700], [0, 1, 1, 0], clamp);
  const titleY = interpolate(frame, [16, 54], [26, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ backgroundColor: "#070a12", color: "#f5f7fb", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={staticFile("audio/sports-car-score.wav")} volume={0.7} />
      <ThreeCanvas width={width} height={height} camera={{ position: [camera * Math.sin(yaw), 1.2 + pitch * 2, camera * Math.cos(yaw)], fov: 36 }} style={{ width: "100%", height: "100%" }}>
        <Studio frame={frame} />
      </ThreeCanvas>
      <AbsoluteFill style={{ pointerEvents: "none", opacity: titleOpacity, transform: `translateY(${titleY}px)`, padding: "6.5% 7.5%", boxSizing: "border-box" }}>
        <div style={{ color: "#ff647d", fontSize: 16, fontWeight: 700, letterSpacing: 6 }}>MOTORSPORT / DESIGN STUDY 01</div>
        <div style={{ position: "absolute", left: "7.5%", bottom: "12%", maxWidth: "44%" }}>
          <div style={{ fontSize: 78, lineHeight: 0.9, fontWeight: 800, letterSpacing: -4 }}>SCULPTED<br />FOR SPEED.</div>
          <div style={{ marginTop: 22, color: "#bac6d3", fontSize: 19, letterSpacing: 2 }}>A study in power, proportion and motion.</div>
        </div>
        <div style={{ position: "absolute", right: "7.5%", bottom: "13%", textAlign: "right", color: "rgba(224,234,246,.75)", fontSize: 14, lineHeight: 1.9, letterSpacing: 3 }}>
          MID-ENGINE FORM<br />AERODYNAMIC PROFILE<br />PRECISION ALLOY WHEELS
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 26, left: "7.5%", right: "7.5%", height: 2, background: "rgba(215,227,241,.16)" }}>
        <div style={{ width: `${(frame / 719) * 100}%`, height: "100%", background: "#ff536e" }} />
      </div>
    </AbsoluteFill>
  );
};
