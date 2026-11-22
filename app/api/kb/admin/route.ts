import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { RTP_DEFAULTS, resolveRtp, FAMILIES } from "@/lib/kb/rtp";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const no = (m: string, c: number) => NextResponse.json({ ok: false, error: m }, { status: c });
export async function GET() {
  const u = await currentUser();
  if (!u || u.role !== "admin") return no("Admin only", 403);
  const ov = await td.kbRtp();
  const live: Record<string, number> = {};
  FAMILIES.forEach(f => { live[f] = resolveRtp(f, ov); });
  return NextResponse.json({ ok: true, live: live, defaults: RTP_DEFAULTS, audit: await td.audits() });
}
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u || u.role !== "admin") return no("Admin only", 403);
  const b = await req.json();
  const cat = String(b.cat || ""); const v = Number(b.value);
  if (FAMILIES.indexOf(cat as "crash") < 0) return no("Unknown family", 400);
  if (!isFinite(v) || v < 0.5 || v > 0.995) return no("RTP must be between 50% and 99.5%", 400);
  await td.kbSetRtp(cat, v);
  await td.log(u.email, "KB_RTP", cat, "RTP set to " + (v * 100).toFixed(1) + "% - edge " + ((1 - v) * 100).toFixed(1) + "%");
  return NextResponse.json({ ok: true, message: cat + " RTP saved at " + (v * 100).toFixed(1) + "%" });
}
