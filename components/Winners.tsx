"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { fmt } from "@/lib/catalog";

type W = { id: number; user: string; game: string; mult: number; amount: number };

export default function Winners() {
  const [rows, setRows] = useState<W[]>([]);
  const [stats, setStats] = useState({ players: 18420, rounds: 96140, top: 284500 });

  useEffect(() => {
    const pull = () => {
      fetch("/api/winners", { cache: "no-store" }).then(r => r.json())
        .then(d => { if (d.ok) { setRows(d.winners); setStats(d.stats); } }).catch(() => {});
    };
    pull();
    const iv = setInterval(pull, 45000);
    return () => clearInterval(iv);
  }, []);

  const line = [...rows, ...rows];

  return (
    <section className="kb-win">
      <div className="bt wrap mb">
        <h2 className="h2" style={{ margin: 0 }}><Icon name="bolt" />Winners board</h2>
        <span className="tag v">SIMULATED ENTERTAINMENT FEED</span>
      </div>
      <div className="grid g3 mb">
        <div className="stat j"><span>Players online</span><b style={{ color: "var(--jade)" }}>{stats.players.toLocaleString()}</b></div>
        <div className="stat"><span>Rounds today</span><b style={{ color: "var(--gold-hi)" }}>{stats.rounds.toLocaleString()}</b></div>
        <div className="stat v"><span>Top demo payout</span><b style={{ color: "#D0A6FF" }}>{fmt(stats.top)}</b></div>
      </div>
      <div className="kb-ticker">
        <div className="kb-track">
          {line.map((w, i) => (
            <div key={i} className="kb-wchip">
              <div className="kb-wava">{w.user.slice(0, 1)}</div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="xs clip" style={{ fontWeight: 800 }}>{w.user}</div>
                <div className="xxs faint clip">{w.game}</div>
              </div>
              <div className="ctr">
                <div className="mono xxs" style={{ color: "var(--jade)", fontWeight: 900 }}>{w.mult.toFixed(2)}x</div>
                <div className="mono xxs" style={{ color: "var(--gold-hi)", fontWeight: 800 }}>{fmt(w.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="note v mt">
        This board is a generated entertainment feed for the educational demo. Names, multipliers and amounts are simulated and do not represent real players or real payouts.
      </div>
    </section>
  );
}