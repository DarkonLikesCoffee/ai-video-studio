import { ThreeCanvas } from "@remotion/three";
import type { FC } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useThree } from "@react-three/fiber";
import { BackSide, Vector3 } from "three";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const smooth = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const point = (angle: number, radius: number, y: number): [number, number, number] =>
  [Math.cos(angle) * radius, y, Math.sin(angle) * radius];

const CameraRig: FC<{ position: Vector3; target: Vector3 }> = ({ position, target }) => {
  const camera = useThree((state) => state.camera);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
};

const Robot: FC<{ frame: number; scale?: number; repair?: number; facing?: number }> = ({
  frame, scale = 1, repair = 0, facing = 0,
}) => {
  const walk = Math.sin(frame * 0.22);
  const armReach = interpolate(repair, [0, 0.2, 0.62, 0.86, 1], [0.08, -0.35, -1.12, -0.75, 0.04], clamp);
  const toolGlow = smooth(repair, 0.53, 0.72);
  return (
    <group scale={scale} rotation={[0, facing + Math.sin(frame * 0.025) * 0.035, 0]}>
      <mesh position={[0, 0.69, 0]} castShadow>
        <capsuleGeometry args={[0.31, 0.63, 7, 14]} />
        <meshPhysicalMaterial color="#c8c1ad" metalness={0.5} roughness={0.42} clearcoat={0.55} />
      </mesh>
      <mesh position={[0, 1.31, 0.04]} castShadow>
        <boxGeometry args={[0.58, 0.43, 0.48]} />
        <meshPhysicalMaterial color="#e0d7c1" metalness={0.38} roughness={0.34} />
      </mesh>
      <mesh position={[0, 1.34, 0.292]}>
        <boxGeometry args={[0.39, 0.14, 0.035]} />
        <meshStandardMaterial color="#172c37" emissive="#dc9d52" emissiveIntensity={1.35} />
      </mesh>
      <mesh position={[0, 1.34, 0.317]}>
        <sphereGeometry args={[0.052, 16, 12]} />
        <meshBasicMaterial color="#fff0bf" />
      </mesh>
      <mesh position={[0, 1.64, 0.02]}>
        <torusGeometry args={[0.14, 0.035, 10, 24]} />
        <meshStandardMaterial color="#be995d" metalness={0.85} roughness={0.24} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.36, 0.92, 0]}>
          <mesh rotation={[0, 0, side * 0.16]}>
            <cylinderGeometry args={[0.09, 0.09, 0.4, 14]} />
            <meshStandardMaterial color="#7d8b88" metalness={0.78} roughness={0.28} />
          </mesh>
          <group position={[side * 0.015, -0.22, 0.02]} rotation={[0, 0, side === 1 ? armReach : -0.14]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.068, 0.068, 0.39, 12]} />
              <meshStandardMaterial color="#bda36e" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.4, 0.04]}>
              <sphereGeometry args={[0.09, 12, 8]} />
              <meshStandardMaterial color="#dec58d" metalness={0.8} roughness={0.22} />
            </mesh>
            <group position={[0, -0.48, 0.09]}>
              <mesh position={[-0.045, -0.045, 0]}>
                <boxGeometry args={[0.045, 0.12, 0.06]} />
                <meshStandardMaterial color="#d8bd83" metalness={0.85} />
              </mesh>
              <mesh position={[0.045, -0.045, 0]}>
                <boxGeometry args={[0.045, 0.12, 0.06]} />
                <meshStandardMaterial color="#d8bd83" metalness={0.85} />
              </mesh>
              <pointLight intensity={toolGlow * 0.8} color="#ffbf66" distance={0.8} />
            </group>
          </group>
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.18, 0.33, 0]}>
          <mesh position={[0, -0.16, 0]} rotation={[0, 0, side * walk * 0.28]}>
            <cylinderGeometry args={[0.105, 0.13, 0.35, 12]} />
            <meshStandardMaterial color="#526267" metalness={0.75} />
          </mesh>
          <mesh position={[0, -0.36, 0.08]}>
            <boxGeometry args={[0.23, 0.13, 0.36]} />
            <meshStandardMaterial color="#263c45" metalness={0.62} roughness={0.38} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Tower: FC<{ frame: number; doorOpen: number; beacon: number }> = ({ frame, doorOpen, beacon }) => {
  const lensRotation = frame * 0.034 * beacon;
  return (
    <group position={[2.6, 0, 0]}>
      <mesh position={[0, -0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.9, 0.78, 48]} />
        <meshStandardMaterial color="#35434a" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.94, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.22, 3.75, 48, 1]} />
        <meshStandardMaterial color="#858679" roughness={0.9} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, -0.55 + i * 0.42, 0.82]}>
          <boxGeometry args={[1.62 - i * 0.07, 0.035, 0.04]} />
          <meshStandardMaterial color="#c2b69c" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, -0.28, 1.045]}>
        <boxGeometry args={[0.95, 1.42, 0.07]} />
        <meshStandardMaterial color="#101c24" roughness={0.92} />
      </mesh>
      <group position={[-0.4, -0.27, 1.1]} rotation={[0, -doorOpen * 1.12, 0]}>
        <mesh position={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.78, 1.35, 0.09]} />
          <meshStandardMaterial color="#343f42" metalness={0.64} roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0.4, -0.54 + i * 0.21, 0.055]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#c6a46d" metalness={0.82} />
          </mesh>
        ))}
        <mesh position={[0.69, 0, 0.1]}>
          <torusGeometry args={[0.09, 0.022, 8, 18]} />
          <meshStandardMaterial color="#d7b876" metalness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, 4.12, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.38, 48]} />
        <meshStandardMaterial color="#253944" metalness={0.7} roughness={0.36} />
      </mesh>
      <mesh position={[0, 4.35, 0]}>
        <cylinderGeometry args={[0.96, 0.96, 0.07, 48]} />
        <meshStandardMaterial color="#c5a56e" metalness={0.8} />
      </mesh>
      <group position={[0, 4.82, 0]}>
        <mesh>
          <cylinderGeometry args={[0.84, 0.84, 1.15, 32, 1, true]} />
          <meshPhysicalMaterial color="#9fc4cf" transparent opacity={0.16} roughness={0.08} side={BackSide} />
        </mesh>
        <group rotation={[0, lensRotation, 0]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 0.46, 32]} />
            <meshStandardMaterial color="#d8b56f" emissive="#ffb45c" emissiveIntensity={beacon * 4} metalness={0.83} roughness={0.2} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
              <boxGeometry args={[0.085, 0.96, 0.085]} />
              <meshPhysicalMaterial color="#f2d49b" emissive="#ffb65d" emissiveIntensity={beacon * 2.8} metalness={0.38} roughness={0.15} />
            </mesh>
          ))}
        </group>
        <pointLight color="#ffc36e" intensity={beacon * 175} distance={28} />
      </group>
      <mesh position={[0, 5.55, 0]}>
        <coneGeometry args={[1.2, 0.52, 48]} />
        <meshStandardMaterial color="#182a32" metalness={0.75} />
      </mesh>
      <mesh position={[0, 6.0, 0]}>
        <coneGeometry args={[0.28, 0.56, 32]} />
        <meshStandardMaterial color="#a88d60" metalness={0.8} />
      </mesh>
      <pointLight position={[0, 4.85, 0]} color="#ffc274" intensity={beacon * 65} distance={14} />
      <pointLight position={[0, 0.9, 0.9]} color="#e6a75b" intensity={doorOpen * 1.5} distance={4} />
    </group>
  );
};

