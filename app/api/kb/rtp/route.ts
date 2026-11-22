import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { RTP_DEFAULTS, resolveRtp, FAMILIES } from "@/lib/kb/rtp";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const ov = await td.kbRtp();
  const live: Record<string, number> = {};
  FAMILIES.forEach(f => { live[f] = resolveRtp(f, ov); });
  return NextResponse.json({ ok: true, live: live, defaults: RTP_DEFAULTS });
}
