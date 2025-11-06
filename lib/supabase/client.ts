import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as Network from "expo-network";
import { AppState } from "react-native";
import { secureStorageManager } from "../storage/secure-store";
import { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePubKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabasePubKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client with optimized settings for mobile
export type SupabaseDbClient = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

// Custom storage adapter using SecureStore
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Intercept auth token requests from Supabase
      if (key.endsWith("-auth-token")) {
        const session = await secureStorageManager.getSession();
        if (!session) return null;

        // Format session as a proper JWT token
        return JSON.stringify({
          access_token: session.access_token,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: session.refresh_token,
          user: {
            id: session.user_id,
            aud: "authenticated",
            role: "authenticated",
          },
        });
      }
      const value = await secureStorageManager.getAuthItem(key);
      return value;
    } catch (error) {
      console.warn("Storage getItem failed:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Intercept auth token storage from Supabase
      if (key.endsWith("-auth-token")) {
        const sessionData = JSON.parse(value);
        const now = new Date().toISOString();
        const session = {
          id: crypto.randomUUID(),
          user_id: sessionData.user?.id || "",
          device_id:
            (await secureStorageManager.getAuthItem("device_id")) ||
            `device_${Date.now()}`,
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at:
            sessionData.expires_at ||
            new Date(Date.now() + 3600 * 1000).toISOString(),
          created_at: now,
          ip_address: "127.0.0.1", // Local session
          user_agent: "zypp-wallet-mobile",
        };
        await secureStorageManager.setSession(session);
        return;
      }
      await secureStorageManager.setAuthItem(key, value);
    } catch (error) {
      console.warn("Storage setItem failed:", error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // Intercept auth token removal from Supabase
      if (key.endsWith("-auth-token")) {
        await secureStorageManager.setSession(null);
        return;
      }
      await secureStorageManager.removeAuthItem(key);
    } catch (error) {
      console.warn("Storage removeItem failed:", error);
    }
  },
};

// Create the regular Supabase client (respects RLS)
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabasePubKey,
  {
    auth: {
      storage: customStorage,
      flowType: "pkce",
      debug: false, // Disable debug in production
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        "X-Client-Info": "zypp-wallet-mobile",
      },
    },
  }
);

// Create the admin Supabase client (bypasses RLS - for sign-up operations)
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "zypp-wallet-admin",
      },
    },
  }
);

// Network status manager
class NetworkManager {
  private isOnline = true;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener() {
    try {
      // Check initial network state
      const networkState = await Network.getNetworkStateAsync();
      this.isOnline = networkState.isConnected ?? false;

      // Listen to network state changes
      Network.addNetworkStateListener((state) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        if (wasOnline !== this.isOnline) {
          this.notifyListeners();
        }
      });

      // Listen to app state changes
      AppState.addEventListener("change", this.handleAppStateChange);
    } catch (error) {
      console.error("Network manager initialization failed:", error);
    }
  }

  private handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === "active") {
      // Re-check network when app becomes active
      Network.getNetworkStateAsync()
        .then((state) => {
          this.isOnline = state.isConnected ?? false;
          this.notifyListeners();
        })
        .catch(() => {
          // Silently fail if network check fails
        });
    }
  };

  addListener(listener: (online: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  getIsOnline() {
    return this.isOnline;
  }
}

export const networkManager = new NetworkManager();

// Supabase service with retry logic and admin/client selection
class SupabaseService {
  private maxRetries = 3;
  private baseDelay = 1000;

  async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = this.baseDelay * (this.maxRetries - retries + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;

    if (error.message?.includes("Network request failed")) return true;
    if (error.message?.includes("fetch failed")) return true;
    if (error.message?.includes("timeout")) return true;
    if (error.status && error.status >= 500) return true;

    return false;
  }

  // Generic query with retry
  async query<T>(
    query: () => Promise<{ data: T | null; error: any }>,
    useAdmin = false
  ): Promise<{ data: T | null; error: any }> {
    try {
      return await this.withRetry(query);
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Helper to determine which client to use
  getClient(useAdmin: boolean = false): SupabaseClient<Database> {
    return useAdmin ? supabaseAdmin : supabase;
  }
}

export const supabaseService = new SupabaseService();
