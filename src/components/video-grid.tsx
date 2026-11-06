"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { startAmbientBackdrop } from "@/lib/ambient-backdrop";
import { buildPanesClipPath } from "@/lib/panes-clip-path";
import { runVideoSequence } from "@/lib/run-video-sequence";

gsap.registerPlugin(useGSAP);

const PANES = ["top-left", "top-right", "bottom-left", "bottom-right"];

interface VideoGridProps {
  sources: string[];
}

export default function VideoGrid({ sources }: VideoGridProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const maskedRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);

  // One video is clipped to the four pane shapes, so it reads as a single picture seen
  // through four windows. Layout effect: the clip must exist before the stage can show.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const masked = maskedRef.current;
    if (!grid || !masked) return;

    const panes = Array.from(grid.querySelectorAll<HTMLElement>("[data-pane]"));
    const applyClipPath = () => {
      masked.style.clipPath = buildPanesClipPath(panes);
    };

    applyClipPath();
    const observer = new ResizeObserver(applyClipPath);
    observer.observe(grid);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const ambient = ambientRef.current;
    if (!video || !ambient) return;

    return startAmbientBackdrop(video, ambient);
  }, []);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const ambient = ambientRef.current;
      const video = videoRef.current;
      if (!stage || !ambient || !video) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const controller = new AbortController();
        void runVideoSequence({ stage, ambient, video, sources }, controller.signal);

        return () => {
          controller.abort();
          gsap.killTweensOf([stage, ambient]);
          video.pause();
        };
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([stage, ambient], { autoAlpha: 1 });
        video.pause();
        video.load();
      });

      return () => media.revert();
    },
    { scope: stageRef },
  );

  return (
    <>
      {/* Oversized so the blur does not fade out at the page edges. */}
      <canvas
        ref={ambientRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed -top-[30%] -left-[30%] -z-10 size-[160%] blur-[9vmax]"
      />
      <div ref={stageRef} className="invisible relative h-full">
        <div
          ref={gridRef}
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-gutter"
        >
          {PANES.map((pane) => (
            <div key={pane} data-pane className="rounded-pane" />
          ))}
        </div>
        {/* No fill under the video: a second clipped layer leaves a light line on the rounded corners. */}
        <div ref={maskedRef} className="absolute inset-0">
          <video
            ref={videoRef}
            className="size-full object-cover"
            src={sources[0]}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  );
}
