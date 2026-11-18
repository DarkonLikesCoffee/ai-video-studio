import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import type { FC } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackSide } from "three";
import type { SubtitleCue } from "../project";

export type NarratedSkyExplainerProps = {
  title: string;
  durationInFrames: number;
  narrationAudioSrc: string;
  musicAudioSrc: string;
  transitionAudioSrc: string;
  subtitleCues: SubtitleCue[];
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const StarField: FC = () => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 80 }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = 5.2 + ((index * 17) % 37) / 10;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle * 1.31) * 3.1,
      z: -2.5 - ((index * 11) % 23) / 10,
      size: 0.012 + ((index * 7) % 7) / 1000,
      phase: index * 0.71,
    };
  });
  return (
    <group>
      {stars.map((star, index) => (
        <mesh key={index} position={[star.x, star.y, star.z]}>
          <sphereGeometry args={[star.size, 5, 5]} />
          <meshBasicMaterial
            color={index % 6 === 0 ? "#b9e8ff" : "#dce8ff"}
            transparent
            opacity={0.4 + 0.35 * (0.5 + 0.5 * Math.sin(frame / 19 + star.phase))}
          />
        </mesh>
      ))}
    </group>
  );
};

const SolarSystemShot: FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 16) * 0.025;
  const rotation = frame / 180;
  return (
    <>
      <color attach="background" args={["#050c19"]} />
      <fog attach="fog" args={["#050c19", 10, 24]} />
      <ambientLight intensity={0.58} />
      <directionalLight position={[4, 6, 8]} intensity={1.7} color="#e8f3ff" />
      <StarField />
      <group position={[-2.65, 0.62, 0]}>
        <mesh scale={pulse}>
          <sphereGeometry args={[0.72, 64, 48]} />
          <meshStandardMaterial color="#fff1bf" emissive="#ffac3d" emissiveIntensity={2.4} roughness={0.35} />
        </mesh>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[0.35 + index * 0.48, rotation * (index % 2 ? -1 : 1), 0]}>
            <torusGeometry args={[0.98 + index * 0.22, 0.012, 8, 96]} />
            <meshBasicMaterial color={index === 1 ? "#ffe9a8" : "#f6b85c"} transparent opacity={0.42 - index * 0.08} />
          </mesh>
        ))}
        <pointLight color="#ffd17d" intensity={88} distance={18} />
      </group>
      <group position={[2.35, -0.35, -0.3]} rotation={[0.14, rotation, -0.12]}>
        <mesh>
          <sphereGeometry args={[1.05, 64, 48]} />
          <meshStandardMaterial color="#16446f" roughness={0.92} metalness={0.08} />
        </mesh>
        <mesh scale={1.045}>
          <sphereGeometry args={[1.05, 64, 48]} />
          <meshBasicMaterial color="#5cb9ff" transparent opacity={0.23} side={BackSide} />
        </mesh>
        <mesh position={[-0.2, 0.62, 0.66]} rotation={[0.2, 0.3, -0.6]} scale={[0.55, 0.16, 0.05]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#4c926d" roughness={1} />
        </mesh>
        <mesh position={[0.47, -0.12, 0.82]} rotation={[0.5, -0.3, 0.5]} scale={[0.38, 0.12, 0.04]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#4c926d" roughness={1} />
        </mesh>
        <pointLight position={[0, 0, 2]} color="#8bcfff" intensity={5} distance={5} />
      </group>
      <mesh position={[-0.05, 0.55, -0.4]} rotation={[0, 0, -0.07]}>
        <boxGeometry args={[4.9, 0.035, 0.035]} />
        <meshBasicMaterial color="#ffe7a7" transparent opacity={0.76} />
      </mesh>
    </>
  );
};

