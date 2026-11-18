export type NasaSvsSelectedAsset = {
  id: string;
  title: string;
  creator: string;
  attribution?: string;
  sourcePage: string;
  url: string;
  mime: "video/mp4" | "video/webm";
  width?: number;
  height?: number;
  license: "Public domain";
  shotIds: string[];
};
export function isSafeNasaSvsUrl(value: string): boolean;
export function getNasaRetryDelayMs(retryAfter: string | null | undefined, attempt: number, now?: number): number;
export function fetchNasaVideoWithRetries(
  url: string | URL,
  fetchImpl?: typeof fetch,
  pause?: (milliseconds: number) => Promise<void>,
): Promise<Response>;
export function validateNasaSelection(selection: { assets: NasaSvsSelectedAsset[] }): NasaSvsSelectedAsset[];
export function runCli(argv?: string[]): Promise<void>;
