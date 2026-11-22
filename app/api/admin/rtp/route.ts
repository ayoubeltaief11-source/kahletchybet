import { td } from "@/lib/td-store";
import { DEFAULT_RTP } from "@/lib/rtp-config";
import { needAdmin, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  return ok({ rtp: await td.rtpOverrides(), defaults: DEFAULT_RTP });
}
export async function POST(req: Request) {
  const g = await needAdmin(); if (g.res) return g.res;
  const { cat, value } = await req.json();
  if (!DEFAULT_RTP[cat] || !isFinite(value) || value < 0.5 || value > 1) return bad("Invalid");
  await td.setRtpOverride(cat, value);
  await td.log(g.user!.email, "SET_RTP", cat, "RTP set to " + (value * 100).toFixed(1) + "%");
  return ok({ message: "Saved" });
}
