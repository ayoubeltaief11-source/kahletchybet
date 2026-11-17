import { db } from "@/lib/db";
import { needUser, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const g = await needUser(); if (g.res) return g.res;
  const { id } = await req.json().catch(() => ({ id: "" }));
  const game = await db.game(String(id));
  if (!game) return bad("Game not found", 404);
  if (game.status !== "connected" || !game.launch_url) return bad("This title is awaiting a licensed provider integration.", 409);
  let host = "";
  try { host = new URL(game.launch_url).hostname; } catch { return bad("Stored launch URL is invalid", 422); }
  const allowed = game.domains.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.some(d => host === d || host.endsWith("." + d))) return bad("Launch host is not in the allowed domain list", 403);
  let cfg: Record<string, string> = {};
  try { cfg = JSON.parse(game.config || "{}"); } catch {}
  const u = new URL(game.launch_url);
  for (const [k, v] of Object.entries(cfg)) if (typeof v === "string") u.searchParams.set(k, v);
  u.searchParams.set("mode", "demo");
  u.searchParams.set("currency", "CR");
  return ok({ url: u.toString(), provider: game.provider, name: game.name });
}