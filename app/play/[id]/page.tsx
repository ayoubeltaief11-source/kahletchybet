"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";

export default function Play() {
  const { id } = useParams<{ id: string }>();
  const { me, toast } = useApp();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!me) { setLoading(false); return; }
    const referrer = window.location.origin;
    fetch("/api/games/launch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, referrer }) })
      .then(r => r.json()).then(d => {
        if (d.ok) { setUrl(d.url); setName(d.name); } else setErr(d.error ?? "Launch failed");
        setLoading(false);
      }).catch(() => { setErr("Network error"); setLoading(false); });
  }, [id, me]);

  const goFull = () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen(); setFull(false); }
    else { el.requestFullscreen?.().then(() => setFull(true)).catch(() => toast("Fullscreen blocked by browser", "e")); }
  };

  if (!me) return <div className="empty"><Icon name="lock" /><div style={{ fontWeight: 750, marginBottom: 12 }}>Sign in to play</div><Link href="/login" className="btn g">Sign in</Link></div>;

  return (
    <div className="col">
      <div className="bt wrap">
        <div className="row"><Link href="/casino" className="btn o s">â† Casino</Link><h1 className="h2" style={{ margin: 0, fontSize: 19 }}>{name || "Game"}</h1></div>
        <div className="row wrap">
          <span className="tag j">CONNECTED</span>
          <span className="tag v">DEMO MODE</span>
          {url && <button className="btn g s" onClick={goFull}><Icon name="bolt" />{full ? "Exit full" : "Fullscreen"}</button>}
          {url && <button className="btn o s" onClick={() => { const u = url; setUrl(""); setTimeout(() => setUrl(u), 60); }}><Icon name="refresh" />Reload</button>}
        </div>
      </div>

      {loading && <div className="skel" style={{ height: 520 }} />}
      {err && <div className="note e">{err}</div>}

      {url && (
        <div ref={box} className="kb-stageframe">
          <iframe src={url} title={name} className="kb-frame" allow="autoplay; fullscreen; gamepad; microphone; camera" allowFullScreen
            referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}

      <div className="note g">
        Game served by GameDistribution with the required referrer parameter. In-game credits belong to the provider demo session.
        Your kahlatchybet wallet is separate and uses virtual TD credits only.
      </div>
    </div>
  );
}