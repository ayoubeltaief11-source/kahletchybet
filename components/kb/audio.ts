"use client";
import { useCallback, useRef, useState } from "react";
export function useKbAudio() {
  const ref = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);
  const mref = useRef(false);
  const ac = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ref.current) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ref.current = new C();
    }
    if (ref.current.state === "suspended") void ref.current.resume();
    return ref.current;
  }, []);
  const blip = useCallback((f: number, d: number, type: OscillatorType, g: number, slide?: number) => {
    if (mref.current) return; const c = ac(); if (!c) return;
    try {
      const o = c.createOscillator(), gn = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, c.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), c.currentTime + d);
      gn.gain.setValueAtTime(g, c.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
      o.connect(gn); gn.connect(c.destination); o.start(); o.stop(c.currentTime + d);
    } catch (e) { /* silent */ }
  }, [ac]);
  const noise = useCallback((d: number, g: number, hp: number) => {
    if (mref.current) return; const c = ac(); if (!c) return;
    try {
      const len = Math.floor(c.sampleRate * d);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const dat = buf.getChannelData(0);
      for (let i = 0; i < len; i++) dat[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const flt = c.createBiquadFilter(); flt.type = "highpass"; flt.frequency.value = hp;
      const gn = c.createGain(); gn.gain.value = g;
      src.connect(flt); flt.connect(gn); gn.connect(c.destination); src.start();
    } catch (e) { /* silent */ }
  }, [ac]);
  const seq = useCallback((notes: number[], step: number, d: number, type: OscillatorType, g: number) => {
    notes.forEach(function (n, i) { setTimeout(function () { blip(n, d, type, g); }, i * step); });
  }, [blip]);
  const toggle = useCallback(() => {
    setMuted(function (m) { mref.current = !m; return !m; });
  }, []);
  return {
    muted, toggle,
    click: function () { blip(430, 0.045, "square", 0.05); },
    chip: function () { blip(920, 0.055, "triangle", 0.07, 640); noise(0.05, 0.03, 2600); },
    spin: function () { blip(170, 0.16, "sawtooth", 0.05, 340); },
    reel: function () { blip(130, 0.06, "square", 0.04, 85); },
    tick: function (m: number) { blip(280 + Math.min(950, m * 72), 0.04, "sine", 0.045); },
    count: function (n: number) { blip(400 + n * 110, 0.1, "triangle", 0.07); },
    launch: function () { blip(110, 0.55, "sawtooth", 0.06, 560); noise(0.4, 0.035, 400); },
    cash: function () { seq([784, 988, 1319], 68, 0.18, "sine", 0.11); noise(0.12, 0.03, 3200); },
    win: function () { seq([523, 659, 784, 1047], 82, 0.22, "triangle", 0.1); },
    big: function () { seq([523, 659, 784, 1047, 1319, 1568, 2093], 72, 0.26, "triangle", 0.12); noise(0.5, 0.04, 1800); },
    bust: function () { blip(210, 0.6, "sawtooth", 0.09, 45); noise(0.45, 0.075, 180); },
    lose: function () { blip(250, 0.3, "sine", 0.06, 120); },
    ball: function () { blip(1250, 0.035, "sine", 0.032, 940); },
    safe: function () { blip(660, 0.09, "sine", 0.07, 880); },
    boom: function () { blip(90, 0.55, "square", 0.1, 32); noise(0.5, 0.09, 120); },
    dice: function () { noise(0.16, 0.05, 900); blip(300, 0.08, "square", 0.04, 200); },
    card: function () { noise(0.09, 0.045, 2200); blip(520, 0.05, "triangle", 0.04, 700); },
    chain: function (n: number) { blip(440 + Math.min(1200, n * 130), 0.12, "triangle", 0.09); },
    warn: function () { seq([300, 240], 110, 0.16, "square", 0.06); }
  };
}
