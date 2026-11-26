"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";
const PitchPulse = dynamic(function () { return import("@/src/kb3/sports/pitch-pulse/PitchPulse"); }, { ssr: false });
export default function DebugPage() {
  return <ClientOnly minHeight={520}><PitchPulse debug/></ClientOnly>;
}
