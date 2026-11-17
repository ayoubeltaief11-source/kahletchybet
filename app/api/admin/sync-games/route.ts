import { ensureGDGames } from "@/lib/gd-games";
import { db } from "@/lib/db";
import { needAdmin, ok, logErr } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function POST() {
  const g = await needAdmin(); if (g.res) return g.res;
  try { await ensureGDGames(); return ok({ games: await db.games() }); }
  catch (e) { logErr("sync", e); return ok({ games: [] }); }
}