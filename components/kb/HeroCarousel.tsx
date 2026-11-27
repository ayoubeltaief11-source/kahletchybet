"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HERO } from "../../lib/lobby-featured";
import { useKbFonts } from "@/lib/kb/prefs";

function Art({ id, bg, cover, color, color2, title }: { id: string; bg: string; cover: string; color: string; color2: string; title: string }) {
  const [stage, setStage] = useState(0);
  const src = stage === 0 ? bg : stage === 1 ? cover : "";
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg," + color + "," + color2 + ")" }}>
      {src ? (
        <img key={id + stage} src={src} alt={title} decoding="async" onError={function () { setStage(function (s) { return s + 1; }); }}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "72% 50%", display: "block" }}/>
      ) : null}
    </div>
  );
}

export default function HeroCarousel() {
  useKbFonts();
  const slides = HERO;
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const timer = useRef<number>(0);

  useEffect(function () {
    if (hold || slides.length < 2) return;
    timer.current = window.setInterval(function () {
      setI(function (v) { return (v + 1) % slides.length; });
    }, 6000);
    return function () { if (timer.current) window.clearInterval(timer.current); };
  }, [hold, slides.length]);

  useEffect(function () {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setI(function (v) { return (v - 1 + slides.length) % slides.length; });
      if (e.key === "ArrowRight") setI(function (v) { return (v + 1) % slides.length; });
    }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [slides.length]);

  if (slides.length === 0) return null;
  const go = function (d: number) { setI(function (v) { return (v + d + slides.length) % slides.length; }); };

  return (
    <section className="k2-hero" onMouseEnter={function () { setHold(true); }} onMouseLeave={function () { setHold(false); }}>
      <div className="k2-hero-track" style={{ transform: "translateX(" + (-i * 100) + "%)" }}>
        {slides.map(function (g) {
          return (
            <article key={g.id} className="k2-hero-slide">
              <div className="k2-hero-art">
                <Art id={g.id} bg={g.bg} cover={g.cover} color={g.color} color2={g.color2} title={g.title}/>
              </div>
              <div className="k2-hero-shade" style={{ background: "linear-gradient(90deg, rgba(6,8,14,.94) 0%, rgba(6,8,14,.82) 38%, rgba(6,8,14,.28) 68%, rgba(6,8,14,.05) 100%)" }}/>
              <div className="k2-hero-body">
                <div className="k2-hero-meta">
                  <span className="k2-demo">Demo - no real money</span>
                  <span className="k2-hero-tag">{g.tag}</span>
                  <span className="k2-hero-tag">EXCLUSIVE</span>
                </div>
                <h2>{g.title}</h2>
                <p>{g.blurb}</p>
                <div className="k2-hero-meta">
                  <Link href={g.href} className="k2-btn k2-btn-gold">PLAY NOW</Link>
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
