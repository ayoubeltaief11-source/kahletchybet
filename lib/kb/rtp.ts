export type Family = "crash" | "slots" | "roulette" | "table" | "instant";
export interface RtpSpec { rtp: number; label: string; note: string; }
export const RTP_DEFAULTS: Record<Family, RtpSpec> = {
  crash:    { rtp: 0.970, label: "Crash",    note: "Survival curve P(m) = RTP / m. Bust at 1.00x happens with probability equal to the house edge." },
  slots:    { rtp: 0.965, label: "Slots",    note: "Weighted paytable. Small returns are frequent, large multipliers are mathematically rare." },
  roulette: { rtp: 0.973, label: "Roulette", note: "37 pockets. Straight pays 36x on a 1/37 chance - the zero is the entire edge." },
  table:    { rtp: 0.960, label: "Table",    note: "Card and dice rules mirrored from real tables, scaled to the configured edge." },
  instant:  { rtp: 0.970, label: "Instant",  note: "Fair odds multiplied by RTP. Every multiplier is derived from the true probability." },
};
export const FAMILIES: Family[] = ["crash","slots","roulette","table","instant"];
export function resolveRtp(f: Family, o?: Record<string, number>): number {
  const base = RTP_DEFAULTS[f] ? RTP_DEFAULTS[f].rtp : 0.965;
  const v = o && typeof o[f] === "number" ? o[f] : base;
  return Math.max(0.5, Math.min(0.995, v));
}
export function edgeOf(rtp: number): number { return Math.max(0, 1 - rtp); }
