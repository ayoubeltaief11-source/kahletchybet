"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { fmt } from "@/lib/catalog";

// هذه الصفحة مخصصة للإدارة فقط
export default function AdminTD() {
  const { me, toast } = useApp();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("funding");
  const [uid, setUid] = useState("");
  const [amt, setAmt] = useState("10");
  const [defCap, setDefCap] = useState("30");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/td", { cache: "no-store" }).then(r => r.json()).then(d => {
      if (d.ok) { setData(d); setDefCap(String(d.defaultCap)); }
    }).catch(() => {});
  }, []);
  useEffect(() => { if (me?.role === "admin") load(); }, [me, load]);

  if (!me) return <div className="empty"><Icon name="lock" /><div style={{ marginBottom: 12 }}>Administrator sign-in required</div><Link href="/login" className="btn g">Sign in</Link></div>;
  if (me.role !== "admin") return <div className="empty"><Icon name="shield" /><div>403 - Administrator role required</div><Link href="/" className="btn o s" style={{ marginTop: 14 }}>Home</Link></div>;

  const act = async (action: string, userId?: string, amount?: number) => {
    setBusy(true);
    const r = await fetch("/api/admin/td", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, userId, amount }) });
    const d = await r.json(); setBusy(false);
    if (!d.ok) return toast(d.error ?? "Failed", "e");
    toast(d.message ?? "Saved", "j"); load();
  };

  const users = (data?.users ?? []).filter((u: any) => (u.name + u.email + u.id).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="col">
      <div className="bt wrap">
        <h1 className="h2" style={{ margin: 0 }}><Icon name="shield" />TD Control Center</h1>
        <div className="row"><span className="kb-demobadge">Demo</span><Link href="/admin" className="btn o s">Main admin</Link></div>
      </div>

      <div className="note v">
        Simulation control surface. TD carries no monetary value and no payment integration exists.
        Every funding action and cap change is written to the audit trail below.
      </div>

      <div className="tabs">
        {[["funding","Funding by ID"],["caps","Weekly caps"],["rounds","Rounds"],["audit","Audit trail"]].map(([k,l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "funding" && (
        <>
          <div className="card pad">
            <h3 className="h3">Credit or debit an account by ID</h3>
            <div className="grid g2">
              <label className="f"><span>User ID</span><input className="in mono" value={uid} onChange={e => setUid(e.target.value)} placeholder="paste the account ID" /></label>
              <label className="f"><span>Amount (TD)</span><input className="in mono" type="number" min={0} step={1} value={amt} onChange={e => setAmt(e.target.value)} /></label>
            </div>
            <div className="chipline mb">{[10,20,50,100].map(v => <button key={v} className="btn o s" onClick={() => setAmt(String(v))}>{v} TD</button>)}</div>
            <div className="row wrap">
              <button className="btn j" disabled={busy || !uid} onClick={() => act("deposit", uid, Number(amt))}>Deposit TD</button>
              <button className="btn d" disabled={busy || !uid} onClick={() => act("withdraw", uid, Number(amt))}>Withdraw TD</button>
            </div>
          </div>
          <div className="card pad">
            <div className="bt wrap mb"><h3 className="h3" style={{ margin: 0 }}>Accounts</h3>
              <input className="in" style={{ maxWidth: 220 }} placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="scroll"><table className="tbl">
              <thead><tr><th>Account</th><th>ID</th><th>Balance</th><th>Week net</th><th>Headroom</th><th></th></tr></thead>
              <tbody>{users.map((u: any) => (
                <tr key={u.id}>
                  <td><b className="xs">{u.name}</b><div className="xxs faint">{u.email}</div></td>
                  <td><button className="btn o x mono" onClick={() => { setUid(u.id); toast("ID copied to form", "j"); }}>{u.id.slice(0,10)}...</button></td>
                  <td className="mono xs">{fmt(u.balance)}</td>
                  <td className="mono xs" style={{ color: u.net >= 0 ? "var(--jade)" : "var(--ember)" }}>{u.net.toFixed(2)}</td>
                  <td className="mono xs">{u.headroom.toFixed(2)}</td>
                  <td><button className="btn o x" onClick={() => { setUid(u.id); setTab("funding"); }}>Select</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        </>
      )}

      {tab === "caps" && (
        <>
          <div className="card pad">
            <h3 className="h3">Default weekly ceiling for new accounts</h3>
            <div className="row wrap">
              <input className="in mono" style={{ maxWidth: 160 }} type="number" min={0} value={defCap} onChange={e => setDefCap(e.target.value)} />
              <button className="btn g" disabled={busy} onClick={() => act("defaultCap", undefined, Number(defCap))}>Save default</button>
            </div>
            <div className="xxs faint mt">Applied to any account without an individual ceiling.</div>
          </div>
          <div className="card pad">
            <h3 className="h3">Per-account ceilings</h3>
            <div className="scroll"><table className="tbl">
              <thead><tr><th>Account</th><th>Current cap</th><th>Week net</th><th>New cap</th><th></th></tr></thead>
              <tbody>{users.map((u: any) => <CapRow key={u.id} u={u} busy={busy} onSave={(v) => act("cap", u.id, v)} />)}</tbody>
            </table></div>
          </div>
        </>
      )}

      {tab === "rounds" && (
        <div className="card pad">
          <h3 className="h3">Recent casino rounds</h3>
          <div className="scroll"><table className="tbl">
            <thead><tr><th>Game</th><th>Engine</th><th>Stake</th><th>Payout</th><th>Mult</th><th>When</th></tr></thead>
            <tbody>{(data?.rounds ?? []).map((r: any) => (
              <tr key={r.id}>
                <td className="xs">{r.slug}</td><td className="xxs">{r.engine}</td>
                <td className="mono xs">{fmt(r.stake)}</td>
                <td className="mono xs" style={{ color: r.payout > 0 ? "var(--jade)" : "var(--faint)" }}>{fmt(r.payout)}</td>
                <td className="mono xs">{r.mult.toFixed(2)}x</td>
                <td className="xxs faint">{new Date(r.ts).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {!(data?.rounds ?? []).length && <div className="empty">No rounds recorded yet.</div>}
        </div>
      )}

      {tab === "audit" && (
        <div className="card pad">
          <h3 className="h3">Administrator audit trail</h3>
          <div className="scroll"><table className="tbl">
            <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th><th>When</th></tr></thead>
            <tbody>{(data?.audit ?? []).map((a: any) => (
              <tr key={a.id}>
                <td className="xs">{a.actor}</td>
                <td><span className="tag g">{a.action}</span></td>
                <td className="xs">{a.target}</td>
                <td className="xs dim">{a.detail}</td>
                <td className="xxs faint">{new Date(a.ts).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {!(data?.audit ?? []).length && <div className="empty">No administrative actions yet.</div>}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #333", borderRadius: 8 }}>
        <h3 style={{ marginBottom: 12 }}>Create New Account</h3>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Create a new user or secondary admin. They must change password on first login.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <input id="new-name" placeholder="Full Name" className="input" />
          <input id="new-email" placeholder="Email" className="input" type="email" />
          <input id="new-password" placeholder="Temporary Password" className="input" type="password" />
          <select id="new-role" className="input">
            <option value="user">Regular User</option>
            <option value="secondary_admin">Secondary Admin</option>
          </select>
        </div>
        <button 
          className="btn" 
          style={{ marginTop: 12 }} 
          onClick={async () => {
            const name = (document.getElementById("new-name") as HTMLInputElement)?.value;
            const email = (document.getElementById("new-email") as HTMLInputElement)?.value;
            const password = (document.getElementById("new-password") as HTMLInputElement)?.value;
            const role = (document.getElementById("new-role") as HTMLSelectElement)?.value;
            if (!name || !email || !password) return alert("Please fill all fields");
            try {
              const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
              });
              const data = await res.json();
              if (res.ok) {
                alert("Account created successfully!");
                window.location.reload();
              } else {
                alert("Error: " + (data.error || "Unknown error"));
              }
            } catch (e) {
              alert("Network error");
            }
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function CapRow({ u, busy, onSave }: { u: any; busy: boolean; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(u.cap));
  return (
    <tr>
      <td><b className="xs">{u.name}</b><div className="xxs faint">{u.email}</div></td>
      <td className="mono xs">{u.cap} TD</td>
      <td className="mono xs" style={{ color: u.net >= 0 ? "var(--jade)" : "var(--ember)" }}>{u.net.toFixed(2)}</td>
      <td><input className="in mono" style={{ maxWidth: 110, padding: "6px 10px" }} type="number" min={0} value={v} onChange={e => setV(e.target.value)} /></td>
      <td><button className="btn g x" disabled={busy} onClick={() => onSave(Number(v))}>Save</button></td>
    </tr>
  );
}
