"use client";
import { useEffect, useState } from "react";
import { useApp } from "./Shell";
import Icon from "./Icon";

export default function EmbeddedStage({ name, iframeUrl, category }: { name: string; iframeUrl: string; category: string }) {
  const { me } = useApp();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!me) return;
    const t = setTimeout(() => { if (loading) setBlocked(true); }, 9000);
    return () => clearTimeout(t);
  }, [loading, me]);

  if (!me) {
    return (
      <div className="empty">
        <Icon name="lock" />
        <div style={{ fontWeight: 750, marginBottom: 12 }}>Sign in to access the demo casino</div>
      </div>
    );
  }

  return (
    <div className="embedded-wrapper">
      <div className="embedded-header">
        <div className="row">
          <span className="kb-demobadge lg">Demo</span>
          <span className="tag n">{category.toUpperCase()}</span>
        </div>
        <h2 className="h2" style={{ margin: 0, fontSize: 18 }}>{name}</h2>
      </div>

      <div className="embedded-frame-container">
        {loading && !blocked && (
          <div className="embedded-loader">
            <div className="spinner"></div>
            <div className="xxs faint mt">Loading secure demo environment...</div>
          </div>
        )}
        {blocked && (
          <div className="embedded-error">
            <Icon name="info" />
            <b>Demo session restricted</b>
            <div className="xs dim mt">This provider session is not accepting embedded access right now. Try another title from the lobby.</div>
          </div>
        )}
        <iframe
          src={iframeUrl}
          title={name}
          className={"embedded-iframe " + (loading ? "hidden" : "visible")}
          allow="autoplay; fullscreen; gamepad; microphone; camera"
          allowFullScreen
          onLoad={() => { setLoading(false); setBlocked(false); }}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="note g mt">
        <b>Transparency:</b> this game runs in the provider own demo session with provider credits.
        It is not linked to your kahlatchybet TD wallet.
      </div>
    </div>
  );
}