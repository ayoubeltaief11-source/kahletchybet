import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export interface Card { rank: string; suit: string; value: number; }
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SUITS = ["S","H","D","C"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = RANKS.indexOf(rank) + 1;
      if (value >= 10) value = 0;
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

export function createShoe(decks: number = 8): Card[] {
  let shoe: Card[] = [];
  for (let i = 0; i < decks; i++) shoe = shoe.concat(createDeck());
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = shoe[i]; shoe[i] = shoe[j]; shoe[j] = t;
  }
  return shoe;
}

export function handValue(cards: Card[]): number {
  let sum = 0;
  for (const c of cards) sum += c.value;
  return sum % 10;
}

export interface BaccaratResult {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  winner: "player" | "banker" | "tie";
  natural: boolean;
}

export function playBaccarat(shoe: Card[]): BaccaratResult {
  const pCards = [shoe.pop()!, shoe.pop()!];
  const bCards = [shoe.pop()!, shoe.pop()!];
  const pVal = handValue(pCards);
  const bVal = handValue(bCards);
  
  const pNatural = pVal >= 8;
  const bNatural = bVal >= 8;
  
  if (pNatural || bNatural) {
    const winner = pVal > bVal ? "player" : bVal > pVal ? "banker" : "tie";
    return { playerCards: pCards, bankerCards: bCards, playerScore: pVal, bankerScore: bVal, winner, natural: true };
  }
  
  let pThird: Card | null = null;
  if (pVal <= 5) {
    pThird = shoe.pop()!;
    pCards.push(pThird);
  }
  
  const pFinal = handValue(pCards);
  let bThird: Card | null = null;
  let bankerDraws = false;
  
  if (bVal <= 2) bankerDraws = true;
  else if (bVal === 3 && pVal !== 8) bankerDraws = true;
  else if (bVal === 4 && pVal >= 2 && pVal <= 6) bankerDraws = true;
  else if (bVal === 5 && pVal >= 4 && pVal <= 7) bankerDraws = true;
  else if (bVal === 6 && (pVal === 6 || pVal === 7)) bankerDraws = true;
  
  if (bankerDraws) {
    bThird = shoe.pop()!;
    bCards.push(bThird);
  }
  
  const bFinal = handValue(bCards);
  const winner = pFinal > bFinal ? "player" : bFinal > pFinal ? "banker" : "tie";
  
  return { playerCards: pCards, bankerCards: bCards, playerScore: pFinal, bankerScore: bFinal, winner, natural: false };
}

export interface BaccaratConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
  commission: number;
}

export const BACCARAT_GAMES: BaccaratConfig[] = [
  { slug: "classic", name: "Classic Baccarat", accent: "#0c7a4e", accent2: "#ffd97a", felt: "linear-gradient(170deg,#0a3a24,#0c7a4e 42%,#062a1a)", frame: "#ffd97a", maxWin: "x9", vol: "Low", tag: "5% Commission", badge: "LIVE", commission: 0.05 },
  { slug: "nocommission", name: "No Commission Baccarat", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x9", vol: "Low", tag: "No Commission", badge: "NEW", commission: 0 },
  { slug: "speed", name: "Speed Baccarat", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 42%,#120302)", frame: "#ff9f43", maxWin: "x9", vol: "Medium", tag: "27 Seconds", badge: "HOT", commission: 0.05 }
];

export function baccaratBySlug(slug: string): BaccaratConfig {
  const hit = BACCARAT_GAMES.find(function (g) { return g.slug === slug; });
  return hit || BACCARAT_GAMES[0];
}