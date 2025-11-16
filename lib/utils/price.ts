import { secureStorageManager } from "@/lib/storage/secure-store";

const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
const CACHE_KEY = "market.sol_usd";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchSolUsdPrice(): Promise<number> {
  try {
    const res = await fetch(COINGECKO_SIMPLE_PRICE_URL);
    if (!res.ok) throw new Error(`Coingecko error: ${res.status}`);
    const data: any = await res.json();
    const price = data && data.solana && data.solana.usd;
    if (!price || typeof price !== "number") throw new Error("Invalid price");

    // Cache it
    const payload = {
      price,
      fetched_at: Date.now(),
    };
    try {
      await secureStorageManager.setAuthItem(
        CACHE_KEY,
        JSON.stringify(payload)
      );
    } catch {
      // non-fatal
      console.warn("Failed to cache SOL price: cache write failed");
    }

    return price;
  } catch (error: any) {
    console.warn("Failed to fetch SOL price from CoinGecko:", error.message);
    // Try to return cached value if present
    const cached = await getCachedSolUsdPrice();
    if (cached) return cached;
    // Fallback to a conservative default to avoid huge UI surprises
    return 20;
  }
}

export async function getCachedSolUsdPrice(): Promise<number | null> {
  try {
    const raw = await secureStorageManager.getAuthItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.price !== "number") return null;
    // Respect TTL
    if (Date.now() - (parsed.fetched_at || 0) > CACHE_TTL_MS) return null;
    return parsed.price as number;
  } catch (err) {
    return null;
  }
}

export async function getSolUsdPrice(forceRefresh = false): Promise<number> {
  if (!forceRefresh) {
    const cached = await getCachedSolUsdPrice();
    if (cached) return cached;
  }
  return await fetchSolUsdPrice();
}
