export interface SupabaseDatabase {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "send" | "receive" | "transfer";
          status: "pending" | "confirmed" | "failed";
          signature?: string;
          from_address: string;
          to_address: string;
          amount: number;
          token_mint?: string;
          symbol: string;
          usd_value: number;
          fee: number;
          nonce?: string;
          durable_nonce_account?: string;
          memo?: string;
          created_at: string;
          updated_at: string;
          confirmed_at?: string;
          is_offline: boolean;
          sync_attempts?: number;
        };
        Insert: Omit<
          SupabaseDatabase["public"]["Tables"]["transactions"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<
          SupabaseDatabase["public"]["Tables"]["transactions"]["Row"]
        >;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          contact_username: string;
          contact_pubkey: string;
          contact_type: "personal" | "business";
          status: "active" | "blocked" | "removed";
          last_interaction: string;
          created_at: string;
          updated_at: string;
          sync_version: number;
        };
        Insert: Omit<
          SupabaseDatabase["public"]["Tables"]["contacts"]["Row"],
          "created_at" | "updated_at" | "sync_version"
        >;
        Update: Partial<
          SupabaseDatabase["public"]["Tables"]["contacts"]["Row"]
        >;
      };
      peer_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string;
          device_type: "mobile" | "desktop" | "web";
          transport_type: "bluetooth" | "wifi" | "nfc";
          last_seen: string;
          status: "active" | "offline" | "removed";
          is_trusted: boolean;
          created_at: string;
          updated_at: string;
          sync_version: number;
        };
        Insert: Omit<
          SupabaseDatabase["public"]["Tables"]["peer_devices"]["Row"],
          "created_at" | "updated_at" | "sync_version"
        >;
        Update: Partial<
          SupabaseDatabase["public"]["Tables"]["peer_devices"]["Row"]
        >;
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          language: string;
          currency: string;
          theme: "light" | "dark" | "system";
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
          sync_version: number;
        };
        Insert: Omit<
          SupabaseDatabase["public"]["Tables"]["app_settings"]["Row"],
          "created_at" | "updated_at" | "sync_version"
        >;
        Update: Partial<
          SupabaseDatabase["public"]["Tables"]["app_settings"]["Row"]
        >;
      };
      nonce_accounts: {
        Row: {
          pubkey: string;
          authority: string;
          nonce: string;
          lamports: number;
          fee_calculator: {
            lamportsPerSignature: number;
          };
          created_at: string;
          last_used: string | null;
          is_active: boolean;
          network: "mainnet-beta" | "devnet" | "testnet";
        };
        Insert: Omit<
          SupabaseDatabase["public"]["Tables"]["nonce_accounts"]["Row"],
          "created_at"
        >;
        Update: Partial<
          SupabaseDatabase["public"]["Tables"]["nonce_accounts"]["Row"]
        >;
      };
    };
  };
}
