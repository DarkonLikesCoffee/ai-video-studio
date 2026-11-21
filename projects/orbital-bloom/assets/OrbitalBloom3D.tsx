import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import type { FC } from "react";
import {
  AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { BackSide, CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Shape, Vector3 } from "three";

type OrbitalBloomProps = { durationInFrames?: number };
type P3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const smooth = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const path = (points: P3[]) => new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));

const bladeShape = new Shape();
bladeShape.moveTo(0.02, -0.07);
bladeShape.quadraticCurveTo(0.26, -0.14, 0.66, 0.2);
bladeShape.quadraticCurveTo(0.33, 0.3, 0.02, 0.13);
bladeShape.closePath();
const bladeGeometry = new ExtrudeGeometry(bladeShape, {
  depth: 0.07, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.012, bevelSegments: 3,
});

const Dome: FC = () => {
  const ribs = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const points: P3[] = Array.from({ length: 25 }, (_, j) => {
      const t = (j / 24) * Math.PI / 2;
      const r = 8.1 * Math.cos(t);
      return [Math.cos(angle) * r, 8.1 * Math.sin(t), Math.sin(angle) * r];
    });
    return points;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[8.1, 64, 40, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#8bb6c6" roughness={0.22} metalness={0.08} transparent opacity={0.08} transmission={0.2} thickness={0.15} side={DoubleSide} depthWrite={false} />
      </mesh>
      {ribs.map((points, i) => (
        <mesh key={i}>
          <tubeGeometry args={[path(points), 64, 0.028, 8, false]} />
          <meshStandardMaterial color="#647985" metalness={0.9} roughness={0.26} />
        </mesh>
      ))}
      {[0.22, 0.48, 0.72, 0.9].map((t, i) => (
        <mesh key={i} position={[0, 8.1 * Math.sin(t * Math.PI / 2), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8.1 * Math.cos(t * Math.PI / 2), 0.024, 8, 128]} />
          <meshStandardMaterial color="#80949e" metalness={0.94} roughness={0.24} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8.08, 0.09, 12, 160]} />
        <meshStandardMaterial color="#435761" metalness={0.94} roughness={0.3} />
      </mesh>
    </group>
  );
};

const Planet: FC = () => {
  const frame = useCurrentFrame();
  return (
    <group position={[5.25, 3.45, -8.7]} rotation={[0.16, frame / 920, -0.1]}>
      <mesh><sphereGeometry args={[1.34, 64, 48]} /><meshStandardMaterial color="#274e66" roughness={0.94} /></mesh>
      <mesh scale={1.02}><sphereGeometry args={[1.34, 64, 48]} /><meshBasicMaterial color="#8ecde0" transparent opacity={0.22} side={BackSide} /></mesh>
      <mesh position={[-0.24, 0.55, 0.72]} rotation={[0.2, 0.3, -0.55]} scale={[0.68, 0.13, 0.05]}>
        <sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#52846d" roughness={1} />
      </mesh>
      <pointLight position={[-2, 1, 2]} color="#9bc9e8" intensity={5} distance={6} />
    </group>
  );
};

const Station: FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <color attach="background" args={["#03070b"]} />
      <fog attach="fog" args={["#03070b", 13, 32]} />
      <ambientLight intensity={0.3} color="#78909a" />
      <hemisphereLight args={["#a2c4d2", "#101719", 0.42]} />
      <directionalLight position={[-5, 7, 4]} intensity={1.1} color="#bed0d4" />
      <pointLight position={[-5, 3, -2]} intensity={16} distance={14} color="#3e8796" />
      <pointLight position={[5.5, 2, 1]} intensity={12} distance={12} color="#a96b43" />
      <pointLight position={[-6, 0.5, 4]} intensity={18 * (1 - smooth(frame, 70, 245))} distance={9} color="#dc6047" />
      <Dome />
      <Planet />
      <mesh position={[0, -0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18]} /><meshStandardMaterial color="#11191a" metalness={0.8} roughness={0.46} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.25, 1.2, -0.6]}>
          <mesh><boxGeometry args={[0.2, 3.5, 0.24]} /><meshStandardMaterial color="#35474f" metalness={0.88} roughness={0.3} /></mesh>
          <mesh position={[0, 1.56, 0.16]}><boxGeometry args={[1.4, 0.12, 0.2]} /><meshStandardMaterial color="#536a75" metalness={0.9} roughness={0.25} /></mesh>
        </group>
      ))}
      <mesh position={[0, -0.055, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.65, 1.08, 1]}>
        <circleGeometry args={[1.38, 64]} /><meshStandardMaterial color="#514232" roughness={1} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        const pts: P3[] = [[Math.cos(a) * 0.22, -0.025, Math.sin(a) * 0.18], [Math.cos(a + 0.12) * 0.62, -0.03, Math.sin(a + 0.12) * 0.52], [Math.cos(a - 0.08) * 1.12, -0.035, Math.sin(a - 0.08) * 0.78]];
        return <mesh key={i}><tubeGeometry args={[path(pts), 16, 0.009, 5, false]} /><meshStandardMaterial color="#211c18" /></mesh>;
      })}
      {Array.from({ length: 24 }, (_, i) => {
        const a = i * 2.399963;
        const r = 1.9 + ((i * 13) % 29) / 10;
        return <mesh key={i} position={[Math.cos(a) * r, -0.02, Math.sin(a) * r]}>
          <dodecahedronGeometry args={[0.035 + (i % 4) * 0.012, 0]} />
          <meshStandardMaterial color="#4b4c44" metalness={0.52} roughness={0.9} />
        </mesh>;
      })}
      {Array.from({ length: 36 }, (_, i) => {
        const x = ((((i * 37) % 97) / 97) - 0.5) * 12;
        const y = 0.45 + ((i * 17) % 47) / 16 + Math.sin(frame / 38 + i) * 0.08;
        const z = ((((i * 23) % 83) / 83) - 0.5) * 11;
        return <mesh key={i} position={[x + Math.sin(frame / 46 + i) * 0.05, y, z]}>
          <sphereGeometry args={[0.008 + (i % 4) * 0.002, 5, 5]} />
          <meshBasicMaterial color="#d1dacf" transparent opacity={0.14} />
        </mesh>;
      })}
    </>
  );
};

