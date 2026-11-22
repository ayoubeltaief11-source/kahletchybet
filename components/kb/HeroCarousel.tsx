"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { KB_GAMES } from "@/lib/kb/catalog";
import { sigOf, PATH_NAME, FEATURE_NAME } from "@/lib/kb/sig";
import { useKbFonts } from "@/lib/kb/prefs";
import Poster from "./Art";

export default function HeroCarousel() {
  useKbFonts();
  const slides = useMemo(function () {
    const want = ["jet", "mega5", "jackpot5", "vip", "mines", "plinko"];
    const out: typeof KB_GAMES = [];
    want.forEach(function (v) {
      const hit = KB_GAMES.find(function (g) { return g.variant === v; });
      if (hit) out.push(hit);
    });
    return out;
  }, []);
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const timer = useRef<number>(0);
  useEffect(function () {
    if (hold || slides.length < 2) return;
    timer.current = window.setInterval(function () {
      setI(function (v) { return (v + 1) % slides.length; });
    }, 6000);
    return function () { if (timer.current) clearInterval(timer.current); };
  }, [hold, slides.length]);
  if (slides.length === 0) return <div className="k2-skel" style={{ height: 250 }}/>;
  const go = function (d: number) { setI(function (v) { return (v + d + slides.length) % slides.length; }); };
  return (
    <section className="k2-hero" onMouseEnter={function () { setHold(true); }} onMouseLeave={function () { setHold(false); }}>
      <div className="k2-hero-track" style={{ transform: "translateX(" + (-i * 100) + "%)" }}>
        {slides.map(function (g) {
          const s = sigOf(g.id);
          const tag = g.family === "crash" ? PATH_NAME[s.path] : g.family === "slots" ? FEATURE_NAME[s.feature] : g.family.toUpperCase();
          return (
            <article key={g.id} className="k2-hero-slide">
              <div className="k2-hero-art"><Poster g={g}/></div>
              <div className="k2-hero-shade"/>
              <div className="k2-hero-body">
                <div className="k2-hero-meta">
                  <span className="k2-demo">Demo - no real money</span>
                  <span className="k2-hero-tag">{tag}</span>
                  <span className="k2-hero-tag">{g.vol} volatility</span>
                </div>
                <h2>{g.name}</h2>
                <p>Server-settled round against your TD wallet. House edge is shown on every game because the long-run result is the lesson.</p>
                <div className="k2-hero-meta">
                  <Link href={"/casino/play/" + g.id} className="k2-btn k2-btn-gold">PLAY NOW</Link>
                  <Link href="/learn" className="k2-btn">HOW RTP WORKS</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <button className="k2-hero-nav prev" onClick={function () { go(-1); }} aria-label="Previous">&#8249;</button>
      <button className="k2-hero-nav next" onClick={function () { go(1); }} aria-label="Next">&#8250;</button>
      <div className="k2-hero-dots">
        {slides.map(function (g, k) {
          return <i key={g.id} className={k === i ? "on" : ""} onClick={function () { setI(k); }}/>;
        })}
      </div>
    </section>
  );
}
