import { AbsoluteFill, Img, staticFile } from "remotion";

export type AssetReviewImage = {
  relativePath: string;
  sizeBytes: number;
  extension: string;
};

export type AssetReviewProps = {
  projectTitle: string;
  pageNumber: number;
  totalPages: number;
  assets: AssetReviewImage[];
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

/**
 * QA-only still composition. It renders local project images at full preview
 * resolution so a multimodal reviewer can inspect the actual browser output.
 * It is deliberately not registered in RemotionRoot or the production
 * composition catalogue.
 */
export const AssetReview = ({
  projectTitle,
  pageNumber,
  totalPages,
  assets,
}: AssetReviewProps) => {
  const rows = Math.max(1, Math.ceil(assets.length / 4));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#10141c",
        color: "#f4f7fb",
        padding: 28,
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 62,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #344052",
          padding: "0 4px 12px",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#91a4bd", letterSpacing: 2, textTransform: "uppercase" }}>
            AI Video Studio · Pre-animation asset review
          </div>
          <div style={{ fontSize: 25, fontWeight: 700, marginTop: 4 }}>{projectTitle}</div>
        </div>
        <div style={{ color: "#c2cede", fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
          Page {pageNumber} / {totalPages}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(" + rows + ", minmax(0, 1fr))",
          gap: 14,
          paddingTop: 16,
          paddingBottom: 10,
        }}
      >
        {assets.map((asset) => (
          <div
            key={asset.relativePath}
            style={{
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
              backgroundColor: "#1a2330",
              border: "1px solid #3a485c",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 6,
                backgroundColor: "#f2f2f2",
                backgroundImage:
                  "linear-gradient(45deg, #d5d9df 25%, transparent 25%), linear-gradient(-45deg, #d5d9df 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d5d9df 75%), linear-gradient(-45deg, transparent 75%, #d5d9df 75%)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
              }}
            >
              <Img
                src={staticFile(asset.relativePath)}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                flexShrink: 0,
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#f3f6fa",
                  fontWeight: 600,
                }}
              >
                {asset.relativePath}
              </span>
              <span style={{ flexShrink: 0, color: "#a8b6c8", fontVariantNumeric: "tabular-nums" }}>
                {formatBytes(asset.sizeBytes)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          height: 24,
          flexShrink: 0,
          color: "#8fa0b6",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Rendered previews · transparent assets shown on a checkerboard</span>
        <span>Visual approval is a separate assistant/human review step</span>
      </div>
    </AbsoluteFill>
  );
};
