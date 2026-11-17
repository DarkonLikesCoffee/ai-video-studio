import { AbsoluteFill, Img, OffthreadVideo, Sequence, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CSSProperties, FC, ReactNode } from "react";
import type { AnimationTracks, SceneMedia, VideoProject, VideoScene } from "../project";
import { isRemoteMediaUrl } from "../project";
import { evaluateAnimationTrack } from "../animation";

type SceneCardProps = {
  scene: VideoScene;
  index: number;
};

type AnimatedMediaProps = {
  media: SceneMedia;
  index: number;
};

const AnimatedMedia: FC<AnimatedMediaProps> = ({ media, index }) => {
  const frame = useCurrentFrame();
  const placement = media.placement ?? "background";
  const defaultX = media.x ?? (placement === "right" ? 57 : 0);
  const defaultY = media.y ?? 0;
  const defaultWidth = media.width ?? (placement === "background" ? 100 : 43);
  const defaultHeight = media.height ?? 100;
  const x = evaluateAnimationTrack(frame, media.animations?.x, defaultX);
  const y = evaluateAnimationTrack(frame, media.animations?.y, defaultY);
  const width = evaluateAnimationTrack(frame, media.animations?.width, defaultWidth);
  const height = evaluateAnimationTrack(frame, media.animations?.height, defaultHeight);
  const opacity = evaluateAnimationTrack(frame, media.animations?.opacity, media.opacity ?? 1);
  const rotation = evaluateAnimationTrack(frame, media.animations?.rotation, media.rotation ?? 0);
  const scaleX = evaluateAnimationTrack(frame, media.animations?.scaleX, 1);
  const scaleY = evaluateAnimationTrack(frame, media.animations?.scaleY, 1);
  const source = isRemoteMediaUrl(media.src) ? media.src : staticFile(media.src);

  const style: CSSProperties = {
    position: "absolute",
    top: `${y}%`,
    left: `${x}%`,
    width: `${width}%`,
    height: `${height}%`,
    objectFit: media.fit ?? "cover",
    objectPosition: media.position ?? "center",
    opacity,
    zIndex: media.zIndex ?? index,
    transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
    transformOrigin: "center center",
  };

  if (media.type === "image") {
    return <Img src={source} style={style} />;
  }

  return (
    <OffthreadVideo
      src={source}
      style={style}
      {...(media.trimBefore === undefined ? {} : { trimBefore: media.trimBefore })}
      playbackRate={media.playbackRate ?? 1}
      muted={media.muted ?? true}
      volume={media.volume ?? 1}
    />
  );
};

