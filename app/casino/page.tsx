"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/Shell";
import { KB_GAMES, kbById } from "@/lib/kb/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf, PATH_NAME, ENV_NAME, FRAME_NAME, FEATURE_NAME } from "@/lib/kb/sig";
import { usePrefs } from "@/lib/kb/prefs";
import Poster from "@/components/kb/Art";
import HeroCarousel from "@/components/kb/HeroCarousel";
import WinTicker from "@/components/kb/WinTicker";
import AudioBoot from "@/components/kb2/AudioBoot";
import SoundPanel from "@/components/kb2/SoundPanel";
import { Row, GameCard, Cover } from "@/components/kb2/Row";
import { CRASH_GAMES } from "@/lib/kb2/crashConfig";
import { CLUSTER_GAMES } from "@/lib/kb2/slotMath";
import { LINE_GAMES } from "@/lib/kb2/lineMath";
import { MEGA_GAMES } from "@/lib/kb2/megaMath";
import { HOLD_GAMES } from "@/lib/kb2/holdMath";
import { CLASSIC_GAMES } from "@/lib/kb2/classicMath";
import { ROULETTE_GAMES } from "@/lib/kb2/rouletteMath";
import { BACCARAT_GAMES } from "@/lib/kb2/baccaratMath";
import { SICBO_GAMES } from "@/lib/kb2/sicboMath";
import { MINES_GAMES } from "@/lib/kb2/minesMath";
import { PLINKO_GAMES } from "@/lib/kb2/plinkoMath";
import { DICE_GAMES } from "@/lib/kb2/diceMath";
import { INSTANT_GAMES } from "@/lib/kb2/instantMath";
import { INSTANT2_GAMES } from "@/lib/kb2/instant2Math";
import { NEW_GAMES, newGamesByFamily, hrefFor } from "@/lib/kb2/newGames";

const FAM: [string, string][] = [["all", "All games"], ["crash", "Crash"], ["slots", "Slots"], ["roulette", "Roulette"], ["table", "Table"], ["instant", "Instant"]];
const VAR: Record<string, string> = { jet: "JET", rocket: "ROCKET", zeppelin: "AIRSHIP", heli: "HELI", classic3: "3x3 LINES", mega5: "MEGAWAYS", cluster6: "CLUSTER", jackpot5: "JACKPOT", tumble5: "TUMBLE", holdwin: "HOLD+WIN", wood: "CLASSIC WHEEL", neon: "NEON WHEEL", vip: "VIP WHEEL", blackjack: "BLACKJACK", baccarat: "BACCARAT", sicbo: "SIC BO", mines: "MINES", plinko: "PLINKO", hilo: "HI-LO", dice: "DICE" };

