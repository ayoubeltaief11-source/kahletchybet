import { td } from "@/lib/td-store";
import { DEFAULT_RTP } from "@/lib/rtp-config";
import { needUser, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const g = await needUser(); if (g.res) return g.res;
  const overrides = await td.rtpOverrides();
  return ok({ rtp: overrides, defaults: DEFAULT_RTP });
}
