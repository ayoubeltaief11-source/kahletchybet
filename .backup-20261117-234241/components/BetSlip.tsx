"use client";
import { useState } from "react";
import { useApp } from "./Shell";
import { tr, fmt } from "@/lib/catalog";
import Icon from "./Icon";

export type Selection = { key: string; fixture: string; label: string; market: string; pick: string; price: number };

export default function BetSlip({ selections, remove, clear }: { selections: Selection[]; remove: (k: string) => void; clear: () => void }) {
  const { me, lang, refresh, toast } = useApp();
  const [stake, setStake] = useState("100");
  const [mode, setMode] = useState<"combo" | "single">("combo");
  const [busy, setBusy] = useState(false);
  const amt = Math.max(0, Number(stake) || 0);
  const combo = selections.reduce((a, s) => a * s.price, 1);
  const total = mode === "combo" ? amt : amt * selections.length;
  const ret = mode === "combo" ? amt * combo : selections.reduce((a, s) => a + amt * s.price, 0);

  const place = async () => {
    if (!me) return toast(tr(lang, "signin") + " first", "e");
    if (!selections.length) return;
    if (amt < 10) return toast("Minimum stake is 10 CR", "e");
    setBusy(true);
    try {
      const r = await fetch("/api/bets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections: selections.map(s => ({ fixture: s.fixture, label: s.label, market: s.market, pick: s.pick, price: s.price })), stake: amt, mode }) });
      const d = await r.json();
      if (!r.ok || !d.ok) toast(d.error ?? "Bet failed", "e");
      else { toast("Demo bet recorded â€” stays OPEN until settlement data is connected", "j"); clear(); refresh(); }
    } catch { toast("Network error", "e"); }
    setBusy(false);
  };

  return (
    <div className="slip">
      <div className="bt mb">
        <h3 className="h3" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Icon name="ticket" />{tr(lang, "slip")}</h3>
        <span className="tag j">{selections.length}</span>
      </div>
      {!selections.length ? (
        <div className="empty" style={{ padding: "34px 14px" }}><Icon name="ticket" /><div className="xs">Select real odds from the list to build a demo bet.</div></div>
      ) : (
        <>
          {selections.length > 1 && (
            <div className="tabs" style={{ marginBottom: 11 }}>
              <button className={"tab" + (mode === "combo" ? " on" : "")} onClick={() => setMode("combo")}>Combo Ã—{selections.length}</button>
              <button className={"tab" + (mode === "single" ? " on" : "")} onClick={() => setMode("single")}>Singles</button>
            </div>
          )}
          <div className="col" style={{ maxHeight: 300, overflowY: "auto", marginBottom: 13, gap: 8 }}>
            {selections.map(s => (
              <div key={s.key} className="sel">
                <div className="bt"><div className="xxs faint clip grow">{s.label}</div><button className="btn d x" onClick={() => remove(s.key)}><Icon name="x" /></button></div>
                <div className="bt xs" style={{ marginTop: 4 }}><b className="clip">{s.pick}</b><b className="mono" style={{ color: "var(--jade)" }}>{s.price.toFixed(2)}</b></div>
                <div className="xxs faint">{s.market}</div>
              </div>
            ))}
          </div>
          <label className="f"><span>{tr(lang, "stake")} (CR)</span>
            <input className="in mono" type="number" min={10} step={10} value={stake} onChange={e => setStake(e.target.value)} />
          </label>
          <div className="chipline mb">
            {[50, 100, 500, 1000].map(v => <button key={v} className="btn o s" onClick={() => setStake(String(v))}>{v}</button>)}
            {me && <button className="btn o s" onClick={() => setStake(String(Math.floor(me.balance)))}>MAX</button>}
          </div>
          <div className="bt xs mb"><span className="dim">Total stake</span><b className="mono">{fmt(total)}</b></div>
          {mode === "combo" && <div className="bt xs mb"><span className="dim">Combined odds</span><b className="mono">{combo.toFixed(2)}</b></div>}
          <div className="bt mb" style={{ padding: "11px 13px", borderRadius: 11, background: "rgba(232,179,60,.09)", border: "1px solid rgba(232,179,60,.3)" }}>
            <span className="xs dim">Potential return</span><b className="mono" style={{ color: "var(--gold-hi)", fontSize: 17 }}>{fmt(Math.round(ret * 100) / 100)}</b>
          </div>
          <button className="btn j w" disabled={busy} onClick={place}>{busy ? "Placingâ€¦" : tr(lang, "place")}</button>
          <div className="xxs faint ctr" style={{ marginTop: 9 }}>Virtual credits Â· no real money Â· bets remain OPEN</div>
        </>
      )}
    </div>
  );
}