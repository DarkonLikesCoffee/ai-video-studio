export type RendererKind = "project-video" | "custom-remotion";
export type CompositionAvailability = "registered" | "to-be-built";

export type CompositionCapability = {
  id: string;
  renderer: RendererKind;
  selectable: boolean;
  purpose: string;
  strengths: string[];
  limitations: string[];
};

// This is the model-facing catalogue of compositions actually registered by
// packages/video-engine/src/root.tsx on the current branch. Add every new
// production composition here before the Director can select it. Tests verify
// that each catalogue entry is registered; unlisted IDs are not selectable.
export const COMPOSITION_REGISTRY: readonly CompositionCapability[] = [
  {
    id: "DemoVideo",
    renderer: "custom-remotion",
    selectable: false,
    purpose: "Engine smoke test only.",
    strengths: ["Verifies the basic Remotion render path."],
    limitations: ["Not a production creative template."],
  },
  {
    id: "ProjectVideo",
    renderer: "project-video",
    selectable: true,
    purpose: "General-purpose compatibility renderer for structured 2D projects.",
    strengths: [
      "Layered local/remote image and video assets",
      "2D vector graphics, text, SVG path animation and particles",
      "Keyframed transforms, scene transitions, captions and global audio tracks",
    ],
    limitations: [
      "Uses a recurring scene layout and title/editorial framing",
      "Does not create arbitrary 3D geometry or a true 3D camera",
      "Do not choose it merely because it is the easiest or default renderer",
    ],
  },
  {
    id: "ThreeDShowcase",
    renderer: "custom-remotion",
    selectable: false,
    purpose: "Reference/showcase composition demonstrating a narrow set of 3D techniques.",
    strengths: ["Provides a reference for basic Three.js integration."],
    limitations: ["A showcase, not a general-purpose production composition."],
  },
  {
    id: "MadridNewYorkParis",
    renderer: "custom-remotion",
    selectable: true,
    purpose: "Specialized animated city-route travel story.",
    strengths: ["Animated map routes, location labels and a Three.js Eiffel Tower reveal."],
    limitations: ["Its story, cities and visual structure are hard-coded; adapt or create a new composition for other itineraries."],
  },
  {
    id: "MadridTrip",
    renderer: "custom-remotion",
    selectable: true,
    purpose: "Specialized Madrid travel/geography composition.",
    strengths: ["Custom geographic framing and route-oriented visual storytelling."],
    limitations: ["Not a general-purpose map or travel renderer; inspect its scope before reuse."],
  },
  {
    id: "CinematicAdBenchmark",
    renderer: "custom-remotion",
    selectable: true,
    purpose: "Specialized premium product-ad benchmark built around a 3D speaker product.",
    strengths: ["Three.js product geometry, moving camera, studio lighting, exploded-view sequence and editorial overlays."],
    limitations: ["The product model, brand copy, timing and shot structure are hard-coded; do not reuse unchanged for unrelated products."],
  },
  {
    id: "NarratedSkyExplainer",
    renderer: "custom-remotion",
    selectable: true,
    purpose: "Specialized narrated science/space explainer combining 3D scenes and optional footage clips.",
    strengths: ["Three.js visual sequences, narration, subtitles, music and footage integration."],
    limitations: ["Its built-in scene language is tailored to the sky/space explainer; unrelated topics may need a new composition."],
  },
] as const;

export const getCompositionCapability = (id: string): CompositionCapability | undefined =>
  COMPOSITION_REGISTRY.find((composition) => composition.id === id);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const validateRenderStrategy = (value: unknown): string[] => {
  if (!isRecord(value)) return ["renderStrategy is required and must be an object."];

  const errors: string[] = [];
  const { renderer, compositionId, availability, rationale, requiredCapabilities, fallback } = value;

  if (renderer !== "project-video" && renderer !== "custom-remotion") {
    errors.push('renderStrategy.renderer must be "project-video" or "custom-remotion".');
  }
  if (typeof compositionId !== "string" || !/^[A-Z][A-Za-z0-9]{1,63}$/.test(compositionId)) {
    errors.push("renderStrategy.compositionId must be a PascalCase Remotion composition ID.");
  }
  if (availability !== "registered" && availability !== "to-be-built") {
    errors.push('renderStrategy.availability must be "registered" or "to-be-built".');
  }
  if (!nonEmpty(rationale) || rationale.length > 500) {
    errors.push("renderStrategy.rationale must be a non-empty string of at most 500 characters.");
  }
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.length === 0 ||
      requiredCapabilities.length > 12 || requiredCapabilities.some((item) => !nonEmpty(item) || item.length > 160)) {
    errors.push("renderStrategy.requiredCapabilities must contain 1–12 non-empty strings of at most 160 characters.");
  }
  if (!nonEmpty(fallback) || fallback.length > 500) {
    errors.push("renderStrategy.fallback must be a non-empty string of at most 500 characters.");
  }

  if (typeof compositionId === "string" && availability === "registered") {
    const selected = getCompositionCapability(compositionId);
    if (!selected) {
      errors.push(`renderStrategy.compositionId "${compositionId}" is not registered in the current composition catalogue.`);
    } else if (!selected.selectable) {
      errors.push(`renderStrategy.compositionId "${compositionId}" is registered for reference/testing only, not production selection.`);
    } else if (renderer !== selected.renderer) {
      errors.push(`renderStrategy.renderer must be "${selected.renderer}" for composition "${compositionId}".`);
    }
  }

  if (availability === "to-be-built") {
    if (renderer !== "custom-remotion") errors.push('A "to-be-built" composition must use renderer "custom-remotion".');
    if (typeof compositionId === "string" && getCompositionCapability(compositionId)) {
      errors.push(`renderStrategy.compositionId "${compositionId}" already exists; select its registered availability instead.`);
    }
  }

  if (renderer === "project-video" &&
      (compositionId !== "ProjectVideo" || availability !== "registered")) {
    errors.push('The "project-video" renderer must select registered composition "ProjectVideo".');
  }
  if (renderer === "custom-remotion" && compositionId === "ProjectVideo") {
    errors.push('Use renderer "project-video" for composition "ProjectVideo".');
  }

  return errors;
};

export const renderCompositionRegistryForPrompt = (): string =>
  COMPOSITION_REGISTRY.map((composition) => {
    const status = composition.selectable ? "selectable" : "reference/test only — do not select";
    return [
      `- ${composition.id} [${composition.renderer}; ${status}]`,
      `  Purpose: ${composition.purpose}`,
      `  Strengths: ${composition.strengths.join("; ")}`,
      `  Limitations: ${composition.limitations.join("; ")}`,
    ].join("\n");
  }).join("\n");
