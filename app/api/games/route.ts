import { db } from "@/lib/db";
import { ensureGDGames } from "@/lib/gd-games";
import { ok, logErr } from "@/lib/guard";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await ensureGDGames();
    const games = await db.games();
    return ok({ games: games.map(g => ({
      id: g.id, name: g.name, provider: g.provider, category: g.category, thumbnail: g.thumbnail,
      status: g.status, featured: g.featured, external_id: g.external_id,
      launchable: g.status === "connected" && !!g.launch_url,
    })) });
  } catch (e) { logErr("games", e); return ok({ games: [] }); }
}