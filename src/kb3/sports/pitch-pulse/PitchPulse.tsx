"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { getLeagueState } from "./clock";
import { calculateOdds, evaluateBet, type Bet, type MarketType } from "./engine";
import { LEAGUES, getTeamBadgeSvg } from "./leagues";
import "./pitch.css";

// Web Audio مولّد
let audioCtx: AudioContext | null = null;
function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) { const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return null; audioCtx = new AC(); }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(f: number, d: number, type: OscillatorType, v: number, delay = 0) {
  const c = getAudio(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
}
const sfx = {
  click: () => tone(800, 0.05, "sine", 0.08),
  goal: () => { tone(523, 0.15, "triangle", 0.15, 0); tone(659, 0.15, "triangle", 0.15, 0.1); tone(784, 0.2, "triangle", 0.15, 0.2); },
  whistle: () => tone(440, 0.3, "sine", 0.1),
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, i * 0.12)); },
  tick: () => tone(600, 0.03, "square", 0.04)
};

function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const svg = useMemo(() => getTeamBadgeSvg(name), [name]);
  return <div className="pp-badge" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function formatTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function PitchPulse({ debug }: { debug?: boolean }) {
  const [leagueId, setLeagueId] = useState("solar");
  const [now, setNow] = useState(Date.now());
  const [bets, setBets] = useState<Bet[]>([]);
  const [slip, setSlip] = useState<{ matchId: string; lineId: string; market: MarketType; selection: string; price: number; team?: string }[]>([]);
  const [stake, setStake] = useState(10);
  const [slipTab, setSlipTab] = useState<"SINGLE" | "ACCUMULATOR">("SINGLE");
  const [tab, setTab] = useState<"BETTING" | "LIVE" | "RESULTS" | "MYBETS">("BETTING");
  const [muted, setMuted] = useState(false);
  const prevPhaseRef = useRef<string>("");

  useEffect(() => {
    try { const saved = localStorage.getItem("pp_bets"); if (saved) setBets(JSON.parse(saved)); } catch (e) {}
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { try { localStorage.setItem("pp_bets", JSON.stringify(bets)); } catch (e) {} }, [bets]);

  const state = useMemo(() => getLeagueState(leagueId, now), [leagueId, now]);
  if (!state) return <div className="pp-root"><div>Loading...</div></div>;

  // تقييم الرهانات تلقائياً عند الانتقال من LIVE إلى RESULTS
  useEffect(() => {
    if (state.phase === "RESULTS" && prevPhaseRef.current === "LIVE") {
      const results: Record<string, { homeGoals: number; awayGoals: number }> = {};
      state.fixtures.forEach((m, i) => { results[`m_${i}`] = { homeGoals: m.homeGoals, awayGoals: m.awayGoals }; });
      const updated = bets.map(b => {
        if (b.status === "PENDING") return evaluateBet({ ...b }, results);
        return b;
      });
      setBets(updated);
      const won = updated.filter(b => b.status === "WON").length;
      if (won > 0) { if (!muted) sfx.win(); }
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.fixtures]);

  const toggleSlip = (matchId: string, lineId: string, market: MarketType, selection: string, price: number, team?: string) => {
    if (!muted) sfx.click();
    const exists = slip.findIndex(s => s.matchId === matchId && s.lineId === lineId);
    if (exists >= 0) setSlip(slip.filter((_, i) => i !== exists));
    else {
      const filtered = slipTab === "ACCUMULATOR" ? slip.filter(s => s.matchId !== matchId) : slip;
      setSlip([...filtered, { matchId, lineId, market, selection, price, team }]);
    }
  };

  const submitBet = () => {
    if (slip.length === 0 || state.phase !== "BETTING" || state.msRemaining < 3000) return;
    const newBet: Bet = {
      id: Date.now().toString(),
      selections: slip.map(s => ({ matchId: s.matchId, lineId: s.lineId, price: s.price, market: s.market, selection: s.selection })),
      stake, type: slipTab, status: "PENDING", payout: 0
    };
    setBets([newBet, ...bets]);
    setSlip([]);
    if (!muted) sfx.whistle();
  };

  const estWin = slip.length > 0 ? +(stake * (slipTab === "ACCUMULATOR" ? slip.reduce((a, b) => a * b.price, 1) : Math.max(...slip.map(s => s.price)))).toFixed(2) : 0;
  const pendingStake = bets.filter(b => b.status === "PENDING").reduce((a, b) => a + b.stake, 0);
  const totalWon = bets.filter(b => b.status === "WON").reduce((a, b) => a + b.payout, 0);

  return (
    <div className="pp-root">
      <div className="pp-bg" />
      <header className="pp-header">
        <div className="pp-logo">PITCH PULSE <span className="pp-demo-badge">DEMO</span></div>
        <div className="pp-balance">BAL: {(1000 - pendingStake + totalWon).toFixed(2)} TD</div>
        <button className="pp-mute-btn" onClick={() => setMuted(!muted)}>{muted ? "🔇" : "🔊"}</button>
      </header>
      <div className="pp-layout">
        <aside className="pp-sidebar">
          {LEAGUES.map(l => {
            const ls = getLeagueState(l.id, now);
            return (
              <button key={l.id} className={`pp-league-btn ${leagueId === l.id ? "active" : ""}`} onClick={() => setLeagueId(l.id)}>
                <span>{l.name}</span>
                <span className={`pp-phase ${ls?.phase.toLowerCase()}`}>{ls?.phase}</span>
              </button>
            );
          })}
        </aside>
        <main className="pp-main">
          <div className="pp-status-bar">
            <h2>{state.league.name} <span>Season {state.season} - Week {state.week}</span></h2>
            <div className={`pp-timer ${state.phase.toLowerCase()}`}>{formatTime(state.msRemaining)}</div>
          </div>

          {tab === "BETTING" && state.phase === "BETTING" && (
            <div className="pp-betting-view">
              <div className="pp-standings">
                <h3>Standings</h3>
                <div className="pp-table-wrap">
                  <table className="pp-table">
                    <thead><tr><th>#</th><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead>
                    <tbody>
                      {Object.entries(state.standings).sort(([, a], [, b]) => b.pts - a.pts || (b.f - b.a) - (a.f - a.a)).map(([tid, s], i) => {
                        const team = state.league.teams.find(t => t.id === tid)!;
                        return (
                          <tr key={tid}>
                            <td>{i + 1}</td>
                            <td className="pp-team-cell"><TeamBadge name={team.name} size={22} /> <span>{team.name}</span></td>
                            <td>{s.p}</td><td>{s.w}</td><td>{s.d}</td><td>{s.l}</td>
                            <td>{s.f - s.a > 0 ? `+${s.f - s.a}` : s.f - s.a}</td>
                            <td><b>{s.pts}</b></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pp-fixtures">
                <h3>Fixtures & Markets</h3>
                {state.fixtures.map((m, idx) => {
                  const home = state.league.teams.find(t => t.id === m.homeId)!;
                  const away = state.league.teams.find(t => t.id === m.awayId)!;
                  const lamH = 1.2 * (home.attack / away.defense) * 1.15;
                  const lamA = 0.9 * (away.attack / home.defense);
                  const odds = calculateOdds(lamH, lamA);
                  return (
                    <div key={idx} className="pp-match-row">
                      <div className="pp-teams">
                        <div className="pp-team"><TeamBadge name={home.name} /> <span>{home.name}</span></div>
                        <div className="pp-vs">VS</div>
                        <div className="pp-team"><span>{away.name}</span> <TeamBadge name={away.name} /></div>
                      </div>
                      <div className="pp-odds">
                        {odds.lines.filter(l => l.market === "1X2").map(l => (
                          <button key={l.id} className={`pp-odd-btn ${slip.some(s => s.lineId === l.id) ? "selected" : ""}`} onClick={() => toggleSlip(`m_${idx}`, l.id, l.market, l.selection, l.price, l.selection === "1" ? home.name : l.selection === "2" ? away.name : "Draw")}>
                            <span>{l.selection}</span><b>{l.price.toFixed(2)}</b>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "LIVE" && state.phase === "LIVE" && (
            <div className="pp-live-view">
              <h3>Live Matches</h3>
              {state.fixtures.map((m, idx) => {
                const home = state.league.teams.find(t => t.id === m.homeId)!;
                const away = state.league.teams.find(t => t.id === m.awayId)!;
                const lastGoal = m.events.filter(e => e.min <= m.minute).sort((a, b) => b.min - a.min)[0];
                return (
                  <div key={idx} className="pp-live-card">
                    <div className="pp-live-minute">{m.minute}'</div>
                    <div className={`pp-live-team ${lastGoal?.team === "home" ? "scored" : ""}`}>
                      <TeamBadge name={home.name} /> <span>{home.name}</span> <b>{m.homeGoals}</b>
                    </div>
                    <div className="pp-live-team away">
                      <b>{m.awayGoals}</b> <span>{away.name}</span> <TeamBadge name={away.name} />
                      {lastGoal?.team === "away" && <span className="pp-scored-indicator" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "RESULTS" && (state.phase === "RESULTS" || state.phase === "SEASON_BREAK") && (
            <div className="pp-results-view">
              <h3>Weekly Results</h3>
              {state.fixtures.map((m, idx) => {
                const home = state.league.teams.find(t => t.id === m.homeId)!;
                const away = state.league.teams.find(t => t.id === m.awayId)!;
                const myBet = bets.find(b => b.selections.some(s => s.matchId === `m_${idx}` && b.status !== "PENDING"));
                return (
                  <div key={idx} className="pp-result-row">
                    <div className="pp-result-teams">
                      <span>{home.name}</span><b>{m.homeGoals} - {m.awayGoals}</b><span>{away.name}</span>
                    </div>
                    {myBet && <span className={`pp-result-status ${myBet.status.toLowerCase()}`}>{myBet.status} {myBet.payout > 0 ? `+${myBet.payout.toFixed(2)}` : ""}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "MYBETS" && (
            <div className="pp-mybets-view">
              <h3>My Bets ({bets.length})</h3>
              {bets.length === 0 ? <div className="pp-empty">No bets yet</div> : bets.map(b => (
                <div key={b.id} className="pp-bet-card">
                  <div className="pp-bet-header">
                    <span className={`pp-bet-status ${b.status.toLowerCase()}`}>{b.status}</span>
                    <span>{b.type} | Stake: {b.stake.toFixed(2)}</span>
                  </div>
                  <div className="pp-bet-selections">
                    {b.selections.map((s, i) => <div key={i}>{s.selection} @ {s.price.toFixed(2)}</div>)}
                  </div>
                  {b.payout > 0 && <div className="pp-bet-payout">Payout: {b.payout.toFixed(2)} TD</div>}
                </div>
              ))}
            </div>
          )}

          {state.phase === "SEASON_BREAK" && tab === "BETTING" && (
            <div className="pp-season-break">
              <h2>🏆 Season {state.season - 1} Complete</h2>
              <p>New season starts in {formatTime(state.msRemaining)}</p>
              <div className="pp-final-standings">
                {Object.entries(state.standings).sort(([, a], [, b]) => b.pts - a.pts).slice(0, 3).map(([tid, s], i) => {
                  const team = state.league.teams.find(t => t.id === tid)!;
                  return <div key={tid} className="pp-podium"><TeamBadge name={team.name} size={48} /><b>{i + 1}. {team.name}</b><span>{s.pts} pts</span></div>;
                })}
              </div>
            </div>
          )}
        </main>

        <aside className="pp-betslip">
          <div className="pp-slip-tabs">
            <button className={tab === "BETTING" ? "active" : ""} onClick={() => setTab("BETTING")}>Bet</button>
            <button className={tab === "LIVE" ? "active" : ""} onClick={() => setTab("LIVE")}>Live</button>
            <button className={tab === "RESULTS" ? "active" : ""} onClick={() => setTab("RESULTS")}>Results</button>
            <button className={tab === "MYBETS" ? "active" : ""} onClick={() => setTab("MYBETS")}>My Bets</button>
          </div>
          <div className="pp-slip-header">
            <button className={slipTab === "SINGLE" ? "active" : ""} onClick={() => setSlipTab("SINGLE")}>Singles</button>
            <button className={slipTab === "ACCUMULATOR" ? "active" : ""} onClick={() => setSlipTab("ACCUMULATOR")}>Accumulator</button>
          </div>
          <div className="pp-slip-items">
            {slip.length === 0 ? <div className="pp-empty-slip">Your betslip is empty</div> : slip.map((s, i) => (
              <div key={i} className="pp-slip-item">
                <div className="pp-slip-match">{s.team || "Match"} - {s.selection}</div>
                <div className="pp-slip-odd">{s.price.toFixed(2)} <button onClick={() => toggleSlip(s.matchId, s.lineId, s.market, s.selection, s.price)}>✕</button></div>
              </div>
            ))}
          </div>
          <div className="pp-slip-footer">
            <div className="pp-stake-input">
              <span>Stake:</span>
              <input type="number" value={stake} onChange={e => setStake(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="pp-quick-stakes">
              {[1, 5, 10, 50].map(v => <button key={v} onClick={() => setStake(v)}>{v}</button>)}
            </div>
            <div className="pp-slip-summary">
              <span>Est. Winnings:</span><b>{estWin.toFixed(2)} TD</b>
            </div>
            <button className="pp-submit-bet" disabled={slip.length === 0 || state.msRemaining < 3000} onClick={submitBet}>
              {state.msRemaining < 3000 ? "LOCKED" : `Place Bet (${slip.length})`}
            </button>
          </div>
        </aside>
      </div>
      {debug && (
        <div className="pp-debug-panel">
          <b>DEBUG STATE</b>
          <div>League: {state.league.name} | Phase: {state.phase} | Week: {state.week} | Season: {state.season}</div>
          <div>Ms Remaining: {state.msRemaining} | Offset: {state.league.offset}</div>
          <div>Stored Bets: {bets.length} | Won: {bets.filter(b => b.status === "WON").length}</div>
        </div>
      )}
    </div>
  );
}
