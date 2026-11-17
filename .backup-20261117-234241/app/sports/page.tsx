"use client";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { SPORTS, tr } from "@/lib/catalog";

export default function SportsIndex() {
  const { lang } = useApp();
  return (
    <div className="col">
      <h1 className="h2"><Icon name="globe" />{tr(lang, "sports")}</h1>
      <div className="note g">{tr(lang, "demo")}</div>
      <div className="grid g3">
        {SPORTS.map(s => (
          <Link key={s.key} href={"/sports/" + s.key} className="card hov pad">
            <div className="row mb">
              <div style={{ width: 52, height: 52, borderRadius: 15, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${s.hue}33,transparent)`, border: `1px solid ${s.hue}44`, color: s.hue }}><Icon name={s.icon} /></div>
              <div><b style={{ fontSize: 17 }}>{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</b>
                <div className="xxs faint">{s.key === "football" ? "API-Football Â· fixtures + odds" : "The Odds API Â· bookmaker prices"}</div></div>
            </div>
            <div className="bt"><span className="tag n">{s.key === "football" ? "FOOTBALL_ODDS_API_KEY" : "ODDS_API_KEY"}</span><span className="btn o s">Open â†’</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}