import { Database } from "../supabase/database.types";

type NonceAccountDB = Database["public"]["Tables"]["nonce_accounts"]["Row"];
type NonceAccountInsert =
  Database["public"]["Tables"]["nonce_accounts"]["Insert"];
type NonceAccountUpdate =
  Database["public"]["Tables"]["nonce_accounts"]["Update"];

// Define interfaces for nonce management
export interface NonceAccountInfo {
  publicKey: string;
  authority: string;
  nonce: string;
  balance: number;
  feeCalculator: {
    lamportsPerSignature: number;
  };
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  network: "mainnet-beta" | "devnet" | "testnet";
}

export interface NonceMetrics {
  totalNonces: number;
  activeNonces: number;
  expiredNonces: number;
  failedOperations: number;
  averageLatency: number;
  lastCleanup: string;
}

export interface NonceCache {
  value: string;
  timestamp: number;
  feeCalculator: {
    lamportsPerSignature: number;
  };
}

// Constants
export const NONCE_ACCOUNT_LENGTH = 80;
export const MAX_NONCE_AGE = 10 * 60 * 1000; // 10 minutes
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

// Error handling
type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class NonceError extends Error {
  readonly code: ErrorCode;
  readonly context?: unknown;

  constructor(code: ErrorCode, message: string, context?: unknown) {
    super(message);
    this.name = "NonceError";
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, NonceError.prototype);
  }
}

export const ErrorCodes = {
  INITIALIZATION_FAILED: "NONCE_INITIALIZATION_FAILED",
  CREATION_FAILED: "NONCE_CREATION_FAILED",
  ADVANCE_FAILED: "NONCE_ADVANCE_FAILED",
  VERIFICATION_FAILED: "NONCE_VERIFICATION_FAILED",
  EXPIRED: "NONCE_EXPIRED",
  NOT_FOUND: "NONCE_NOT_FOUND",
  CLEANUP_FAILED: "NONCE_CLEANUP_FAILED",
} as const;

// Utility function to convert between DB and internal types
export function mapToNonceAccountInfo(
  data: Database["public"]["Tables"]["nonce_accounts"]["Row"]
): NonceAccountInfo {
  return {
    publicKey: data.pubkey,
    authority: data.authority,
    nonce: data.nonce,
    balance: data.lamports,
    feeCalculator: data.fee_calculator,
    created_at: data.created_at,
    last_used: data.last_used,
    is_active: data.is_active,
    network: data.network,
  };
}

export function mapFromNonceAccountInfo(
  info: NonceAccountInfo
): Database["public"]["Tables"]["nonce_accounts"]["Insert"] {
  return {
    pubkey: info.publicKey,
    authority: info.authority,
    nonce: info.nonce,
    lamports: info.balance,
    fee_calculator: info.feeCalculator,
    created_at: info.created_at,
    last_used: info.last_used,
    is_active: info.is_active,
    network: info.network,
  };
}
