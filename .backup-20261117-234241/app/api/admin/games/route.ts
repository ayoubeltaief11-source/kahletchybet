import { z } from "zod";
import { db, nid, now } from "@/lib/db";
import { needAdmin, bad, ok, logErr } from "@/lib/guard";

export const dynamic = "force-dynamic";
const Body = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  provider: z.string().min(2).max(60),
  category: z.enum(["live", "slots", "crash", "roulette", "blackjack", "table", "instant"]),
  external_id: z.string().max(120).default(""),
  launch_url: z.string().max(600).default(""),
  thumbnail: z.string().max(600).default(""),
  status: z.enum(["awaiting", "pending", "connected", "disabled"]).default("awaiting"),
  domains: z.string().max(400).default(""),
  config: z.string().max(1200).default("{}"),
  featured: z.boolean().default(false),
  sort: z.number().int().min(0).max(9999).default(0),
});

export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  return ok({ games: await db.games() });
}
export async function POST(req: Request) {
  try {
    const g = await needAdmin(); if (g.res) return g.res;
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad(p.error.issues[0]?.message ?? "Invalid game payload");
    const d = p.data;
    if (d.launch_url && !/^https:\/\//i.test(d.launch_url)) return bad("Launch URL must start with https://");
    if (d.status === "connected" && !d.launch_url) return bad("A connected game requires a launch URL");
    try { JSON.parse(d.config || "{}"); } catch { return bad("Launch configuration must be valid JSON"); }
    const id = d.id || nid();
    const existing = d.id ? await db.game(id) : null;
    await db.saveGame({ id, name: d.name, provider: d.provider, category: d.category, external_id: d.external_id, launch_url: d.launch_url,
      thumbnail: d.thumbnail, status: d.status, domains: d.domains, config: d.config, featured: d.featured, sort: d.sort, created: existing?.created ?? now() });
    return ok({ games: await db.games() });
  } catch (e) { logErr("admin-games", e); return bad("Could not save game", 500); }
}
export async function DELETE(req: Request) {
  const g = await needAdmin(); if (g.res) return g.res;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("Missing id");
  await db.dropGame(id);
  return ok({ games: await db.games() });
}