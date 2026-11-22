"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/Shell";
import { kbById } from "@/lib/kb/catalog";
import { resolveRtp } from "@/lib/kb/rtp";
import CrashGame from "@/components/kb/CrashGame";
import SlotsGame from "@/components/kb/SlotsGame";
import RouletteGame from "@/components/kb/RouletteGame";
import TableGame from "@/components/kb/TableGame";
import MinesGame from "@/components/kb/MinesGame";
import DiceGame from "@/components/kb/DiceGame";
import PlinkoGame from "@/components/kb/PlinkoGame";
import HiLoGame from "@/components/kb/HiLoGame";
export default function KBPlay() {
  const p = useParams<{ id: string }>();
  const { me } = useApp();
  const g = kbById(p.id);
  const [ov, setOv] = useState<Record<string, number>>({});
  useEffect(function () {
    let on = true;
    fetch("/api/kb/rtp", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { if (on && d.ok) setOv(d.live); }).catch(function () { });
    return function () { on = false; };
  }, [p.id]);
  if (!g) return <div className="kb-empty"><b>Game not found</b><Link href="/casino" className="kb-btn">Back to lobby</Link></div>;
  if (!me) return <div className="kb-empty"><b>Sign in to play</b><span>Your website TD balance is the only wallet used here.</span><Link href="/login" className="kb-btn gold">Sign in</Link></div>;
  const rtp = resolveRtp(g.family, ov);
  return (
    <div className="kb-play">
      <div className="kb-crumb"><Link href="/casino">Lobby</Link><i>/</i><span>{g.family}</span><i>/</i><b>{g.name}</b></div>
      {g.family === "crash" && <CrashGame g={g} rtp={rtp}/>}
      {g.family === "slots" && <SlotsGame g={g} rtp={rtp}/>}
      {g.family === "roulette" && <RouletteGame g={g} rtp={rtp}/>}
      {g.family === "table" && <TableGame g={g} rtp={rtp}/>}
      {g.variant === "mines" && <MinesGame g={g} rtp={rtp}/>}
      {g.variant === "dice" && <DiceGame g={g} rtp={rtp}/>}
      {g.variant === "plinko" && <PlinkoGame g={g} rtp={rtp}/>}
      {g.variant === "hilo" && <HiLoGame g={g} rtp={rtp}/>}
    </div>
  );
}