const Seed: FC<{ frame: number }> = ({ frame }) => {
  const opening = smooth(frame, 246, 365);
  const ignition = smooth(frame, 232, 282);
  const y = interpolate(frame, [0, 330, 395], [1.3, 1.23, 0.68], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const a = frame / 58;
  const b = -frame / 82;
  return (
    <group position={[0, y + Math.sin(frame / 18) * 0.018 * (1 - opening), 0]} rotation={[0.05 * Math.sin(frame / 48), frame / 410, 0.04 * Math.sin(frame / 35)]}>
      <mesh scale={[0.78, 0.96, 0.68]}>
        <sphereGeometry args={[0.82, 64, 48]} />
        <meshPhysicalMaterial color="#28373e" metalness={0.95} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, a, 0.22]}>
        <torusGeometry args={[0.99, 0.032, 14, 120]} />
        <meshPhysicalMaterial color="#c17a4d" metalness={0.98} roughness={0.19} />
      </mesh>
      <mesh rotation={[0.78, 0.25, b]}>
        <torusGeometry args={[1.13, 0.019, 10, 120]} />
        <meshStandardMaterial color="#d9c6a5" metalness={0.98} roughness={0.19} />
      </mesh>
      <mesh rotation={[0.12, frame / 105, Math.PI / 2.2]}>
        <torusGeometry args={[0.68, 0.024, 10, 100]} />
        <meshPhysicalMaterial color="#8b9ba0" metalness={0.97} roughness={0.18} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const spread = opening * (0.56 + (i % 2) * 0.08);
        const tilt = opening * (i % 2 ? -0.42 : 0.48);
        return <group key={i} position={[Math.sin(angle) * spread, opening * 0.16 * (i % 2 ? 1 : -1), Math.cos(angle) * spread]} rotation={[Math.sin(angle) * tilt, angle, Math.cos(angle) * tilt]}>
          <mesh>
            <sphereGeometry args={[0.96, 40, 32, 0, Math.PI / 4 - 0.026, 0.22, 2.48]} />
            <meshPhysicalMaterial color={i % 2 ? "#bd7950" : "#a75d3c"} metalness={0.92} roughness={0.23} clearcoat={1} clearcoatRoughness={0.12} side={DoubleSide} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.922, 32, 26, 0, Math.PI / 4 - 0.026, 0.3, 2.3]} />
            <meshStandardMaterial color="#586970" metalness={0.96} roughness={0.3} side={DoubleSide} />
          </mesh>
          {[0.62, 1.14, 1.72, 2.22].map((theta, j) => <mesh key={j} position={[0.946 * Math.sin(theta) * Math.cos(Math.PI / 8), 0.946 * Math.cos(theta), 0.946 * Math.sin(theta) * Math.sin(Math.PI / 8)]}>
            <sphereGeometry args={[0.026, 12, 10]} /><meshPhysicalMaterial color="#e1bd8a" metalness={0.96} roughness={0.2} />
          </mesh>)}
          <mesh position={[0.72, -0.05, 0.14]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 20]} /><meshStandardMaterial color="#4c5a61" metalness={0.98} roughness={0.24} />
          </mesh>
          <mesh position={[0.72, -0.05, 0.2]}><sphereGeometry args={[0.035, 14, 12]} /><meshStandardMaterial color="#e3ad70" metalness={0.94} roughness={0.19} /></mesh>
        </group>;
      })}
      <mesh position={[0, 0, 0.36]}>
        <sphereGeometry args={[0.61, 48, 36]} />
        <meshPhysicalMaterial color="#97a9a7" roughness={0.08} transmission={0.84} thickness={0.26} transparent opacity={0.38} ior={1.34} side={DoubleSide} />
      </mesh>
      <mesh scale={[0.44, 0.5, 0.44]}>
        <sphereGeometry args={[0.68, 64, 48]} />
        <meshPhysicalMaterial color="#ffb044" roughness={0.18} metalness={0.12} clearcoat={1} emissive="#ff8d29" emissiveIntensity={0.32 + ignition * (1.8 + 0.5 * Math.sin(frame / 5))} />
      </mesh>
      <mesh rotation={[0.4, a, 0.2]}><torusGeometry args={[0.54, 0.012, 8, 90]} /><meshBasicMaterial color="#ffd58b" transparent opacity={0.9} /></mesh>
      <mesh rotation={[1.2, b, 0.8]}><torusGeometry args={[0.46, 0.009, 8, 90]} /><meshBasicMaterial color="#f8c77a" transparent opacity={0.72} /></mesh>
      {Array.from({ length: 8 }, (_, i) => <group key={i} position={[0, 0, 0.46]} rotation={[0, 0, i * Math.PI / 4 + opening * (i % 2 ? 0.22 : -0.22)]}>
        <mesh geometry={bladeGeometry}><meshPhysicalMaterial color={i % 2 ? "#798b90" : "#c5a079"} metalness={0.94} roughness={0.2} clearcoat={0.85} side={DoubleSide} /></mesh>
        <mesh position={[0.57, 0.13, 0.09]}><sphereGeometry args={[0.031, 12, 10]} /><meshStandardMaterial color="#f1cb91" metalness={0.98} roughness={0.17} /></mesh>
      </group>)}
      <pointLight position={[0, 0.1, 0.25]} color="#ff9d35" intensity={4 + ignition * 86} distance={7} />
      <pointLight position={[0, -0.2, -0.8]} color="#cf7a37" intensity={ignition * 18} distance={4} />
    </group>
  );
};

