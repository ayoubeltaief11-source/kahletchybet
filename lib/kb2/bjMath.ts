import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;

export interface Card { rank: string; suit: string; value: number; hidden?: boolean; }
export interface Hand { cards: Card[]; score: number; isBlackjack: boolean; isBust: boolean; }

const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUITS = ["S","H","D","C"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      let value = i + 2;
      if (i >= 10) value = 10;
      if (rank === "A") value = 11;
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

export function createShoe(decks: number = 6): Card[] {
  let shoe: Card[] = [];
  for (let i = 0; i < decks; i++) shoe = shoe.concat(createDeck());
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = shoe[i]; shoe[i] = shoe[j]; shoe[j] = t;
    const t2 = shoe[i].suit; shoe[i].suit = shoe[j].suit; shoe[j].suit = t2; 
  }
  return shoe;
}

export function calcScore(cards: Card[]): { score: number; isBlackjack: boolean; isBust: boolean; soft: boolean } {
  let score = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.hidden) continue;
    score += c.value;
    if (c.rank === "A") aces += 1;
  }
  let soft = false;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
    soft = true;
  }
  if (!soft && aces > 0 && score <= 21) soft = true;
  const isBlackjack = cards.length === 2 && score === 21 && !cards.some(c => c.hidden);
  return { score, isBlackjack, isBust: score > 21, soft };
}

export interface BJResult {
  playerHand: Hand;
  dealerHand: Hand;
  outcome: "win" | "lose" | "push" | "blackjack";
  payoutMult: number;
  shoe: Card[]; tx?: string;
}

export function playHand(shoe: Card[], playerBet: number, playerAction: "stand" | "hit" | "double", initialPlayerCards: Card[], initialDealerCards: Card[]): BJResult {
  let pCards = [...initialPlayerCards];
  let dCards = [...initialDealerCards];
  
  if (playerAction === "hit") {
    pCards.push({ ...shoe.pop()! });
  } else if (playerAction === "double") {
    pCards.push({ ...shoe.pop()! });
  }
  
  const pScore = calcScore(pCards);
  const playerHand: Hand = { cards: pCards, score: pScore.score, isBlackjack: pScore.isBlackjack, isBust: pScore.isBust };
  
  let outcome: "win" | "lose" | "push" | "blackjack" = "lose";
  let payoutMult = 0;
  
  if (playerHand.isBust) {
    outcome = "lose";
  } else if (playerHand.isBlackjack) {
    outcome = "blackjack";
    payoutMult = 2.5;
  } else {
    let dScore = calcScore(dCards);
    while (dScore.score < 17) {
      dCards.push({ ...shoe.pop()! });
      dScore = calcScore(dCards);
    }
    const dealerHand: Hand = { cards: dCards, score: dScore.score, isBlackjack: dScore.isBlackjack, isBust: dScore.isBust };
    
    if (dealerHand.isBust) {
      outcome = "win";
      payoutMult = 2;
    } else if (playerHand.score > dealerHand.score) {
      outcome = "win";
      payoutMult = 2;
    } else if (playerHand.score === dealerHand.score) {
      outcome = "push";
      payoutMult = 1;
    } else {
      outcome = "lose";
    }
  }
  
  return { playerHand, dealerHand: { cards: dCards, score: calcScore(dCards).score, isBlackjack: false, isBust: calcScore(dCards).isBust }, outcome, payoutMult, shoe };
}