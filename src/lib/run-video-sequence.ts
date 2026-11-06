import gsap from "gsap";
import { playSystemSound } from "@/lib/system-sound";

const APPEAR_SECONDS = 1.2;
const DISAPPEAR_SECONDS = 2.4;
const GAP_MS = 400;
const FADE_EASE = "sine.inOut";

interface SequenceTargets {
  stage: HTMLElement;
  ambient: HTMLElement;
  video: HTMLVideoElement;
  sources: string[];
}

function cancellable(
  signal: AbortSignal,
  start: (done: () => void) => () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();

    const onAbort = () => {
      cancel();
      reject(signal.reason);
    };
    const cancel = start(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    });
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return cancellable(signal, (done) => {
    const timer = setTimeout(done, ms);
    return () => clearTimeout(timer);
  });
}

function videoEnded(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  return cancellable(signal, (done) => {
    video.addEventListener("ended", done, { once: true });
    return () => video.removeEventListener("ended", done);
  });
}

function appear({ stage, ambient }: SequenceTargets): void {
  playSystemSound("appear");
  gsap.fromTo(
    [stage, ambient],
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: APPEAR_SECONDS, ease: FADE_EASE },
  );
}

function disappear({ stage, ambient }: SequenceTargets, seconds: number): void {
  playSystemSound("disappear");
  gsap.to([stage, ambient], {
    autoAlpha: 0,
    duration: seconds,
    ease: FADE_EASE,
    overwrite: "auto",
  });
}

// Resolves false when the file cannot start (missing, unsupported or autoplay refused).
async function playVideo(
  targets: SequenceTargets,
  source: string,
  signal: AbortSignal,
): Promise<boolean> {
  const { video } = targets;

  if (video.getAttribute("src") !== source) {
    video.src = source;
  }

  try {
    await video.play();
  } catch {
    // An aborted run also rejects play(); that must not mark the file as unplayable.
    signal.throwIfAborted();
    return false;
  }

  appear(targets);

  // Fade out while the video is still playing, so its last frame never freezes on screen.
  const secondsLeft = video.duration - video.currentTime;
  const fadeSeconds = Math.min(DISAPPEAR_SECONDS, secondsLeft);
  await wait((secondsLeft - fadeSeconds) * 1000, signal);
  disappear(targets, fadeSeconds);

  if (!video.ended) {
    await videoEnded(video, signal);
  }
  await wait(GAP_MS, signal);
  return true;
}

export async function runVideoSequence(
  targets: SequenceTargets,
  signal: AbortSignal,
): Promise<void> {
  const queue = [...targets.sources];

  try {
    while (!signal.aborted) {
      const source = queue.shift();
      if (source === undefined) {
        // No file could play: leave the empty panes on screen while the videos are missing.
        appear(targets);
        return;
      }
      if (await playVideo(targets, source, signal)) {
        queue.push(source);
      }
    }
  } catch (error) {
    if (!signal.aborted) throw error;
  }
}
