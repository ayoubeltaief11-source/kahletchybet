import { db } from "@/lib/db";
import { ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const games = await db.games();
  return ok({ games: games.map(g => ({ id: g.id, name: g.name, provider: g.provider, category: g.category, thumbnail: g.thumbnail, status: g.status, featured: g.featured, launchable: g.status === "connected" && !!g.launch_url })) });
}