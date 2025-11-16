import { NonceAccountInfo } from "@/types";
import {
  Connection,
  Keypair,
  NONCE_ACCOUNT_LENGTH,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { secureStorageManager } from "../storage/secure-store";
import { supabase, SupabaseDbClient } from "../supabase/client";
import { Database } from "../supabase/database.types";
import {
  ErrorCodes,
  mapToNonceAccountInfo,
  MAX_NONCE_AGE,
  NonceCache,
  NonceError,
  NonceMetrics,
} from "./nonce-types";

export class NonceManager {
  private readonly connection: Connection;
  private readonly supabase: SupabaseDbClient;
  private readonly nonceCache: Map<string, NonceCache>;
  private readonly maxNonceAge = MAX_NONCE_AGE;
  // CRITICAL: Track reserved nonces to prevent reuse (security fix)
  private readonly reservedNonces: Map<string, { reservedAt: number; transactionId?: string }> = new Map();
  private readonly reservationLocks: Map<string, Promise<void>> = new Map();
  private metrics: NonceMetrics = {
    totalNonces: 0,
    activeNonces: 0,
    expiredNonces: 0,
    failedOperations: 0,
    averageLatency: 0,
    lastCleanup: new Date().toISOString(),
  };

  constructor() {
    this.connection = new Connection(
      process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" }
    );
    this.supabase = supabase;
    this.nonceCache = new Map();
    this.startCleanupInterval();
    this.trackMetrics();
  }

  private startCleanupInterval() {
    // Clean up expired nonces every minute
    setInterval(() => {
      this.cleanupExpiredNonces();
    }, 60 * 1000);
  }

  private trackMetrics() {
    setInterval(
      () => {
        const activeNonces = Array.from(this.nonceCache.entries()).filter(
          ([_, data]) => Date.now() - data.timestamp <= this.maxNonceAge
        ).length;

        this.metrics = {
          ...this.metrics,
          activeNonces,
          lastCleanup: new Date().toISOString(),
        };

        console.log("Nonce metrics:", this.metrics);
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  private async cleanupExpiredNonces() {
    const now = Date.now();
    let expiredCount = 0;

    try {
      for (const [pubkey, data] of this.nonceCache.entries()) {
        if (now - data.timestamp > this.maxNonceAge) {
          this.nonceCache.delete(pubkey);
          await this.deactivateNonceAccount(pubkey);
          expiredCount++;
        }
      }

      this.metrics.expiredNonces += expiredCount;
      console.log(`Cleaned up ${expiredCount} expired nonces`);
    } catch (error) {
      this.metrics.failedOperations++;
      console.error("Error cleaning up expired nonces:", error);
      throw new NonceError(
        ErrorCodes.CLEANUP_FAILED,
        "Failed to clean up expired nonces",
        error
      );
    }
  }

  // Create a new durable nonce account with retry logic
  async createNonceAccount(
    authorityKeypair: Keypair,
    rentAmount: number = 0.001 // 0.001 SOL for rent
  ): Promise<NonceAccountInfo> {
    try {
      // Generate nonce account keypair
      const nonceAccountKeypair = Keypair.generate();

      // Calculate rent exemption
      const rentExemption =
        await this.connection.getMinimumBalanceForRentExemption(
          NONCE_ACCOUNT_LENGTH
        );

      // Create transaction to initialize nonce account
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: authorityKeypair.publicKey,
          newAccountPubkey: nonceAccountKeypair.publicKey,
          lamports: rentExemption,
          space: NONCE_ACCOUNT_LENGTH,
          programId: SystemProgram.programId,
        }),
        SystemProgram.nonceInitialize({
          noncePubkey: nonceAccountKeypair.publicKey,
          authorizedPubkey: authorityKeypair.publicKey,
        })
      );

      // Send and confirm transaction
      await sendAndConfirmTransaction(this.connection, transaction, [
        authorityKeypair,
        nonceAccountKeypair,
      ]);

      // Get initial nonce value
      const nonceAccountInfo = await this.connection.getNonce(
        nonceAccountKeypair.publicKey
      );

      if (!nonceAccountInfo) {
        throw new NonceError(
          ErrorCodes.INITIALIZATION_FAILED,
          "Failed to initialize nonce account"
        );
      }

      // Get balance of nonce account
      const balance = await this.connection.getBalance(
        nonceAccountKeypair.publicKey
      );

      const rpcUrl = this.connection.rpcEndpoint;
      const network = rpcUrl.includes("devnet")
        ? "devnet"
        : rpcUrl.includes("testnet")
          ? "testnet"
          : "mainnet-beta";

      const nonceInfo: NonceAccountInfo = {
        publicKey: nonceAccountKeypair.publicKey.toBase58(),
        authority: authorityKeypair.publicKey.toBase58(),
        nonce: nonceAccountInfo.nonce,
        balance,
        feeCalculator: {
          lamportsPerSignature:
            nonceAccountInfo.feeCalculator.lamportsPerSignature,
        },
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        is_active: true,
        network,
      };

      // Store in local storage
      await this.storeNonceAccountLocally(nonceInfo);

      // Store in Supabase if user is authenticated
      await this.storeNonceAccountInSupabase(nonceInfo);

      return nonceInfo;
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Nonce account creation failed:", error);
      throw new NonceError(
        ErrorCodes.CREATION_FAILED,
        `Failed to create nonce account: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  // Get or create nonce account for a wallet
  async getNonceAccount(authorityPublicKey: string): Promise<NonceAccountInfo> {
    try {
      // Try to get from local storage first
      const localNonce = await this.getLocalNonceAccount(authorityPublicKey);
      if (localNonce && localNonce.is_active) {
        // Verify the nonce account still exists on-chain
        try {
          const onChainInfo = await this.connection.getNonce(
            new PublicKey(localNonce.publicKey)
          );
          if (onChainInfo) {
            return {
              ...localNonce,
              nonce: onChainInfo.nonce,
              last_used: new Date().toISOString(),
            };
          }
        } catch {
          // Nonce account doesn't exist on-chain, mark as inactive
          await this.deactivateNonceAccount(localNonce.publicKey);
        }
      }

      // Try to get from Supabase
      const supabaseNonce =
        await this.getSupabaseNonceAccount(authorityPublicKey);
      if (supabaseNonce && supabaseNonce.is_active) {
        try {
          const onChainInfo = await this.connection.getNonce(
            new PublicKey(supabaseNonce.publicKey)
          );
          if (onChainInfo) {
            await this.storeNonceAccountLocally(supabaseNonce);
            return {
              ...supabaseNonce,
              nonce: onChainInfo.nonce,
              last_used: new Date().toISOString(),
            };
          }
        } catch {
          await this.deactivateNonceAccount(supabaseNonce.publicKey);
        }
      }

      throw new NonceError(
        ErrorCodes.NOT_FOUND,
        "No active nonce account found"
      );
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Get nonce account failed:", error);
      throw new NonceError(
        ErrorCodes.NOT_FOUND,
        `Failed to get nonce account: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  // Advance nonce to next value
  async advanceNonce(
    nonceAccountPublicKey: string,
    authorityKeypair: Keypair
  ): Promise<string> {
    try {
      const transaction = new Transaction().add(
        SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccountPublicKey),
          authorizedPubkey: authorityKeypair.publicKey,
        })
      );

      await sendAndConfirmTransaction(this.connection, transaction, [
        authorityKeypair,
      ]);

      // Get updated nonce
      const updatedNonce = await this.connection.getNonce(
        new PublicKey(nonceAccountPublicKey)
      );

      if (!updatedNonce) {
        throw new Error("Failed to advance nonce");
      }

      // CRITICAL: Release the reservation since nonce has been advanced
      this.releaseNonce(nonceAccountPublicKey);

      // Update local storage
      await this.updateLocalNonce(nonceAccountPublicKey, updatedNonce.nonce);

      // Update Supabase
      await this.updateSupabaseNonce(nonceAccountPublicKey, updatedNonce.nonce);

      return updatedNonce.nonce;
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Nonce advance failed:", error);
      throw new NonceError(
        ErrorCodes.ADVANCE_FAILED,
        `Failed to advance nonce: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  // Get current nonce value
  async getCurrentNonce(nonceAccountPublicKey: string): Promise<string> {
    try {
      const nonceAccountInfo = await this.connection.getNonce(
        new PublicKey(nonceAccountPublicKey)
      );

      if (!nonceAccountInfo) {
        throw new Error("Nonce account not found");
      }

      return nonceAccountInfo.nonce;
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Get current nonce failed:", error);
      throw new NonceError(
        ErrorCodes.NOT_FOUND,
        `Failed to get current nonce: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  // Create multiple nonce accounts for batch offline transactions
  async createNonceAccountBatch(
    authorityKeypair: Keypair,
    count: number = 5
  ): Promise<NonceAccountInfo[]> {
    const nonceAccounts: NonceAccountInfo[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const nonceAccount = await this.createNonceAccount(authorityKeypair);
        nonceAccounts.push(nonceAccount);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to create nonce account ${i + 1}:`, error);
        // Continue with other accounts even if one fails
      }
    }

    return nonceAccounts;
  }

  // Get all nonce accounts for a wallet
  async getWalletNonceAccounts(
    authorityPublicKey: string
  ): Promise<NonceAccountInfo[]> {
    try {
      // Get from local storage
      const localNonces = await this.getLocalNonceAccounts(authorityPublicKey);

      // Get from Supabase
      const supabaseNonces =
        await this.getSupabaseNonceAccounts(authorityPublicKey);

      // Merge and deduplicate
      const allNonces = [...localNonces, ...supabaseNonces];
      const uniqueNonces = allNonces.filter(
        (nonce, index, self) =>
          index === self.findIndex((n) => n.publicKey === nonce.publicKey)
      );

      // Verify each nonce account is still active on-chain
      const verifiedNonces: NonceAccountInfo[] = [];

      for (const nonce of uniqueNonces) {
        try {
          const onChainInfo = await this.connection.getNonce(
            new PublicKey(nonce.publicKey)
          );
          if (onChainInfo && nonce.is_active) {
            verifiedNonces.push({
              ...nonce,
              nonce: onChainInfo.nonce,
            });
          } else {
            await this.deactivateNonceAccount(nonce.publicKey);
          }
        } catch (verifyError) {
          console.error(
            "Verification failed for nonce account:",
            nonce.publicKey,
            verifyError
          );
          await this.deactivateNonceAccount(nonce.publicKey);
        }
      }

      return verifiedNonces;
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Get wallet nonce accounts failed:", error);
      throw new NonceError(
        ErrorCodes.VERIFICATION_FAILED,
        `Failed to get nonce accounts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Reserve a nonce for offline transaction
  // CRITICAL: This prevents nonce reuse which could lead to double-spending attacks
  async reserveNonce(
    authorityPublicKey: string,
    transactionId?: string
  ): Promise<{ nonce: string; nonceAccount: string }> {
    // Use a lock per authority to prevent concurrent reservations
    const lockKey = authorityPublicKey;
    let lockPromise = this.reservationLocks.get(lockKey);
    
    if (lockPromise) {
      // Wait for existing reservation to complete
      await lockPromise;
    }

    // Create new lock for this reservation
    let resolveLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.reservationLocks.set(lockKey, newLock);

    try {
      const nonceAccounts =
        await this.getWalletNonceAccounts(authorityPublicKey);

      // Find an active nonce account that is NOT currently reserved
      let availableNonceAccount = null;
      for (const nonceAccount of nonceAccounts) {
        if (!nonceAccount.is_active) continue;
        
        const nonceKey = nonceAccount.publicKey;
        const reservation = this.reservedNonces.get(nonceKey);
        
        // Check if this nonce is already reserved
        if (reservation) {
          // If reservation is older than 10 minutes, consider it stale and allow reuse
          const reservationAge = Date.now() - reservation.reservedAt;
          if (reservationAge < 10 * 60 * 1000) {
            // Still reserved, skip this nonce account
            continue;
          } else {
            // Stale reservation, remove it
            this.reservedNonces.delete(nonceKey);
          }
        }
        
        availableNonceAccount = nonceAccount;
        break;
      }

      if (!availableNonceAccount) {
        throw new NonceError(
          ErrorCodes.NOT_FOUND,
          "No available nonce accounts. All nonces are currently reserved or inactive. Please create more nonce accounts or wait for existing transactions to complete."
        );
      }

      // Get current nonce value from blockchain (always get fresh value)
      const currentNonce = await this.getCurrentNonce(
        availableNonceAccount.publicKey
      );

      // CRITICAL: Mark this nonce as reserved IMMEDIATELY to prevent reuse
      const nonceKey = availableNonceAccount.publicKey;
      this.reservedNonces.set(nonceKey, {
        reservedAt: Date.now(),
        transactionId,
      });

      // Update last used timestamp in storage
      await this.updateNonceLastUsed(availableNonceAccount.publicKey);

      console.log(`🔒 Reserved nonce ${currentNonce.substring(0, 8)}... from account ${nonceKey.substring(0, 8)}...`);

      return {
        nonce: currentNonce,
        nonceAccount: availableNonceAccount.publicKey,
      };
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Nonce reservation failed:", error);
      throw new NonceError(
        ErrorCodes.NOT_FOUND,
        `Failed to reserve nonce: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    } finally {
      // Release the lock
      resolveLock!();
      this.reservationLocks.delete(lockKey);
    }
  }

  // Release a reserved nonce (call when transaction completes or fails)
  releaseNonce(nonceAccount: string): void {
    if (this.reservedNonces.delete(nonceAccount)) {
      console.log(`🔓 Released reserved nonce from account ${nonceAccount.substring(0, 8)}...`);
    }
  }

  // Check if a nonce is currently reserved
  isNonceReserved(nonceAccount: string): boolean {
    const reservation = this.reservedNonces.get(nonceAccount);
    if (!reservation) return false;
    
    // Check if reservation is stale (older than 10 minutes)
    const reservationAge = Date.now() - reservation.reservedAt;
    if (reservationAge > 10 * 60 * 1000) {
      // Stale reservation, remove it
      this.reservedNonces.delete(nonceAccount);
      return false;
    }
    
    return true;
  }

  // Check if nonce is still fresh (used within last 2 minutes)
  private isNonceFresh(lastUsed: string | null): boolean {
    if (!lastUsed) return false;
    const lastUsedTime = new Date(lastUsed).getTime();
    const currentTime = Date.now();
    return currentTime - lastUsedTime < 2 * 60 * 1000; // 2 minutes
  }

  // Local storage methods
  private async storeNonceAccountLocally(
    nonceInfo: NonceAccountInfo
  ): Promise<void> {
    try {
      const existingNonces = await this.getLocalNonceAccounts(
        nonceInfo.authority
      );
      const updatedNonces = existingNonces.filter(
        (n) => n.publicKey !== nonceInfo.publicKey
      );
      updatedNonces.push(nonceInfo);
      await secureStorageManager.setNonceAccounts(updatedNonces);
    } catch (error) {
      this.metrics.failedOperations++;
      console.error("Store nonce locally failed:", error);
      throw new NonceError(
        ErrorCodes.CREATION_FAILED,
        `Failed to store nonce account locally: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async getLocalNonceAccount(
    authorityPublicKey: string
  ): Promise<NonceAccountInfo | null> {
    try {
      const nonces = await this.getLocalNonceAccounts(authorityPublicKey);
      return nonces.find((nonce) => nonce.is_active) || null;
    } catch (error) {
      console.error("Get local nonce account failed:", error);
      return null;
    }
  }

  private async getLocalNonceAccounts(
    authorityPublicKey: string
  ): Promise<NonceAccountInfo[]> {
    try {
      const stored = await secureStorageManager.getNonceAccounts();
      return stored.filter((nonce) => nonce.authority === authorityPublicKey);
    } catch (error) {
      console.error("Get local nonce accounts failed:", error);
      return [];
    }
  }

  private async updateLocalNonce(
    nonceAccountPublicKey: string,
    newNonce: string
  ): Promise<void> {
    try {
      const allNonces = await secureStorageManager.getNonceAccounts();
      const updatedNonces = allNonces.map((nonce) =>
        nonce.publicKey === nonceAccountPublicKey
          ? { ...nonce, nonce: newNonce, last_used: new Date().toISOString() }
          : nonce
      );
      await secureStorageManager.setNonceAccounts(updatedNonces);
    } catch (error) {
      this.metrics.failedOperations++;
      console.error("Update local nonce failed:", error);
      throw new NonceError(
        ErrorCodes.ADVANCE_FAILED,
        `Failed to update nonce locally: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async deactivateNonceAccount(
    nonceAccountPublicKey: string
  ): Promise<void> {
    try {
      const allNonces = await secureStorageManager.getNonceAccounts();
      const updatedNonces = allNonces.map((nonce) =>
        nonce.publicKey === nonceAccountPublicKey
          ? { ...nonce, is_active: false }
          : nonce
      );
      await secureStorageManager.setNonceAccounts(updatedNonces);

      // Also update in Supabase
      await this.deactivateSupabaseNonce(nonceAccountPublicKey);
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Deactivate nonce account failed:", error);
      throw new NonceError(
        ErrorCodes.CLEANUP_FAILED,
        `Failed to deactivate nonce account: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async updateNonceLastUsed(
    nonceAccountPublicKey: string
  ): Promise<void> {
    try {
      const allNonces = await secureStorageManager.getNonceAccounts();
      const updatedNonces = allNonces.map((nonce) =>
        nonce.publicKey === nonceAccountPublicKey
          ? { ...nonce, last_used: new Date().toISOString() }
          : nonce
      );
      await secureStorageManager.setNonceAccounts(updatedNonces);
    } catch (error) {
      console.error("Update nonce last used failed:", error);
    }
  }

  // Supabase methods
  private async storeNonceAccountInSupabase(
    nonceInfo: NonceAccountInfo
  ): Promise<void> {
    try {
      type NonceAccountInsert =
        Database["public"]["Tables"]["nonce_accounts"]["Insert"];
      const insertData: NonceAccountInsert = {
        pubkey: nonceInfo.publicKey,
        authority: nonceInfo.authority,
        nonce: nonceInfo.nonce,
        lamports: nonceInfo.balance,
        fee_calculator: nonceInfo.feeCalculator,
        created_at: new Date(nonceInfo.created_at).toISOString(),
        last_used: nonceInfo.last_used
          ? new Date(nonceInfo.last_used).toISOString()
          : null,
        is_active: nonceInfo.is_active,
        network: nonceInfo.network,
      };

      const { error } = await this.supabase
        .from("nonce_accounts")
        .insert(insertData);

      if (error) {
        this.metrics.failedOperations++;
        throw new NonceError(
          ErrorCodes.CREATION_FAILED,
          `Failed to store nonce in Supabase: ${error.message}`,
          error
        );
      }
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Store nonce in Supabase failed:", error);
      throw new NonceError(
        ErrorCodes.CREATION_FAILED,
        `Failed to store nonce in Supabase: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async updateSupabaseNonce(
    nonceAccountPublicKey: string,
    newNonce: string
  ): Promise<void> {
    try {
      type NonceAccountUpdate =
        Database["public"]["Tables"]["nonce_accounts"]["Update"];
      const updateData: NonceAccountUpdate = {
        nonce: newNonce,
        last_used: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("nonce_accounts")
        .update(updateData)
        .match({ pubkey: nonceAccountPublicKey });

      if (error) {
        this.metrics.failedOperations++;
        throw new NonceError(
          ErrorCodes.ADVANCE_FAILED,
          `Failed to update Supabase nonce: ${error.message}`,
          error
        );
      }
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Update Supabase nonce failed:", error);
      throw new NonceError(
        ErrorCodes.ADVANCE_FAILED,
        `Failed to update Supabase nonce: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async deactivateSupabaseNonce(
    nonceAccountPublicKey: string
  ): Promise<void> {
    try {
      type NonceAccountUpdate =
        Database["public"]["Tables"]["nonce_accounts"]["Update"];
      const updateData: NonceAccountUpdate = {
        is_active: false,
        last_used: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("nonce_accounts")
        .update(updateData)
        .match({ pubkey: nonceAccountPublicKey });

      if (error) {
        this.metrics.failedOperations++;
        throw new NonceError(
          ErrorCodes.CLEANUP_FAILED,
          `Failed to deactivate Supabase nonce: ${error.message}`,
          error
        );
      }
    } catch (error) {
      this.metrics.failedOperations++;
      if (error instanceof NonceError) {
        throw error;
      }
      console.error("Deactivate Supabase nonce failed:", error);
      throw new NonceError(
        ErrorCodes.CLEANUP_FAILED,
        `Failed to deactivate Supabase nonce: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async getSupabaseNonceAccount(
    authorityPublicKey: string
  ): Promise<NonceAccountInfo | null> {
    try {
      type NonceAccountRow =
        Database["public"]["Tables"]["nonce_accounts"]["Row"];
      const { data, error } = await this.supabase
        .from("nonce_accounts")
        .select()
        .match({
          authority: authorityPublicKey,
          is_active: true,
        })
        .order("last_used", { ascending: false })
        .limit(1)
        .maybeSingle<NonceAccountRow>();

      if (error) throw error;
      if (!data) return null;

      const accountBalance = await this.connection.getBalance(
        new PublicKey(data.pubkey)
      );
      return mapToNonceAccountInfo({ ...data, lamports: accountBalance });
    } catch (error) {
      console.error("Get Supabase nonce account failed:", error);
      this.metrics.failedOperations++;
      return null;
    }
  }

  private async getSupabaseNonceAccounts(
    authorityPublicKey: string
  ): Promise<NonceAccountInfo[]> {
    try {
      type NonceAccountRow =
        Database["public"]["Tables"]["nonce_accounts"]["Row"];
      const { data, error } = await this.supabase
        .from("nonce_accounts")
        .select()
        .match({
          authority: authorityPublicKey,
          is_active: true,
        })
        .order("last_used", { ascending: false })
        .then((result) => ({
          data: result.data as NonceAccountRow[],
          error: result.error,
        }));

      if (error) throw error;
      if (!data) return [];

      // Get balances in parallel
      const balancePromises = data.map((item: NonceAccountRow) =>
        this.connection.getBalance(new PublicKey(item.pubkey))
      );
      const balances = await Promise.all(balancePromises);

      return data.map((item: NonceAccountRow, index: number) =>
        mapToNonceAccountInfo({ ...item, lamports: balances[index] })
      );
    } catch (error) {
      console.error("Get Supabase nonce accounts failed:", error);
      this.metrics.failedOperations++;
      return [];
    }
  }
}

export const nonceManager = new NonceManager();
