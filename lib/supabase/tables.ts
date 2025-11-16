import { Database } from "./database.types";

// Table Rows
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type NonceAccountRow =
  Database["public"]["Tables"]["nonce_accounts"]["Row"];

// Insert Types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type NonceAccountInsert =
  Database["public"]["Tables"]["nonce_accounts"]["Insert"];

// Update Types
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
export type NonceAccountUpdate =
  Database["public"]["Tables"]["nonce_accounts"]["Update"];

// Additional Tables (to be added as they're created in Supabase)
export interface TransactionRow {
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
}

export interface ContactRow {
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
}

export interface PeerDeviceRow {
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
}

export interface AppSettingsRow {
  id: string;
  user_id: string;
  currency: string;
  language: string;
  appearance: string;
  notifications: any;
  security: any;
  p2p: any;
  created_at: string;
  updated_at: string;
}

export interface ErrorLogRow {
  id: string;
  error_code: string;
  severity: string;
  message: string;
  context: any;
  user_id?: string;
  device_id: string;
  app_version: string;
  os_version: string;
  created_at: string;
}
