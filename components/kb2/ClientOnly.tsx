"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: number;
}

export function useMounted(): boolean {
  const [on, setOn] = useState<boolean>(false);
  useEffect(function () { setOn(true); }, []);
  return on;
}

export default function ClientOnly({ children, fallback, minHeight }: Props) {
  const on = useMounted();
  if (on) return <>{children}</>;
  const ph = fallback ?? (
    <div className="kb2-boot" style={{ minHeight: minHeight ?? 320 }}>
      <div className="kb2-boot-ring"/>
      <span className="kb2-boot-txt">Loading engine</span>
    </div>
  );
  return <>{ph}</>;
}