const Storm: FC<{ frame: number }> = ({ frame }) => {
  const rain = Array.from({ length: 240 }, (_, i) => ({
    x: ((i * 73) % 190) / 10 - 9.5,
    y: ((i * 47) % 95) / 10 - 4.7,
    z: ((i * 29) % 70) / 10 - 3.5,
    phase: i * 0.29,
  }));
  const lightning = Math.max(
    0,
    interpolate(frame, [43, 46, 51], [0, 1, 0], clamp),
    interpolate(frame, [181, 184, 188], [0, 0.92, 0], clamp),
    interpolate(frame, [338, 340, 343], [0, 0.82, 0], clamp),
  );
  return (
    <group>
      {rain.map((drop, i) => {
        const fall = (frame * 0.17 + drop.phase) % 8.8;
        return (
          <mesh key={i} position={[drop.x + fall * 0.22, drop.y - fall, drop.z]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.22, 5]} />
            <meshBasicMaterial color="#b9d3db" transparent opacity={0.32} />
          </mesh>
        );
      })}
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} position={[-9 + i * 1.1, -2.35 + Math.sin(frame * 0.08 + i) * 0.13, -2.7]} scale={[1.2, 0.15 + 0.035 * Math.sin(frame * 0.11 + i), 1]}>
          <sphereGeometry args={[1, 18, 10]} />
          <meshStandardMaterial color="#31566b" roughness={0.28} metalness={0.18} />
        </mesh>
      ))}
      <ambientLight color="#668295" intensity={0.22} />
      <directionalLight position={[-6, 8, 5]} color="#8da5b7" intensity={0.9} />
      <pointLight position={[-5, 5, -3]} color="#7aa6ba" intensity={0.55} distance={20} />
    </group>
  );
};

