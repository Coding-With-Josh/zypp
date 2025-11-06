import { getCachedSolUsdPrice, getSolUsdPrice } from "@/lib/utils/price";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useMarketPrice(refreshIntervalMs: number = DEFAULT_REFRESH_MS) {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<number | null>(null);

  const refreshPrice = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const price = await getSolUsdPrice(force);
      setSolPrice(price);
      setIsLoading(false);
      return price;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Try cached first
        const cached = await getCachedSolUsdPrice();
        if (mounted && cached) setSolPrice(cached);

        // Fetch fresh in background (non-blocking)
        const fresh = await getSolUsdPrice();
        if (mounted) setSolPrice(fresh);
      } catch {
        // ignore - hook exposes error state
      }
    })();

    // Set up background refresh
    if (refreshIntervalMs > 0) {
      // Use window.setInterval signature but TS may need number
      intervalRef.current = setInterval(() => {
        refreshPrice(true);
      }, refreshIntervalMs) as unknown as number;
    }

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current as unknown as number);
      }
    };
  }, [refreshIntervalMs, refreshPrice]);

  return {
    solPrice,
    isLoading,
    error,
    refreshPrice,
  } as const;
}

export default useMarketPrice;
