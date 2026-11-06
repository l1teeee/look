import { readdirSync } from "node:fs";
import path from "node:path";

const VIDEOS_DIRECTORY = path.join(process.cwd(), "public", "videos");

// Drop-in playlist: every .mp4 in public/videos plays, in natural filename order.
export function listVideoSources(): string[] {
  return readdirSync(VIDEOS_DIRECTORY)
    .filter((fileName) => fileName.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((fileName) => `/videos/${encodeURIComponent(fileName)}`);
}
