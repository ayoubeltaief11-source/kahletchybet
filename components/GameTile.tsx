"use client";
import Icon from "./Icon";
import { useApp } from "./Shell";

const HUE: Record<string, string> = { live: "#E8B33C", slots: "#A855F7", crash: "#FF4757", roulette: "#12D18E", blackjack: "#3B82F6", table: "#22D3EE", instant: "#F97316" };
const GLYPH: Record<string, string> = { live: "live", slots: "slots", crash: "crash", roulette: "roulette", blackjack: "blackjack", table: "table", instant: "instant" };

export default function GameTile({ game }: { game: any }) {
  const { toast, me } = useApp();
  const hue = HUE[game.category] ?? "#E8B33C";
  const connected = game.status === "connected" && game.launchable;

  const launch = async () => {
    if (!me) return toast("Sign in to launch a game", "e");
    if (!connected) return toast("Awaiting a licensed provider integration", "g");
    const r = await fetch("/api/games/launch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: game.id }) });
    const d = await r.json();
    if (!d.ok) return toast(d.error ?? "Launch failed", "e");
    window.open(d.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="tile">
      {game.featured && <span className="badge tag g">FEATURED</span>}
      <div className="thumb" style={{ background: `linear-gradient(150deg, ${hue}44, ${hue}12 55%, #06080B)` }}>
        {game.thumbnail
          ? <img src={game.thumbnail} alt={game.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          : <Icon name={GLYPH[game.category] ?? "casino"} className="glyph" />}
        <div className="lock"><span>{connected ? "LAUNCH DEMO" : "AWAITING INTEGRATION"}</span></div>
      </div>
      <div className="tilebody">
        <div className="bt"><b style={{ fontSize: 13.5 }} className="clip">{game.name}</b></div>
        <div className="xxs faint clip">{game.provider}</div>
        <div className="bt" style={{ marginTop: "auto", paddingTop: 6 }}>
          <span className={"tag " + (connected ? "j" : game.status === "disabled" ? "e" : "n")}>
            {connected ? "CONNECTED" : game.status === "pending" ? "PENDING" : game.status === "disabled" ? "DISABLED" : "COMING SOON"}
          </span>
          <button className={"btn " + (connected ? "g" : "o") + " s"} onClick={launch}>{connected ? "Play" : "Notify"}</button>
        </div>
      </div>
    </div>
  );
}