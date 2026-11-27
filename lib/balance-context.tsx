"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface BalanceContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  updateBalance: (delta: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wallet", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("فشل في جلب الرصيد");
      }
      const data = await res.json();
      setBalance(data.balance || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Balance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const updateBalance = async (delta: number) => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: delta, kind: "bet" }),
      });
      if (!res.ok) {
        throw new Error("فشل في تحديث الرصيد");
      }
      const data = await res.json();
      setBalance(data.newBalance ?? balance + delta);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const refreshBalance = async () => {
    await fetchBalance();
  };

  return (
    <BalanceContext.Provider value={{ balance, loading, error, updateBalance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within BalanceProvider");
  return ctx;
}

