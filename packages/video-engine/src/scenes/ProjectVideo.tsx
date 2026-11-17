import { AbsoluteFill, Img, OffthreadVideo, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CSSProperties, FC } from "react";
import type { SceneMedia, VideoProject, VideoScene } from "../project";
import { isRemoteMediaUrl } from "../project";

type SceneCardProps = {
  scene: VideoScene;
  index: number;
};

const SceneMediaLayer: FC<{ media: SceneMedia }> = ({ media }) => {
  const source = isRemoteMediaUrl(media.src) ? media.src : staticFile(media.src);
  const placement = media.placement ?? "background";
  const isBackground = placement === "background";

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: placement === "left" || isBackground ? 0 : "auto",
    right: placement === "right" || isBackground ? 0 : "auto",
    width: isBackground ? "100%" : "43%",
    height: "100%",
    objectFit: media.fit ?? "cover",
    objectPosition: media.position ?? "center",
    opacity: media.opacity ?? 1,
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
  const mediaPlacement = scene.media?.placement ?? "background";
  const hasSideMedia = Boolean(scene.media && mediaPlacement !== "background");
  const textAlign = mediaPlacement === "left" ? "right" : scene.type === "content" || mediaPlacement === "right" ? "left" : "center";
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
  const textSide = mediaPlacement === "left" ? "flex-end" : "flex-start";

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
      {scene.media ? <SceneMediaLayer media={scene.media} /> : null}
      {scene.media && mediaPlacement === "background" ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(90deg, rgba(5, 8, 20, 0.82), rgba(5, 8, 20, 0.38))",
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
          zIndex: 1,
        }}
      >
        <div
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
        </div>
        <h1 style={titleStyle}>{scene.title}</h1>
        {scene.body ? (
          <p
            style={{
              maxWidth: hasSideMedia ? 900 : scene.type === "content" ? 1120 : 1080,
              margin: textAlign === "center" ? "34px auto 0" : "32px 0 0",
              color: "#C7CBD7",
              fontSize: hasSideMedia ? 30 : 38,
              lineHeight: 1.45,
              fontWeight: 400,
            }}
          >
            {scene.body}
          </p>
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
          zIndex: 2,
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
