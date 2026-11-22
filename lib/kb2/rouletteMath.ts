import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export const isRed = (n: number): boolean => REDS.indexOf(n) >= 0;

export interface RouletteConfig {
  slug: string; name: string; type: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
  pockets: number; rtp: number;
}

export const ROULETTE_GAMES: RouletteConfig[] = [
  { slug: "european", name: "European Roulette", type: "european", accent: "#0c7a4e", accent2: "#ffd97a", felt: "linear-gradient(170deg,#0a3a24,#0c7a4e 42%,#062a1a)", frame: "#ffd97a", maxWin: "x36", vol: "Medium", tag: "Single Zero", badge: "LIVE", pockets: 37, rtp: 0.973 },
  { slug: "american", name: "American Roulette", type: "american", accent: "#c4202f", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1a0505,#4a0b0b 42%,#0d0202)", frame: "#fff6d8", maxWin: "x36", vol: "Medium", tag: "Double Zero", badge: "HOT", pockets: 38, rtp: 0.947 },
  { slug: "vip", name: "VIP Gold Roulette", type: "vip", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x36", vol: "High", tag: "High Stakes", badge: "LIVE", pockets: 37, rtp: 0.973 },
  { slug: "lightning", name: "Lightning Roulette", type: "lightning", accent: "#ffd24a", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1a0f02,#4d2f04 42%,#0d0801)", frame: "#ffd97a", maxWin: "x500", vol: "High", tag: "Lucky Numbers", badge: "NEW", pockets: 37, rtp: 0.973 },
  { slug: "french", name: "French Roulette", type: "french", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 42%,#01040c)", frame: "#93c5fd", maxWin: "x36", vol: "Medium", tag: "La Partage", badge: "NEW", pockets: 37, rtp: 0.986 },
  { slug: "mini", name: "Mini Roulette", type: "mini", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x12", vol: "Low", tag: "13 Pockets", badge: "NEW", pockets: 13, rtp: 0.961 }
];

export function rouletteBySlug(slug: string): RouletteConfig {
  const hit = ROULETTE_GAMES.find(function (g) { return g.slug === slug; });
  return hit || ROULETTE_GAMES[0];
}

export interface RouletteResult {
  number: number;
  color: string;
  lucky: number[];
  hot: number[];
  cold: number[];
  wins: { type: string; amount: number }[];
  totalPaid: number;
}

export function spinRoulette(cfg: RouletteConfig, bets: Record<string, number>): RouletteResult {
  const pockets = cfg.pockets || (cfg.type === "american" ? 38 : cfg.type === "mini" ? 13 : 37);
  const number = Math.floor(rnd() * pockets);
  const color = number === 0 ? "green" : isRed(number) ? "red" : "black";
  
  const lucky: number[] = [];
  if (cfg.type === "lightning") {
    for (let i = 0; i < 5; i++) {
      const n = Math.floor(rnd() * pockets);
      if (lucky.indexOf(n) < 0) lucky.push(n);
    }
  }
  
  const hot: number[] = [];
  const cold: number[] = [];
  for (let i = 0; i < 8; i++) hot.push(Math.floor(rnd() * pockets));
  for (let i = 0; i < 8; i++) cold.push(Math.floor(rnd() * pockets));
  
  const wins: { type: string; amount: number }[] = [];
  let totalPaid = 0;
  
  Object.keys(bets).forEach(function (type) {
    const amount = bets[type];
    if (amount <= 0) return;
    let mult = 0;
    if (type === "straight" && number === parseInt(type.split(":")[1])) mult = 36;
    else if (type === "red" && color === "red") mult = 2;
    else if (type === "black" && color === "black") mult = 2;
    else if (type === "even" && number !== 0 && number % 2 === 0) mult = 2;
    else if (type === "odd" && number % 2 === 1) mult = 2;
    else if (type === "low" && number >= 1 && number <= 18) mult = 2;
    else if (type === "high" && number >= 19 && number <= 36) mult = 2;
    else if (type === "dozen1" && number >= 1 && number <= 12) mult = 3;
    else if (type === "dozen2" && number >= 13 && number <= 24) mult = 3;
    else if (type === "dozen3" && number >= 25 && number <= 36) mult = 3;
    else if (type === "col1" && number % 3 === 1) mult = 3;
    else if (type === "col2" && number % 3 === 2) mult = 3;
    else if (type === "col3" && number % 3 === 0 && number !== 0) mult = 3;
    
    if (mult > 0) {
      if (cfg.type === "lightning" && lucky.indexOf(number) >= 0 && type === "straight") mult *= 50;
      const paid = r2(amount * mult);
      wins.push({ type: type, amount: paid });
      totalPaid += paid;
    }
  });
  
  return { number: number, color: color, lucky: lucky, hot: hot, cold: cold, wins: wins, totalPaid: r2(totalPaid) };
}