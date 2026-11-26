"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";
const MoonGame = dynamic(function () { return import("@/src/kb3/slots/moon-rabbit-mint/MoonGame"); }, { ssr: false });
export default function DebugPage() {
  return <ClientOnly minHeight={520}><MoonGame debug/></ClientOnly>;
}
