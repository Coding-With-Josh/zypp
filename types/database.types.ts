export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Transport =
  | "wifi_direct"
  | "bluetooth"
  | "multipeer"
  | "nfc"
  | "qr_code"
  | "local_network";

export type Currency = "usd" | "eur" | "gbp" | "jpy" | "cny";
export type Language = "en" | "es" | "fr" | "de" | "zh" | "ja" | "ko" | "ar";
export type Appearance = "light" | "dark" | "auto";
export type Platform = "ios" | "android" | "web";
export type WalletType = "custodial" | "external" | "hardware";
export type TransactionType =
  | "transfer"
  | "token_transfer"
  | "nft_transfer"
  | "swap"
  | "airdrop"
  | "receive"
  | "stake"
  | "unstake";

export type TransactionStatus =
  | "draft"
  | "signed_offline"
  | "queued"
  | "pending"
  | "confirmed"
  | "failed"
  | "expired";

export type ConfirmationStatus = "processed" | "confirmed" | "finalized";
export type SecurityEventSeverity = "info" | "warning" | "alert";
export type ErrorSeverity = "low" | "medium" | "high" | "critical";
export type BackupType = "full" | "wallet_only" | "settings";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          display_name: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
          last_seen: string;
          is_online: boolean;
          device_count: number;
          wallet_address: string | null;
          status: "active" | "inactive" | "suspended" | "pending_setup";
          role: "user" | "admin" | "moderator";
          is_temporary: boolean;
          preferences: {
            currency: Currency;
            language: Language;
            theme: Appearance;
            notifications: boolean;
          };
          metadata: Json;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "id" | "created_at" | "updated_at" | "last_seen"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sessions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          public_key: string;
          encrypted_private_key: string;
          key_encryption_version: number;
          derivation_path: string | null;
          wallet_type: WalletType;
          is_primary: boolean;
          created_at: string;
          last_used: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wallets"]["Row"],
          "id" | "created_at" | "last_used"
        >;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionType;
          status: TransactionStatus;
          signature: string | null;
          from_address: string;
          to_address: string;
          amount: number;
          token_mint: string | null;
          symbol: string;
          usd_value: number | null;
          fee: number;
          nonce: string;
          durable_nonce_account: string | null;
          memo: string | null;
          envelope: string | null;
          signed_data: string | null;
          p2p_metadata: Json | null;
          is_offline: boolean;
          sync_attempts: number;
          last_sync_attempt: string | null;
          slot: number | null;
          confirmation_status: ConfirmationStatus | null;
          error_message: string | null;
          blockhash: string | null;
          last_valid_block_height: number | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          failed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["transactions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
      wallet_balances: {
        Row: {
          id: string;
          wallet_id: string;
          sol_balance: number;
          usd_value: number;
          token_count: number;
          nft_count: number;
          last_updated: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wallet_balances"]["Row"],
          "id" | "last_updated"
        >;
        Update: Partial<Database["public"]["Tables"]["wallet_balances"]["Row"]>;
      };
      peer_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string;
          platform: Platform;
          app_version: string;
          last_seen: string;
          is_online: boolean;
          transport_capabilities: Transport[];
          public_key: string;
          connection_strength: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["peer_devices"]["Row"],
          "id" | "last_seen" | "is_online"
        >;
        Update: Partial<Database["public"]["Tables"]["peer_devices"]["Row"]>;
      };
      p2p_connections: {
        Row: {
          id: string;
          local_device_id: string;
          peer_device_id: string;
          transport: Transport;
          status: "connecting" | "connected" | "disconnected" | "error";
          established_at: string;
          last_activity: string;
          metadata: Json;
        };
        Insert: Omit<
          Database["public"]["Tables"]["p2p_connections"]["Row"],
          "id" | "established_at" | "last_activity"
        >;
        Update: Partial<Database["public"]["Tables"]["p2p_connections"]["Row"]>;
      };
      discovery_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          transport: Transport;
          is_advertising: boolean;
          is_browsing: boolean;
          started_at: string;
          ended_at: string | null;
          discovered_peers: string[];
        };
        Insert: Omit<
          Database["public"]["Tables"]["discovery_sessions"]["Row"],
          "id" | "started_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["discovery_sessions"]["Row"]
        >;
      };
      p2p_messages: {
        Row: {
          id: string;
          type: "transaction" | "handshake" | "ping" | "contact_request";
          from_device_id: string;
          to_device_id: string;
          payload: string;
          encryption: Json;
          transport: Transport;
          sent_at: string;
          delivered_at: string | null;
          read_at: string | null;
          hop_path: string[];
        };
        Insert: Omit<
          Database["public"]["Tables"]["p2p_messages"]["Row"],
          "id" | "sent_at"
        >;
        Update: Partial<Database["public"]["Tables"]["p2p_messages"]["Row"]>;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          contact_username: string;
          contact_public_key: string;
          nickname: string | null;
          tags: string[];
          is_favorite: boolean;
          last_interaction: string;
          transaction_count: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["contacts"]["Row"],
          "id" | "created_at" | "transaction_count"
        >;
        Update: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
      };
      contact_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          from_username: string;
          to_username: string;
          status: "pending" | "accepted" | "rejected" | "cancelled";
          message: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["contact_requests"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["contact_requests"]["Row"]
        >;
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          currency: Currency;
          language: Language;
          appearance: Appearance;
          notifications: {
            transactions: boolean;
            promotions: boolean;
            security: boolean;
            p2p_discovery: boolean;
          };
          security: {
            auto_lock: number;
            biometrics: boolean;
            hide_balances: boolean;
            transaction_confirmation: boolean;
          };
          p2p: {
            auto_accept: boolean;
            discovery_range: "short" | "medium" | "long";
            preferred_transport: Transport;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["app_settings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
      };
      device_settings: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          p2p_enabled: boolean;
          transports_enabled: Transport[];
          auto_join_networks: boolean;
          battery_optimization: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["device_settings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["device_settings"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "transaction_received"
            | "transaction_confirmed"
            | "contact_joined"
            | "airdrop_received"
            | "security_alert";
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          created_at: string;
          action_url: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      security_events: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "login"
            | "logout"
            | "pin_change"
            | "wallet_export"
            | "backup_created"
            | "suspicious_activity";
          severity: SecurityEventSeverity;
          description: string;
          ip_address: string | null;
          device_id: string;
          location: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["security_events"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["security_events"]["Row"]>;
      };
      encrypted_backups: {
        Row: {
          id: string;
          user_id: string;
          backup_type: BackupType;
          encrypted_data: string;
          encryption_key_hash: string;
          version: number;
          created_at: string;
          device_id: string;
          size_bytes: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["encrypted_backups"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["encrypted_backups"]["Row"]
        >;
      };
      error_logs: {
        Row: {
          id: string;
          error_code: string;
          severity: ErrorSeverity;
          message: string;
          context: Json;
          user_id: string | null;
          device_id: string;
          app_version: string;
          os_version: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["error_logs"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["error_logs"]["Row"]>;
      };
    };
    Views: {
      user_activity_summary: {
        Row: {
          user_id: string;
          username: string;
          joined_at: string;
          last_seen: string;
          is_online: boolean;
          wallet_count: number;
          transaction_count: number;
          contact_count: number;
          device_count: number;
          total_volume: number;
        };
      };
      platform_stats: {
        Row: {
          platform: Platform;
          user_count: number;
          device_count: number;
          avg_hours_since_seen: number;
          online_devices: number;
        };
      };
      transaction_analytics: {
        Row: {
          transaction_date: string;
          type: string;
          status: string;
          transaction_count: number;
          total_amount: number;
          avg_amount: number;
          offline_count: number;
        };
      };
      p2p_network_activity: {
        Row: {
          transport: Transport;
          connection_count: number;
          unique_devices: number;
          avg_connection_duration_seconds: number;
          most_recent_activity: string;
        };
      };
    };
    Functions: {
      accept_contact_request: {
        Args: { request_id: string };
        Returns: string;
      };
      get_user_transaction_summary: {
        Args: { user_uuid: string };
        Returns: {
          total_count: number;
          pending_count: number;
          failed_count: number;
          total_sent: number;
          total_received: number;
          last_transaction_date: string;
        };
      };
      cleanup_expired_sessions: {
        Args: Record<string, never>;
        Returns: number;
      };
      update_peer_device_online_status: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
