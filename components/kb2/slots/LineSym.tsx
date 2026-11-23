"use client";
import { useState, useEffect } from "react";
import { sym, asset, hasGame } from "@/src/kb3/registry";

function slugFromUrl(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/\/casino\/[a-z0-9]+\/([a-z0-9-]+)/);
  return m && m[1] ? m[1] : "";
}

export function LineSym({ k, set, size = 56 }: { k: number; set: string; size?: number }) {
  const [slug, setSlug] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(function () { setSlug(slugFromUrl()); }, []);
  const src = slug && hasGame(slug) ? sym(slug, k) : "";
  if (src && !failed) {
    return <img src={src} width={size} height={size} alt="" draggable={false} onError={function () { setFailed(true); }} style={{ objectFit: "contain", filter: "drop-shadow(0 2px 5px rgba(0,0,0,.55))" }}/>;
  }
  const hues = ["#ef3b52", "#f0b429", "#3fcf5f", "#9b5cf6", "#ff7a3d", "#17c9a4", "#ff4fa3", "#2fb6e8", "#ffd24a"];
  const c = hues[((k % 9) + 9) % 9];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="24" fill={c} stroke="#1a1408" strokeWidth="2"/>
      <circle cx="24" cy="24" r="7" fill="#ffffff" opacity="0.35"/>
    </svg>
  );
}

export function LineMascot({ hue, hue2, size = 200, slug }: { hue: string; hue2?: string; size?: number; slug?: string }) {
  const [id, setId] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(function () { setId(slug || slugFromUrl()); }, [slug]);
  const src = id && hasGame(id) ? asset(id, "character") : "";
  if (!src || failed) return null;
  return <img src={src} alt="" width={size} height={size} draggable={false} onError={function () { setFailed(true); }} style={{ objectFit: "contain", filter: "drop-shadow(0 0 22px " + hue + "80)" }}/>;
}
