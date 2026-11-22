"use client";
import { useEffect, useRef } from "react";

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ParticleField({ accent, density }: { accent: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(function () {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0, h = 0;
    const N = density || 26;
    const parts: { x: number; y: number; r: number; vy: number; vx: number; a: number }[] = [];
    function resize() {
      if (!cv) return;
      w = cv.width = cv.offsetWidth;
      h = cv.height = cv.offsetHeight;
    }
    resize();
    for (let i = 0; i < N; i++) {
      parts.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.4, vy: -(0.12 + Math.random() * 0.3), vx: (Math.random() - 0.5) * 0.16, a: 0.15 + Math.random() * 0.4 });
    }
    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced()) raf = requestAnimationFrame(tick);
    }
    if (!reduced()) raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return function () { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [accent, density]);
  return <canvas ref={ref} className="kb3-pfield" aria-hidden="true"/>;
}

export function burstAt(host: HTMLElement | null, color: string, count?: number) {
  if (!host || reduced()) return;
  const cv = document.createElement("canvas");
  cv.className = "kb3-burst";
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) { return; }
  const w = cv.width = host.offsetWidth;
  const h = cv.height = host.offsetHeight;
  const cx = w / 2, cy = h / 2;
  const N = count || 16;
  const ps: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = [];
  for (let i = 0; i < N; i++) {
    const a = (Math.PI * 2 * i) / N + Math.random() * 0.4;
    const sp = 2 + Math.random() * 3.4;
    ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, r: 1.6 + Math.random() * 2.6 });
  }
  let raf = 0;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.life -= 0.028;
      if (p.life > 0) {
        alive++;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (alive > 0) raf = requestAnimationFrame(tick);
    else if (cv.parentNode) cv.parentNode.removeChild(cv);
  }
  raf = requestAnimationFrame(tick);
}

export function CoinRain({ active, duration }: { active: boolean; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(function () {
    const cv = ref.current;
    if (!cv || !active) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const w = cv.width = cv.offsetWidth;
    const h = cv.height = cv.offsetHeight;
    const coins: { x: number; y: number; vy: number; rot: number; vr: number; r: number }[] = [];
    const N = 70;
    for (let i = 0; i < N; i++) {
      coins.push({ x: Math.random() * w, y: -Math.random() * h, vy: 3 + Math.random() * 4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2, r: 7 + Math.random() * 8 });
    }
    const start = performance.now();
    const dur = duration || 4200;
    function tick(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const c of coins) {
        c.y += c.vy; c.rot += c.vr;
        if (c.y > h + 20) { c.y = -20; c.x = Math.random() * w; }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        const g = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
        g.addColorStop(0, "#fff6d8"); g.addColorStop(0.5, "#ffd97a"); g.addColorStop(1, "#b8860b");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r, c.r * Math.abs(Math.cos(c.rot)) * 0.6 + c.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a6a06"; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }
      if (now - start < dur) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    }
    raf = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(raf); };
  }, [active, duration]);
  if (!active) return null;
  return <canvas ref={ref} className="kb3-coinrain" aria-hidden="true"/>;
}
