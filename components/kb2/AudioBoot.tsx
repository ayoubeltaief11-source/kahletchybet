"use client";
import { useEffect } from "react";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

export default function AudioBoot() {
  const { p } = usePrefs();
  useEffect(function () {
    const a = getAudio();
    const open = function () { a.unlock(); a.syncFromPrefs(); };
    window.addEventListener("pointerdown", open, { passive: true });
    window.addEventListener("keydown", open);
    return function () {
      window.removeEventListener("pointerdown", open);
      window.removeEventListener("keydown", open);
    };
  }, []);
  useEffect(function () {
    const a = getAudio();
    a.setLevels(p.master, p.music, p.sfx, !p.sound);
  }, [p.master, p.music, p.sfx, p.sound]);
  useEffect(function () {
    return function () { getAudio().stopAll(); };
  }, []);
  return null;
}
