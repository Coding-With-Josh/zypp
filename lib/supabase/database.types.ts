export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          display_name: string | null
          bio: string | null
          created_at: string
          updated_at: string
          last_seen: string
          is_online: boolean
          device_count: number
          // NEW COLUMNS ADDED
          wallet_address: string | null
          status: 'active' | 'inactive' | 'suspended' | 'pending_setup'
          role: 'user' | 'admin' | 'moderator'
          preferences: Json
          is_temporary: boolean
        }
        Insert: {
          id?: string
          username: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          last_seen?: string
          is_online?: boolean
          device_count?: number
          // NEW COLUMNS ADDED
          wallet_address?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'pending_setup'
          role?: 'user' | 'admin' | 'moderator'
          preferences?: Json
          is_temporary?: boolean
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          last_seen?: string
          is_online?: boolean
          device_count?: number
          // NEW COLUMNS ADDED
          wallet_address?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'pending_setup'
          role?: 'user' | 'admin' | 'moderator'
          preferences?: Json
          is_temporary?: boolean
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
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
        Insert: {
          pubkey: string;
          authority: string;
          nonce: string;
          lamports: number;
          fee_calculator: {
            lamportsPerSignature: number;
          };
          created_at?: string;
          last_used?: string | null;
          is_active?: boolean;
          network: "mainnet-beta" | "devnet" | "testnet";
        };
        Update: {
          pubkey?: string;
          authority?: string;
          nonce?: string;
          lamports?: number;
          fee_calculator?: {
            lamportsPerSignature: number;
          };
          created_at?: string;
          last_used?: string | null;
          is_active?: boolean;
          network?: "mainnet-beta" | "devnet" | "testnet";
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: string;
          from_address: string;
          to_address: string;
          amount: number;
          token_mint?: string;
          symbol: string;
          usd_value?: number;
          fee: number;
          signature?: string;
          blockhash?: string;
          created_at: string;
          updated_at: string;
          nonce: string;
          is_offline: boolean;
          sync_attempts?: number;
          last_sync_attempt?: string;
          envelope?: string;
          signed_data?: string;
          device_id?: string;
          slot?: number;
          confirmation_status?: string;
        };
        Insert: {
          id: string;
          user_id: string;
          type: string;
          status: string;
          from_address: string;
          to_address: string;
          amount: number;
          token_mint?: string;
          symbol: string;
          usd_value?: number;
          fee: number;
          signature?: string;
          blockhash?: string;
          created_at?: string;
          updated_at?: string;
          nonce: string;
          is_offline: boolean;
          sync_attempts?: number;
          last_sync_attempt?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          status?: string;
          from_address?: string;
          to_address?: string;
          amount?: number;
          token_mint?: string;
          symbol?: string;
          usd_value?: number;
          fee?: number;
          signature?: string;
          blockhash?: string;
          created_at?: string;
          updated_at?: string;
          nonce?: string;
          is_offline?: boolean;
          sync_attempts?: number;
          last_sync_attempt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          contact_username: string;
          contact_public_key: string;
          nickname?: string;
          tags: string[];
          is_favorite: boolean;
          last_interaction: string;
          transaction_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          contact_user_id: string;
          contact_username: string;
          contact_public_key: string;
          nickname?: string;
          tags?: string[];
          is_favorite?: boolean;
          last_interaction?: string;
          transaction_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_user_id?: string;
          contact_username?: string;
          contact_public_key?: string;
          nickname?: string;
          tags?: string[];
          is_favorite?: boolean;
          last_interaction?: string;
          transaction_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      peer_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string;
          platform: string;
          app_version: string;
          last_seen: string;
          is_online: boolean;
          transport_capabilities: string[];
          public_key: string;
          connection_strength?: number;
        };
        Insert: {
          id: string;
          user_id: string;
          device_id: string;
          device_name: string;
          platform: string;
          app_version: string;
          last_seen?: string;
          is_online?: boolean;
          transport_capabilities?: string[];
          public_key: string;
          connection_strength?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          device_name?: string;
          platform?: string;
          app_version?: string;
          last_seen?: string;
          is_online?: boolean;
          transport_capabilities?: string[];
          public_key?: string;
          connection_strength?: number;
        };
        Relationships: [
          {
            foreignKeyName: "peer_devices_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          language: string;
          appearance: string;
          notifications: Json;
          security: Json;
          p2p: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          currency: string;
          language: string;
          appearance: string;
          notifications: Json;
          security: Json;
          p2p: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          language?: string;
          appearance?: string;
          notifications?: Json;
          security?: Json;
          p2p?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          id: string;
          error_code: string;
          severity: string;
          message: string;
          context: Json;
          user_id?: string;
          device_id: string;
          app_version: string;
          os_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          error_code: string;
          severity: string;
          message: string;
          context: Json;
          user_id?: string;
          device_id: string;
          app_version: string;
          os_version: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          error_code?: string;
          severity?: string;
          message?: string;
          context?: Json;
          user_id?: string;
          device_id?: string;
          app_version?: string;
          os_version?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_nonce_value: {
        Args: {
          p_pubkey: string;
          p_nonce: string;
          p_last_used: string;
        };
        Returns: undefined;
      };
      deactivate_nonce_account: {
        Args: {
          p_pubkey: string;
          p_last_used: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