export default function KBLobby() {
  const { me } = useApp();
  const { p: prefs, toggleFav, pushRecent } = usePrefs();
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [v, setV] = useState("all");
  const [n, setN] = useState(30);
  const [onlyFav, setOnlyFav] = useState(false);

  const newCount = CRASH_GAMES.length + CLUSTER_GAMES.length + LINE_GAMES.length + MEGA_GAMES.length + HOLD_GAMES.length + CLASSIC_GAMES.length + ROULETTE_GAMES.length + 4 + BACCARAT_GAMES.length + SICBO_GAMES.length + MINES_GAMES.length + PLINKO_GAMES.length + DICE_GAMES.length + INSTANT_GAMES.length + INSTANT2_GAMES.length;
  const totalCount = KB_GAMES.length + newCount;

  const variants = useMemo(function () {
    const s: string[] = [];
    KB_GAMES.forEach(function (g) { if (s.indexOf(g.variant) < 0 && (f === "all" || g.family === f)) s.push(g.variant); });
    return s;
  }, [f]);

  const list = useMemo(function () {
    const t = q.trim().toLowerCase();
    return KB_GAMES.filter(function (g) {
      if (onlyFav && prefs.fav.indexOf(g.id) < 0) return false;
      if (f !== "all" && g.family !== f) return false;
      if (v !== "all" && g.variant !== v) return false;
      if (t && g.name.toLowerCase().indexOf(t) < 0) return false;
      return true;
    });
  }, [q, f, v, onlyFav, prefs.fav]);

  const recentGames = useMemo(function () {
    const out: KBGame[] = [];
    prefs.recent.forEach(function (id) { const g = kbById(id); if (g) out.push(g); });
    return out.slice(0, 12);
  }, [prefs.recent]);

  const favGames = useMemo(function () {
    const out: KBGame[] = [];
    prefs.fav.forEach(function (id) { const g = kbById(id); if (g) out.push(g); });
    return out.slice(0, 12);
  }, [prefs.fav]);

  return (
    <div className="kb-lobby">
      <AudioBoot/>
      <SoundPanel/>
      <HeroCarousel/>
      <WinTicker/>

      <header className="kb-hero">
        <div className="kb-hero-bg"/><div className="kb-hero-grain"/>
        <div className="kb-hero-in">
          <span className="kb-demo big">Demo</span>
          <h1>kahlatchy<em>bet</em> casino</h1>
          <p>{totalCount} simulation titles. {newCount} run on the new studio engines with server-settled rounds, and {KB_GAMES.length} stay available in the classic catalog. Every game shows its RTP because the long-run result is the lesson.</p>
          <div className="kb-stats">
            <div><b>{totalCount}</b><span>Titles</span></div>
            <div><b>{newCount}</b><span>Studio</span></div>
            <div><b>{KB_GAMES.length}</b><span>Classic</span></div>
            <div><b>0.00</b><span>Start balance</span></div>
          </div>
        </div>
      </header>

            <Row title="Falcon Dunes" count={1} badge="NEW - 243 WAYS" href="/casino/falcon-dunes">
        <GameCard href="/casino/falcon-dunes" name="Falcon Dunes" tag="243 WAYS + WILD MULTS + FREE SPINS" badge="NEW" maxWin="x5000" vol="High" felt="linear-gradient(170deg,#2a1a0a,#1a1206)" accent="#C98A3C" slug="falcon-dunes" cover={<Cover kind="reels" hue="#C98A3C" hue2="#2DD4D4"}/>}
      </Row>
      <Row title="Atlas Skyfall" count={1} badge="NEW - PAYS ANYWHERE" href="/casino/atlas-skyfall">
        <GameCard href="/casino/atlas-skyfall" name="Atlas Skyfall" tag="PAYS ANYWHERE + TUMBLE + MULT BALLS" badge="NEW" maxWin="x25000" vol="High" felt="linear-gradient(170deg,#0B1530,#060b1a)" accent="#2DD4D4" slug="atlas-skyfall" cover={<Cover kind="cluster" hue="#2DD4D4" hue2="#C98A3C"/>}/>
      </Row>
      <Row title="New Roulette" count={newGamesByFamily("roulette").length} badge="EXCLUSIVE" href={"/casino/roulette2/" + newGamesByFamily("roulette")[0].slug}>
        {newGamesByFamily("roulette").map(function (g) {
          return <GameCard key={g.slug} href={hrefFor(g)} name={g.name} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt || "linear-gradient(170deg,#0a1018,#04060a)"} accent={g.accent} slug={g.slug} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>}/>;
        })}
      </Row>
      <Row title="New Slots" count={newGamesByFamily("slots").length} badge="KB STUDIO" href={"/casino/cluster/" + newGamesByFamily("slots")[0].slug}>
        {newGamesByFamily("slots").map(function (g) {
          return <GameCard key={g.slug} href={hrefFor(g)} name={g.name} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt || "linear-gradient(170deg,#0a1018,#04060a)"} accent={g.accent} slug={g.slug} cover={<Cover kind="cluster" hue={g.accent} hue2={g.accent2}/>}/>;
        })}
      </Row>
      <Row title="New Crash" count={newGamesByFamily("crash").length} badge="SHARED ROUND" href={"/casino/sky/" + newGamesByFamily("crash")[0].slug}>
        {newGamesByFamily("crash").map(function (g) {
          return <GameCard key={g.slug} href={hrefFor(g)} name={g.name} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.sky || g.felt || "linear-gradient(170deg,#0a1018,#04060a)"} accent={g.accent} slug={g.slug} cover={<Cover kind="jet" hue={g.accent} hue2={g.accent2}/>}/>;
        })}
      </Row>
      <Row title="New Instant" count={newGamesByFamily("instant").length} badge="RTP 97%" href={"/casino/instant/" + newGamesByFamily("instant")[0].slug}>
        {newGamesByFamily("instant").map(function (g) {
          return <GameCard key={g.slug} href={hrefFor(g)} name={g.name} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt || "linear-gradient(170deg,#0a1018,#04060a)"} accent={g.accent} slug={g.slug} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>}/>;
        })}
      </Row>
