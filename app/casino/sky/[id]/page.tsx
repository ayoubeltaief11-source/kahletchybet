"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";

const CrashLive = dynamic(function () { return import("@/components/kb2/crash/CrashLive"); }, {
  ssr: false,
  loading: function () {
    return (
      <div className="kb2-boot" style={{ minHeight: 520 }}>
        <div className="kb2-boot-ring"/>
        <span className="kb2-boot-txt">Connecting to live round</span>
      </div>
    );
  }
});

export default function Page() {
  return (
    <ClientOnly minHeight={520}>
      <CrashLive/>
    </ClientOnly>
  );
}