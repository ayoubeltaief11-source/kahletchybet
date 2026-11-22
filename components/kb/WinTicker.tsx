"use client";
import { useEffect, useMemo, useState } from "react";
import { KB_GAMES } from "@/lib/kb/catalog";

interface Win { id: number; who: string; game: string; amount: number; mult: number; }
const NAMES = ["Nova_88", "Kai_R", "Mira", "Orion", "Luna_X", "Raf_21", "Zed", "Ayla", "Titan", "Vex", "Sora", "Nyx"];

export default function WinTicker() {
  const [rows, setRows] = useState<Win[]>([]);
  useEffect(function () {
    let seed = 1;
    const make = function (n: number): Win {
      seed += 1;
      const g = KB_GAMES[(seed * 37) % KB_GAMES.length];
      const mult = [1.4, 2.1, 3.6, 5.2, 8.4, 12.5, 24, 48][seed % 8];
      const stake = [2, 5, 10, 20, 25][seed % 5];
      return { id: seed, who: NAMES[seed % NAMES.length], game: g.name, amount: Math.round(stake * mult * 100) / 100, mult: mult };
    };
    const first: Win[] = [];
    for (let k = 0; k < 12; k++) first.push(make(k));
    setRows(first);
    const iv = window.setInterval(function () {
      setRows(function (old) { return [make(Date.now() % 9999)].concat(old).slice(0, 12); });
    }, 4200);
    return function () { clearInterval(iv); };
  }, []);
  const doubled = useMemo(function () { return rows.concat(rows); }, [rows]);
  if (rows.length === 0) return <div className="k2-skel" style={{ height: 38 }}/>;
  return (
    <div className="k2-ticker">
      <span className="k2-ticker-label">SIMULATED WINS</span>
      <div className="k2-ticker-view">
        <div className="k2-ticker-run">
          {doubled.map(function (w, k) {
            return (
              <span key={w.id + "-" + k} className="k2-win">
                <b>{w.who}</b>
                <i>hit</i>
                <b>{w.game}</b>
                <em>+{w.amount.toFixed(2)} TD</em>
                <i>{w.mult.toFixed(2)}x</i>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
