import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import type { FC } from "react";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
type Vector3 = [number, number, number];

type ShotPose = {
  start: number;
  end: number;
  cameraFrom: Vector3;
  cameraTo: Vector3;
  targetFrom: Vector3;
  targetTo: Vector3;
  rotationFrom: number;
  rotationTo: number;
  scaleFrom: number;
  scaleTo: number;
  explodeFrom: number;
  explodeTo: number;
  offsetXFrom: number;
  offsetXTo: number;
  background: string;
};

const shotPoses: ShotPose[] = [
  {
    start: 0, end: 90,
    cameraFrom: [2.65, 1.45, 2.55], cameraTo: [1.95, 1.24, 2.0],
    targetFrom: [1.12, 0.78, 0], targetTo: [1.12, 0.76, 0],
    rotationFrom: -0.48, rotationTo: -0.3,
    scaleFrom: 1, scaleTo: 1.03, explodeFrom: 0, explodeTo: 0,
    offsetXFrom: 0, offsetXTo: 0, background: "#090d13",
  },
  {
    start: 90, end: 240,
    cameraFrom: [3.45, 2.0, 5.7], cameraTo: [2.0, 1.6, 5.1],
    targetFrom: [0, 0.32, 0], targetTo: [0, 0.28, 0],
    rotationFrom: -0.5, rotationTo: 0.34,
    scaleFrom: 0.96, scaleTo: 1, explodeFrom: 0, explodeTo: 0,
    offsetXFrom: 0, offsetXTo: 0, background: "#111922",
  },
  {
    start: 240, end: 360,
    cameraFrom: [2.7, 0.7, 2.6], cameraTo: [2.15, 0.56, 1.95],
    targetFrom: [1.18, -0.12, 0], targetTo: [1.18, -0.1, 0],
    rotationFrom: 0.24, rotationTo: 0.42,
    scaleFrom: 1, scaleTo: 1.02, explodeFrom: 0, explodeTo: 0,
    offsetXFrom: 0, offsetXTo: 0, background: "#10161c",
  },
  {
    start: 360, end: 465,
    cameraFrom: [2.72, 0.74, 2.45], cameraTo: [2.4, 0.76, 2.2],
    targetFrom: [1.2, -0.1, 0], targetTo: [1.2, -0.1, 0],
    rotationFrom: 0.38, rotationTo: 0.28,
    scaleFrom: 1.02, scaleTo: 0.96, explodeFrom: 0, explodeTo: 0.92,
    offsetXFrom: 0, offsetXTo: 0, background: "#090e15",
  },
  {
    start: 465, end: 600,
    cameraFrom: [0.45, 1.0, 5.8], cameraTo: [0.12, 0.92, 6.0],
    targetFrom: [0.18, 0.3, 0], targetTo: [0.18, 0.3, 0],
    rotationFrom: 0.2, rotationTo: 0.08,
    scaleFrom: 0.99, scaleTo: 1.02, explodeFrom: 0, explodeTo: 0,
    offsetXFrom: 0.38, offsetXTo: 0.38, background: "#080c12",
  },
];

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const mixVector = (from: Vector3, to: Vector3, amount: number): Vector3 => [
  mix(from[0], to[0], amount),
  mix(from[1], to[1], amount),
  mix(from[2], to[2], amount),
];

const headbandPoints = [
  [-1.08, 0.18, 0], [-1.24, 0.48, 0], [-1.22, 0.98, 0],
  [-0.83, 1.39, 0], [0, 1.57, 0], [0.83, 1.39, 0],
  [1.22, 0.98, 0], [1.24, 0.48, 0], [1.08, 0.18, 0],
].map(([x, y, z]) => new THREE.Vector3(x!, y!, z!));
const cushionPoints = headbandPoints.map((point) =>
  new THREE.Vector3(point.x * 0.985, point.y - 0.13, point.z + 0.045),
);
const headbandGeometry = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(headbandPoints), 112, 0.078, 16, false,
);
const cushionGeometry = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(cushionPoints), 112, 0.056, 12, false,
);

