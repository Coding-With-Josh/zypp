import { Provider } from "@supabase/supabase-js";

// Extend the Provider type to include our custom provider
declare module "@supabase/supabase-js" {
  export interface FirstProvider {
    SOLANA: "solana";
  }
}

// Update the Provider type
export type ExtendedProvider = Provider | "solana";
