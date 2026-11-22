"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { fmt } from "@/lib/catalog";

const CATS = ["live", "slots", "crash", "roulette", "blackjack", "table", "instant"];
const BLANK = { id: "", name: "", provider: "", category: "slots", external_id: "", launch_url: "", thumbnail: "", status: "awaiting", domains: "", config: "{}", featured: false, sort: 0 };

export default function Admin() {
  const { me, toast } = useApp();
  const [tab, setTab] = useState("overview");
  const [ov, setOv] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState<any>(BLANK);
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState("");
  const [denied, setDenied] = useState(false);

  const loadOv = useCallback(() => { fetch("/api/admin/overview", { cache: "no-store" }).then(r => { if (r.status === 401 || r.status === 403) { setDenied(true); return null; } return r.json(); }).then(d => { if (d?.ok) setOv(d); }).catch(() => {}); }, []);
  const loadGames = useCallback(() => { fetch("/api/admin/games", { cache: "no-store" }).then(r => r.json()).then(d => { if (d.ok) setGames(d.games); }).catch(() => {}); }, []);
  const loadUsers = useCallback(() => { fetch("/api/admin/users", { cache: "no-store" }).then(r => r.json()).then(d => { if (d.ok) setUsers(d.users); }).catch(() => {}); }, []);

  useEffect(() => { if (me?.role === "admin") { loadOv(); loadGames(); loadUsers(); } }, [me, loadOv, loadGames, loadUsers]);

  if (!me) return <div className="empty"><Icon name="lock" /><div style={{ fontWeight: 750, marginBottom: 12 }}>Administrator sign-in required</div><Link href="/login" className="btn g">Sign in</Link></div>;
  if (me.role !== "admin" || denied) return <div className="empty"><Icon name="shield" /><div style={{ fontWeight: 750 }}>403  Administrator role required</div><div className="xs" style={{ marginTop: 8 }}>This route is protected on the server, not only in the interface.</div><Link href="/" className="btn o s" style={{ marginTop: 14 }}> Home</Link></div>;

  const saveGame = async () => {
    const r = await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sort: Number(form.sort) || 0, id: form.id || undefined }) });
    const d = await r.json();
    if (!d.ok) return toast(d.error ?? "Save failed", "e");
    setGames(d.games); setEditing(false); setForm(BLANK); loadOv(); toast("Game saved", "j");
  };
  const delGame = async (id: string) => {
    const r = await fetch("/api/admin/games?id=" + id, { method: "DELETE" });
    const d = await r.json(); if (d.ok) { setGames(d.games); loadOv(); toast("Game removed", "j"); }
  };
  const act = async (id: string, action: string, value?: any) => {
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, value }) });
    const d = await r.json();
    if (!d.ok) return toast(d.error ?? "Action failed", "e");
    setUsers(d.users); loadOv(); toast("User updated", "j");
  };

  const shown = games.filter(g => (g.name + g.provider + g.category).toLowerCase().includes(q.toLowerCase()));
  const maxDay = Math.max(1, ...(ov?.days ?? [1]));

  return (
    <div className="col">
      <div className="bt wrap">
        <h1 className="h2" style={{ margin: 0 }}><Icon name="shield" />Admin console</h1>
        <span className="tag g">SERVER-PROTECTED</span><Link href="/admin/td" className="btn g s">TD Control Center</Link><Link href="/admin/kb-rtp" className="btn g s">House Edge</Link><Link href="/admin/rtp" className="btn o s">RTP Control</Link>
      </div>

      <div className="tabs">
        {[["overview", "Overview"], ["games", "Game integrations"], ["users", "Users"], ["providers", "Providers & keys"]].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && ov && (
        <>
          <div className="grid g4">
            <div className="stat"><span>Users</span><b>{ov.users}</b></div>
            <div className="stat j"><span>Active 7d</span><b style={{ color: "var(--jade)" }}>{ov.active}</b></div>
            <div className="stat a"><span>Demo bets</span><b style={{ color: "#8FB8FF" }}>{ov.bets}</b></div>
            <div className="stat"><span>Virtual credits</span><b style={{ color: "var(--gold-hi)" }}>{Math.round(ov.balances).toLocaleString()}</b></div>
          </div>
          <div className="grid g2">
            <div className="card pad">
              <h3 className="h3">Bets  last 7 days</h3>
              <div className="row" style={{ alignItems: "flex-end", height: 140, gap: 9 }}>
                {ov.days.map((v: number, i: number) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: Math.max(5, (v / maxDay) * 108), borderRadius: "7px 7px 0 0", background: ["#E8B33C", "#12D18E", "#3B82F6", "#A855F7", "#22D3EE", "#F97316", "#FF4757"][i] }} />
                    <div className="xxs faint" style={{ marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card pad">
              <h3 className="h3">Catalogue by category</h3>
              {Object.entries(ov.byCat).map(([k, v]: any, i) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div className="bt xs"><span style={{ textTransform: "capitalize" }}>{k}</span><b className="mono">{v}</b></div>
                  <div className="bar"><i style={{ width: (v / Math.max(...Object.values(ov.byCat) as number[])) * 100 + "%", background: ["#E8B33C", "#A855F7", "#FF4757", "#12D18E", "#3B82F6", "#22D3EE", "#F97316"][i % 7] }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid g3">
            <div className="stat v"><span>Games connected</span><b style={{ color: "#D0A6FF" }}>{ov.connected}</b></div>
            <div className="stat"><span>Awaiting integration</span><b>{ov.awaiting}</b></div>
            <div className="stat a"><span>Storage driver</span><b style={{ fontSize: 18 }}>{ov.storage === "postgres" ? "PostgreSQL" : "Local file (dev)"}</b></div>
          </div>
          <div className="card pad">
            <h3 className="h3">Recent ledger activity</h3>
            <div className="scroll"><table className="tbl">
              <thead><tr><th>Kind</th><th>Note</th><th>Amount</th><th>After</th><th>When</th></tr></thead>
              <tbody>{ov.recentLedger.map((r: any) => (
                <tr key={r.id}><td><span className={"tag " + (r.after < r.before ? "e" : "j")}>{r.kind}</span></td>
                  <td className="xs dim">{r.note}</td><td className="mono xs">{fmt(r.amount)}</td>
                  <td className="mono xs">{r.after.toFixed(2)}</td><td className="xxs faint">{new Date(r.created).toLocaleString()}</td></tr>
              ))}</tbody></table></div>
          </div>
        </>
      )}

      {tab === "games" && (
        <>
          <div className="note a">
            Add a licensed title here and it appears instantly in the casino lobby. Set status to <b>connected</b> only when you hold a valid
            HTTPS launch URL from the provider. Allowed domains restrict which hosts may be embedded.
          </div>
          <div className="bt wrap">
            <button className="btn g" onClick={() => { setForm(BLANK); setEditing(true); }}><Icon name="plus" />Add game</button>
            <input className="in" style={{ maxWidth: 260 }} placeholder="Search catalogue" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="card pad scroll">
            <table className="tbl">
              <thead><tr><th>Title</th><th>Provider</th><th>Category</th><th>Status</th><th>Launch URL</th><th></th></tr></thead>
              <tbody>{shown.map(g => (
                <tr key={g.id}>
                  <td><b className="xs">{g.name}</b>{g.featured && <span className="tag g" style={{ marginInlineStart: 7 }}>FEATURED</span>}</td>
                  <td className="xs dim">{g.provider}</td>
                  <td className="xs" style={{ textTransform: "capitalize" }}>{g.category}</td>
                  <td><span className={"tag " + (g.status === "connected" ? "j" : g.status === "disabled" ? "e" : "n")}>{g.status}</span></td>
                  <td className="xxs faint clip" style={{ maxWidth: 220 }}>{g.launch_url || ""}</td>
                  <td><div className="row" style={{ gap: 5 }}>
                    <button className="btn o x" onClick={() => { setForm({ ...g }); setEditing(true); }}><Icon name="edit" /></button>
                    <button className="btn d x" onClick={() => delGame(g.id)}><Icon name="trash" /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {!shown.length && <div className="empty">No games match your search.</div>}
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="card pad scroll">
          <table className="tbl">
            <thead><tr><th>Account</th><th>Role</th><th>Balance</th><th>Bets</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id}>
                <td><b className="xs">{u.name}</b><div className="xxs faint">{u.email}</div></td>
                <td><span className={"tag " + (u.role === "admin" ? "g" : "a")}>{u.role}</span></td>
                <td className="mono xs">{fmt(u.balance)}</td>
                <td className="mono xs">{u.bets}</td>
                <td><span className={"tag " + (u.banned ? "e" : "j")}>{u.banned ? "SUSPENDED" : "ACTIVE"}</span></td>
                <td><div className="row wrap" style={{ gap: 5 }}>
                  <button className="btn o x" onClick={() => act(u.id, "credit", 1000)}>+1k</button>
                  <button className="btn o x" onClick={() => act(u.id, "debit", 1000)}>1k</button>
                  <button className="btn o x" onClick={() => act(u.id, "role", u.role === "admin" ? "user" : "admin")}>{u.role === "admin" ? "Demote" : "Promote"}</button>
                  <button className="btn d x" disabled={u.id === me.id} onClick={() => act(u.id, u.banned ? "unban" : "ban")}>{u.banned ? "Restore" : "Suspend"}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "providers" && ov && (
        <>
          <div className="note g">Keys live only in server environment variables. They are never bundled into the browser and never committed to the repository.</div>
          <div className="card pad scroll">
            <table className="tbl">
              <thead><tr><th>Service</th><th>Environment variable</th><th>Status</th><th>Where to obtain</th></tr></thead>
              <tbody>
                <tr><td><b className="xs">API-Football</b><div className="xxs faint">Fixtures, live scores, odds</div></td><td className="mono xxs">FOOTBALL_ODDS_API_KEY</td>
                  <td><span className={"tag " + (ov.providers.football.configured ? "j" : "n")}>{ov.providers.football.configured ? "CONFIGURED" : "MISSING"}</span></td>
                  <td className="xxs"><a href="https://dashboard.api-football.com/" target="_blank" rel="noreferrer" style={{ color: "var(--gold-hi)" }}>dashboard.api-football.com</a></td></tr>
                <tr><td><b className="xs">The Odds API</b><div className="xxs faint">Multi-sport bookmaker prices</div></td><td className="mono xxs">ODDS_API_KEY</td>
                  <td><span className={"tag " + (ov.providers.odds.configured ? "j" : "n")}>{ov.providers.odds.configured ? "CONFIGURED" : "MISSING"}</span></td>
                  <td className="xxs"><a href="https://the-odds-api.com/#get-access" target="_blank" rel="noreferrer" style={{ color: "var(--gold-hi)" }}>the-odds-api.com</a></td></tr>
                <tr><td><b className="xs">Casino aggregator</b><div className="xxs faint">Licensed game launch</div></td><td className="mono xxs">CASINO_AGGREGATOR_KEY</td>
                  <td><span className={"tag " + (ov.providers.aggregator.configured ? "j" : "n")}>{ov.providers.aggregator.configured ? "CONFIGURED" : "COMMERCIAL AGREEMENT REQUIRED"}</span></td>
                  <td className="xxs dim">Signed contract with your aggregator</td></tr>
                <tr><td><b className="xs">Database</b><div className="xxs faint">Production persistence</div></td><td className="mono xxs">POSTGRES_URL</td>
                  <td><span className={"tag " + (ov.providers.database.configured ? "j" : "g")}>{ov.providers.database.configured ? "POSTGRES CONNECTED" : "LOCAL FILE (DEV)"}</span></td>
                  <td className="xxs"><a href="https://neon.tech" target="_blank" rel="noreferrer" style={{ color: "var(--gold-hi)" }}>neon.tech</a>  free tier</td></tr>
                <tr><td><b className="xs">Payments</b></td><td className="mono xxs"></td>
                  <td><span className="tag v">DISABLED BY DESIGN</span></td><td className="xxs dim">No real payment integration exists</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <div className="modal" onClick={() => setEditing(false)}>
          <div className="modalbox" onClick={e => e.stopPropagation()}>
            <h3 className="h2">{form.id ? "Edit game" : "Add game"}</h3>
            <div className="grid g2">
              <label className="f"><span>Title</span><input className="in" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
              <label className="f"><span>Provider</span><input className="in" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="GameDistribution" /></label>
              <label className="f"><span>Category</span><select className="in" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="f"><span>Status</span><select className="in" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="awaiting">awaiting</option><option value="pending">pending</option><option value="connected">connected</option><option value="disabled">disabled</option></select></label>
            </div>
            <label className="f"><span>Provider game ID</span><input className="in" value={form.external_id} onChange={e => setForm({ ...form, external_id: e.target.value })} /></label>
            <label className="f"><span>Launch URL (https)</span><input className="in" value={form.launch_url} onChange={e => setForm({ ...form, launch_url: e.target.value })} placeholder="https://provider.com/launch/..." /></label>
            <label className="f"><span>Thumbnail URL</span><input className="in" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://cdn.provider.com/thumb.jpg" /></label>
            <label className="f"><span>Allowed domains (comma separated)</span><input className="in" value={form.domains} onChange={e => setForm({ ...form, domains: e.target.value })} placeholder="html5.gamedistribution.com" /></label>
            <label className="f"><span>Launch configuration (JSON)</span><textarea className="in mono" value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} /></label>
            <div className="grid g2">
              <label className="f"><span>Sort order</span><input className="in" type="number" value={form.sort} onChange={e => setForm({ ...form, sort: e.target.value })} /></label>
              <label className="f"><span>Featured</span><select className="in" value={form.featured ? "1" : "0"} onChange={e => setForm({ ...form, featured: e.target.value === "1" })}><option value="0">No</option><option value="1">Yes</option></select></label>
            </div>
            <div className="row"><button className="btn j grow" onClick={saveGame}>Save game</button><button className="btn o" onClick={() => setEditing(false)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}