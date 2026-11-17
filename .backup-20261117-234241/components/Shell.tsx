"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import Icon from "./Icon";
import { SPORTS, tr, fmt, type Lang } from "@/lib/catalog";

type Me = { id: string; email: string; name: string; role: string; avatar: string; balance: number } | null;
const Ctx = createContext<{ me: Me; lang: Lang; setLang: (l: Lang) => void; refresh: () => void; toast: (m: string, k?: string) => void }>({ me: null, lang: "en", setLang: () => {}, refresh: () => {}, toast: () => {} });
export const useApp = () => useContext(Ctx);

const NAV = [
  { href: "/", key: "home", icon: "home", label: { en: "Home", ar: "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", fr: "Accueil" } },
  { href: "/sports", key: "sports", icon: "football", label: null },
  { href: "/casino", key: "casino", icon: "casino", label: null },
  { href: "/wallet", key: "wallet", icon: "wallet", label: null },
  { href: "/dashboard", key: "dashboard", icon: "user", label: null },
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const [msg, setMsg] = useState<{ m: string; k: string } | null>(null);
  const [busy, setBusy] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(d => { setMe(d.user ?? null); setBusy(false); }).catch(() => setBusy(false));
  }, []);

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("vbx_lang")) as Lang | null;
    const l: Lang = saved === "ar" || saved === "fr" ? saved : "en";
    setLangState(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    refresh();
    const iv = setInterval(refresh, 25000);
    return () => clearInterval(iv);
  }, [refresh]);

  const setLang = (l: Lang) => {
    setLangState(l); localStorage.setItem("vbx_lang", l);
    document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };
  const toast = (m: string, k = "g") => { setMsg({ m, k }); setTimeout(() => setMsg(null), 3400); };
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  const label = (n: typeof NAV[number]) => (n.label ? n.label[lang] : tr(lang, n.key as any));

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null); toast("Signed out", "j"); router.push("/"); router.refresh();
  };

  return (
    <Ctx.Provider value={{ me, lang, setLang, refresh, toast }}>
      <div className="app">
        <aside className="side">
          <Link href="/" className="brand">
            <div className="crest" />
            <div className="wordmark">VORTEX <i>BET</i><small>DEMO PLATFORM</small></div>
          </Link>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={"nav" + (on(n.href) ? " on" : "")}>
              <Icon name={n.icon} /><span>{label(n)}</span>
            </Link>
          ))}
          {me?.role === "admin" && (
            <Link href="/admin" className={"nav" + (on("/admin") ? " on" : "")}><Icon name="shield" /><span>{tr(lang, "admin")}</span></Link>
          )}
          <div style={{ height: 14 }} />
          <div className="xxs faint" style={{ paddingInlineStart: 13, letterSpacing: 1.4, fontWeight: 900 }}>SPORTS</div>
          <div style={{ overflowY: "auto", flex: 1, marginTop: 6 }}>
            {SPORTS.map(s => (
              <Link key={s.key} href={"/sports/" + s.key} className={"nav" + (path === "/sports/" + s.key ? " on" : "")} style={{ padding: "8px 13px", fontSize: 13 }}>
                <Icon name={s.icon} /><span>{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</span>
              </Link>
            ))}
          </div>
          <div className="sidefoot"><b>DEMO / EDUCATIONAL</b>{tr(lang, "demo")}</div>
        </aside>

        <div className="main">
          <header className="top">
            <Link href="/" className="wordmark" style={{ fontSize: 16 }}>VORTEX <i>BET</i></Link>
            <nav className="toplinks">
              {NAV.map(n => <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}>{label(n)}</Link>)}
              {me?.role === "admin" && <Link href="/admin" className={on("/admin") ? "on" : ""}>{tr(lang, "admin")}</Link>}
            </nav>
            <div className="langs">
              {(["en", "ar", "fr"] as Lang[]).map(l => (
                <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            {!busy && (me ? (
              <>
                <Link href="/wallet" className="purse"><Icon name="wallet" className="" />{fmt(me.balance)}</Link>
                <Link href="/dashboard" className="ava" title={me.name}>{me.name.slice(0, 1).toUpperCase()}</Link>
                <button className="btn o s" onClick={signOut}><Icon name="logout" /></button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn o s">{tr(lang, "signin")}</Link>
                <Link href="/register" className="btn g s">{tr(lang, "register")}</Link>
              </>
            ))}
          </header>

          <main className="body">{children}</main>

          <footer className="foot">
            <div>{tr(lang, "demo")}</div>
            <div style={{ marginTop: 6 }}>
              <Link href="/legal/terms">Terms</Link>Â·<Link href="/legal/privacy">Privacy</Link>Â·<Link href="/legal/responsible">Responsible Play</Link>Â·<Link href="/legal/integrations">Integrations</Link>
            </div>
            <div style={{ marginTop: 6 }}>Â© {new Date().getFullYear()} VORTEX BET â€” kahlatchyBET project. 18+ educational demonstration.</div>
          </footer>
        </div>

        <nav className="dock">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""}><Icon name={n.icon} /><span>{label(n)}</span></Link>
          ))}
        </nav>
      </div>
      {msg && <div className={"toast " + msg.k}>{msg.m}</div>}
    </Ctx.Provider>
  );
}