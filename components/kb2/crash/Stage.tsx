"use client";
import { useEffect, useState } from "react";
import type { CrashPhase } from "@/lib/kb2/crashLoop";
import CrashScene from "@/src/kb3/crash/CrashScene";

export interface StageInput { phase: CrashPhase; mult: number; progress: number; hue: number; countdown?: number; betCount?: number; }

export default function Stage({ input, craft }: { input: StageInput; craft: string }) {
  const [slug, setSlug] = useState("skyward-jet");
  useEffect(function () {
    const m = window.location.pathname.match(/\/casino\/sky\/([a-z0-9-]+)/);
    if (m && m[1]) setSlug(m[1]);
  }, []);
  return (
    <div className="kb3-stage-canvas">
      <CrashScene gameId={slug} phase={input.phase} multiplier={input.mult} progress={input.progress} countdown={input.countdown} betCount={input.betCount}/>
    </div>
  );
}
