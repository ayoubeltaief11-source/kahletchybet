"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";
const FalconGame = dynamic(function () { return import("@/src/kb3/slots/falcon-dunes/FalconGame"); }, { ssr: false });
export default function Page() {
  return <ClientOnly minHeight={520}><FalconGame/></ClientOnly>;
}
