import { Composition } from "remotion";
import projectExample from "../../../projects/examples/three-scene-story/scene.json";
import { getProjectDurationInFrames, type VideoProject } from "./project";
import { DemoVideo } from "./scenes/DemoVideo";
import { ProjectVideo } from "./scenes/ProjectVideo";
import { ThreeDShowcase } from "./scenes/ThreeDShowcase";
import { MadridNewYorkParis } from "./scenes/MadridNewYorkParis";
import { MadridTrip, MADRID_TRIP_DURATION, FPS as MADRID_TRIP_FPS, WIDTH as MADRID_TRIP_WIDTH, HEIGHT as MADRID_TRIP_HEIGHT } from "./scenes/MadridTrip";
import { CinematicAdBenchmark } from "./scenes/CinematicAdBenchmark";
import { NarratedSkyExplainer, type NarratedSkyExplainerProps } from "./scenes/NarratedSkyExplainer";
import { TinyAstronautCrystalCave } from "./scenes/TinyAstronautCrystalCave";

// Remotion merges partial --props over defaultProps. Do not leak the example
// project's soundtrack into projects that intentionally omit audioTracks.
const defaultProject = {
  ...(projectExample as unknown as VideoProject),
  audioTracks: [],
};

export const RemotionRoot = () => (
  <>
    <Composition
      id="TinyAstronautCrystalCave"
      component={TinyAstronautCrystalCave}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="ProjectVideo"
      component={ProjectVideo}
      durationInFrames={getProjectDurationInFrames(defaultProject)}
      fps={defaultProject.composition.fps}
      width={defaultProject.composition.width}
      height={defaultProject.composition.height}
      defaultProps={defaultProject}
      calculateMetadata={({ props }) => ({
        durationInFrames: getProjectDurationInFrames(props),
        fps: props.composition.fps,
        width: props.composition.width,
        height: props.composition.height
      })}
    />
    <Composition
      id="ThreeDShowcase"
      component={ThreeDShowcase}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="MadridNewYorkParis"
      component={MadridNewYorkParis}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="MadridTrip"
      component={MadridTrip}
      durationInFrames={MADRID_TRIP_DURATION}
      fps={MADRID_TRIP_FPS}
      width={MADRID_TRIP_WIDTH}
      height={MADRID_TRIP_HEIGHT}
    />
    <Composition
      id="CinematicAdBenchmark"
      component={CinematicAdBenchmark}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="NarratedSkyExplainer"
      component={NarratedSkyExplainer}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Por qué el cielo es azul",
        durationInFrames: 600,
        narrationAudioSrc: "assets/audio/narration.wav",
        musicAudioSrc: "assets/audio/score.wav",
        transitionAudioSrc: "assets/audio/transition-whoosh.wav",
        subtitleCues: [],
      } satisfies NarratedSkyExplainerProps}
    />
  </>
);
