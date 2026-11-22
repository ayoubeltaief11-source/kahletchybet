"use client";
import { useCallback, useEffect, useState } from "react";

export interface Prefs {
  fav: string[];
  recent: string[];
  sound: boolean;
  master: number;
  music: number;
  sfx: number;
  lang: string;
  turbo: boolean;
}

const KEY = "kb_prefs_v2";
const DEF: Prefs = { fav: [], recent: [], sound: true, master: 0.8, music: 0.35, sfx: 0.9, lang: "en", turbo: false };

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEF;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEF;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      fav: Array.isArray(p.fav) ? p.fav.slice(0, 60) : [],
      recent: Array.isArray(p.recent) ? p.recent.slice(0, 24) : [],
      sound: typeof p.sound === "boolean" ? p.sound : true,
      master: typeof p.master === "number" ? p.master : 0.8,
      music: typeof p.music === "number" ? p.music : 0.35,
      sfx: typeof p.sfx === "number" ? p.sfx : 0.9,
      lang: typeof p.lang === "string" ? p.lang : "en",
      turbo: typeof p.turbo === "boolean" ? p.turbo : false
    };
  } catch (e) { return DEF; }
}

export function writePrefs(p: Prefs): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* storage blocked */ }
}

export function usePrefs() {
  const [p, setP] = useState<Prefs>(DEF);
  useEffect(function () { setP(readPrefs()); }, []);
  const update = useCallback(function (patch: Partial<Prefs>) {
    setP(function (old) { const next: Prefs = Object.assign({}, old, patch); writePrefs(next); return next; });
  }, []);
  const toggleFav = useCallback(function (id: string) {
    setP(function (old) {
      const has = old.fav.indexOf(id) >= 0;
      const fav = has ? old.fav.filter(function (x) { return x !== id; }) : [id].concat(old.fav).slice(0, 60);
      const next: Prefs = Object.assign({}, old, { fav: fav }); writePrefs(next); return next;
    });
  }, []);
  const pushRecent = useCallback(function (id: string) {
    setP(function (old) {
      const recent = [id].concat(old.recent.filter(function (x) { return x !== id; })).slice(0, 24);
      const next: Prefs = Object.assign({}, old, { recent: recent }); writePrefs(next); return next;
    });
  }, []);
  return { p: p, update: update, toggleFav: toggleFav, pushRecent: pushRecent };
}

let fontsDone = false;
export function useKbFonts(): void {
  useEffect(function () {
    if (fontsDone || typeof document === "undefined") return;
    fontsDone = true;
    const pre = document.createElement("link");
    pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "anonymous";
    document.head.appendChild(pre);
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600;700&family=Poppins:wght@400;600;800&family=Cairo:wght@600;800&display=swap";
    document.head.appendChild(l);
  }, []);
}
