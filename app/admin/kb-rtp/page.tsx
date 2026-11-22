"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import { FAMILIES, RTP_DEFAULTS } from "@/lib/kb/rtp";
import type { Family } from "@/lib/kb/rtp";
interface Audit { id: string; actor: string; action: string; target: string; detail: string; ts: number; }
export default function KBRtp() {
  const { me, toast } = useApp();
  const [live, setLive] = useState<Record<string, number>>({});
  const [audit, setAudit] = useState<Audit[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const load = useCallback(function () {
    fetch("/api/kb/admin", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) return;
      setLive(d.live); setAudit(d.audit || []);
      const dr: Record<string, string> = {};
      FAMILIES.forEach(function (f) { dr[f] = (d.live[f] * 100).toFixed(1); });
      setDraft(dr);
    }).catch(function () { });
  }, []);
  useEffect(function () { if (me && me.role === "admin") load(); }, [me, load]);
  const save = useCallback(async function (f: Family) {
    const v = Number(draft[f]) / 100;
    const r = await fetch("/api/kb/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cat: f, value: v }) });
    const d = await r.json();
    if (d.ok) { toast(d.message, "j"); load(); } else toast(d.error || "Failed", "e");
  }, [draft, toast, load]);
  if (!me || me.role !== "admin") return <div className="kb-empty"><b>Administrator access required</b><Link href="/admin" className="kb-btn">Admin home</Link></div>;
  return (
    <div className="kb-admin">
      <div className="kb-admin-head">
        <h1>House Edge Control</h1>
        <span className="kb-demo big">Demo</span>
        <Link href="/admin" className="kb-btn">Back</Link>
      </div>
      <div className="kb-warn">These values are read by the server on every single round. Lowering RTP accelerates simulated losses and makes the house advantage visible. This platform holds no real money and TD cannot be bought, sold or redeemed.</div>
      <div className="kb-rtp-grid">
        {FAMILIES.map(function (f) {
          const cur = live[f] || RTP_DEFAULTS[f].rtp;
          const def = RTP_DEFAULTS[f].rtp;
          return (
            <div key={f} className="kb-rtp-card">
              <h3>{RTP_DEFAULTS[f].label}</h3>
              <div className="kb-rtp-nums">
                <div><span>Live RTP</span><b style={{ color: cur < def ? "#FF6B6B" : "#12D18E" }}>{(cur * 100).toFixed(1)}%</b></div>
                <div><span>House edge</span><b>{((1 - cur) * 100).toFixed(1)}%</b></div>
                <div><span>Default</span><b>{(def * 100).toFixed(1)}%</b></div>
              </div>
              <div className="kb-bar"><i style={{ width: (cur * 100) + "%" }}/><u style={{ left: (def * 100) + "%" }}/></div>
              <p>{RTP_DEFAULTS[f].note}</p>
              <div className="kb-rtp-set">
                <input type="number" min={50} max={99.5} step={0.1} value={draft[f] || ""} onChange={function (e) { const nv = e.target.value; setDraft(function (p) { const c: Record<string, string> = {}; Object.keys(p).forEach(function (k) { c[k] = p[k]; }); c[f] = nv; return c; }); }}/>
                <span>%</span>
                <button onClick={function () { void save(f); }}>Apply</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="kb-audit">
        <h3>Administrative audit trail</h3>
        {audit.length === 0 && <p className="kb-dim">No changes recorded yet.</p>}
        {audit.slice(0, 30).map(function (a) {
          return <div key={a.id} className="kb-audit-row"><b>{a.action}</b><span>{a.target}</span><em>{a.detail}</em><i>{a.actor}</i><u>{new Date(a.ts).toLocaleString()}</u></div>;
        })}
      </div>
    </div>
  );
}