const Plant: FC<{ frame: number }> = ({ frame }) => {
  const growth = smooth(frame, 354, 474);
  const bloom = smooth(frame, 391, 478);
  const sway = Math.sin(frame / 22) * 0.045;
  const stems: { points: P3[]; radius: number }[] = [
    { points: [[0, -0.25, 0], [-0.08, 0.48, 0.02], [0.08, 1.12, -0.04], [0.02, 2.05, 0]], radius: 0.052 },
    { points: [[0.02, 0.64, 0], [-0.52, 0.98, 0.02], [-0.88, 1.55, -0.12], [-1.14, 1.72, -0.16]], radius: 0.032 },
    { points: [[0.03, 0.94, 0], [0.5, 1.22, 0.05], [0.82, 1.78, 0.08], [1.08, 1.92, 0.1]], radius: 0.03 },
    { points: [[0.04, 1.25, 0], [-0.34, 1.64, 0.08], [-0.48, 2.05, 0.06]], radius: 0.022 },
    { points: [[0.05, 1.45, 0], [0.4, 1.82, -0.03], [0.52, 2.16, -0.1]], radius: 0.022 },
  ];
  const roots: P3[][] = [
    [[0, 0.02, 0], [-0.35, -0.12, 0.2], [-0.86, -0.17, 0.36], [-1.42, -0.2, 0.28]],
    [[0, 0.02, 0], [0.34, -0.1, -0.14], [0.88, -0.17, -0.38], [1.4, -0.2, -0.25]],
    [[0, 0.02, 0], [0.04, -0.18, 0.35], [-0.1, -0.22, 0.86], [-0.36, -0.24, 1.34]],
    [[0, 0.02, 0], [-0.12, -0.16, -0.3], [-0.42, -0.21, -0.78], [-0.64, -0.24, -1.2]],
  ];
  return (
    <group position={[0, 0.04, 0]} scale={[1, growth, 1]}>
      {roots.map((pts, i) => <mesh key={i}><tubeGeometry args={[path(pts), 34, 0.025 - i * 0.002, 8, false]} /><meshStandardMaterial color="#a98257" roughness={0.7} /></mesh>)}
      {stems.map((stem, i) => <group key={i} rotation={[0, 0, i === 0 ? sway * 0.2 : sway * (i % 2 ? 1 : -1)]}>
        <mesh><tubeGeometry args={[path(stem.points), 52, stem.radius, 10, false]} /><meshPhysicalMaterial color="#376e66" roughness={0.28} metalness={0.1} clearcoat={0.7} /></mesh>
        <mesh><tubeGeometry args={[path(stem.points.map(([x, y, z]) => [x, y, z + stem.radius * 0.55])), 52, 0.008, 6, false]} /><meshBasicMaterial color="#ffc36b" transparent opacity={0.72} /></mesh>
      </group>)}
      {Array.from({ length: 7 }, (_, i) => {
        const angle = i * 2.399963;
        const side = i % 2 ? -1 : 1;
        const y = 0.45 + (i % 3) * 0.38;
        return <group key={i} position={[Math.cos(angle) * 0.14 + side * 0.19, y, Math.sin(angle) * 0.12]} rotation={[0.2, 0, side * 0.46]}>
          <mesh scale={[0.2, 0.38, 0.055]}><sphereGeometry args={[1, 32, 24]} /><meshPhysicalMaterial color={i % 2 ? "#67b59d" : "#92c9a4"} roughness={0.28} clearcoat={0.8} /></mesh>
          <mesh position={[0, 0, 0.056]}><tubeGeometry args={[path([[0, -0.28, 0], [0.035, 0, 0], [0, 0.28, 0]]), 18, 0.008, 6, false]} /><meshBasicMaterial color="#e8d18b" transparent opacity={0.72} /></mesh>
        </group>;
      })}
      <group position={[0.02 + sway * 0.35, 2.04, 0]} rotation={[0.03, frame / 150, sway * 0.15]}>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const reveal = bloom * (0.88 + 0.12 * Math.sin(frame / 17 + i));
          const radius = 0.08 + bloom * 0.13;
          return <group key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle + Math.PI / 2]} scale={[reveal, reveal, reveal]}>
            <mesh position={[0, 0.37, 0]} scale={[0.22, 0.52, 0.065]}>
              <sphereGeometry args={[1, 36, 28]} />
              <meshPhysicalMaterial color={i % 3 === 0 ? "#f1bba0" : i % 3 === 1 ? "#d9a8bf" : "#a8d9c8"} roughness={0.18} metalness={0.04} transmission={0.25} thickness={0.16} transparent opacity={0.92} clearcoat={1} emissive="#2b7864" emissiveIntensity={0.5} side={DoubleSide} />
            </mesh>
            <mesh position={[0, 0.37, 0.075]}><tubeGeometry args={[path([[0, 0.04, 0], [0.012, 0.27, 0], [0, 0.55, 0]]), 22, 0.008, 6, false]} /><meshBasicMaterial color="#ffe0a0" transparent opacity={0.82} /></mesh>
          </group>;
        })}
        <mesh><sphereGeometry args={[0.22, 36, 28]} /><meshPhysicalMaterial color="#ffc45e" emissive="#ffac3b" emissiveIntensity={2.4} roughness={0.2} metalness={0.15} /></mesh>
        <pointLight position={[0, 0.2, 0.3]} color="#ffb35b" intensity={bloom * 66} distance={8} />
      </group>
    </group>
  );
};

