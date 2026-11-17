"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import { tr } from "@/lib/catalog";

export default function Register() {
  const { lang, refresh, toast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, password }) });
    const d = await r.json(); setBusy(false);
    if (!d.ok) return setErr(d.error ?? "Registration failed");
    refresh(); toast("Account created â€” 10,000 demo credits added", "j"); router.push("/dashboard"); router.refresh();
  };

  return (
    <div style={{ maxWidth: 470, margin: "26px auto" }}>
      <div className="card pad fade">
        <div className="ctr mb">
          <div className="crest" style={{ width: 58, height: 58, margin: "0 auto 14px" }} />
          <h1 className="h2" style={{ justifyContent: "center" }}>{tr(lang, "register")}</h1>
          <p className="xs dim" style={{ margin: 0 }}>Create an account and receive 10,000 virtual credits</p>
        </div>
        <form onSubmit={submit}>
          <label className="f"><span>Display name</span><input className="in" required minLength={3} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>
          <label className="f"><span>Email</span><input className="in" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label className="f"><span>Password (8+ characters)</span><input className="in" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" /></label>
          {err && <div className="note e mb">{err}</div>}
          <button className="btn g w" disabled={busy}>{busy ? "Creatingâ€¦" : tr(lang, "register")}</button>
        </form>
        <div className="ctr mt xs"><span className="dim">Already registered? </span><Link href="/login" style={{ color: "var(--gold-hi)", fontWeight: 800 }}>{tr(lang, "signin")}</Link></div>
        <div className="note g mt">{tr(lang, "demo")}</div>
      </div>
    </div>
  );
}