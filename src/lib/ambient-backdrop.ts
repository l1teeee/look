const FIELD_WIDTH = 16;
const FIELD_HEIGHT = 9;
const SMOOTH_WIDTH = 64;
const SMOOTH_HEIGHT = 36;
const SAMPLE_INTERVAL_MS = 200;
const BLEND = 0.35;

// Averages the playing video into a tiny color field and paints it, smoothly upscaled, into the
// canvas. The browser stretches that canvas over the page, which is the whole blur: no CSS
// filter, no oversized layer and no second video decoder.
export function startAmbientBackdrop(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): () => void {
  const field = document.createElement("canvas");
  const fieldContext = field.getContext("2d");
  const context = canvas.getContext("2d");
  if (fieldContext === null || context === null) {
    throw new Error("A 2D canvas is needed for the ambient backdrop.");
  }

  field.width = FIELD_WIDTH;
  field.height = FIELD_HEIGHT;
  canvas.width = SMOOTH_WIDTH;
  canvas.height = SMOOTH_HEIGHT;
  fieldContext.imageSmoothingQuality = "high";
  context.imageSmoothingQuality = "high";

  let hasDrawn = false;

  const sample = () => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    // Paint once for the first picture, then only while the video plays.
    if (hasDrawn && video.paused) return;

    fieldContext.drawImage(video, 0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    // Blend each sample over the previous one so the colors glide instead of stepping.
    context.globalAlpha = hasDrawn ? BLEND : 1;
    context.drawImage(field, 0, 0, SMOOTH_WIDTH, SMOOTH_HEIGHT);
    hasDrawn = true;
  };

  const timer = window.setInterval(sample, SAMPLE_INTERVAL_MS);
  return () => window.clearInterval(timer);
}
