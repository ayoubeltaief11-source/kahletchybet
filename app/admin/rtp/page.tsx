"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { DEFAULT_RTP } from "@/lib/rtp-config";

export default function AdminRtp() {
  const { me, toast } = useApp();
  const [vals, setVals] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch("/api/admin/rtp").then(r => r.json()).then(d => { if (d.ok) setVals(d.rtp); });
  }, []);
  if (!me || (me.role !== "admin" && me.role !== "secondary_admin")) {
    return <div className="empty"><Icon name="shield" /><div>Admin or Secondary Admin access required</div></div>;
  }
  const save = async (cat: string, v: number) => {
    const r = await fetch("/api/admin/rtp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cat, value: v }) });
    const d = await r.json();
    if (d.ok) { setVals(p => ({ ...p, [cat]: v })); toast(cat + " RTP saved", "j"); } else toast(d.error, "e");
  };
  return (
    <div className="col">
      <div className="bt wrap mb"><h1 className="h2" style={{ margin: 0 }}><Icon name="shield" /> RTP / House Edge Control</h1><span className="kb-demobadge lg">Demo</span></div>
      <div className="note v mb">
        These values are read by the SERVER on every round. Lower RTP = faster simulated losses. 
        <strong> Example: If RTP is 50%, and 10 players each bet 10 TD, they will collectively lose 50 TD and win 50 TD.</strong>
      </div>
      <div className="card pad">
        <table className="tbl">
          <thead><tr><th>Category</th><th>Default RTP</th><th>Current RTP</th><th>House Edge</th><th>Set</th></tr></thead>
          <tbody>
            {Object.keys(DEFAULT_RTP).map(cat => {
              const cur = vals[cat] ?? DEFAULT_RTP[cat].rtp;
              const houseEdge = ((1 - cur) * 100).toFixed(1);
              return (<tr key={cat}>
                <td>
                  <b>{DEFAULT_RTP[cat].label}</b>
                  <div className="xxs faint">{DEFAULT_RTP[cat].warning}</div>
                  <div className="xxs" style={{ color: "var(--k2-gold2)", marginTop: 4 }}>
                    {cur < 0.5 ? "⚠️ Low RTP: Players lose fast." : cur > 0.9 ? "✅ High RTP: Players win more often." : "⚖️ Balanced RTP."}
                  </div>
                </td>
                <td className="mono xs">{(DEFAULT_RTP[cat].rtp * 100).toFixed(1)}%</td>
                <td className="mono xs" style={{ color: cur < DEFAULT_RTP[cat].rtp ? "var(--ember)" : "var(--jade)" }}>{(cur * 100).toFixed(1)}%</td>
                <td className="mono xs">{houseEdge}%</td>
                <td><RtpCell cat={cat} val={cur} onSave={save} /></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function RtpCell({ cat, val, onSave }: { cat: string; val: number; onSave: (c: string, v: number) => void }) {
  const [v, setV] = useState((val * 100).toFixed(1));
  return <div className="row"><input className="in mono" style={{ maxWidth: 90 }} value={v} onChange={e => setV(e.target.value)} /><button className="btn g x" onClick={() => onSave(cat, Math.max(0.5, Math.min(1, Number(v) / 100)))}>Save</button></div>;
}