const Coast: FC<{ frame: number }> = ({ frame }) => (
  <group>
    <mesh position={[0, -2.68, -1.9]} receiveShadow>
      <boxGeometry args={[31, 1.12, 13]} />
      <meshStandardMaterial color="#202f36" roughness={1} />
    </mesh>
    <mesh position={[0, -3.36, -3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[45, 24]} />
      <meshStandardMaterial color="#071622" roughness={0.46} metalness={0.18} />
    </mesh>
    {Array.from({ length: 22 }, (_, i) => (
      <mesh key={i} position={[-12 + i * 1.12, -2.94 + Math.sin(frame * 0.1 + i) * 0.16, -1 - (i % 4)]} scale={[1.35, 0.24, 1]}>
        <sphereGeometry args={[1, 18, 10]} />
        <meshStandardMaterial color="#315568" roughness={0.38} transparent opacity={0.88} />
      </mesh>
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-7.8 + i * 1.85, -2.12 + Math.sin(i * 2.2) * 0.18, -3.3 - Math.sin(i * 1.4) * 0.65]} rotation={[0, 0, Math.sin(i) * 0.28]}>
        <coneGeometry args={[0.68, 1.55, 5]} />
        <meshStandardMaterial color="#26383e" roughness={1} />
      </mesh>
    ))}
  </group>
);

const SpiralStairs: FC<{ frame: number }> = ({ frame }) => (
  <group position={[2.6, 0.2, 0]}>
    <mesh>
      <cylinderGeometry args={[1.5, 1.5, 4.8, 48, 1, true]} />
      <meshStandardMaterial color="#43515a" side={BackSide} roughness={0.95} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[0.22, 0.22, 4.6, 24]} />
      <meshStandardMaterial color="#71634d" metalness={0.45} />
    </mesh>
    {Array.from({ length: 28 }, (_, i) => {
      const angle = i * 0.48 + frame * 0.002;
      return (
        <group key={i} position={point(angle, 0.92, -1.75 + i * 0.125)} rotation={[0, -angle, 0]}>
          <mesh>
            <boxGeometry args={[0.76, 0.12, 0.46]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#8b806a" : "#5b5d55"} roughness={0.9} />
          </mesh>
          <mesh position={[0.25, 0.1, 0]}>
            <boxGeometry args={[0.055, 0.3, 0.055]} />
            <meshStandardMaterial color="#b9a174" metalness={0.68} />
          </mesh>
        </group>
      );
    })}
    <pointLight position={[0, 1.8, 0]} color="#d49c5c" intensity={1.3} distance={8} />
  </group>
);

