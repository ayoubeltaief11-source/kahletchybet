"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { tr, fmt } from "@/lib/catalog";

export default function Wallet() {
  const { me, lang, refresh, toast } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [modal, setModal] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState("Demo Card");
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { fetch("/api/wallet", { cache: "no-store" }).then(r => r.json()).then(d => { if (d.ok) setRows(d.ledger ?? []); }).catch(() => {}); }, []);
  useEffect(() => { if (me) load(); }, [me, load]);

  if (!me) return <div className="empty"><Icon name="lock" /><div style={{ fontWeight: 750, marginBottom: 12 }}>Sign in to open your demo wallet</div><Link href="/login" className="btn g">{tr(lang, "signin")}</Link></div>;

  const submit = async () => {
    const a = Number(amount);
    if (!isFinite(a) || a <= 0) return toast("Enter a valid amount", "e");
    setBusy(true);
    const r = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: modal, amount: a, method }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) return toast(d.error ?? "Operation failed", "e");
    setRows(d.ledger ?? []); refresh(); setModal(null);
    toast(`${modal === "DEPOSIT" ? "Credited" : "Debited"} ${fmt(a)}  simulation only`, "j");
  };

  const sum = (k: string[]) => rows.filter(r => k.includes(r.kind)).reduce((a, r) => a + r.amount, 0);
  const shown = rows.filter(r => filter === "ALL" || r.kind === filter);

  return (
    <div className="col">
      <h1 className="h2"><Icon name="wallet" />{tr(lang, "wallet")}</h1>
      <div className="hero ctr" style={{ padding: "40px 26px" }}>
        <div className="xs dim" style={{ letterSpacing: 1.4, fontWeight: 800 }}>AVAILABLE DEMO BALANCE</div>
        <div style={{ fontSize: "clamp(40px,8vw,66px)", fontWeight: 900, color: "var(--gold-hi)", letterSpacing: -2.5, lineHeight: 1.15 }}>{fmt(me.balance)}</div>
        <div className="note g" style={{ display: "inline-block", marginTop: 10 }}>{tr(lang, "demo")}</div>
      </div>

      <div className="grid g4">
        <div className="stat j"><span>Credits in</span><b style={{ color: "var(--jade)" }}>{fmt(sum(["DEPOSIT", "BONUS", "ADJUST"]))}</b></div>
        <div className="stat e"><span>Credits out</span><b style={{ color: "var(--ember)" }}>{fmt(sum(["WITHDRAW"]))}</b></div>
        <div className="stat a"><span>Staked</span><b style={{ color: "#8FB8FF" }}>{fmt(sum(["BET"]))}</b></div>
        <div className="stat"><span>Entries</span><b>{rows.length}</b></div>
      </div>

      <div className="grid g2">
        <button className="card hov pad" style={{ textAlign: "start", cursor: "pointer" }} onClick={() => setModal("DEPOSIT")}>
          <Icon name="plus" className="" /><b style={{ display: "block", fontSize: 17, color: "var(--jade)", marginTop: 10 }}>Demo deposit</b>
          <div className="xs dim">Adds virtual credits to your account. No payment provider is contacted.</div>
        </button>
        <button className="card hov pad" style={{ textAlign: "start", cursor: "pointer" }} onClick={() => setModal("WITHDRAW")}>
          <Icon name="logout" /><b style={{ display: "block", fontSize: 17, color: "var(--gold-hi)", marginTop: 10 }}>Demo withdrawal</b>
          <div className="xs dim">Removes virtual credits. Nothing is transferred anywhere.</div>
        </button>
      </div>

      <div className="card pad">
        <div className="bt wrap mb">
          <h3 className="h3" style={{ margin: 0 }}>Transaction ledger</h3>
          <div className="tabs" style={{ margin: 0 }}>{["ALL", "DEPOSIT", "WITHDRAW", "BET", "BONUS"].map(f => <button key={f} className={"tab" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}</button>)}</div>
        </div>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Type</th><th>Detail</th><th>Amount</th><th>Before</th><th>After</th><th>When</th></tr></thead>
            <tbody>{shown.slice(0, 100).map(r => {
              const out = r.after < r.before;
              return (<tr key={r.id}>
                <td><span className={"tag " + (out ? "e" : "j")}>{r.kind}</span></td>
                <td className="xs dim">{r.note}</td>
                <td className="mono" style={{ color: out ? "var(--ember)" : "var(--jade)", fontWeight: 800 }}>{out ? "" : "+"}{fmt(r.amount)}</td>
                <td className="mono xxs faint">{r.before.toFixed(2)}</td>
                <td className="mono xs">{r.after.toFixed(2)}</td>
                <td className="xxs faint">{new Date(r.created).toLocaleString()}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        {!shown.length && <div className="empty">No entries for this filter.</div>}
      </div>

      {modal && (
        <div className="modal" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={e => e.stopPropagation()}>
            <h3 className="h2">{modal === "DEPOSIT" ? "Demo deposit" : "Demo withdrawal"}</h3>
            <div className="note g mb">SIMULATION ONLY  no card, bank, crypto or payment network is involved at any point.</div>
            <label className="f"><span>Amount (CR)</span><input className="in mono" type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></label>
            <label className="f"><span>Simulated method</span>
              <select className="in" value={method} onChange={e => setMethod(e.target.value)}>
                <option>Demo Card</option><option>Demo Bank Transfer</option><option>Demo Crypto</option><option>Demo Voucher</option>
              </select></label>
            <div className="chipline mb">{[500, 1000, 5000, 25000].map(v => <button key={v} className="btn o s" onClick={() => setAmount(String(v))}>{v}</button>)}</div>
            <div className="row"><button className="btn j grow" disabled={busy} onClick={submit}>{busy ? "Processing" : "Confirm"}</button><button className="btn o" onClick={() => setModal(null)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}