import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { paymentApi, parseFeatures } from "@/features/monetization/api/paymentApi";

/** "pro" = has an active paid TENANT subscription on the server. */
export type TenantTier = "free" | "pro";

const DEFAULT_DAILY_SWIPES = 15; // mirrors BE baseline in resetDailySwipesAtomic

interface MonetizationState {
  tier: TenantTier;
  /** True once the balance has been fetched from the server. */
  loaded: boolean;
  swipesLeft: number;
  maxSwipes: number;
  boostsLeft: number;
  isPricingOpen: boolean;
  /** Optimistic local decrement; the server enforces the real quota. Returns false when out of swipes. */
  decrementSwipes: () => boolean;
  openPricing: () => void;
  closePricing: () => void;
  refresh: () => Promise<void>;
}

const MonetizationContext = createContext<MonetizationState | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<TenantTier>("free");
  const [loaded, setLoaded] = useState(false);
  const [swipesLeft, setSwipesLeft] = useState(0);
  const [maxSwipes, setMaxSwipes] = useState(DEFAULT_DAILY_SWIPES);
  const [boostsLeft, setBoostsLeft] = useState(0);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [balance, subs, plans] = await Promise.all([
      paymentApi.getMyConsumables().catch(() => null),
      paymentApi.getMySubscriptions().catch(() => []),
      paymentApi.getPlans().catch(() => []),
    ]);
    if (balance) {
      setSwipesLeft(balance.swipesLeft);
      setBoostsLeft(balance.boostsLeft);
      setLoaded(true);
    }
    const tenantPlans = plans.filter((p) => p.targetRole === "TENANT");
    const active = tenantPlans.filter((p) => subs.some((s) => s.planId === p.id));
    setTier(active.length ? "pro" : "free");
    setMaxSwipes(Math.max(DEFAULT_DAILY_SWIPES, ...active.map((p) => parseFeatures(p).swipes_per_day)));
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setTier("free");
      setLoaded(false);
      setSwipesLeft(0);
      setBoostsLeft(0);
    }
  }, [user, refresh]);

  const decrementSwipes = () => {
    if (!loaded) return true; // server is the source of truth
    if (swipesLeft <= 0) {
      setIsPricingOpen(true);
      return false;
    }
    setSwipesLeft((prev) => prev - 1);
    return true;
  };

  return (
    <MonetizationContext.Provider
      value={{
        tier,
        loaded,
        swipesLeft,
        maxSwipes,
        boostsLeft,
        isPricingOpen,
        decrementSwipes,
        openPricing: () => setIsPricingOpen(true),
        closePricing: () => setIsPricingOpen(false),
        refresh,
      }}
    >
      {children}
    </MonetizationContext.Provider>
  );
}

export function useMonetization() {
  const context = useContext(MonetizationContext);
  if (!context) {
    throw new Error("useMonetization must be used within a MonetizationProvider");
  }
  return context;
}
