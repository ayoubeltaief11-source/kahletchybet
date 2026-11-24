"use client";
import { useState } from "react";
import { getGame, asset } from "../registry";

function hideImg(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.display = "none"; }

export default function RouletteIntro({ slug, onPlay }: { slug: string; onPlay: () => void }) {
  const g = getGame(slug);
  const [hide, setHide] = useState(false);
  const sub = slug === "crimson-roulette" ? "DOUBLE ZERO · 38 POCKETS" : slug === "royal-velvet" ? "LA PARTAGE · HALF BACK ON ZERO" : slug === "midnight-wheel" || slug === "golden-crown" ? "AUTO LIVE · CONTINUOUS ROUNDS" : "SINGLE ZERO · 37 POCKETS";
  function play() {
    if (hide) { try { window.localStorage.setItem("kb3_rl_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    onPlay();
  }
  return (
    <div className="rli-root">
      <div className="rli-bg" style={{ backgroundImage: "url(" + asset(slug, "cover") + ")" }}/>
      <div className="rli-scrim"/>
      <div className="rli-inner">
        <img className="rli-logo" src={asset(slug, "logo")} alt="" onError={hideImg}/>
        <img className="rli-char" src={asset(slug, "character")} alt="" onError={hideImg}/>
        <h2 className="rli-title">{g.title}</h2>
        <p className="rli-sub">{sub}</p>
        <button className="rli-play" onClick={play}>PLAY NOW</button>
        <label className="rli-check">
          <input type="checkbox" checked={hide} onChange={function (e) { setHide(e.target.checked); }}/>
          <span>Do not show again</span>
        </label>
      </div>
    </div>
  );
}
