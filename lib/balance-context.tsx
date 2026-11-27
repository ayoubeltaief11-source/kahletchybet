"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface BalanceContextType {
  balance: number;
  updateBalance: (delta: number) => void;
  setBalance: (amount: number) => void;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

const STORAGE_KEY = "kahlatchybet_balance";
const INITIAL_BALANCE = 500.51;

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalanceState] = useState(INITIAL_BALANCE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) setBalanceState(parsed);
      }
    } catch (e) {}
  }, []);

  const updateBalance = (delta: number) => {
    setBalanceState(prev => {
      const next = Math.round((prev + delta) * 100) / 100;
      try { localStorage.setItem(STORAGE_KEY, next.toString()); } catch (e) {}
      return next;
    });
  };

  const setBalance = (amount: number) => {
    setBalanceState(amount);
    try { localStorage.setItem(STORAGE_KEY, amount.toString()); } catch (e) {}
  };

  return (
    <BalanceContext.Provider value={{ balance, updateBalance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within BalanceProvider");
  return ctx;
}
