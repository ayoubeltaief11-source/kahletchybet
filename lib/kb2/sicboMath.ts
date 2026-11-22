import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export interface SicBoResult {
  dice: [number, number, number];
  total: number;
  isTriple: boolean;
  isBig: boolean;
  isSmall: boolean;
  specificTriples: boolean[];
  anyTriple: boolean;
  specificDoubles: boolean[];
  twoDiceCombos: boolean[];
  sumBets: boolean[];
}

export function rollDice(): [number, number, number] {
  return [
    1 + Math.floor(rnd() * 6),
    1 + Math.floor(rnd() * 6),
    1 + Math.floor(rnd() * 6)
  ];
}

export function evaluateSicBo(dice: [number, number, number]): SicBoResult {
  const [d1, d2, d3] = dice;
  const total = d1 + d2 + d3;
  const isTriple = d1 === d2 && d2 === d3;
  const isBig = total >= 11 && total <= 17 && !isTriple;
  const isSmall = total >= 4 && total <= 10 && !isTriple;
  
  const specificTriples = [false, false, false, false, false, false];
  if (isTriple) specificTriples[d1 - 1] = true;
  
  const anyTriple = isTriple;
  
  const specificDoubles = [false, false, false, false, false, false];
  for (let i = 1; i <= 6; i++) {
    const count = [d1, d2, d3].filter(d => d === i).length;
    if (count >= 2) specificDoubles[i - 1] = true;
  }
  
  const twoDiceCombos = Array(15).fill(false);
  const combos = [[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,4],[2,5],[2,6],[3,4],[3,5],[3,6],[4,5],[4,6],[5,6]];
  for (let i = 0; i < 15; i++) {
    const [a, b] = combos[i];
    const hasA = [d1, d2, d3].includes(a);
    const hasB = [d1, d2, d3].includes(b);
    if (hasA && hasB) twoDiceCombos[i] = true;
  }
  
  const sumBets = Array(14).fill(false);
  for (let s = 4; s <= 17; s++) {
    if (total === s) sumBets[s - 4] = true;
  }
  
  return { dice, total, isTriple, isBig, isSmall, specificTriples, anyTriple, specificDoubles, twoDiceCombos, sumBets };
}

export interface SicBoConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
}

export const SICBO_GAMES: SicBoConfig[] = [
  { slug: "classic", name: "Classic Sic Bo", accent: "#0c7a4e", accent2: "#ffd97a", felt: "linear-gradient(170deg,#0a3a24,#0c7a4e 42%,#062a1a)", frame: "#ffd97a", maxWin: "x180", vol: "High", tag: "3 Dice", badge: "LIVE", },
  { slug: "grand", name: "Grand Sic Bo", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x180", vol: "High", tag: "High Stakes", badge: "HOT" }
];

export function sicboBySlug(slug: string): SicBoConfig {
  const hit = SICBO_GAMES.find(function (g) { return g.slug === slug; });
  return hit || SICBO_GAMES[0];
}

export const PAYOUTS = {
  bigSmall: 1,
  specificTriple: 180,
  anyTriple: 30,
  specificDouble: 10,
  twoDiceCombo: 6,
  sum: { 4: 60, 5: 30, 6: 18, 7: 12, 8: 8, 9: 7, 10: 6, 11: 6, 12: 6, 13: 7, 14: 8, 15: 12, 16: 18, 17: 30 }
};