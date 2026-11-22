"use client";
import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Assets } from "pixi.js";
import type { CrashPhase } from "@/lib/kb2/crashLoop";

export interface StageInput { phase: CrashPhase; mult: number; progress: number; hue: number; }
interface P { x: number; y: number; vx: number; vy: number; life: number; size: number; }

export default function Stage({ input, craft }: { input: StageInput; craft: string }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<StageInput>(input);
  live.current = input;

  useEffect(function () {
    const el = host.current;
    if (!el) return;
    let dead = false;
    let app: Application | null = null;
    let onResize: (() => void) | null = null;
    const parts: P[] = [];
    let shake = 0;
    let lastPhase: CrashPhase = "betting";
    let camX = 0;
    let camY = 0;
    let t = 0;

    const boot = async function () {
      const mm0 = typeof window !== "undefined" ? window.location.pathname.match(/\/casino\/sky\/([a-z0-9-]+)/) : null;
      if (mm0 && mm0[1] && host.current) {
        host.current.style.backgroundImage = "linear-gradient(rgba(5,8,14,.55),rgba(5,8,14,.72)), url(/assets/" + mm0[1] + "/bg.jpg)";
        host.current.style.backgroundSize = "cover";
        host.current.style.backgroundPosition = "center";
        host.current.style.animation = "kb3par 60s ease-in-out infinite alternate";
      }
      const a = new Application();
      try {
        await a.init({
          width: Math.max(320, el.clientWidth),
          height: Math.max(240, el.clientHeight),
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(2, window.devicePixelRatio || 1),
          powerPreference: "high-performance"
        });
      } catch (e) { return; }
      if (dead) { try { a.destroy(true, { children: true }); } catch (e) { /* gone */ } return; }
      app = a;
      el.appendChild(a.canvas);
      a.canvas.style.width = "100%";
      a.canvas.style.height = "100%";
      a.canvas.style.display = "block";

      const world = new Container();
      const far = new Container();
      const mid = new Container();
      const near = new Container();
      const chute = new Container();
      const trail = new Graphics();
      const jet = new Container();
      const jetBody = new Graphics();
      const fx = new Graphics();

      const clearLayer = function (c: Container) {
        const kids = c.removeChildren();
        kids.forEach(function (k) { if (k !== chute) k.destroy(); });
      };

      const ridge = function (g: Graphics, w: number, h: number, base: number, amp: number, color: number, alpha: number, seed: number) {
        g.moveTo(-260, h);
        for (let x = -260; x <= w + 460; x += 38) {
          const y = base + Math.sin((x + seed) * 0.0062) * amp + Math.sin((x + seed) * 0.0173) * amp * 0.42;
          g.lineTo(x, y);
        }
        g.lineTo(w + 460, h);
        g.closePath();
        g.fill({ color: color, alpha: alpha });
      };

      const buildBack = function () {
        const w = a.screen.width;
        const h = a.screen.height;
        clearLayer(far); clearLayer(mid); clearLayer(near);
        const g1 = new Graphics(); ridge(g1, w, h, h * 0.60, 28, 0x101d33, 0.9, 0); far.addChild(g1);
        const stars = new Graphics();
        for (let i = 0; i < 46; i++) {
          const sx = (i * 137) % (w + 300) - 100;
          const sy = (i * 71) % Math.max(60, h * 0.5);
          stars.circle(sx, sy, i % 6 === 0 ? 1.6 : 0.9).fill({ color: 0xffffff, alpha: i % 3 === 0 ? 0.7 : 0.35 });
        }
        far.addChild(stars);
        const cl = new Graphics();
        for (let i = 0; i < 8; i++) {
          const cx = (i * 240) % (w + 520) - 160;
          const cy = 34 + (i % 3) * 44;
          cl.ellipse(cx, cy, 78, 21).fill({ color: 0xffffff, alpha: 0.055 });
          cl.ellipse(cx + 44, cy - 9, 52, 16).fill({ color: 0xffffff, alpha: 0.04 });
        }
        far.addChild(cl);
        const g2 = new Graphics(); ridge(g2, w, h, h * 0.73, 34, 0x0a1220, 0.94, 880); mid.addChild(g2);
        chute.removeChildren().forEach(function (c) { c.destroy(); });
        for (let i = 0; i < 5; i++) {
          const c = new Container();
          const gg = new Graphics();
          gg.arc(0, 0, 15, Math.PI, 0).fill({ color: live.current.hue, alpha: 0.32 });
          gg.moveTo(-15, 0).lineTo(-4, 19).lineTo(4, 19).lineTo(15, 0).stroke({ width: 1, color: 0xffffff, alpha: 0.22 });
          gg.rect(-4, 19, 8, 7).fill({ color: 0x0a1220, alpha: 0.9 });
          c.addChild(gg);
          c.x = 70 + i * 175;
          c.y = 62 + (i % 2) * 46;
          chute.addChild(c);
        }
        mid.addChild(chute);
        const g3 = new Graphics(); ridge(g3, w, h, h * 0.88, 22, 0x04070d, 1, 1650); near.addChild(g3);
      };

      const drawJet = function () {
        jetBody.clear();
        const kb = (jetBody as any);
        if (!kb.__kbStarted) {
          kb.__kbStarted = true;
          const mm = typeof window !== "undefined" ? window.location.pathname.match(/\/casino\/sky\/([a-z0-9-]+)/) : null;
          if (mm && mm[1]) {
            Assets.load("/assets/" + mm[1] + "/character.png").then(function (tex) {
              const sp = Sprite.from(tex);
              sp.anchor.set(0.5, 0.5);
              sp.scale.set(150 / Math.max(1, tex.width));
              if (jetBody.parent) jetBody.parent.addChild(sp);
              kb.__kbSprite = sp;
              kb.__kbLast = null;
              jetBody.visible = false;
            }).catch(function () { /* keep drawn craft */ });
          }
        }
        if (kb.__kbSprite) {
          const gp = jetBody.getGlobalPosition();
          if (kb.__kbLast) {
            const dx = gp.x - kb.__kbLast.x;
            const dy = gp.y - kb.__kbLast.y;
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
              kb.__kbSprite.rotation = Math.atan2(dy, dx) * 0.6;
            }
          }
          kb.__kbLast = { x: gp.x, y: gp.y };
        }
        const c = live.current.hue;
        if (craft === "rocket") {
          jetBody.moveTo(0, -24).quadraticCurveTo(12, -6, 12, 13).lineTo(-12, 13).quadraticCurveTo(-12, -6, 0, -24).fill({ color: 0xfff6d8 }).stroke({ width: 1.4, color: c });
          jetBody.moveTo(-12, 4).lineTo(-22, 19).lineTo(-12, 15).closePath().fill({ color: c });
          jetBody.moveTo(12, 4).lineTo(22, 19).lineTo(12, 15).closePath().fill({ color: c });
          jetBody.circle(0, -5, 5.4).fill({ color: 0x8fd8ff }).stroke({ width: 1.2, color: 0x12405e });
        } else if (craft === "airship") {
          jetBody.ellipse(0, 0, 32, 14).fill({ color: 0xfff6d8 }).stroke({ width: 1.4, color: c });
          jetBody.moveTo(28, -8).lineTo(41, -14).lineTo(41, 14).lineTo(28, 8).closePath().fill({ color: c });
          jetBody.rect(-10, 14, 20, 8).fill({ color: 0x2b1e04 });
          jetBody.ellipse(-11, -6, 13, 4.4).fill({ color: 0xffffff, alpha: 0.42 });
        } else if (craft === "heli") {
          jetBody.rect(-32, -17, 64, 3).fill({ color: 0x2b1e04 });
          jetBody.rect(-2, -15, 4, 8).fill({ color: 0x2b1e04 });
          jetBody.ellipse(0, 0, 23, 10.5).fill({ color: 0xfff6d8 }).stroke({ width: 1.4, color: c });
          jetBody.ellipse(12, -1, 7, 5).fill({ color: 0x8fd8ff }).stroke({ width: 1, color: 0x12405e });
          jetBody.moveTo(-15, 11).lineTo(15, 11).stroke({ width: 2, color: 0x2b1e04 });
        } else {
          jetBody.moveTo(-32, 2).lineTo(14, -6).lineTo(35, -16).lineTo(42, -12).lineTo(25, -2).lineTo(42, 9).lineTo(35, 12).lineTo(14, 4).lineTo(-32, 2).closePath().fill({ color: 0xfff6d8 }).stroke({ width: 1.4, color: c });
          jetBody.moveTo(-4, -3).lineTo(-19, -23).lineTo(-10, -22).lineTo(9, -5).closePath().fill({ color: c });
          jetBody.moveTo(-4, 3).lineTo(-19, 23).lineTo(-10, 22).lineTo(9, 5).closePath().fill({ color: c });
          jetBody.ellipse(23, -6, 6.2, 3.6).fill({ color: 0x8fd8ff }).stroke({ width: 1, color: 0x12405e });
        }
      };

      buildBack();
      drawJet();
      jet.addChild(jetBody);
      world.addChild(far); world.addChild(mid); world.addChild(near);
      world.addChild(trail); world.addChild(jet); world.addChild(fx);
      a.stage.addChild(world);

      onResize = function () {
        if (!app || !el) return;
        app.renderer.resize(Math.max(320, el.clientWidth), Math.max(240, el.clientHeight));
        buildBack();
      };
      window.addEventListener("resize", onResize);

      a.ticker.add(function (tk) {
        if (!app) return;
        const dt = Math.min(3, tk.deltaTime);
        t += dt;
        const s = live.current;
        const w = app.screen.width;
        const h = app.screen.height;
        const baseX = w * 0.10;
        const baseY = h * 0.84;
        const spanX = w * 0.66;
        const spanY = h * 0.60;
        const p = s.phase === "crashed" ? 1 : Math.max(0, Math.min(1, s.progress));
        const px = baseX + spanX * p;
        const py = baseY - spanY * Math.pow(p, 1.45);

        far.x = -((t * 0.11) % 420);
        mid.x = -((t * 0.33) % 420);
        near.x = -((t * 0.70) % 420);
        for (let i = 0; i < chute.children.length; i++) {
          const c = chute.children[i];
          c.y += Math.sin((t + i * 40) * 0.013) * 0.2;
          c.x -= 0.15 * dt;
          if (c.x < -90) c.x = w + 130;
        }

        const tcx = Math.max(0, px - w * 0.55) * 0.55;
        const tcy = Math.min(0, py - h * 0.42) * 0.35;
        camX += (tcx - camX) * 0.06 * dt;
        camY += (tcy - camY) * 0.06 * dt;

        if (s.phase === "crashed" && lastPhase !== "crashed") {
          shake = 17;
          for (let i = 0; i < 48; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 1.3 + Math.random() * 5.4;
            parts.push({ x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.1, life: 1, size: 1.5 + Math.random() * 3.6 });
          }
        }
        if (s.phase === "betting" && lastPhase !== "betting") parts.length = 0;
        lastPhase = s.phase;
        if (shake > 0) shake = Math.max(0, shake - 0.72 * dt);
        world.x = -camX + (shake > 0 ? (Math.random() - 0.5) * shake : 0);
        world.y = -camY + (shake > 0 ? (Math.random() - 0.5) * shake : 0);

        trail.clear();
        if (s.phase !== "betting" && p > 0.001) {
          const steps = 44;
          for (let layer = 0; layer < 3; layer++) {
            const wid = [12, 6, 2.4][layer];
            const alp = [0.09, 0.2, 0.95][layer];
            trail.moveTo(baseX, baseY);
            for (let i = 1; i <= steps; i++) {
              const q = (i / steps) * p;
              trail.lineTo(baseX + spanX * q, baseY - spanY * Math.pow(q, 1.45));
            }
            trail.stroke({ width: wid, color: layer === 2 ? 0xfff6d8 : live.current.hue, alpha: alp, cap: "round", join: "round" });
          }
          trail.moveTo(baseX, baseY);
          for (let i = 1; i <= steps; i++) {
            const q = (i / steps) * p;
            trail.lineTo(baseX + spanX * q, baseY - spanY * Math.pow(q, 1.45));
          }
          trail.lineTo(px, baseY).lineTo(baseX, baseY).closePath().fill({ color: live.current.hue, alpha: 0.1 });
        }

        jet.x = px;
        jet.y = py + (s.phase === "flying" ? Math.sin(t * 0.09) * 2.2 : 0);
        const slope = p > 0.02 ? Math.atan2(-spanY * 1.45 * Math.pow(Math.max(0.02, p), 0.45), spanX) : -0.18;
        jet.rotation = s.phase === "crashed" ? 0.95 : Math.max(-0.62, slope * 0.55);
        jet.visible = s.phase !== "crashed";
        jet.alpha = s.phase === "betting" ? 0.35 : 1;

        fx.clear();
        if (s.phase === "flying") {
          const fl = 13 + Math.min(36, (s.mult - 1) * 7);
          fx.moveTo(px - 28, py + 2).lineTo(px - 28 - fl, py + 5).lineTo(px - 28, py + 9).closePath().fill({ color: 0xff9f43, alpha: 0.72 });
          fx.moveTo(px - 28, py + 3).lineTo(px - 28 - fl * 0.58, py + 5).lineTo(px - 28, py + 7).closePath().fill({ color: 0xfff6d8, alpha: 0.9 });
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const q = parts[i];
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.vy += 0.14 * dt;
          q.vx *= 0.985;
          q.life -= 0.016 * dt;
          if (q.life <= 0) { parts.splice(i, 1); continue; }
          fx.circle(q.x, q.y, Math.max(0.4, q.size * q.life)).fill({ color: q.life > 0.55 ? 0xfff6d8 : 0xff4757, alpha: Math.max(0, q.life) });
        }
        if (s.phase === "crashed") {
          fx.circle(px, py, 26 + Math.sin(t * 0.2) * 3).stroke({ width: 2, color: 0xff4757, alpha: 0.42 });
        }
      });
    };

    void boot();
    return function () {
      dead = true;
      if (onResize) window.removeEventListener("resize", onResize);
      const a = app;
      app = null;
      if (a) {
        try { a.canvas.remove(); } catch (e) { /* gone */ }
        try { a.destroy(true, { children: true }); } catch (e) { /* gone */ }
      }
    };
  }, [craft]);

  return <div ref={host} className="kb3-stage-canvas"/>;
}
