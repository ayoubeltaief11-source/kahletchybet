"use client";
import Link from "next/link";
import Icon from "./Icon";
import { useApp } from "./Shell";

const HUE: Record<string, string> = { live: "#E8B33C", slots: "#A855F7", crash: "#FF4757", roulette: "#12D18E", blackjack: "#3B82F6", table: "#22D3EE", instant: "#F97316" };
const GLYPH: Record<string, string> = { live: "live", slots: "slots", crash: "crash", roulette: "roulette", blackjack: "blackjack", table: "table", instant: "instant" };

export default function GameTile({ game }: { game: any }) {
  const { toast, me } = useApp();
  const hue = HUE[game.category] ?? "#E8B33C";
  const connected = game.status === "connected" && game.launchable;
  const href = "/play/" + game.id;

  const guard = (e: React.MouseEvent) => {
    if (!me) { e.preventDefault(); toast("Sign in to play", "e"); return; }
    if (!connected) { e.preventDefault(); toast("Awaiting provider integration", "g"); }
  };

  return (
    <div className="tile">
      {game.featured && <span className="badge tag g">FEATURED</span>}
      <Link href={href} onClick={guard}>
        <div className="thumb" style={{ background: `linear-gradient(150deg, ${hue}44, ${hue}12 55%, #06080B)` }}>
          {game.thumbnail
            ? <img src={game.thumbnail} alt={game.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            : <Icon name={GLYPH[game.category] ?? "casino"} className="glyph" />}
          <div className="lock"><span>{connected ? "PLAY NOW" : "COMING SOON"}</span></div>
        </div>
      </Link>
      <div className="tilebody">
        <b style={{ fontSize: 13.5 }} className="clip">{game.name}</b>
        <div className="xxs faint clip">{game.provider}</div>
        <div className="bt" style={{ marginTop: "auto", paddingTop: 6 }}>
          <span className={"tag " + (connected ? "j" : game.status === "disabled" ? "e" : "n")}>{connected ? "CONNECTED" : (game.status ?? "awaiting").toUpperCase()}</span>
          <Link href={href} onClick={guard} className={"btn " + (connected ? "g" : "o") + " s"}>{connected ? "Play" : "Info"}</Link>
        </div>
      </div>
    </div>
  );
}