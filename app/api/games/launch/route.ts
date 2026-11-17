import { db } from "@/lib/db";
import { gdUrl, GD_REFERRER } from "@/lib/gd-games";
import { needUser, bad, ok } from "@/lib/guard";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const g = await needUser(); if (g.res) return g.res;
  const body = await req.json().catch(() => ({}));
  const game = await db.game(String(body.id ?? ""));
  if (!game) return bad("Game not found", 404);
  if (game.status !== "connected" || !game.launch_url) return bad("This title is awaiting a provider integration.", 409);
  const referrer = typeof body.referrer === "string" && /^https?:\/\//i.test(body.referrer) ? body.referrer : GD_REFERRER;
  let url = game.launch_url;
  if (game.external_id) url = gdUrl(game.external_id, referrer);
  let host = "";
  try { host = new URL(url).hostname; } catch { return bad("Stored launch URL is invalid", 422); }
  const allowed = game.domains.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.some(d => host === d || host.endsWith("." + d))) return bad("Launch host is not allowed", 403);
  return ok({ url, provider: game.provider, name: game.name, internal: "/play/" + game.id });
}