const RepairMechanism: FC<{ frame: number }> = ({ frame }) => {
  const repair = smooth(frame, 365, 438);
  const coupling = interpolate(repair, [0, 0.38, 0.62, 1], [-0.32, -0.12, 0.02, 0], clamp);
  const pin = interpolate(repair, [0, 0.46, 0.7, 1], [-0.42, -0.28, 0.01, 0], clamp);
  return (
    <group position={[2.6, 4.82, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.12, 12, 48]} />
        <meshStandardMaterial color="#8e744d" metalness={0.86} roughness={0.24} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={point((i * Math.PI) / 6, 0.79, 0)}>
          <boxGeometry args={[0.22, 0.18, 0.2]} />
          <meshStandardMaterial color="#b4945b" metalness={0.85} roughness={0.24} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.24, 36]} />
        <meshStandardMaterial color="#273f48" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[coupling, 0, 0.05]}>
        <cylinderGeometry args={[0.14, 0.14, 0.36, 24]} />
        <meshStandardMaterial color="#c59d60" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0.34 + coupling * 0.18, 0.04, 0.05]}>
        <cylinderGeometry args={[0.12, 0.12, 0.28, 24]} />
        <meshStandardMaterial color="#ad8c5d" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[pin, 0.2, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.64, 12]} />
        <meshStandardMaterial color="#e3c78e" metalness={0.93} roughness={0.17} />
      </mesh>
      <mesh position={[0, 0.88, 0.28]} rotation={[0, 0, interpolate(repair, [0, 0.48, 0.72, 1], [-0.9, -0.65, 0.12, 0.08], clamp)]}>
        <cylinderGeometry args={[0.07, 0.07, 0.62, 12]} />
        <meshStandardMaterial color="#b59b70" metalness={0.9} roughness={0.24} />
      </mesh>
      <mesh position={[0.1, 0.58, 0.35]}>
        <sphereGeometry args={[0.11, 12, 8]} />
        <meshStandardMaterial color="#d3b980" metalness={0.86} />
      </mesh>
      <pointLight position={[0, 0.2, 0.4]} color="#ffb95f" intensity={repair * 3.2} distance={2.2} />
    </group>
  );
};

const Vessel: FC<{ frame: number }> = ({ frame }) => (
  <group position={[-4.1 + Math.sin(frame * 0.025) * 0.12, -2.3 + Math.sin(frame * 0.08) * 0.045, -2.2]} rotation={[0, 0.1, Math.sin(frame * 0.06) * 0.02]} scale={0.78}>
    <mesh>
      <boxGeometry args={[1.55, 0.28, 0.48]} />
      <meshStandardMaterial color="#62767b" metalness={0.45} roughness={0.45} />
    </mesh>
    <mesh position={[0.1, 0.28, 0]}>
      <boxGeometry args={[0.62, 0.34, 0.4]} />
      <meshStandardMaterial color="#9b9b88" roughness={0.75} />
    </mesh>
    <mesh position={[0.06, 0.48, 0]}>
      <boxGeometry args={[0.055, 0.38, 0.06]} />
      <meshStandardMaterial color="#cbb783" metalness={0.75} />
    </mesh>
    <pointLight position={[0.62, 0.25, 0.25]} color="#ffbd66" intensity={1.2} distance={1.4} />
  </group>
);

const BeaconBeam: FC<{ frame: number; strength: number; wide: boolean }> = ({ frame, strength, wide }) => (
  <group position={[2.6, 4.82, 0]} rotation={[0, frame * 0.034, -Math.PI / 2]}>
    <mesh>
      <coneGeometry args={[wide ? 2.1 : 0.78, wide ? 20 : 12, 36, 1, true]} />
      <meshBasicMaterial color="#ffd58d" transparent opacity={strength * (wide ? 0.105 : 0.14)} side={BackSide} depthWrite={false} />
    </mesh>
    <pointLight color="#ffd28b" intensity={strength * (wide ? 24 : 10)} distance={wide ? 40 : 23} />
  </group>
);

