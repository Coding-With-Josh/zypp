import { NonceAccount } from "@solana/web3.js";

export interface NonceAccountInfo {
  publicKey: string;
  authority: string;
  nonce: string;
  balance: number;
  feeCalculator: {
    lamportsPerSignature: number;
  };
  nonceAccount?: NonceAccount;
  created_at: string;
  last_used: string;
  is_active: boolean;
}

export interface NonceCache {
  value: string;
  timestamp: number;
  feeCalculator: {
    lamportsPerSignature: number;
  };
}

export interface NonceMetrics {
  totalNonces: number;
  activeNonces: number;
  expiredNonces: number;
  failedOperations: number;
  averageLatency: number;
  lastCleanup: string;
}
