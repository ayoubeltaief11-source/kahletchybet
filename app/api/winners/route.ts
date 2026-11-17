import { winnersFeed } from "@/lib/sim";
import { ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() {
  const seed = Math.floor(Date.now() / 45000);
  return ok({
    winners: winnersFeed(18),
    stats: { players: 16000 + (seed % 5200), rounds: 88000 + (seed % 14000), top: 180000 + (seed % 140000) },
    simulated: true,
  });
}