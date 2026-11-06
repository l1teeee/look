"use client";

import { useEffect } from "react";
import { setSystemSoundEnabled } from "@/lib/system-sound";

function enableSound() {
  setSystemSoundEnabled(true);
}

// Browsers refuse audio before a gesture, so the first click or tap anywhere turns the sound on.
export default function SoundUnlock() {
  useEffect(() => {
    window.addEventListener("click", enableSound, { once: true });
    return () => window.removeEventListener("click", enableSound);
  }, []);

  return null;
}
