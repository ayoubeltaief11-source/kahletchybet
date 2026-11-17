"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";
import GameTile from "@/components/GameTile";
import { CASINO_CATEGORIES } from "@/lib/catalog";

export default function Category() {
  const { category } = useParams<{ category: string }>();
  const { lang } = useApp();
  const def = CASINO_CATEGORIES.find(c => c.key === category);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/games").then(r => r.json()).then(d => { setGames((d.games ?? []).filter((g: any) => g.category === category)); setLoading(false); }).catch(() => setLoading(false)); }, [category]);

  return (
    <div className="col">
      <div className="bt wrap">
        <h1 className="h2" style={{ margin: 0, color: def?.hue }}><Icon name={def?.glyph ?? "casino"} />{def ? (lang === "ar" ? def.ar : lang === "fr" ? def.fr : def.en) : category}</h1>
        <Link href="/casino" className="btn o s"> Full lobby</Link>
      </div>
      <div className="note g">These catalogue slots activate the moment you connect an authorized provider launch URL in the Admin console.</div>
      {loading && <div className="grid g4">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 230 }} />)}</div>}
      {!loading && !games.length && <div className="empty"><Icon name="casino" /><div>No titles in this category yet.</div></div>}
      <div className="grid g4">{games.map(g => <GameTile key={g.id} game={g} />)}</div>
    </div>
  );
}