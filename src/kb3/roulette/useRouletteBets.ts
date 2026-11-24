"use client";
import { useCallback, useState } from "react";
import type { Bet, BetType, RouletteVariant } from "./engine";
import { createBetState, addPlacement, undo, clearBets, doubleBets, rebet, confirmBets, totalStake, toBets, amountOn } from "./bets";
import type { BetState } from "./bets";

export const CHIP_VALUES: number[] = [1, 2, 5, 10, 25, 50, 100];
export const CHIP_COLORS: Record<number, string> = { 1: "#e9edf2", 2: "#4f8ff7", 5: "#e5484d", 10: "#30a46c", 25: "#8e4ec6", 50: "#f76b15", 100: "#20242c" };

export interface BetApi {
  state: BetState;
  chip: number;
  setChip: (v: number) => void;
  total: number;
  place: (type: BetType, numbers: string[]) => boolean;
  undo: () => void;
  clear: () => void;
  rebet: () => void;
  double: () => void;
  confirm: () => Bet[];
  amountOn: (type: BetType, numbers: string[]) => number;
  canSpin: boolean;
}

export function useRouletteBets(variant: RouletteVariant, balance: number, locked: boolean): BetApi {
  const [state, setState] = useState<BetState>(createBetState);
  const [chip, setChip] = useState(5);
  const total = totalStake(state);

  const place = useCallback(function (type: BetType, numbers: string[]): boolean {
    if (locked) return false;
    if (total + chip > balance) return false;
    try {
      setState(function (s) { return addPlacement(variant, s, type, numbers, chip); });
      return true;
    } catch (e) { return false; }
  }, [locked, total, chip, balance, variant]);

  const confirm = useCallback(function (): Bet[] {
    const bets = toBets(state);
    setState(function (s) { return confirmBets(s); });
    return bets;
  }, [state]);

  return {
    state: state,
    chip: chip,
    setChip: setChip,
    total: total,
    place: place,
    undo: useCallback(function () { setState(function (s) { return undo(s); }); }, []),
    clear: useCallback(function () { setState(function (s) { return clearBets(s); }); }, []),
    rebet: useCallback(function () { setState(function (s) { return rebet(s); }); }, []),
    double: useCallback(function () { setState(function (s) { return doubleBets(s); }); }, []),
    confirm: confirm,
    amountOn: useCallback(function (type: BetType, numbers: string[]) { return amountOn(state, type, numbers); }, [state]),
    canSpin: !locked && total > 0 && total <= balance
  };
}
