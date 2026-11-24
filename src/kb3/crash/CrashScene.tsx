"use client";
import { useEffect, useRef, useState } from "react";
import { getGame, asset } from "../registry";
import "./crash.css";
import { crashSfx } from "./sfx";

export interface CrashSceneProps {
  gameId: string;
  phase: "betting" | "flying" | "crashed";
  multiplier: number;
  progress?: number;
  countdown?: number;
  betCount?: number;
}

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; kind: number; col: string; }

function clamp(n: number, a: number, b: number): number { return Math.max(a, Math.min(b, n)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function mix(c1: number[], c2: number[], t: number): string {
  return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," + Math.round(lerp(c1[1], c2[1], t)) + "," + Math.round(lerp(c1[2], c2[2], t)) + ")";
}
export function multColor(m: number): string {
  if (m < 2) return "#ffffff";
  if (m < 5) return "#ffd97a";
  if (m < 10) return "#ff9a3d";
  if (m < 25) return "#ff5a5a";
  return "#c07aff";
}
function trailCols(id: string): { smoke: string; flame: string; glow: string } {
  if (id === "ember-rocket") return { smoke: "rgba(120,110,100,", flame: "rgba(255,140,40,", glow: "#ff6b3d" };
  if (id === "drift-balloon") return { smoke: "rgba(220,230,240,", flame: "rgba(200,220,255,", glow: "#7fb2ff" };
  if (id === "rotor-heli") return { smoke: "rgba(180,170,150,", flame: "rgba(200,190,160,", glow: "#12d18e" };
  if (id === "nightglide-stealth") return { smoke: "rgba(140,120,220,", flame: "rgba(150,110,255,", glow: "#a855f7" };
  return { smoke: "rgba(235,235,235,", flame: "rgba(255,170,60,", glow: "#e8b33c" };
}

export default function CrashScene({ gameId, phase, multiplier, progress, countdown, betCount }: CrashSceneProps) {
  const g = getGame(slugSafe(gameId));
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const craftRef = useRef<HTMLImageElement>(null);
  const partsRef = useRef<P[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [imgOk, setImgOk] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [muted, setMuted] = useState(false);
  const lastIntRef = useRef(1);
  const [sticks, setSticks] = useState<{ id: number; x: number; y: number; amt: string }[]>([]);
  const [craftSrc, setCraftSrc] = useState(asset(gameId, "character"));
  const stateRef = useRef({ phase: phase, mult: multiplier, progress: -1, cx: 0, cy: 0, fade: 0, angle: 0, fall: 0, scroll: 0, bob: 0, emit: 0 });
  stateRef.current.phase = phase;
  stateRef.current.mult = multiplier;
  stateRef.current.progress = progress === undefined ? -1 : progress;
  const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(function () {
    if (phase !== "crashed") return;
    const cols = trailCols(gameId);
    const w = hostRef.current ? hostRef.current.clientWidth : 800;
    const h = hostRef.current ? hostRef.current.clientHeight : 450;
    const st = stateRef.current;
    const cx = st.cx || (55 / 100 * w);
    const cy = st.cy || (45 / 100 * h);
    for (let i = 0; i < (reduced ? 18 : 60); i++) {
      const a = Math.random() * 6.283;
      const sp = 60 + Math.random() * 240;
      partsRef.current.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.6, max: 1, size: 2 + Math.random() * 4, kind: 2, col: [cols.glow, g.color2, "#ffffff", "#ff9a3d"][i % 4] });
    }
    setFlash(true);
    crashSfx.boom();
    setShake(true);
    const t1 = window.setTimeout(function () { setFlash(false); }, 80);
    const t2 = window.setTimeout(function () { setShake(false); }, 400);
    return function () { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [phase, gameId, reduced, g.color2]);

  useEffect(function () { setMuted(crashSfx.isMuted()); const im = new Image(); im.onload = function () { setCraftSrc("/assets/" + gameId + "/character-side.png"); }; im.src = "/assets/" + gameId + "/character-side.png"; }, [gameId]);

  useEffect(function () {
    if (countdown === undefined || countdown > 3 || countdown <= 0) return;
    crashSfx.count();
  }, [countdown]);

  useEffect(function () {
    if (phase !== "flying") return;
    let n = 0;
    const iv = window.setInterval(function () {
      n += 1;
      const id = Date.now() + n;
      const amt = (2 + Math.random() * 40).toFixed(2);
      setSticks(function (s) { return s.concat([{ id: id, x: 15 + Math.random() * 65, y: 20 + Math.random() * 40, amt: amt }]).slice(-6); });
      window.setTimeout(function () { setSticks(function (s) { return s.filter(function (x) { return x.id !== id; }); }); }, 2200);
    }, 2600);
    return function () { window.clearInterval(iv); };
  }, [phase]);

  useEffect(function () {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = performance.now();
    const stars: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random() * 0.7, r: Math.random() * 1.4 + 0.4 });
    const clouds: { x: number; y: number; s: number }[] = [];
    for (let i = 0; i < 7; i++) clouds.push({ x: Math.random(), y: 0.15 + Math.random() * 0.4, s: 0.6 + Math.random() * 0.9 });
    const near: { x: number; y: number; k: number }[] = [];
    for (let i = 0; i < 5; i++) near.push({ x: Math.random(), y: 0.5 + Math.random() * 0.35, k: i % 2 });
    const imgs: Record<string, HTMLImageElement | null> = { far: null, farL: null, mid: null, near: null, smoke: null, spark: null, launch: null };
    function tryLoad(key: string, url: string) { const im = new Image(); im.onload = function () { imgs[key] = im; }; im.src = url; }
    tryLoad("far", asset(gameId, "bg"));
    tryLoad("farL", "/assets/" + gameId + "/layer-far.png");
    tryLoad("launch", "/assets/" + gameId + "/launch-scene.png");
    tryLoad("mid", "/assets/" + gameId + "/layer-mid.png");
    tryLoad("near", "/assets/" + gameId + "/layer-near.png");
    tryLoad("smoke", "/assets/crash/smoke.png");
    tryLoad("spark", "/assets/crash/spark.png");
    function resize() { w = host!.clientWidth; h = host!.clientHeight; cv!.width = w; cv!.height = h; }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    function pathPos(p: number): { x: number; y: number } { const e = 1 - Math.pow(1 - p, 2); return { x: 8 + 47 * e, y: 82 - 37 * e }; }
    const cols = trailCols(gameId);

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const m = st.mult;
      crashSfx.engine(st.phase === "flying" ? m : 0);
      const li = Math.floor(m);
      if (st.phase === "flying" && li !== lastIntRef.current) { lastIntRef.current = li; crashSfx.pulse(); }
      const t = clamp(Math.log(Math.max(1, m)) / Math.log(50), 0, 1);
      const speed = (reduced ? 0.4 : 1) * (14 + t * 90);
      if (st.phase === "flying") st.scroll += speed * dt;
      st.bob = now / 1000;
      if (st.phase === "crashed") st.fall = Math.min(1, st.fall + dt * 1.6); else st.fall = 0;
      const skyTop = t < 0.5 ? mix([42, 74, 122], [58, 42, 90], t * 2) : mix([58, 42, 90], [5, 10, 24], (t - 0.5) * 2);
      const skyBot = t < 0.5 ? mix([122, 90, 58], [196, 106, 58], t * 2) : mix([196, 106, 58], [10, 20, 48], (t - 0.5) * 2);
      const grad = ctx!.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBot);
      ctx!.fillStyle = grad; ctx!.fillRect(0, 0, w, h);
      const starA = Math.max(0, (t - 0.55) / 0.45);
      if (imgs.launch && st.fade < 1) { ctx!.globalAlpha = 1 - st.fade; ctx!.drawImage(imgs.launch, 0, 0, w, h); ctx!.globalAlpha = 1; }
      if (st.phase === "betting") st.fade = 0; else st.fade = Math.min(1, st.fade + dt / 0.6);
      if (starA > 0) { ctx!.fillStyle = "rgba(255,255,255," + (starA * 0.9).toFixed(2) + ")"; for (const s of stars) { ctx!.beginPath(); ctx!.arc(s.x * w, s.y * h, s.r, 0, 6.283); ctx!.fill(); } }
      if (imgs.far) { ctx!.globalAlpha = 1; ctx!.drawImage(imgs.far, 0, 0, w, h); ctx!.fillStyle = "rgba(4,7,12," + (0.35 + t * 0.3).toFixed(2) + ")"; ctx!.fillRect(0, 0, w, h); }
      if (imgs.farL) { const off = (st.scroll * 0.05) % w; ctx!.globalAlpha = 0.6; ctx!.drawImage(imgs.farL, -off, h * 0.25, w * 1.3, h * 0.75); ctx!.drawImage(imgs.farL, w * 1.3 - off, h * 0.25, w * 1.3, h * 0.75); ctx!.globalAlpha = 1; }
      ctx!.globalAlpha = 0.55;
      if (imgs.mid) { const mw = w * 1.4; const off = (st.scroll * 0.15) % mw; ctx!.drawImage(imgs.mid, -off, h * 0.1, mw, h * 0.6); ctx!.drawImage(imgs.mid, mw - off, h * 0.1, mw, h * 0.6); }
      else { ctx!.fillStyle = "rgba(255,255,255,0.16)"; for (const c of clouds) { const cx = ((c.x * w - st.scroll * 0.4) % (w + 200) + w + 200) % (w + 200) - 100; ctx!.beginPath(); ctx!.ellipse(cx, c.y * h, 60 * c.s, 18 * c.s, 0, 0, 6.283); ctx!.fill(); } }
      ctx!.globalAlpha = 1;
      if (imgs.near && !g.hideNear) { const nw = w * 1.2; const off = (st.scroll * 0.35) % nw; ctx!.globalAlpha = 0.35; ctx!.drawImage(imgs.near, -off, h * 0.35, nw, h * 0.65); ctx!.drawImage(imgs.near, nw - off, h * 0.35, nw, h * 0.65); ctx!.globalAlpha = 1; }
      ctx!.globalCompositeOperation = "soft-light"; ctx!.globalAlpha = 0.4; ctx!.fillStyle = g.color; ctx!.fillRect(0, 0, w, h); ctx!.globalCompositeOperation = "source-over"; ctx!.globalAlpha = 1;
      if (!imgs.near && !g.hideNear) { for (const n of near) { const nx = ((n.x * w - st.scroll * 0.9) % (w + 120) + w + 120) % (w + 120) - 60; const ny = n.y * h; if (n.k === 0) { ctx!.strokeStyle = "rgba(20,26,36,0.7)"; ctx!.lineWidth = 2; ctx!.beginPath(); ctx!.moveTo(nx - 8, ny); ctx!.quadraticCurveTo(nx - 3, ny - 5, nx, ny); ctx!.quadraticCurveTo(nx + 3, ny - 5, nx + 8, ny); ctx!.stroke(); } else { ctx!.fillStyle = "rgba(196,106,58,0.5)"; ctx!.beginPath(); ctx!.ellipse(nx, ny, 9, 11, 0, 0, 6.283); ctx!.fill(); } } }
      if (st.phase === "betting") { ctx!.fillStyle = "rgba(16,20,28,0.95)"; ctx!.fillRect(0, h * 0.86, w, h * 0.14); ctx!.strokeStyle = "rgba(255,217,122,0.5)"; ctx!.lineWidth = 2; ctx!.setLineDash([18, 14]); ctx!.beginPath(); ctx!.moveTo(0, h * 0.9); ctx!.lineTo(w, h * 0.9); ctx!.stroke(); ctx!.setLineDash([]); trailRef.current = []; }
      const p = st.phase === "flying" ? (st.progress >= 0 ? clamp(st.progress, 0, 1) : clamp(Math.log(Math.max(1, m)) / Math.log(30), 0, 1)) : 0;
      const pos = pathPos(p);
      const nxt = pathPos(Math.min(1, p + 0.01));
      const dx = (nxt.x - pos.x) * w / 100;
      const dy = (nxt.y - pos.y) * h / 100;
      const target = st.phase === "flying" ? clamp(Math.atan2(dy, dx) * 180 / Math.PI, -35, 15) : 0;
      st.angle = lerp(st.angle, target, 0.12);
      const bobY = st.phase === "flying" && !reduced ? Math.sin(st.bob * 2.2) * 0.6 : 0;
      const cx = pos.x / 100 * w;
      const cy = (pos.y + bobY) / 100 * h;
      st.cx = cx; st.cy = cy;
      if (st.phase === "flying") {
        trailRef.current.push({ x: cx, y: cy });
        if (trailRef.current.length > 46) trailRef.current.shift();
        const rad = st.angle * Math.PI / 180;
        const rx = cx - Math.cos(rad) * 52;
        const ry = cy - Math.sin(rad) * 52;
        st.emit += (reduced ? 24 : 50 + t * 70) * dt;
        while (st.emit > 1) {
          st.emit -= 1;
          const flame = Math.random() < 0.45;
          partsRef.current.push({ x: rx + (Math.random() - 0.5) * 6, y: ry + (Math.random() - 0.5) * 6, vx: -Math.cos(rad) * 40 + (Math.random() - 0.5) * 24, vy: -Math.sin(rad) * 40 + (Math.random() - 0.5) * 24 - (flame ? 0 : 14), life: flame ? 0.25 : 0.8, max: flame ? 0.25 : 0.8, size: flame ? 3 + Math.random() * 4 : 4 + Math.random() * 6, kind: flame ? 1 : 0, col: flame ? cols.flame : cols.smoke });
        }
      }
      if (trailRef.current.length > 2) {
        ctx!.strokeStyle = cols.glow;
        ctx!.lineWidth = 2;
        ctx!.shadowColor = cols.glow;
        ctx!.shadowBlur = 8;
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx!.globalAlpha = (i / trailRef.current.length) * 0.45;
          ctx!.beginPath();
          ctx!.moveTo(trailRef.current[i - 1].x, trailRef.current[i - 1].y);
          ctx!.lineTo(trailRef.current[i].x, trailRef.current[i].y);
          ctx!.stroke();
        }
        ctx!.globalAlpha = 1;
        ctx!.shadowBlur = 0;
      }
      const parts = partsRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.life -= dt;
        if (q.life <= 0) { parts.splice(i, 1); continue; }
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.kind === 0) { q.vy -= 10 * dt; q.size += 14 * dt; }
        if (q.kind === 2) q.vy += 220 * dt;
        const a = q.life / q.max;
        if (q.kind === 0) { ctx!.globalCompositeOperation = "lighter"; ctx!.globalAlpha = a * 0.5; if (imgs.smoke) { ctx!.drawImage(imgs.smoke, q.x - q.size, q.y - q.size, q.size * 2, q.size * 2); } else { ctx!.fillStyle = q.col + (a * 0.5).toFixed(2) + ")"; ctx!.beginPath(); ctx!.arc(q.x, q.y, q.size, 0, 6.283); ctx!.fill(); } ctx!.globalCompositeOperation = "source-over"; }
        else { ctx!.globalCompositeOperation = "lighter"; ctx!.globalAlpha = a; if (imgs.spark) { const ss = q.size * 3; ctx!.drawImage(imgs.spark, q.x - ss / 2, q.y - ss / 2, ss, ss); } else { ctx!.fillStyle = q.kind === 1 ? q.col + a.toFixed(2) + ")" : q.col; ctx!.beginPath(); ctx!.arc(q.x, q.y, q.size * (q.kind === 1 ? a : 1), 0, 6.283); ctx!.fill(); } ctx!.globalCompositeOperation = "source-over"; }
      }
      ctx!.globalAlpha = 1;
      if (parts.length > 220) parts.splice(0, parts.length - 220);
      const el = craftRef.current;
      if (el) {
        const fy = pos.y + bobY + st.fall * 30;
        const rot = st.angle - (g.baseAngle || 0) + st.fall * 120;
        const flip = g.facing === "left" ? -1 : 1;
        el.style.left = pos.x + "%";
        el.style.top = fy + "%";
        el.style.transform = "translate(-50%,-50%) rotate(" + rot.toFixed(2) + "deg) scaleX(" + flip + ")";
        el.style.opacity = String((imgOkRef.current ? 1 : 0) * (1 - st.fall));
      }
    }
    raf = requestAnimationFrame(loop);
    function onVis() { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(loop); } }
    document.addEventListener("visibilitychange", onVis);
    return function () { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); ro.disconnect(); crashSfx.engine(0); };
  }, [gameId, reduced, g.baseAngle, g.facing]);

  const imgOkRef = useRef(false);
  imgOkRef.current = imgOk;
  const m = multiplier;
  const intPart = Math.floor(m);
  return (
    <div className={"rcs-host" + (shake ? " rcs-shake" : "")} ref={hostRef}>
      <canvas ref={canvasRef} className="rcs-canvas"/>
      {sticks.map(function (s) { return <div key={s.id} className="rcs-sticker" style={{ left: s.x + "%", top: s.y + "%" }}>+{s.amt} TD<i>SIM</i></div>; })}
      <img className="rcs-logo" src={asset(gameId, "logo")} alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
      <button className="rcs-mute" onClick={function () { crashSfx.unlock(); setMuted(crashSfx.toggleMute()); }}>{muted ? "MUTED" : "MUTE"}</button>
      <img ref={craftRef} className="rcs-craft" src={craftSrc} alt="" onLoad={function () { setImgOk(true); }} style={{ opacity: 0 }}/>
      {flash && <div className="rcs-flash"/>}
      {phase !== "betting" && (
        <div className="rcs-mult" key={intPart} style={{ color: multColor(m) }}>{m.toFixed(2)}x</div>
      )}
      {phase === "betting" && (
        <div className="rcs-betmsg"><b>PLACE YOUR BET</b><span className="rcs-ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" className="rcs-ring-bg" pathLength={100}/><circle cx="20" cy="20" r="16" className="rcs-ring-fg" pathLength={100} strokeDasharray="100" style={{ strokeDashoffset: String(100 - clamp((countdown || 0) / 20, 0, 1) * 100) }}/></svg><b>{countdown !== undefined ? countdown : ""}</b></span><em>{betCount !== undefined ? betCount + " bets" : ""}</em></div>
      )}
      {phase === "crashed" && <div className="rcs-crashed">CRASHED @ {m.toFixed(2)}x</div>}
    </div>
  );
}

function slugSafe(id: string): string { return id; }
