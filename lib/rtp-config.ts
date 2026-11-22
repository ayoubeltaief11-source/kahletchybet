
export interface RtpEntry { rtp: number; label: string; warning: string; }
export const DEFAULT_RTP: Record<string, RtpEntry> = {
  crash:    { rtp: 0.970, label: "Crash / Jet",   warning: "House edge 3.0% - long-term loss guaranteed." },
  slots:    { rtp: 0.965, label: "Slots",         warning: "House edge 3.5% - volatility means rare wins." },
  roulette: { rtp: 0.973, label: "Roulette",      warning: "House edge 2.7% - the zero is the house advantage." },
  table:    { rtp: 0.960, label: "Table Games",   warning: "House edge 4.0% - educational demo only." },
};
export function getRtp(category: string, overrides?: Record<string, number>): RtpEntry {
  const base = DEFAULT_RTP[category] ?? DEFAULT_RTP.slots;
  const rtp = overrides && overrides[category] ? overrides[category] : base.rtp;
  return { rtp, label: base.label, warning: base.warning };
}
