"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import BetSlip, { type Selection } from "@/components/BetSlip";
import { SPORTS, tr } from "@/lib/catalog";

export default function SportPage() {
  const { sport } = useParams<{ sport: string }>();
  const def = SPORTS.find(s => s.key === sport);
  const { lang } = useApp();
  const [data, setData] = useState<any>({ fixtures: [] });
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("all");
  const [q, setQ] = useState("");
  const [sels, setSels] = useState<Selection[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/sports?sport=${sport}&scope=${scope}`, { cache: "no-store" })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => { setData({ source: "error", message: "Network error", fixtures: [] }); setLoading(false); });
  }, [sport, scope]);

  useEffect(() => { load(); const iv = setInterval(load, 120000); return () => clearInterval(iv); }, [load]);

  const list = useMemo(() => (data.fixtures ?? []).filter((f: any) => (f.home + f.away + f.league).toLowerCase().includes(q.toLowerCase())), [data, q]);
  const toggle = (f: any, m: any, p: any) => {
    const key = `${f.id}|${m.key}|${p.label}`;
    setSels(prev => prev.some(s => s.key === key) ? prev.filter(s => s.key !== key)
      : [...prev.filter(s => !s.key.startsWith(`${f.id}|${m.key}|`)), { key, fixture: f.id, label: `${f.home} v ${f.away}`, market: m.name, pick: p.label, price: p.price }]);
  };
  const has = (f: any, m: any, p: any) => sels.some(s => s.key === `${f.id}|${m.key}|${p.label}`);

  return (
    <div className="split">
      <div className="col">
        <div className="bt wrap">
          <h1 className="h2" style={{ margin: 0 }}><Icon name={def?.icon ?? "football"} />{def ? (lang === "ar" ? def.ar : lang === "fr" ? def.fr : def.en) : sport}</h1>
          <div className="row">
            <span className={"tag " + (data.source === "error" ? "e" : data.configured ? "j" : "n")}>
              {data.configured ? (data.source ?? "provider") : "KEY REQUIRED"}
            </span>
            <button className="btn o s" onClick={load}><Icon name="refresh" /></button>
          </div>
        </div>

        {!data.configured && !loading && (
          <div className="note g">
            <b>Provider key not configured.</b> Add <code>{sport === "football" ? "FOOTBALL_ODDS_API_KEY" : "ODDS_API_KEY"}</code> to your server environment.
            No simulated fixtures are shown â€” this platform never invents matches or odds.
          </div>
        )}
        {data.configured && data.message && !loading && <div className="note e">{data.message}</div>}
        {data.remaining && <div className="xxs faint">Provider requests remaining this period: {data.remaining}</div>}

        <div className="bt wrap">
          <div className="tabs" style={{ margin: 0 }}>
            {[["all", tr(lang, "all")], ["live", tr(lang, "live")], ["upcoming", tr(lang, "upcoming")], ["finished", tr(lang, "finished")]].map(([k, l]) => (
              <button key={k} className={"tab" + (scope === k ? " on" : "")} onClick={() => setScope(k)}>{k === "live" && <span className="dot" style={{ display: "inline-block", marginInlineEnd: 6 }} />}{l}</button>
            ))}
          </div>
          <input className="in" style={{ maxWidth: 230 }} placeholder="Search team or leagueâ€¦" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {loading && [0, 1, 2].map(i => <div key={i} className="skel" />)}
        {!loading && !list.length && (
          <div className="empty"><Icon name="search" /><div style={{ fontWeight: 750 }}>Nothing to show for this filter</div>
            <div className="xs" style={{ marginTop: 6 }}>Real provider data only. Try another tab, or check the provider key and quota.</div></div>
        )}

        {list.map((f: any) => (
          <div key={f.id} className="match">
            <div className="bt xxs faint">
              <span className="row" style={{ gap: 6 }}>{f.leagueLogo && <img src={f.leagueLogo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}<span className="clip">{f.league}</span></span>
              <span className="row" style={{ gap: 6 }}>{f.state === "LIVE" && <span className="dot" />}
                {f.state === "LIVE" ? (f.minute ? `${f.minute}'` : "LIVE") : new Date(f.kickoff).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="teams">
              <div className="tm"><div className="crest-sm">{f.homeLogo ? <img src={f.homeLogo} alt="" /> : <b>{f.home[0]}</b>}</div><span className="clip">{f.home}</span></div>
              <div className="score">{f.scoreHome ?? "â€“"} : {f.scoreAway ?? "â€“"}</div>
              <div className="tm r"><div className="crest-sm">{f.awayLogo ? <img src={f.awayLogo} alt="" /> : <b>{f.away[0]}</b>}</div><span className="clip">{f.away}</span></div>
            </div>
            {!f.markets.length && <div className="note a xxs">The provider supplied this fixture without prices. No odds are invented.</div>}
            {f.markets.slice(0, open === f.id ? f.markets.length : 1).map((m: any) => (
              <div key={m.key} style={{ marginBottom: 8 }}>
                <div className="xxs faint" style={{ marginBottom: 5 }}>{m.name}</div>
                <div className="odds" style={{ gridTemplateColumns: `repeat(${Math.min(3, m.picks.length)},1fr)` }}>
                  {m.picks.map((p: any) => (
                    <button key={p.label} className={"odd" + (has(f, m, p) ? " on" : "")} onClick={() => toggle(f, m, p)}><i>{p.label}</i><b>{p.price.toFixed(2)}</b></button>
                  ))}
                </div>
              </div>
            ))}
            <div className="bt" style={{ marginTop: 8 }}>
              <span className="xxs faint clip">{f.provider}</span>
              {f.markets.length > 1 && <button className="btn o s" onClick={() => setOpen(open === f.id ? null : f.id)}>{open === f.id ? "Fewer" : `+${f.markets.length - 1} markets`}</button>}
            </div>
          </div>
        ))}
      </div>
      <BetSlip selections={sels} remove={k => setSels(p => p.filter(s => s.key !== k))} clear={() => setSels([])} />
    </div>
  );
}