const Earcup: FC<{ side: -1 | 1; explode: number }> = ({ side, explode }) => {
  const outward = side;
  const outerShift = outward * (0.28 + explode * 0.43);
  const trimShift = outward * (0.34 + explode * 0.52);
  const driverShift = outward * (0.2 + explode * 0.72);
  const faceRotation: [number, number, number] = [0, side * Math.PI / 2, 0];

  return (
    <group position={[side * 1.17, -0.16, 0]} rotation={[0, 0, side * 0.035]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.47, 0.49, 0.48, 72, 1, false]} />
        <meshPhysicalMaterial color="#222b33" metalness={0.52} roughness={0.34} clearcoat={0.72} clearcoatRoughness={0.24} />
      </mesh>

      <mesh position={[side * -0.2, 0, 0]} rotation={faceRotation}>
        <torusGeometry args={[0.405, 0.085, 18, 72]} />
        <meshStandardMaterial color="#11161c" metalness={0.08} roughness={0.88} />
      </mesh>

      <mesh position={[outerShift, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.435, 0.435, 0.075, 72, 1, false]} />
        <meshPhysicalMaterial color="#384650" metalness={0.84} roughness={0.25} clearcoat={1} clearcoatRoughness={0.16} />
      </mesh>

      <mesh position={[trimShift, 0, 0]} rotation={faceRotation}>
        <torusGeometry args={[0.402, 0.022, 12, 88]} />
        <meshStandardMaterial color="#b7c3c9" metalness={0.96} roughness={0.18} />
      </mesh>

      <mesh position={[driverShift, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.285, 0.285, 0.045, 64]} />
        <meshPhysicalMaterial color="#111b23" metalness={0.62} roughness={0.28} clearcoat={0.9} />
      </mesh>

      <mesh position={[driverShift + side * 0.027, 0, 0]} rotation={faceRotation}>
        <torusGeometry args={[0.235, 0.012, 8, 64]} />
        <meshStandardMaterial color="#8bd6d2" metalness={0.72} roughness={0.2} emissive="#164447" emissiveIntensity={0.22} />
      </mesh>

      {Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[
              driverShift + side * 0.055,
              Math.sin(angle) * 0.185,
              Math.cos(angle) * 0.185,
            ]}
          >
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshStandardMaterial color="#8e9ca4" metalness={0.35} roughness={0.42} />
          </mesh>
        );
      })}

      <mesh position={[side * 0.02, -0.06, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.045, 24]} />
        <meshStandardMaterial color="#a9b7bf" metalness={0.84} roughness={0.22} />
      </mesh>
      <mesh position={[side * 0.02, -0.06, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.012, 20]} />
        <meshStandardMaterial color="#101820" metalness={0.45} roughness={0.34} />
      </mesh>

      <mesh position={[side * 0.02, 0.34, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.34, 0.14]} />
        <meshStandardMaterial color="#697984" metalness={0.88} roughness={0.28} />
      </mesh>
    </group>
  );
};

const HeadphoneModel: FC<{
  frame: number;
  rotationY: number;
  scale: number;
  explode: number;
  offsetX: number;
}> = ({ frame, rotationY, scale, explode, offsetX }) => {
  const lightSweep = Math.sin(frame / 38) * 0.1;

  return (
    <group position={[offsetX, -0.03, 0]} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={headbandGeometry}>
        <meshPhysicalMaterial color="#56636b" metalness={0.94} roughness={0.22} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh geometry={cushionGeometry}>
        <meshStandardMaterial color="#171d22" metalness={0.06} roughness={0.92} />
      </mesh>

      <mesh position={[0, 1.52, 0.018]} scale={[0.48, 0.035, 0.09]}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshPhysicalMaterial color="#7b898f" metalness={0.78} roughness={0.3} />
      </mesh>

      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * 1.12, 0.27, 0]} rotation={[0, 0, side * 0.05]}>
            <cylinderGeometry args={[0.052, 0.052, 0.48, 20]} />
            <meshStandardMaterial color="#a9b8c0" metalness={0.93} roughness={0.2} />
          </mesh>
          <mesh position={[side * 1.13, 0.48, 0]} rotation={[0, 0, side * 0.08]}>
            <boxGeometry args={[0.18, 0.13, 0.16]} />
            <meshStandardMaterial color="#29343c" metalness={0.72} roughness={0.28} />
          </mesh>
          <Earcup side={side} explode={explode} />
        </group>
      ))}

      <pointLight position={[2.1, 1.5, 1.4]} intensity={0.35 + lightSweep * 0.2} color="#a9f0eb" distance={5} />
    </group>
  );
};

const StudioEnvironment: FC<{ frame: number; background: string }> = ({ frame, background }) => {
  const sweep = Math.sin(frame / 46) * 2.2;
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 8, 19]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#dce8ee", "#141b22", 0.75]} />
      <directionalLight position={[-4, 5, 5]} intensity={2.7} color="#e6f0f4" />
      <spotLight position={[4 + sweep, 5, 3]} angle={0.44} penumbra={0.82} intensity={92} color="#b8e9e5" distance={15} />
      <spotLight position={[-4, 2.5, -2]} angle={0.62} penumbra={0.9} intensity={55} color="#d59b72" distance={14} />
      <pointLight position={[0, 3.8, 3]} intensity={18} color="#f5e6d2" distance={12} />
      <mesh position={[0, -1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#10171e" metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.6, -3.7]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#111922" metalness={0.12} roughness={0.78} />
      </mesh>
      <mesh position={[0, -1.205, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.15, 2.17, 96]} />
        <meshBasicMaterial color="#9acdc9" transparent opacity={0.12} />
      </mesh>
    </>
  );
};

