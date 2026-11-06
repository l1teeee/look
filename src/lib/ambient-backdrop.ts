const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 18;
const FRAME_INTERVAL_MS = 80;

// Paints a tiny copy of the playing video into a canvas. CSS stretches and blurs the canvas
// behind the page, so the background takes the video's colors without a second decoder.
export function startAmbientBackdrop(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): () => void {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("A 2D canvas is needed for the ambient backdrop.");
  }

  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;

  let hasDrawn = false;
  let lastDrawAt = 0;
  let frameRequest = 0;

  const onFrame = (now: number) => {
    frameRequest = requestAnimationFrame(onFrame);
    if (now - lastDrawAt < FRAME_INTERVAL_MS) return;

    const hasPicture = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    // Paint once for the first picture, then only while the video plays.
    if (!hasPicture || (hasDrawn && video.paused)) return;

    context.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    hasDrawn = true;
    lastDrawAt = now;
  };

  frameRequest = requestAnimationFrame(onFrame);
  return () => cancelAnimationFrame(frameRequest);
}
