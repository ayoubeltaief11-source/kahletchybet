"use client";
import dynamic from "next/dynamic";
import ClientOnly from "@/components/kb2/ClientOnly";

const Engine = dynamic(function () { return import("@/components/kb2/bj/BJEngine"); }, {
  ssr: false,
  loading: function () {
    return (<div className="kb2-boot" style={{ minHeight: 560 }}><div className="kb2-boot-ring"/><span className="kb2-boot-txt">Dealing cards...</span></div>);
  }
});

export default function Page() {
  return (<ClientOnly minHeight={560}><Engine/></ClientOnly>);
}