"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import GameTile from "@/components/GameTile";
import { CASINO_CATEGORIES, tr } from "@/lib/catalog";

export default function Casino() {
  const { lang } = useApp();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState("all");

  useEffect(() => { fetch("/api/games").then(r => r.json()).then(d => { setGames(d.games ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const list = useMemo(() => games.filter(g =>
    (cat === "all" || (cat === "popular" ? g.featured : g.category === cat)) &&
    (only === "all" || g.status === only) &&
    g.name.toLowerCase().includes(q.toLowerCase())), [games, cat, q, only]);

  const connected = games.filter(g => g.status === "connected").length;

  return (
    <div className="col">
      <div className="bt wrap">
        <h1 className="h2" style={{ margin: 0 }}><Icon name="casino" />{tr(lang, "casino")}</h1>
        <div className="row wrap">
          <span className="tag n">{games.length} titles</span>
          <span className={"tag " + (connected ? "j" : "g")}>{connected} connected</span>
          <Link href="/admin" className="btn o s"><Icon name="plug" />Manage integrations</Link>
        </div>
      </div>

      <div className="note g">
        <b>Licensed integration model.</b> Every tile is a catalogue slot awaiting an authorized launch URL from your provider
        (GameDistribution, Hub88, Slotegrator and similar). No unlicensed game is embedded, and no in-house game substitutes a real title.
        Add launch URLs in the Admin console to switch a tile to <b>CONNECTED</b>.
      </div>

      <div className="grid g4">
        {CASINO_CATEGORIES.map(c => (
          <button key={c.key} className="card hov pad" style={{ textAlign: "start", cursor: "pointer", borderColor: cat === c.key ? c.hue : undefined }} onClick={() => setCat(cat === c.key ? "all" : c.key)}>
            <div className="row">
              <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: `linear-gradient(140deg,${c.hue}33,transparent)`, color: c.hue }}><Icon name={c.glyph} /></div>
              <div className="grow"><b style={{ fontSize: 13.5 }}>{lang === "ar" ? c.ar : lang === "fr" ? c.fr : c.en}</b>
                <div className="xxs faint">{games.filter(g => g.category === c.key).length} titles</div></div>
            </div>
          </button>
        ))}
        <button className="card hov pad" style={{ textAlign: "start", cursor: "pointer", borderColor: cat === "popular" ? "var(--gold)" : undefined }} onClick={() => setCat(cat === "popular" ? "all" : "popular")}>
          <div className="row">
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: "linear-gradient(140deg,#E8B33C33,transparent)", color: "var(--gold)" }}><Icon name="bolt" /></div>
            <div className="grow"><b style={{ fontSize: 13.5 }}>Popular</b><div className="xxs faint">{games.filter(g => g.featured).length} featured</div></div>
          </div>
        </button>
      </div>

      <div className="bt wrap">
        <div className="tabs" style={{ margin: 0 }}>
          {[["all", "All"], ["connected", "Connected"], ["awaiting", "Coming soon"], ["pending", "Pending"], ["disabled", "Disabled"]].map(([k, l]) => (
            <button key={k} className={"tab" + (only === k ? " on" : "")} onClick={() => setOnly(k)}>{l}</button>
          ))}
        </div>
        <input className="in" style={{ maxWidth: 250 }} placeholder="Search catalogue" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {loading && <div className="grid g4">{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="skel" style={{ height: 230 }} />)}</div>}
      {!loading && !list.length && <div className="empty"><Icon name="casino" /><div style={{ fontWeight: 750 }}>No titles match this filter</div><div className="xs" style={{ marginTop: 6 }}>Adjust the category or status filter, or add titles from the Admin console.</div></div>}
      <div className="grid g4">{list.map(g => <GameTile key={g.id} game={g} />)}</div>
    </div>
  );
}