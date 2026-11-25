"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";
const AtlasGame = dynamic(function () { return import("@/src/kb3/slots/atlas-skyfall/AtlasGame"); }, { ssr: false });
export default function Page() {
  return <ClientOnly minHeight={520}><AtlasGame/></ClientOnly>;
}
