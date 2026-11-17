"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import { tr } from "@/lib/catalog";

export default function Login() {
  const { lang, refresh, toast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const d = await r.json(); setBusy(false);
    if (!d.ok) return setErr(d.error ?? "Sign-in failed");
    refresh(); toast("Welcome back, " + d.user.name, "j"); router.push("/dashboard"); router.refresh();
  };

  return (
    <div style={{ maxWidth: 470, margin: "26px auto" }}>
      <div className="card pad fade">
        <div className="ctr mb">
          <div className="crest" style={{ width: 58, height: 58, margin: "0 auto 14px" }} />
          <h1 className="h2" style={{ justifyContent: "center" }}>{tr(lang, "signin")}</h1>
          <p className="xs dim" style={{ margin: 0 }}>Access your VORTEX BET demo account</p>
        </div>
        <form onSubmit={submit}>
          <label className="f"><span>Email</span><input className="in" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label className="f"><span>Password</span><input className="in" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" /></label>
          {err && <div className="note e mb">{err}</div>}
          <button className="btn j w" disabled={busy}>{busy ? "Signing inâ€¦" : tr(lang, "signin")}</button>
        </form>
        <div className="ctr mt xs"><span className="dim">No account? </span><Link href="/register" style={{ color: "var(--gold-hi)", fontWeight: 800 }}>{tr(lang, "register")}</Link></div>
        <div className="card pad mt" style={{ background: "var(--void)" }}>
          <div className="xxs dim mb" style={{ fontWeight: 800, letterSpacing: 1 }}>SEEDED DEMO ACCOUNTS</div>
          <div className="xxs mono">player@vortexbet.demo Â· Player123!</div>
          <div className="xxs mono">admin@vortexbet.demo Â· ChangeMe123!</div>
        </div>
        <div className="note g mt">{tr(lang, "demo")}</div>
      </div>
    </div>
  );
}