"use client";

import { useEffect, useState } from "react";
import { setSystemSoundEnabled } from "@/lib/system-sound";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  // Browsers refuse audio before a gesture, so the first click anywhere turns the sound on.
  // React handles a click on the button first, then this listener only confirms "on".
  useEffect(() => {
    function enableOnFirstClick() {
      setSystemSoundEnabled(true);
      setEnabled(true);
    }

    window.addEventListener("click", enableOnFirstClick, { once: true });
    return () => window.removeEventListener("click", enableOnFirstClick);
  }, []);

  function handleClick() {
    const nextEnabled = !enabled;
    setSystemSoundEnabled(nextEnabled);
    setEnabled(nextEnabled);
  }

  return (
    <button
      type="button"
      aria-label="Sound"
      aria-pressed={enabled}
      onClick={handleClick}
      className="fixed right-4 bottom-4 grid size-10 place-items-center rounded-full bg-foreground/70 text-background hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-safe:transition-colors"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {enabled ? (
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M16 9.5a4 4 0 0 1 0 5" />
            <path d="M18.5 7a8 8 0 0 1 0 10" />
          </g>
        ) : (
          <path
            d="M16.5 9.5l5 5m0-5l-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
