import { db, MODE } from "@/lib/db";
import { needAdmin, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  const users = await db.users();
  const bets = await db.allBets();
  const ledger = await db.allLedger();
  const games = await db.games();
  const balances = users.reduce((a, u) => a + u.balance, 0);
  const staked = bets.reduce((a, b) => a + b.stake, 0);
  const days = new Array(7).fill(0);
  const byCat: Record<string, number> = {};
  for (const b of bets) { const d = Math.floor((Date.now() - b.created) / 86400000); if (d >= 0 && d < 7) days[6 - d]++; }
  for (const gm of games) byCat[gm.category] = (byCat[gm.category] ?? 0) + 1;
  return ok({
    storage: MODE,
    users: users.length,
    active: users.filter(u => ledger.some(l => l.user_id === u.id && Date.now() - l.created < 604800000)).length,
    bets: bets.length, balances, staked, days, byCat,
    games: games.length,
    connected: games.filter(x => x.status === "connected").length,
    awaiting: games.filter(x => x.status === "awaiting").length,
    providers: {
      football: { configured: !!process.env.FOOTBALL_ODDS_API_KEY, name: "API-Football" },
      odds: { configured: !!process.env.ODDS_API_KEY, name: "The Odds API" },
      aggregator: { configured: !!process.env.CASINO_AGGREGATOR_KEY, name: "Casino Aggregator" },
      database: { configured: MODE === "postgres", name: MODE === "postgres" ? "PostgreSQL" : "Local file store (dev)" },
    },
    recentLedger: ledger.slice(0, 40),
  });
}