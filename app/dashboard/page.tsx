"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { tr, fmt } from "@/lib/catalog";

export default function Dashboard() {
  const { me, lang, refresh, toast } = useApp();
  const [bets, setBets] = useState<any[]>([]);
  const [tab, setTab] = useState("bets");
  const [name, setName] = useState("");
  useEffect(() => { if (me) setName(me.name); }, [me]);
  const load = useCallback(() => { fetch("/api/bets", { cache: "no-store" }).then(r => r.json()).then(d => { if (d.ok) setBets(d.bets ?? []); }).catch(() => {}); }, []);
  useEffect(() => { if (me) load(); }, [me, load]);

  if (!me) return <div className="empty"><Icon name="user" /><div style={{ fontWeight: 750, marginBottom: 12 }}>Sign in to open your dashboard</div><Link href="/login" className="btn g">{tr(lang, "signin")}</Link></div>;

  const save = async () => {
    const r = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await r.json();
    if (!d.ok) return toast(d.error ?? "Update failed", "e");
    refresh(); toast("Profile updated", "j");
  };
  const staked = bets.reduce((a, b) => a + b.stake, 0);
  const potential = bets.reduce((a, b) => a + b.potential, 0);

  return (
    <div className="col">
      <div className="hero" style={{ padding: "32px 26px" }}>
        <div className="row wrap">
          <div className="ava" style={{ width: 76, height: 76, fontSize: 30, flex: "0 0 76px" }}>{me.name.slice(0, 1).toUpperCase()}</div>
          <div className="grow">
            <h1 className="h2" style={{ margin: 0 }}>{me.name}</h1>
            <div className="xs dim">{me.email}</div>
            <div className="chipline" style={{ marginTop: 9 }}>
              <span className={"tag " + (me.role === "admin" ? "g" : "a")}>{me.role.toUpperCase()}</span>
              <span className="tag j">DEMO ACCOUNT</span>
            </div>
          </div>
          <div className="ctr"><div className="xxs dim" style={{ letterSpacing: 1.2, fontWeight: 800 }}>BALANCE</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--gold-hi)" }}>{fmt(me.balance)}</div></div>
        </div>
      </div>

      <div className="grid g4">
        <div className="stat"><span>Bets placed</span><b>{bets.length}</b></div>
        <div className="stat a"><span>Total staked</span><b style={{ color: "#8FB8FF" }}>{fmt(staked)}</b></div>
        <div className="stat j"><span>Open bets</span><b style={{ color: "var(--jade)" }}>{bets.filter(b => b.status === "OPEN").length}</b></div>
        <div className="stat v"><span>Potential</span><b style={{ color: "#D0A6FF" }}>{fmt(potential)}</b></div>
      </div>

      <div className="tabs">
        <button className={"tab" + (tab === "bets" ? " on" : "")} onClick={() => setTab("bets")}>Bet history</button>
        <button className={"tab" + (tab === "settings" ? " on" : "")} onClick={() => setTab("settings")}>Account settings</button>
        <Link href="/wallet" className="tab">Wallet </Link>
        {me.role === "admin" && <Link href="/admin" className="tab">Admin console </Link>}
      </div>

      {tab === "bets" && (
        <div className="col">
          <div className="note a">Demo bets remain <b>OPEN</b>. Automatic settlement activates only when a verified result feed is connected  outcomes are never invented.</div>
          {!bets.length && <div className="empty"><Icon name="ticket" /><div>No bets yet.</div><Link href="/sports" className="btn g s" style={{ marginTop: 14 }}>Open sportsbook</Link></div>}
          {bets.map(b => {
            let sels: any[] = []; try { sels = JSON.parse(b.payload); } catch {}
            return (
              <div key={b.id} className="card pad">
                <div className="bt wrap mb">
                  <span className="xxs faint">{new Date(b.created).toLocaleString()}</span>
                  <span className={"tag " + (b.status === "OPEN" ? "g" : b.status === "WON" ? "j" : "e")}>{b.status}</span>
                </div>
                <div className="col" style={{ gap: 6 }}>
                  {sels.map((s, i) => (
                    <div key={i} className="bt xs"><span className="dim clip grow">{s.label}  <b style={{ color: "var(--ink)" }}>{s.pick}</b></span><b className="mono" style={{ color: "var(--jade)" }}>{Number(s.price).toFixed(2)}</b></div>
                  ))}
                </div>
                <div className="grid g3 mt xs">
                  <div><span className="faint xxs">STAKE</span><br /><b className="mono">{fmt(b.stake)}</b></div>
                  <div><span className="faint xxs">ODDS</span><br /><b className="mono">{b.odds.toFixed(2)}</b></div>
                  <div><span className="faint xxs">POTENTIAL</span><br /><b className="mono" style={{ color: "var(--gold-hi)" }}>{fmt(b.potential)}</b></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "settings" && (
        <div className="card pad col" style={{ maxWidth: 560 }}>
          <label className="f"><span>Display name</span><input className="in" value={name} onChange={e => setName(e.target.value)} /></label>
          <button className="btn j" onClick={save}>Save changes</button>
          <div className="note g">Passwords are hashed with scrypt on the server. Sessions use httpOnly cookies. Demo data only.</div>
        </div>
      )}
    </div>
  );
}