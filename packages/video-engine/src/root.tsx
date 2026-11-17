import { Composition } from "remotion";
import projectExample from "../../../projects/examples/three-scene-story/scene.json";
import { getProjectDurationInFrames, type VideoProject } from "./project";
import { DemoVideo } from "./scenes/DemoVideo";
import { ProjectVideo } from "./scenes/ProjectVideo";

const defaultProject = projectExample as unknown as VideoProject;

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
  </>
);
