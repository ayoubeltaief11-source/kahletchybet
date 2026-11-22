"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import ClientOnly from "@/components/kb2/ClientOnly";

const Engine = dynamic(function () { return import("@/components/kb2/slots/LineEngine"); }, {
  ssr: false,
  loading: function () {
    return (
      <div className="kb2-boot" style={{ minHeight: 560 }}>
        <div className="kb2-boot-ring"/>
        <span className="kb2-boot-txt">Loading reels</span>
      </div>
    );
  }
});

export default function Page() {
  const p = useParams<{ id: string }>();
  return (
    <ClientOnly minHeight={560}>
      <Engine slug={p.id}/>
    </ClientOnly>
  );
}