const ShotScene: FC<{ frame: number; shot: number }> = ({ frame, shot }) => {
  const local = frame - shot * 120;
  const doorOpen = smooth(frame, 165, 215);
  const beacon = smooth(frame, 485, 525);
  const cameraConfigs = [
    { p: [-5.2, 2.7, 14], t: [0.5, 0.1, 0], fov: 45 },
    { p: [-1.9, -0.8, 6.2], t: [1.8, 0.15, 0], fov: 42 },
    { p: [2.9, 5.3, 5.6], t: [2.6, 0.25, 0], fov: 49 },
    { p: [2.4, 5.1, 3.3], t: [2.6, 4.82, 0], fov: 38 },
    { p: [2.2, 4.9, 6.4], t: [2.6, 4.82, 0], fov: 43 },
    { p: [-7.5, -0.2, 15], t: [0.2, 0.2, 0], fov: 47 },
  ] as const;
  const config = cameraConfigs[shot] ?? cameraConfigs[0];
  const drift = new Vector3(
    Math.sin(frame * (shot === 3 ? 0.012 : 0.017)) * (shot === 3 ? 0.06 : 0.26),
    Math.sin(frame * 0.021) * 0.09,
    Math.cos(frame * 0.016) * 0.11,
  );
  const camera = new Vector3(...config.p).add(drift);
  const target = new Vector3(...config.t);
  const lightning = Math.max(
    0,
    smooth(frame, 43, 45) * (1 - smooth(frame, 49, 51)),
    smooth(frame, 181, 184) * (1 - smooth(frame, 187, 190)),
    smooth(frame, 338, 340) * (1 - smooth(frame, 342, 345)),
  );
  return (
    <ThreeCanvas
      camera={{ position: camera.toArray(), fov: config.fov }}
      width={1920}
      height={1080}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: false }}
    >
      <CameraRig position={camera} target={target} />
      <color attach="background" args={["#071523"]} />
      <fog attach="fog" args={["#112a38", shot === 3 ? 2.2 : 9, 31]} />
      <ambientLight color="#8398a6" intensity={0.3} />
      <directionalLight
        position={[-5, 8, 6]}
        color={lightning > 0.1 ? "#eaf5fc" : "#8daabe"}
        intensity={0.85 + lightning * 2.8}
      />
      <pointLight position={[2.6, 4.8, 0]} color="#f8b865" intensity={beacon * 55 + doorOpen * 1.2} distance={28} />
      <Storm frame={frame} />
      <Coast frame={frame} />
      {shot !== 2 && <Tower frame={frame} doorOpen={shot === 1 ? doorOpen : 0} beacon={shot >= 4 ? beacon : 0} />}
      {shot === 0 && <Robot frame={frame} scale={0.43} />}
      {shot === 1 && (
        <>
          <Robot frame={frame} scale={0.75} />
          <group position={[2.6, -2.0, 1.85]}>
            {Array.from({ length: 5 }, (_, i) => (
              <mesh key={i} position={[0, 0.22 + i * 0.15, i * 0.31]}>
                <boxGeometry args={[1.9 - i * 0.12, 0.13, 0.48]} />
                <meshStandardMaterial color="#626761" roughness={0.93} />
              </mesh>
            ))}
          </group>
        </>
      )}
      {shot === 2 && (
        <>
          <SpiralStairs frame={frame} />
          <group position={[3.3, 0.02 + smooth(local, 12, 110) * 0.55, 0.08]}>
            <Robot frame={frame} scale={0.42} facing={-0.3} />
          </group>
        </>
      )}
      {shot === 3 && <RepairMechanism frame={frame} />}
      {shot === 4 && (
        <>
          <Robot frame={frame} scale={0.64} facing={Math.PI / 2} />
          <BeaconBeam frame={frame} strength={beacon} wide={false} />
        </>
      )}
      {shot === 5 && (
        <>
          <Vessel frame={frame} />
          <BeaconBeam frame={frame} strength={beacon} wide />
        </>
      )}
    </ThreeCanvas>
  );
};

export const LighthouseRepairFilm: FC = () => {
  const frame = useCurrentFrame();
  const shot = Math.min(5, Math.floor(frame / 120));
  const fadeIn = interpolate(frame, [0, 20], [0, 1], clamp);
  const fadeOut = interpolate(frame, [702, 720], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#071523", opacity: fadeIn * fadeOut }}>
      <ShotScene frame={frame} shot={shot} />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 48%, rgba(1,7,13,.56) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(3,12,20,.08), transparent 24%, transparent 72%, rgba(2,9,15,.35))",
        }}
      />
      <Audio src={staticFile("assets/audio/stormlight-score.wav")} volume={0.62} />
      <Audio src={staticFile("assets/audio/stormlight-atmosphere.wav")} volume={0.5} />
    </AbsoluteFill>
  );
};