const World: FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Station />
      <Plant frame={frame} />
      <Seed frame={frame} />
      <pointLight position={[0, 1.2, 0.3]} color="#f6a94e" intensity={smooth(frame, 456, 600) * 9} distance={8} />
    </>
  );
};

export const OrbitalBloom3D: FC<OrbitalBloomProps> = ({ durationInFrames = 600 }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const frames = [0, 120, 240, 360, 480, durationInFrames];
  const x = interpolate(frame, frames, [5.8, 2.2, 1.42, -0.75, 0, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const y = interpolate(frame, frames, [3.5, 1.85, 0.62, 0.92, 3.5, 3.8], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const z = interpolate(frame, frames, [10.8, 5.8, 3.65, 4.2, 15.2, 16.4], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const targetY = interpolate(frame, frames, [1.15, 1.18, 1.08, 1.12, 1.28, 1.35], clamp);
  const pitch = Math.atan2(targetY - y, Math.hypot(x, z));
  const yaw = Math.atan2(x, z);
  const titleOpacity = interpolate(frame, [548, 575], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const titleLift = interpolate(frame, [548, 580], [18, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#03070b", color: "#f5ead8", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <Audio src={staticFile("assets/audio/orbital-bloom.wav")} volume={0.94} />
      <ThreeCanvas width={width} height={height} camera={{ position: [x, y, z], rotation: [pitch, yaw, Math.sin(frame / 170) * 0.012], fov: 43, near: 0.1, far: 90 }} style={{ width: "100%", height: "100%" }}>
        <World />
      </ThreeCanvas>
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 46%, transparent 36%, rgba(1,4,7,.54) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderTop: "42px solid rgba(0,0,0,.76)", borderBottom: "42px solid rgba(0,0,0,.76)", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "8.8%", textAlign: "center", opacity: titleOpacity, transform: `translateY(${titleLift}px)`, color: "#f1d4a0", fontSize: 36, fontWeight: 500, letterSpacing: 13, textShadow: "0 3px 30px rgba(0,0,0,.8)", pointerEvents: "none" }}>
        ORBITAL BLOOM
      </div>
    </AbsoluteFill>
  );
};
