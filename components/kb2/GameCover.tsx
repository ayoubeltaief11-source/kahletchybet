"use client";
import { useState } from "react";
import GameCoverSvg from "@/components/kb/GameCoverSvg";

interface GameCoverProps {
  slug: string;
  name: string;
  accent: string;
  accent2: string;
  family: string;
  maxWin?: string;
}

export default function GameCover({ slug, name, accent, accent2, family, maxWin }: GameCoverProps) {
  const [failed, setFailed] = useState(false);
  const src = `/assets/${slug}/cover.png`;

  if (failed) {
    return <GameCoverSvg gameId={slug} type={family} color={accent} color2={accent2} title={name} maxWin={maxWin} />;
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
