import { P2PTransport } from "./index";

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

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  signature?: string;
  from_address: string;
  to_address: string;
  amount: number;
  token_mint?: string;
  symbol: string;
  usd_value?: number;
  fee: number;
  nonce: string;
  durable_nonce_account?: string;
  memo?: string;
  envelope?: string;
  signed_data?: string;
  p2p_metadata?: {
    transport: P2PTransport;
    sender_device_id: string;
    receiver_device_id?: string;
    hop_count: number;
    discovered_at: string;
    received_at?: string;
    rssi?: number;
    channel_id?: string;
  };
  is_offline: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  retry_count?: number;
  next_retry_at?: string;
  offline_version?: number;
  sync_priority?: number;
  offline_metadata?: {
    local_signed_at?: string;
    original_created_at: string;
    device_id: string;
    network_status: string;
    error_details?: {
      code: string;
      message: string;
      retry_strategy: string;
    };
  };
  slot?: number;
  confirmation_status?: ConfirmationStatus;
  error_message?: string;
  blockhash?: string;
  last_valid_block_height?: number;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  failed_at?: string;
}

export interface WalletBalance {
  id: string;
  wallet_id: string;
  sol_balance: number;
  usd_value: number;
  token_count: number;
  nft_count: number;
  last_updated: string;
}

export interface TransactionPackage {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  fromAddress: string;
  toAddress: string;
  amount: number;
  symbol: string;
  tokenMint?: string;
  fee: number;
  nonce: string;
  memo?: string;
  signedData?: string;
  p2pMetadata?: {
    transport: P2PTransport;
    deviceId: string;
    timestamp: number;
    hopCount: number;
  };
  isOffline: boolean;
  createdAt: string;
  updatedAt: string;
}