type AnimatedTextProps = {
  animation?: AnimationTracks;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const AnimatedText: FC<AnimatedTextProps> = ({ animation, children, style }) => {
  const frame = useCurrentFrame();
  const x = evaluateAnimationTrack(frame, animation?.x, 0);
  const y = evaluateAnimationTrack(frame, animation?.y, 0);
  const width = evaluateAnimationTrack(frame, animation?.width, 100);
  const opacity = evaluateAnimationTrack(frame, animation?.opacity, 1);
  const rotation = evaluateAnimationTrack(frame, animation?.rotation, 0);
  const scaleX = evaluateAnimationTrack(frame, animation?.scaleX, 1);
  const scaleY = evaluateAnimationTrack(frame, animation?.scaleY, 1);

  return (
    <div
      style={{
        ...style,
        width: `${width}%`,
        opacity,
        transform: `translate(${x}%, ${y}%) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

const SceneCard: FC<SceneCardProps> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const duration = scene.durationInFrames;
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [duration - 14, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const rise = interpolate(frame, [0, 20], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accent = scene.accentColor ?? "#8B5CF6";
  const background = scene.backgroundColor ?? "#0B1020";
  const mediaLayers = scene.mediaLayers ?? (scene.media ? [scene.media] : []);
  const hasLegacyBackground = Boolean(scene.media && (scene.media.placement ?? "background") === "background");
  const hasSideMedia = Boolean(
    scene.media && (scene.media.placement === "left" || scene.media.placement === "right")
  );
  const textAlign = scene.media?.placement === "left"
    ? "right"
    : scene.type === "content" || scene.media?.placement === "right" ? "left" : "center";
  const eyebrow = scene.eyebrow ?? (scene.type === "title" ? "A SHORT EXPLAINER" : scene.type === "outro" ? "THE BIG PICTURE" : `CHAPTER ${String(index + 1).padStart(2, "0")}`);

  const titleStyle: CSSProperties = {
    fontSize: hasSideMedia ? 72 : scene.type === "content" ? 82 : 104,
    lineHeight: 1.06,
    fontWeight: 760,
    letterSpacing: -4,
    maxWidth: 1320,
    margin: 0,
  };

  const textWidth = hasSideMedia ? "53%" : "100%";
  const textSide = scene.media?.placement === "left" ? "flex-end" : "flex-start";

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 78% 22%, ${accent}25, transparent 34%), ${background}`,
        color: "#F8FAFC",
        justifyContent: "center",
        alignItems: hasSideMedia ? textSide : scene.type === "content" ? "flex-start" : "center",
        padding: "0 13%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {mediaLayers.map((media, layerIndex) => {
        const startInFrames = media.startInFrames ?? 0;
        const durationInFrames = media.durationInFrames ?? duration - startInFrames;
        return (
          <Sequence
            key={media.id ?? `${media.src}-${layerIndex}`}
            from={startInFrames}
            durationInFrames={durationInFrames}
            name={media.id ?? `media-layer-${layerIndex + 1}`}
            style={{ zIndex: media.zIndex ?? layerIndex }}
          >
            <AnimatedMedia media={media} index={layerIndex} />
          </Sequence>
        );
      })}
      {hasLegacyBackground ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(90deg, rgba(5, 8, 20, 0.82), rgba(5, 8, 20, 0.38))",
            zIndex: 30,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          right: -330,
          bottom: -430,
          borderRadius: "50%",
          border: `2px solid ${accent}55`,
          boxShadow: `0 0 100px ${accent}22`,
          transform: `translateY(${interpolate(frame, [0, duration], [26, -26], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px) rotate(${frame * 0.12}deg)`,
          zIndex: 35,
        }}
      />
      <div
        style={{
          position: "relative",
          width: textWidth,
          maxWidth: 1320,
          opacity,
          transform: `translateY(${rise}px)`,
          textAlign,
          zIndex: 50,
        }}
      >
        <AnimatedText
          animation={scene.eyebrowAnimation}
          style={{
            color: accent,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 7,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          {eyebrow}
        </AnimatedText>
        <AnimatedText animation={scene.titleAnimation}>
          <h1 style={titleStyle}>{scene.title}</h1>
        </AnimatedText>
        {scene.body ? (
          <AnimatedText
            animation={scene.bodyAnimation}
            style={{
              margin: textAlign === "center" ? "34px auto 0" : "32px 0 0",
              color: "#C7CBD7",
              fontSize: hasSideMedia ? 30 : 38,
              lineHeight: 1.45,
              fontWeight: 400,
            }}
          >
            <p style={{ margin: 0 }}>{scene.body}</p>
          </AnimatedText>
        ) : null}
        <div
          style={{
            width: 112,
            height: 5,
            margin: textAlign === "center" ? "46px auto 0" : "46px 0 0",
            borderRadius: 99,
            background: accent,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: "13%",
          right: "13%",
          display: "flex",
          justifyContent: "space-between",
          color: "#7B8498",
          fontSize: 17,
          letterSpacing: 3,
          textTransform: "uppercase",
          zIndex: 60,
        }}
      >
        <span>AI VIDEO STUDIO</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
    </AbsoluteFill>
  );
};

export const ProjectVideo: FC<VideoProject> = ({ scenes }) => (
  <AbsoluteFill>
    <Series>
      {scenes.map((scene, index) => (
        <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
          <SceneCard scene={scene} index={index} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
