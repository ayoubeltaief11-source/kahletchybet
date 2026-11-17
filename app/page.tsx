"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import GameTile from "@/components/GameTile";
import Winners from "@/components/Winners";
import { SPORTS, CASINO_CATEGORIES, tr } from "@/lib/catalog";

export default function Home() {
  const { lang, me } = useApp();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [state, setState] = useState<any>({ loading: true });
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/sports?sport=football").then(r => r.json()).then(d => { setFixtures((d.fixtures ?? []).slice(0, 3)); setState(d); }).catch(() => setState({ source: "error" }));
    fetch("/api/games").then(r => r.json()).then(d => setGames((d.games ?? []).filter((g: any) => g.launchable).slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div className="col" style={{ gap: 30 }}>
      <section className="hero fade">
        <span className="tag g">EDUCATIONAL DEMO - VIRTUAL CREDITS</span>
        <h1 className="h1" style={{ marginTop: 18 }}>kahlatchy<span style={{ color: "var(--gold)" }}>bet</span></h1>
        <p className="lead">
          {lang === "ar" ? "\u0645\u0646\u0635\u0629 \u062a\u0639\u0644\u064a\u0645\u064a\u0629 \u062a\u0631\u0641\u064a\u0647\u064a\u0629 \u0641\u062e\u0645\u0629 \u0644\u0644\u0631\u064a\u0627\u0636\u0629 \u0648\u0627\u0644\u0643\u0627\u0632\u064a\u0646\u0648 \u0628\u0623\u0631\u0635\u062f\u0629 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0641\u0642\u0637."
            : lang === "fr" ? "Plateforme educative premium de sport et casino, avec des credits virtuels uniquement."
            : "A premium sportsbook and casino entertainment platform. Rich markets, live games, and a virtual credit wallet - no real money at any point."}
        </p>
        <div className="row wrap">
          <Link href="/sports" className="btn j"><Icon name="football" />{tr(lang, "sports")}</Link>
          <Link href="/casino" className="btn g"><Icon name="casino" />{tr(lang, "casino")}</Link>
          {!me && <Link href="/register" className="btn o"><Icon name="user" />{tr(lang, "register")}</Link>}
        </div>
        <div className="note g" style={{ marginTop: 24 }}>{tr(lang, "demo")}</div>
      </section>

      <Winners />

      <section>
        <div className="bt wrap mb">
          <h2 className="h2" style={{ margin: 0 }}><span className="dot" />{tr(lang, "live")} - Football</h2>
          <span className={"tag " + (state.simulated ? "v" : "j")}>{state.loading ? "LOADING" : state.simulated ? "SIMULATED" : "PROVIDER"}</span>
        </div>
        <div className="grid g3">
          {fixtures.map(f => (
            <Link key={f.id} href={"/sports/football/" + f.id} className="match card hov">
              <div className="bt xxs faint"><span className="clip">{f.league}</span><span className="row" style={{ gap: 5 }}>{f.state === "LIVE" && <span className="dot" />}{f.state}</span></div>
              <div className="teams">
                <div className="tm"><div className="crest-sm">{f.homeLogo ? <img src={f.homeLogo} alt="" /> : <b>{f.home[0]}</b>}</div><span className="clip">{f.home}</span></div>
                <div className="score">{f.scoreHome ?? "-"} : {f.scoreAway ?? "-"}</div>
                <div className="tm r"><div className="crest-sm">{f.awayLogo ? <img src={f.awayLogo} alt="" /> : <b>{f.away[0]}</b>}</div><span className="clip">{f.away}</span></div>
              </div>
              {f.markets?.[0] && (
                <div className="odds" style={{ gridTemplateColumns: `repeat(${Math.min(3, f.markets[0].picks.length)},1fr)` }}>
                  {f.markets[0].picks.slice(0, 3).map((p: any, i: number) => <div key={i} className="odd"><i>{p.label}</i><b>{Number(p.price).toFixed(2)}</b></div>)}
                </div>
              )}
              <div className="xxs faint ctr" style={{ marginTop: 8 }}>{f.markets.length} markets available</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="bt wrap mb">
          <h2 className="h2" style={{ margin: 0 }}><Icon name="casino" />{tr(lang, "casino")}</h2>
          <Link href="/casino" className="btn o s">Open lobby â†’</Link>
        </div>
        <div className="grid g4">{games.map(g => <GameTile key={g.id} game={g} />)}</div>
      </section>

      <section>
        <h2 className="h2"><Icon name="globe" />{tr(lang, "sports")}</h2>
        <div className="grid g4">
          {SPORTS.map(s => (
            <Link key={s.key} href={"/sports/" + s.key} className="card hov pad row">
              <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${s.hue}30,${s.hue}08)`, border: `1px solid ${s.hue}44`, color: s.hue, flex: "0 0 44px" }}>
                <Icon name={s.icon} />
              </div>
              <div className="grow"><b style={{ fontSize: 14 }}>{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</b>
                <div className="xxs faint">Rich markets</div></div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h2"><Icon name="plug" />Casino categories</h2>
        <div className="grid g4">
          {CASINO_CATEGORIES.map(c => (
            <Link key={c.key} href={"/casino/" + c.key} className="card hov pad" style={{ borderColor: c.hue + "33" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${c.hue}33,transparent)`, color: c.hue, marginBottom: 12 }}><Icon name={c.glyph} /></div>
              <b style={{ fontSize: 15 }}>{lang === "ar" ? c.ar : lang === "fr" ? c.fr : c.en}</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}