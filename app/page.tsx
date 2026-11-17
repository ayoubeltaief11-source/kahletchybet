"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import GameTile from "@/components/GameTile";
import { SPORTS, CASINO_CATEGORIES, tr } from "@/lib/catalog";

export default function Home() {
  const { lang, me } = useApp();
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [state, setState] = useState<any>({ loading: true });
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/sports?sport=football").then(r => r.json()).then(d => { setFixtures((d.fixtures ?? []).slice(0, 3)); setState(d); }).catch(() => setState({ source: "error", message: "Network error" }));
    fetch("/api/games").then(r => r.json()).then(d => setGames((d.games ?? []).filter((g: any) => g.featured).slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div className="col" style={{ gap: 30 }}>
      <section className="hero fade">
        <span className="tag g">EDUCATIONAL DEMO Â· VIRTUAL CREDITS</span>
        <h1 className="h1" style={{ marginTop: 18 }}>VORTEX <span style={{ color: "var(--gold)" }}>BET</span></h1>
        <p className="lead">
          {lang === "ar" ? "Ù…Ù†ØµØ© ÙˆÙŠØ¨ Ø§Ø­ØªØ±Ø§ÙÙŠØ© Ù„Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø±Ø§Ù‡Ù†Ø§Øª Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© ÙˆØ§Ù„ÙƒØ§Ø²ÙŠÙ†Ùˆ. Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ© Ø¹Ø¨Ø± Ù…Ø²ÙˆØ¯ Ù…Ø±Ø®Ù‘ØµØŒ ÙˆÙ…Ø­ÙØ¸Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ©ØŒ ÙˆÙ†Ø¸Ø§Ù… ØªÙƒØ§Ù…Ù„ Ø£Ù„Ø¹Ø§Ø¨ Ø¬Ø§Ù‡Ø² Ù„Ù„Ù…Ø²ÙˆØ¯ÙŠÙ†."
            : lang === "fr" ? "Plateforme web premium de dÃ©monstration sportive et casino. DonnÃ©es rÃ©elles via fournisseur, portefeuille virtuel et systÃ¨me d'intÃ©gration de jeux prÃªt."
            : "A production-grade sportsbook and casino platform shell. Real fixture data through a licensed provider, a virtual credit wallet, and a complete game-integration system ready for your providers."}
        </p>
        <div className="row wrap">
          <Link href="/sports" className="btn j"><Icon name="football" />{tr(lang, "sports")}</Link>
          <Link href="/casino" className="btn g"><Icon name="casino" />{tr(lang, "casino")}</Link>
          {!me && <Link href="/register" className="btn o"><Icon name="user" />{tr(lang, "register")}</Link>}
          <Link href="/legal/integrations" className="btn o"><Icon name="plug" />Integration status</Link>
        </div>
        <div className="note g" style={{ marginTop: 24 }}>{tr(lang, "demo")}</div>
      </section>

      <section>
        <div className="bt wrap mb">
          <h2 className="h2" style={{ margin: 0 }}><span className="dot" />Live football data</h2>
          <span className={"tag " + (state.source === "API-Football" ? "j" : state.configured ? "e" : "n")}>
            {state.loading ? "CONNECTINGâ€¦" : state.source === "API-Football" ? "PROVIDER CONNECTED" : state.configured ? "PROVIDER ERROR" : "KEY REQUIRED"}
          </span>
        </div>
        {state.loading && <div className="grid g3">{[0, 1, 2].map(i => <div key={i} className="skel" />)}</div>}
        {!state.loading && !fixtures.length && (
          <div className="empty"><Icon name="info" /><div style={{ fontWeight: 750, marginBottom: 6 }}>No fixtures to display</div>
            <div className="xs">{state.message ?? "Configure FOOTBALL_ODDS_API_KEY on the server to load real matches."}</div>
            <Link href="/legal/integrations" className="btn o s" style={{ marginTop: 14 }}>How to connect</Link></div>
        )}
        <div className="grid g3">
          {fixtures.map(f => (
            <Link key={f.id} href="/sports/football" className="match card hov">
              <div className="bt xxs faint"><span className="clip">{f.league}</span><span className="row" style={{ gap: 5 }}>{f.state === "LIVE" && <span className="dot" />}{f.state}</span></div>
              <div className="teams">
                <div className="tm"><div className="crest-sm">{f.homeLogo ? <img src={f.homeLogo} alt="" /> : <b>{f.home[0]}</b>}</div><span className="clip">{f.home}</span></div>
                <div className="score">{f.scoreHome ?? "â€“"} : {f.scoreAway ?? "â€“"}</div>
                <div className="tm r"><div className="crest-sm">{f.awayLogo ? <img src={f.awayLogo} alt="" /> : <b>{f.away[0]}</b>}</div><span className="clip">{f.away}</span></div>
              </div>
              {f.markets?.[0] ? (
                <div className="odds" style={{ gridTemplateColumns: `repeat(${Math.min(3, f.markets[0].picks.length)},1fr)` }}>
                  {f.markets[0].picks.slice(0, 3).map((p: any, i: number) => <div key={i} className="odd"><i>{p.label}</i><b>{p.price.toFixed(2)}</b></div>)}
                </div>
              ) : <div className="xxs faint ctr" style={{ padding: "8px 0" }}>Odds not supplied for this fixture</div>}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h2"><Icon name="globe" />Sports coverage</h2>
        <div className="grid g4">
          {SPORTS.map(s => (
            <Link key={s.key} href={"/sports/" + s.key} className="card hov pad row">
              <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${s.hue}30,${s.hue}08)`, border: `1px solid ${s.hue}44`, color: s.hue, flex: "0 0 44px" }}>
                <Icon name={s.icon} />
              </div>
              <div className="grow"><b style={{ fontSize: 14 }}>{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</b>
                <div className="xxs faint">{s.key === "football" ? "API-Football" : "The Odds API"}</div></div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="bt wrap mb">
          <h2 className="h2" style={{ margin: 0 }}><Icon name="casino" />Casino catalogue</h2>
          <Link href="/casino" className="btn o s">Open lobby â†’</Link>
        </div>
        <div className="note a mb">
          Titles below are catalogue slots prepared for licensed providers. No game is fabricated or embedded without authorization â€”
          connect real launch URLs from the Admin console to activate them.
        </div>
        <div className="grid g4">{games.map(g => <GameTile key={g.id} game={g} />)}</div>
      </section>

      <section>
        <h2 className="h2"><Icon name="plug" />Casino categories</h2>
        <div className="grid g4">
          {CASINO_CATEGORIES.map(c => (
            <Link key={c.key} href={"/casino/" + c.key} className="card hov pad" style={{ borderColor: c.hue + "33" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${c.hue}33,transparent)`, color: c.hue, marginBottom: 12 }}><Icon name={c.glyph} /></div>
              <b style={{ fontSize: 15 }}>{lang === "ar" ? c.ar : lang === "fr" ? c.fr : c.en}</b>
              <div className="xxs faint" style={{ marginTop: 4 }}>Integration-ready catalogue</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}