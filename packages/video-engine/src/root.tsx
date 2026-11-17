import { Composition } from "remotion";
import projectExample from "../../../projects/examples/three-scene-story/scene.json";
import { getProjectDurationInFrames, type VideoProject } from "./project";
import { DemoVideo } from "./scenes/DemoVideo";
import { ProjectVideo } from "./scenes/ProjectVideo";
import { ThreeDShowcase } from "./scenes/ThreeDShowcase";

// Remotion merges partial --props over defaultProps. Do not leak the example
// project's soundtrack into projects that intentionally omit audioTracks.
const defaultProject = {
  ...(projectExample as unknown as VideoProject),
  audioTracks: [],
};

export const RemotionRoot = () => (
  <>
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
  </>
);
