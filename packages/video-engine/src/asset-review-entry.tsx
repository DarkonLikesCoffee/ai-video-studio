import { Composition, registerRoot } from "remotion";
import { AssetReview, type AssetReviewProps } from "./scenes/AssetReview";

const defaultProps: AssetReviewProps = {
  projectTitle: "Asset review",
  pageNumber: 1,
  totalPages: 1,
  assets: [],
};

const AssetReviewRoot = () => (
  <Composition
    id="AssetReview"
    component={AssetReview}
    durationInFrames={1}
    fps={1}
    width={1920}
    height={1080}
    defaultProps={defaultProps}
  />
);

registerRoot(AssetReviewRoot);
