import type { Bet, BetType, RouletteVariant } from "./engine";
import { makeBet, betKey } from "./engine";

export interface Placement { id: number; type: BetType; numbers: string[]; amount: number; key: string; }
export interface BetState { placements: Placement[]; history: Placement[][]; last: Placement[]; nextId: number; }

export function createBetState(): BetState {
  return { placements: [], history: [], last: [], nextId: 1 };
}

export function totalStake(s: BetState): number {
  let t = 0;
  for (const p of s.placements) t += p.amount;
  return Math.round(t * 100) / 100;
}

function pushHistory(s: BetState): Placement[][] {
  const h = s.history.concat([s.placements]);
  return h.length > 60 ? h.slice(h.length - 60) : h;
}

export function addPlacement(v: RouletteVariant, s: BetState, type: BetType, numbers: string[], chip: number): BetState {
  const valid = makeBet(v, type, numbers, chip);
  const key = type + ":" + betKey(valid.numbers);
  const idx = s.placements.findIndex(function (p) { return p.key === key; });
  let placements: Placement[];
  if (idx >= 0) {
    placements = s.placements.slice();
    placements[idx] = { ...placements[idx], amount: Math.round((placements[idx].amount + chip) * 100) / 100 };
  } else {
    placements = s.placements.concat([{ id: s.nextId, type: type, numbers: valid.numbers, amount: chip, key: key }]);
  }
  return { placements: placements, history: pushHistory(s), last: s.last, nextId: s.nextId + 1 };
}

export function undo(s: BetState): BetState {
  if (s.history.length === 0) return s;
  return { placements: s.history[s.history.length - 1], history: s.history.slice(0, -1), last: s.last, nextId: s.nextId };
}

export function clearBets(s: BetState): BetState {
  if (s.placements.length === 0) return s;
  return { placements: [], history: pushHistory(s), last: s.last, nextId: s.nextId };
}

export function doubleBets(s: BetState): BetState {
  if (s.placements.length === 0) return s;
  return { placements: s.placements.map(function (p) { return { ...p, amount: p.amount * 2 }; }), history: pushHistory(s), last: s.last, nextId: s.nextId };
}

export function rebet(s: BetState): BetState {
  if (s.last.length === 0) return s;
  return { placements: s.last.map(function (p) { return { ...p }; }), history: pushHistory(s), last: s.last, nextId: s.nextId };
}

export function confirmBets(s: BetState): BetState {
  return { placements: [], history: [], last: s.placements.map(function (p) { return { ...p }; }), nextId: s.nextId };
}

export function toBets(s: BetState): Bet[] {
  return s.placements.map(function (p) { return { type: p.type, numbers: p.numbers, amount: p.amount }; });
}

export function amountOn(s: BetState, type: BetType, numbers: string[]): number {
  const key = type + ":" + betKey(numbers);
  const p = s.placements.find(function (x) { return x.key === key; });
  return p ? p.amount : 0;
}
