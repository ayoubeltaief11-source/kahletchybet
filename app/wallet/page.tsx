"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { tr, fmt } from "@/lib/catalog";

export default function Wallet() {
  const { me, lang, refresh, toast } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const load = useCallback(() => {
    fetch("/api/wallet", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.ok) setRows(d.ledger ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (me) load();
    try {
      const last = localStorage.getItem("pp_daily_claim");
      if (last && Date.now() - Number(last) < 86400000) setDailyClaimed(true);
    } catch (e) {}
  }, [me, load]);

  const claimDaily = () => {
    if (dailyClaimed) return;
    try { localStorage.setItem("pp_daily_claim", String(Date.now())); } catch (e) {}
    setDailyClaimed(true);
    toast("Daily free credits added", "j");
    refresh();
  };

  if (!me) {
    return (
      <div className="empty">
        <Icon name="lock" />
        <div style={{ fontWeight: 750, marginBottom: 12 }}>Sign in to open your demo wallet</div>
        <Link href="/login" className="btn g">{tr(lang, "signin")}</Link>
      </div>
    );
  }

  const sum = (k: string[]) => rows.filter(r => k.includes(r.kind)).reduce((a, r) => a + r.amount, 0);
  const shown = rows.filter(r => filter === "ALL" || r.kind === filter);

  return (
    <div className="col">
      <h1 className="h2"><Icon name="wallet" />{tr(lang, "wallet")}</h1>
      <div className="hero ctr" style={{ padding: "40px 26px" }}>
        <div className="xs dim">{tr(lang, "balance")}</div>
        <div className="h1" style={{ marginTop: 6 }}>{fmt(me.balance)} TD</div>
        <div className="note g mt" style={{ fontSize: 12 }}>
          <Icon name="info" /> Educational demo only. Virtual credits. No real money.
        </div>
      </div>

      <div className="grid g4">
        <div className="stat j"><span>Free Credits</span><b style={{ color: "var(--jade)" }}>{fmt(sum(["DAILY", "BONUS"]))}</b></div>
        <div className="stat e"><span>Spent Credits</span><b style={{ color: "var(--ember)" }}>{fmt(sum(["BET"]))}</b></div>
        <div className="stat"><span>Staked</span><b>{fmt(sum(["BET"]) + sum(["WAGER"]))}</b></div>
        <div className="stat"><span>Entries</span><b>{rows.length}</b></div>
      </div>

      <div className="card pad">
        <button className="btn g" onClick={claimDaily} disabled={dailyClaimed}>
          <Icon name="gift" /> {dailyClaimed ? "Claimed (next in 24h)" : "Daily Free TD"}
        </button>
      </div>

      <div className="tabs" style={{ margin: 0 }}>{["ALL", "BET", "WIN", "DAILY", "BONUS"].map(k => (
        <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{k}</button>
      ))}</div>

      <div className="card pad">
        <div className="h3 mb">Transaction history</div>
        {shown.length === 0 ? <div className="dim">No transactions yet</div> : (
          <div className="col" style={{ gap: 8 }}>
            {shown.slice(0, 50).map((r, i) => (
              <div key={i} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 650 }}>{r.kind}</div>
                  <div className="xs dim">{new Date(r.ts).toLocaleString()}</div>
                </div>
                <div style={{ fontWeight: 750, color: r.amount >= 0 ? "var(--jade)" : "var(--ember)" }}>
                  {r.amount >= 0 ? "+" : ""}{fmt(r.amount)} TD
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