const MoleculeMacroShot: FC = () => {
  const frame = useCurrentFrame();
  const atoms = Array.from({ length: 17 }, (_, index) => {
    const angle = index * 2.399963229728653 + frame / 70;
    const radius = 0.9 + (index % 4) * 0.29;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle * 1.8) * (0.32 + (index % 3) * 0.2),
      z: Math.sin(angle) * radius * 0.42,
    };
  });
  return (
    <>
      <color attach="background" args={["#03121f"]} />
      <fog attach="fog" args={["#03121f", 5, 16]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 2, 4]} color="#65d7f5" intensity={48} />
      <pointLight position={[-3, -1, -2]} color="#2a85ff" intensity={18} />
      <mesh>
        <icosahedronGeometry args={[0.58, 2]} />
        <meshPhysicalMaterial color="#79d6ee" metalness={0.28} roughness={0.16} clearcoat={1} emissive="#155c86" emissiveIntensity={0.4} />
      </mesh>
      {atoms.map((atom, index) => (
        <group key={index} position={[atom.x, atom.y, atom.z]}>
          <mesh>
            <sphereGeometry args={[index % 4 === 0 ? 0.105 : 0.064, 20, 16]} />
            <meshStandardMaterial color={index % 4 === 0 ? "#b2e8fa" : "#78bce2"} emissive="#164a70" emissiveIntensity={0.45} />
          </mesh>
          <mesh rotation={[0, 0, Math.atan2(atom.y, atom.x)]}>
            <torusGeometry args={[0.15, 0.009, 6, 24]} />
            <meshBasicMaterial color="#8bdef5" transparent opacity={0.42} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[Math.PI / 2 + index * 0.35, index * 0.8, frame / 110]}>
          <torusGeometry args={[1.75 + index * 0.35, 0.009, 8, 120]} />
          <meshBasicMaterial color={index === 1 ? "#69c8ff" : "#91dff2"} transparent opacity={0.35} />
        </mesh>
      ))}
    </>
  );
};

const WavelengthShot: FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <color attach="background" args={["#09101e"]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 0, 4]} color="#72baff" intensity={26} />
      {[0, 1].map((band) => {
        const color = band === 0 ? "#55aaff" : "#ff806d";
        const y = band === 0 ? 0.95 : -0.95;
        const frequency = band === 0 ? 1.05 : 0.54;
        return (
          <group key={band} position={[0, y, 0]}>
            {Array.from({ length: 42 }, (_, index) => {
              const x = -3.4 + index * 0.165;
              const phase = (x + frame * 0.045) * frequency;
              const z = Math.sin(phase) * (band === 0 ? 0.34 : 0.25);
              return (
                <mesh key={index} position={[x, z, 0]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshBasicMaterial color={color} />
                </mesh>
              );
            })}
            <mesh position={[0, 0, -0.16]}>
              <boxGeometry args={[7.1, 0.012, 0.012]} />
              <meshBasicMaterial color={color} transparent opacity={0.38} />
            </mesh>
          </group>
        );
      })}
      <mesh>
        <sphereGeometry args={[0.38, 32, 24]} />
        <meshPhysicalMaterial color="#b3e6ff" metalness={0.16} roughness={0.12} clearcoat={1} emissive="#226b9a" emissiveIntensity={0.9} />
      </mesh>
    </>
  );
};

const ScatteringShot: FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <color attach="background" args={["#06182a"]} />
      <fog attach="fog" args={["#06182a", 6, 19]} />
      <ambientLight intensity={0.58} />
      <pointLight position={[0, 1, 2]} color="#49aaff" intensity={24} />
      {Array.from({ length: 92 }, (_, index) => {
        const angle = index * 2.399963229728653;
        const radius = 0.5 + ((index * 13) % 29) / 10;
        const drift = frame * (index % 2 === 0 ? 0.003 : -0.002);
        const x = Math.cos(angle + drift) * radius;
        const y = Math.sin(angle * 1.27 + drift) * radius * 0.66;
        const z = Math.sin(angle) * 1.1 - 0.3;
        const size = 0.018 + (index % 5) * 0.009;
        const pulse = 0.75 + 0.25 * Math.sin(frame / 17 + index);
        return (
          <mesh key={index} position={[x, y, z]} scale={pulse}>
            <sphereGeometry args={[size, 7, 7]} />
            <meshBasicMaterial color={index % 5 === 0 ? "#e2f5ff" : "#55b6ff"} transparent opacity={0.56 + (index % 3) * 0.12} />
          </mesh>
        );
      })}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, index) => (
        <mesh key={index} position={[x * Math.cos(frame / 90), x * 0.22, -0.4]} rotation={[0, 0, x * 0.13]}>
          <boxGeometry args={[3.2, 0.018, 0.018]} />
          <meshBasicMaterial color="#71c8ff" transparent opacity={0.12 + 0.14 * (0.5 + 0.5 * Math.sin(frame / 12 + index))} />
        </mesh>
      ))}
      <mesh scale={2.8}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#2384d3" transparent opacity={0.055} side={BackSide} />
      </mesh>
    </>
  );
};