const ShotCopy: FC<{
  frame: number;
  start: number;
  end: number;
  kicker: string;
  title: string;
  side?: "left" | "right";
  top?: string;
}> = ({ frame, start, end, kicker, title, side = "left", top = "auto" }) => {
  const opacity = interpolate(frame, [start, start + 12, end - 12, end], [0, 1, 1, 0], clamp);
  const rise = interpolate(frame, [start, start + 22], [18, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        top,
        bottom: top === "auto" ? "13%" : "auto",
        left: side === "left" ? "8%" : "auto",
        right: side === "right" ? "8%" : "auto",
        width: "34%",
        opacity,
        transform: "translateY(" + rise + "px)",
        textAlign: side,
        color: "#f3f0e9",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ color: "#9ddbd5", fontSize: 15, fontWeight: 700, letterSpacing: "0.25em", marginBottom: 18 }}>
        {kicker}
      </div>
      <div style={{ fontSize: 46, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-0.045em", whiteSpace: "pre-line", textShadow: "0 8px 32px rgba(0,0,0,.38)" }}>
        {title}
      </div>
      <div style={{ width: 56, height: 2, background: "#a4d8d1", marginTop: 22, marginLeft: side === "right" ? "auto" : 0 }} />
    </div>
  );
};

const FinalLockup: FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [476, 500, 600], [0, 1, 1], clamp);
  const rise = interpolate(frame, [476, 515], [20, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: "8%",
        bottom: "15%",
        opacity,
        transform: "translateY(" + rise + "px)",
        color: "#f1eee7",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ color: "#9ddbd5", fontSize: 17, fontWeight: 700, letterSpacing: "0.52em", marginBottom: 18 }}>
        A U R A
      </div>
      <div style={{ fontSize: 64, lineHeight: 0.94, fontWeight: 800, letterSpacing: "-0.055em" }}>
        SOUND,<br />SHAPED AROUND YOU.
      </div>
      <div style={{ color: "#c3cbd0", fontSize: 15, letterSpacing: "0.18em", marginTop: 22 }}>
        A STUDY IN FORM AND FEEL.
      </div>
    </div>
  );
};

export const AcousticProductFilm: FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = shotPoses.find((item) => frame >= item.start && frame <= item.end) ?? shotPoses[shotPoses.length - 1]!;
  const rawProgress = interpolate(frame, [shot.start, shot.end], [0, 1], clamp);
  const progress = Easing.inOut(Easing.cubic)(rawProgress);
  const cameraPosition = mixVector(shot.cameraFrom, shot.cameraTo, progress);
  const target = mixVector(shot.targetFrom, shot.targetTo, progress);
  const horizontalDistance = Math.hypot(cameraPosition[0] - target[0], cameraPosition[2] - target[2]);
  const cameraYaw = Math.atan2(cameraPosition[0] - target[0], cameraPosition[2] - target[2]);
  const cameraPitch = -Math.atan2(cameraPosition[1] - target[1], horizontalDistance);
  const rotationY = mix(shot.rotationFrom, shot.rotationTo, progress);
  const modelScale = mix(shot.scaleFrom, shot.scaleTo, progress);
  const explode = mix(shot.explodeFrom, shot.explodeTo, progress);
  const offsetX = mix(shot.offsetXFrom, shot.offsetXTo, progress);

  return (
    <AbsoluteFill style={{ backgroundColor: "#080c12", color: "#f3f0e9", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={staticFile("assets/audio/score.wav")} volume={0.48} />
      <Sequence from={8} durationInFrames={54}>
        <Audio src={staticFile("assets/audio/metal-brush.wav")} volume={0.58} />
      </Sequence>
      <Sequence from={264} durationInFrames={24}>
        <Audio src={staticFile("assets/audio/control-click.wav")} volume={0.66} />
      </Sequence>
      <Sequence from={476} durationInFrames={36}>
        <Audio src={staticFile("assets/audio/hero-impact.wav")} volume={0.42} />
      </Sequence>

      <ThreeCanvas
        width={width}
        height={height}
        camera={{
          position: cameraPosition,
          rotation: [cameraPitch, cameraYaw, 0],
          fov: 36,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <StudioEnvironment frame={frame} background={shot.background} />
        <HeadphoneModel
          frame={frame}
          rotationY={rotationY}
          scale={modelScale}
          explode={explode}
          offsetX={offsetX}
        />
      </ThreeCanvas>

      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,.34) 100%)" }}>
        <ShotCopy frame={frame} start={0} end={90} kicker="01 / MATERIAL STUDY" title={"A QUIETER KIND\nOF PRESENCE."} />
        <ShotCopy frame={frame} start={90} end={240} kicker="02 / FORM REVEAL" title={"FORM, WITH\nINTENTION."} side="left" top="16%" />
        <ShotCopy frame={frame} start={240} end={360} kicker="03 / THE INTERFACE" title={"EVERY DETAIL\nHAS A PURPOSE."} side="left" />
        <ShotCopy frame={frame} start={360} end={465} kicker="04 / INSIDE THE FORM" title={"BUILT FROM\nTHE INSIDE OUT."} side="right" top="17%" />
        <FinalLockup frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
