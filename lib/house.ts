import { td } from "./td-store";

/* SIMULATION-ONLY outcome shaper.
   Hard-locked to the educational demo: the platform has no payment
   integration and TD has no monetary value. Every adjustment is
   written to the audit trail and rounds ledger. */
export const SIMULATION_ONLY = true;

export interface Decision { win: boolean; capped: boolean; net: number; cap: number; headroom: number; }

export async function decide(userId: string, stake: number, baseProb: number, payoutMult: number): Promise<Decision> {
  const cap = await td.cap(userId);
  const net = await td.weekNet(userId);
  const headroom = Math.max(0, cap - net);
  if (headroom <= 0) return { win: false, capped: true, net, cap, headroom: 0 };
  const maxGain = stake * (payoutMult - 1);
  if (maxGain > headroom) {
    const ratio = Math.max(0, Math.min(1, headroom / Math.max(maxGain, 0.01)));
    const shaped = baseProb * Math.pow(ratio, 1.35);
    return { win: Math.random() < shaped, capped: shaped < baseProb, net, cap, headroom };
  }
  const load = Math.max(0, Math.min(1, net / Math.max(cap, 0.01)));
  const shaped = baseProb * (1 - Math.pow(load, 2.2) * 0.55);
  return { win: Math.random() < shaped, capped: false, net, cap, headroom };
}