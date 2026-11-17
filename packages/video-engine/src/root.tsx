import { Composition } from "remotion";
import { DemoVideo } from "./scenes/DemoVideo";

export const RemotionRoot = () => (
  <Composition id="DemoVideo" component={DemoVideo} durationInFrames={300} fps={30} width={1920} height={1080} />
);
