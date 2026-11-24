"use client";
import dynamic from "next/dynamic";
import { getGame } from "../registry";

const Classic = dynamic(() => import("./ClassicRoulette"), { ssr: false });
const Legacy = dynamic(() => import("./RoulettePro"), { ssr: false });

export default function RouletteGame({ slug }: { slug: string }) {
  getGame(slug);
  if (slug === "midnight-wheel" || slug === "golden-crown") return <Legacy slug={slug}/>;
  return <Classic slug={slug}/>;
}