<Row title="Live Crash" count={CRASH_GAMES.length} badge="SHARED ROUND" href={"/casino/sky/" + CRASH_GAMES[0].slug}>
        {CRASH_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/sky/" + g.slug} name={g.name} slug={g.slug} tag={g.tag + " - " + g.craft} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.sky} accent={g.accent} cover={<Cover kind={g.craft} hue={g.accent} hue2={g.accent}/>} />;
        })}
      </Row>

      <Row title="Cluster Tumble" count={CLUSTER_GAMES.length} badge="TUMBLE + BOMBS" href={"/casino/cluster/" + CLUSTER_GAMES[0].slug}>
        {CLUSTER_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/cluster/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge="NEW" maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="cluster" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Payline Reels" count={LINE_GAMES.length} badge="WILDS + FREE SPINS" href={"/casino/lines/" + LINE_GAMES[0].slug}>
        {LINE_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/lines/" + g.slug} name={g.name} slug={g.slug} tag={(g.rows === 4 ? "40 LINES" : "20 LINES") + " - " + g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Megaways" count={MEGA_GAMES.length} badge="UP TO 117,649 WAYS" href={"/casino/mega/" + MEGA_GAMES[0].slug}>
        {MEGA_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/mega/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Hold and Win" count={HOLD_GAMES.length} badge="4 JACKPOT TIERS" href={"/casino/hold/" + HOLD_GAMES[0].slug}>
        {HOLD_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/hold/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="cluster" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Keno & Tower" count={INSTANT2_GAMES.length} badge="KENO + TOWER" href={"/casino/instant2/" + INSTANT2_GAMES[0].slug}>
        {INSTANT2_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/instant2/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Instant Games" count={INSTANT_GAMES.length} badge="HI-LO + COIN + WHEEL" href={"/casino/instant/" + INSTANT_GAMES[0].slug}>
        {INSTANT_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/instant/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Dice & Limbo" count={DICE_GAMES.length} badge="RTP / PROBABILITY" href={"/casino/dice/" + DICE_GAMES[0].slug}>
        {DICE_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/dice/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Plinko" count={PLINKO_GAMES.length} badge="16 ROWS" href={"/casino/plinko/" + PLINKO_GAMES[0].slug}>
        {PLINKO_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/plinko/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Mines" count={MINES_GAMES.length} badge="5x5 GRID" href={"/casino/mines/" + MINES_GAMES[0].slug}>
        {MINES_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/mines/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Sic Bo Tables" count={SICBO_GAMES.length} badge="3 DICE" href={"/casino/sicbo/" + SICBO_GAMES[0].slug}>
        {SICBO_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/sicbo/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Baccarat Tables" count={BACCARAT_GAMES.length} badge="NATURAL 8/9" href={"/casino/baccarat/" + BACCARAT_GAMES[0].slug}>
        {BACCARAT_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/baccarat/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Blackjack Tables" count={4} badge="3:2 PAYOUT" href="/casino/blackjack2">
        {[{slug:"classic",name:"Classic Blackjack",tag:"6 Decks - Stand on 17",badge:"LIVE",maxWin:"x3",vol:"Low",felt:"radial-gradient(ellipse at center, #0d5a24 0%, #062a1a 100%)",accent:"#ffd97a",accent2:"#ffd97a"},{slug:"vip",name:"VIP Blackjack",tag:"High Stakes",badge:"HOT",maxWin:"x3",vol:"Medium",felt:"radial-gradient(ellipse at center, #1c1403 0%, #0d0a01 100%)",accent:"#e8b33c",accent2:"#fff6d8"},{slug:"european",name:"European Blackjack",tag:"Single Deck",badge:"NEW",maxWin:"x3",vol:"Low",felt:"radial-gradient(ellipse at center, #020617 0%, #01040c 100%)",accent:"#93c5fd",accent2:"#93c5fd"},{slug:"lightning",name:"Lightning Blackjack",tag:"Multipliers",badge:"NEW",maxWin:"x25",vol:"High",felt:"radial-gradient(ellipse at center, #1a0f02 0%, #0d0801 100%)",accent:"#ffd24a",accent2:"#fff6d8"}].map(function (g) {
          return <GameCard key={g.slug} href="/casino/blackjack2" name={g.name} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Roulette Tables" count={ROULETTE_GAMES.length} badge="LIVE WHEEL" href={"/casino/roulette2/" + ROULETTE_GAMES[0].slug}>
        {ROULETTE_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/roulette2/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      <Row title="Classic Three Reels" count={CLASSIC_GAMES.length} badge="5 LINES - FULL SCREEN" href={"/casino/classic3/" + CLASSIC_GAMES[0].slug}>
        {CLASSIC_GAMES.map(function (g) {
          return <GameCard key={g.slug} href={"/casino/classic3/" + g.slug} name={g.name} slug={g.slug} tag={g.tag} badge={g.badge} maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.accent} cover={<Cover kind="reels" hue={g.accent} hue2={g.accent2}/>} />;
        })}
      </Row>

      {recentGames.length > 0 && (
        <div className="k2-row">
          <div className="k2-row-head"><h3>Recently Played</h3><span>{recentGames.length}</span></div>
          <div className="k2-strip">
            {recentGames.map(function (gm) {
              return (
                <Link key={"r" + gm.id} href={"/casino/play/" + gm.id} className="k2-mini" onClick={function () { pushRecent(gm.id); }}>
                  <div className="k2-mini-art"><Poster g={gm}/></div>
                  <b>{gm.name}</b>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {favGames.length > 0 && (
        <div className="k2-row">
          <div className="k2-row-head"><h3>Favorites</h3><span>{favGames.length}</span><button className="k2-btn" onClick={function () { setOnlyFav(function (x) { return !x; }); setN(30); }}>{onlyFav ? "SHOW ALL" : "FILTER FAVORITES"}</button></div>
          <div className="k2-strip">
            {favGames.map(function (gm) {
              return (
                <Link key={"f" + gm.id} href={"/casino/play/" + gm.id} className="k2-mini" onClick={function () { pushRecent(gm.id); }}>
                  <div className="k2-mini-art"><Poster g={gm}/></div>
                  <b>{gm.name}</b>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="k8-classic">
        <span className="k8-classic-badge">ARCHIVE</span>
        <h2>Classic Catalog</h2>
        <span className="k4-count">{KB_GAMES.length}</span>
        <p>The original engine library, kept complete and untouched.</p>
      </div>

      <div className="kb-filters">
        <div className="kb-tabs">
          {FAM.map(function (o) { return <button key={o[0]} className={f === o[0] ? "on" : ""} onClick={function () { setF(o[0]); setV("all"); setN(30); }}>{o[1]}</button>; })}
        </div>
        <input className="kb-search" placeholder="Search classic titles..." value={q} onChange={function (e) { setQ(e.target.value); setN(30); }}/>
      </div>

      <div className="kb-vars">
        <button className={v === "all" && !onlyFav ? "on" : ""} onClick={function () { setV("all"); setOnlyFav(false); setN(30); }}>ALL ENGINES</button>
        <button className={onlyFav ? "on" : ""} onClick={function () { setOnlyFav(true); setN(30); }}>FAVORITES {prefs.fav.length}</button>
        {variants.map(function (x) { return <button key={x} className={v === x ? "on" : ""} onClick={function () { setV(x); setN(30); }}>{VAR[x] || x}</button>; })}
      </div>

      <div className="kb-grid">
        {list.slice(0, n).map(function (g) {
          const s = sigOf(g.id);
          const tag = g.family === "crash" ? PATH_NAME[s.path] + " - " + ENV_NAME[s.env] : g.family === "slots" ? FEATURE_NAME[s.feature] : FRAME_NAME[s.frame];
          const isFav = prefs.fav.indexOf(g.id) >= 0;
          return (
            <Link key={g.id} href={"/casino/play/" + g.id} className="kb-card" onClick={function () { pushRecent(g.id); }} style={{ ["--acc" as string]: g.hue }}>
              <div className="kb-art">
                <Poster g={g}/>
                <span className="kb-demo tiny kb-badge-demo">Demo</span>
                <span className="kb-badge-vol">{g.vol}</span>
                <div className="kb-shine"/>
              </div>
              <button className={"k2-fav" + (isFav ? " on" : "")} onClick={function (e) { e.preventDefault(); e.stopPropagation(); toggleFav(g.id); }} title="Favorite">{isFav ? "*" : "+"}</button>
              <div className="kb-meta">
                <b>{g.name}</b>
                <div><span>{VAR[g.variant] || g.variant}</span><em>{tag}</em></div>
              </div>
              <div className="kb-hover"><span>PLAY NOW</span></div>
            </Link>
          );
        })}
      </div>

      {list.length === 0 && <div className="kb-empty"><b>No titles match</b><span>Try another engine, clear the search, or turn off the favorites filter.</span></div>}
      {n < list.length && <button className="kb-more" onClick={function () { setN(function (x) { return x + 30; }); }}>Load more ({list.length - n} left)</button>}
      {!me && <div className="kb-warn">Sign in to link your TD wallet. New accounts start at 0.00 TD and are funded manually by an administrator.</div>}
    </div>
  );
}