const HorizonShot: FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 120], [-0.5, 0.2], clamp);
  return (
    <>
      <color attach="background" args={["#0c4e83"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 8]} intensity={2.4} color="#eaf7ff" />
      <mesh position={[0, -1.45, -1]}>
        <planeGeometry args={[30, 18]} />
        <meshBasicMaterial color="#064574" />
      </mesh>
      <mesh position={[0, rise, -0.45]}>
        <sphereGeometry args={[1.0, 48, 32]} />
        <meshBasicMaterial color="#bfe8ff" />
      </mesh>
      <mesh position={[0, rise, -0.52]} scale={[1.2, 0.4, 0.7]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#67bfff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -0.2, -0.2]}>
        <torusGeometry args={[1.45, 0.026, 10, 128]} />
        <meshBasicMaterial color="#c6edff" transparent opacity={0.72} />
      </mesh>
      <pointLight position={[0, 1.2, 1]} color="#8dcfff" intensity={55} distance={13} />
    </>
  );
};

const ChapterOverlay: FC<{ frame: number; phase: number }> = ({ frame, phase }) => {
  const local = frame - phase * 120;
  const enter = interpolate(local, [4, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fade = interpolate(local, [0, 14, 103, 120], [0, 1, 1, 0], clamp);
  const chapters = [
    { label: "01 / LUZ SOLAR", title: "TODO EMPIEZA\nCON LUZ.", note: "Un rayo blanco guarda todos los colores." },
    { label: "02 / ATMÓSFERA", title: "EL AIRE\nCAMBIA EL VIAJE.", note: "La luz encuentra millones de moléculas." },
    { label: "03 / LONGITUD DE ONDA", title: "AZUL CORTO.\nROJO LARGO.", note: "No todos los colores se dispersan igual." },
    { label: "04 / DISPERSIÓN", title: "EL AZUL\nSE REPARTE.", note: "La luz llega a tus ojos desde todas partes." },
    { label: "05 / LO QUE VEMOS", title: "ASÍ NACE\nEL CIELO AZUL.", note: "El color está en la luz que llena el aire." },
  ];
  const content = chapters[phase]!;
  const left = phase === 0 || phase === 3;
  return (
    <div
      style={{
        position: "absolute",
        left: left ? "8%" : "auto",
        right: left ? "auto" : "8%",
        top: phase === 2 ? "13%" : "18%",
        width: phase === 2 ? "82%" : "36%",
        textAlign: phase === 2 ? "center" : left ? "left" : "right",
        opacity: fade * enter,
        transform: "translateY(" + ((1 - enter) * 28) + "px)",
        color: "#f4f7fb",
        textShadow: "0 5px 32px rgba(0,0,0,.54)",
      }}
    >
      <div style={{ color: phase === 4 ? "#c7ecff" : "#8ddcff", fontSize: 16, fontWeight: 800, letterSpacing: 5, marginBottom: 18 }}>
        {content.label}
      </div>
      <div style={{ fontSize: phase === 4 ? 78 : 70, fontWeight: 850, lineHeight: 0.94, letterSpacing: -3, whiteSpace: "pre-line" }}>
        {content.title}
      </div>
      <div style={{ color: "#c0d0df", fontSize: 21, lineHeight: 1.45, marginTop: 20 }}>
        {content.note}
      </div>
    </div>
  );
};

const WordCaption: FC<{ cue: SubtitleCue; frame: number }> = ({ cue, frame }) => {
  const localFrame = frame - cue.startInFrames;
  const active = cue.wordTimings?.find((word) => localFrame >= word.startInFrames && localFrame < word.endInFrames);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "8.5%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 420,
        maxWidth: "82%",
        padding: "14px 28px 17px",
        borderRadius: 7,
        background: "rgba(3, 11, 22, .68)",
        border: "1px solid rgba(191, 227, 255, .18)",
        boxShadow: "0 16px 48px rgba(0,0,0,.28)",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {cue.speaker ? <div style={{ color: "#8ddcff", fontSize: 13, letterSpacing: 3, fontWeight: 800, marginBottom: 7 }}>{cue.speaker}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 8, rowGap: 3, fontSize: 34, lineHeight: 1.16, fontWeight: 750 }}>
        {cue.wordTimings?.map((word, index) => (
          <span key={index} style={{ color: active === word ? "#ffd27a" : "#f5f8fc", opacity: active === word ? 1 : 0.74 }}>
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export const NarratedSkyExplainer: FC<NarratedSkyExplainerProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const phase = Math.min(4, Math.floor(frame / 120));
  const cameraX = interpolate(frame, [0, 120, 240, 360, 480, 600], [0.65, -1.9, 0.2, 2.35, 0.5, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cameraY = interpolate(frame, [0, 120, 240, 360, 480, 600], [0.35, 0.65, 0.1, -0.4, -0.2, 0.12], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cameraZ = interpolate(frame, [0, 120, 240, 360, 480, 600], [8.4, 6.1, 7.8, 7.1, 8.7, 7.4], clamp);
  const cameraYaw = -Math.atan2(cameraX, cameraZ);
  const cameraPitch = -Math.atan2(cameraY, Math.hypot(cameraX, cameraZ));
  const cue = props.subtitleCues.find((item) => frame >= item.startInFrames && frame < item.startInFrames + item.durationInFrames);
  const speaking = Boolean(cue);
  const musicVolume = speaking ? 0.075 : 0.16;
  const progress = frame / Math.max(1, props.durationInFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050c19", color: "#f4f7fb", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={staticFile(props.narrationAudioSrc)} volume={1} />
      <Audio src={staticFile(props.musicAudioSrc)} volume={musicVolume} loop />
      {[120, 240, 360, 480].map((start) => (
        <Sequence key={start} from={start - 5} durationInFrames={45}>
          <Audio src={staticFile(props.transitionAudioSrc)} volume={0.16} />
        </Sequence>
      ))}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [cameraX, cameraY, cameraZ], rotation: [cameraPitch, cameraYaw, 0], fov: 39 }}
        style={{ width: "100%", height: "100%" }}
      >
        {phase === 0 ? <SolarSystemShot /> : null}
        {phase === 1 ? <MoleculeMacroShot /> : null}
        {phase === 2 ? <WavelengthShot /> : null}
        {phase === 3 ? <ScatteringShot /> : null}
        {phase === 4 ? <HorizonShot /> : null}
      </ThreeCanvas>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <ChapterOverlay frame={frame} phase={phase} />
        <div style={{ position: "absolute", left: "7.7%", right: "7.7%", top: 44, display: "flex", justifyContent: "space-between", color: "rgba(220,238,250,.6)", fontSize: 12, letterSpacing: 3, fontWeight: 800 }}>
          <span>AI VIDEO STUDIO / EXPLAINER FILM</span>
          <span>{String(phase + 1).padStart(2, "0")} — 05</span>
        </div>
        <div style={{ position: "absolute", left: "7.7%", right: "7.7%", bottom: 36, height: 2, background: "rgba(216,235,250,.16)" }}>
          <div style={{ width: String(Math.min(100, progress * 100)) + "%", height: "100%", background: "#83d6ff" }} />
        </div>
        {cue ? <WordCaption cue={cue} frame={frame} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
