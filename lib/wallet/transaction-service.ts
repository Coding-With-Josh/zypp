import {
  Transaction as AppTransaction,
  OfflineTransaction,
  OnlineTransaction,
  P2PTransport,
} from "@/types";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { keyManagementService } from "../crypto/key-management";
import { nonceManager } from "../solana/nonce-manager";
import { secureStorageManager } from "../storage/secure-store";
import { transportManager } from "../transport/transport-manager";
import { p2pTransactionService } from "./p2p-transaction-service";
import { transactionQueue } from "./transaction-queue";
import { walletService } from "./wallet-service";

class TransactionService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" }
    );
    // Initialize P2P service
    p2pTransactionService.initialize().catch(console.error);
  }

  // Determine best transport method for a recipient
  private async determineTransportMethod(
    recipientAddress: string,
    isOnline: boolean = true
  ): Promise<{
    transport: P2PTransport;
    deviceId?: string;
  }> {
    // Check if recipient is nearby
    const nearbyUsers = await this.getNearbyUsers();
    const nearbyUser = nearbyUsers.find(
      (user) => user.address === recipientAddress
    );

    if (nearbyUser && nearbyUser.transport_capabilities?.length) {
      // Get supported transports
      const supportedTransports = transportManager.getSupportedTransports();

      // Find best matching transport
      for (const transport of nearbyUser.transport_capabilities) {
        if (supportedTransports.includes(transport)) {
          return {
            transport,
            deviceId: nearbyUser.device_id,
          };
        }
      }
    }

    // Fallback based on online status
    return {
      transport: isOnline ? "wifi_direct" : "local_network",
    };
  }

  private async getNearbyUsers() {
    try {
      // Get users from multipeer service via transport manager
      return await new Promise<any[]>((resolve) => {
        let users: any[] = [];
        const timeout = setTimeout(() => resolve(users), 2000); // 2 second timeout

        transportManager
          .initialize(
            (peer) => {
              users.push(peer);
            },
            () => {} // No need to handle transactions here
          )
          .then(() => {
            clearTimeout(timeout);
            resolve(users);
          });
      });
    } catch (error) {
      console.error("Error getting nearby users:", error);
      return [];
    }
  }

  // Send SOL with proper nonce handling
  async sendSOL(
    toAddress: string,
    amount: number,
    memo?: string,
    nonce?: string,
    isOnline: boolean = true
  ): Promise<AppTransaction> {
    const keypair = walletService.getCurrentKeypair();
    if (!keypair) {
      throw new Error("Wallet not unlocked");
    }

    const toPublicKey = new PublicKey(toAddress);
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    try {
      // Try P2P first if recipient is nearby
      const { transport, deviceId } = await this.determineTransportMethod(
        toAddress,
        isOnline
      );

      if (transport !== "local_network") {
        // Create transaction package for P2P
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: toPublicKey,
            lamports,
          })
        );

        // Try P2P transfer
        const success = await p2pTransactionService.sendTransaction(
          {
            id: this.generateId(),
            version: 1,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            transport: {
              transport,
              sender_device_id: await this.getDeviceId(),
              receiver_device_id: deviceId,
              hop_count: 0,
              discovered_at: new Date().toISOString(),
              received_at: new Date().toISOString(),
            },
            envelope: {
              version: 1,
              transaction_data: transaction.serialize().toString("base64"),
              signatures: [],
              nonce: nonce || "",
              metadata: {
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                network: "devnet",
              },
            },
            metadata: {
              amount,
              symbol: "SOL",
              from_address: keypair.publicKey.toBase58(),
              to_address: toAddress,
            },
            signed_data: transaction.serialize().toString("base64"),
          },
          transport,
          deviceId
        );

        if (success) {
          // P2P transfer succeeded
          return {
            id: this.generateId(),
            user_id: "",
            type: "transfer",
            status: "confirmed",
            from_address: keypair.publicKey.toBase58(),
            to_address: toAddress,
            amount,
            symbol: "SOL",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            fee: 0,
            nonce: nonce || "",
            is_offline: false,
          };
        }
      }

      // Fallback to regular transaction if P2P fails or not available
      // Get recent blockhash or use provided nonce
      let blockhash: string;
      let lastValidBlockHeight: number;

      if (nonce) {
        // Use provided nonce for offline transactions
        blockhash = nonce;
        // For nonce transactions, we need to handle block height differently
        lastValidBlockHeight = (await this.connection.getBlockHeight()) + 150;
      } else {
        // Get fresh blockhash for online transactions
        const blockhashInfo = await this.connection.getLatestBlockhash();
        blockhash = blockhashInfo.blockhash;
        lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
      }

      // Create transaction
      const transaction = new Transaction({
        feePayer: keypair.publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Add memo if provided
      if (memo) {
        // In production, you'd add memo program instruction
        // transaction.add(...)
      }

      // Sign transaction
      transaction.sign(keypair);

      let signature: string;

      if (nonce) {
        // For nonce transactions, use special sending method
        signature = await this.sendNonceTransaction(transaction, nonce);
      } else {
        // Regular transaction
        signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [keypair],
          {
            commitment: "confirmed",
            skipPreflight: false,
          }
        );
      }

      // Create transaction record
      const appTransaction: OnlineTransaction = {
        id: this.generateId(),
        user_id: "", // Will be set from auth context
        type: "transfer",
        status: "confirmed",
        signature,
        from_address: keypair.publicKey.toBase58(),
        to_address: toAddress,
        amount,
        token_mint: undefined,
        symbol: "SOL",
        usd_value: 0,
        fee: 0.000005,
        nonce: blockhash,
        durable_nonce_account: nonce
          ? await this.getNonceAccountForTransaction(nonce)
          : undefined,
        memo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        is_offline: false,
        confirmation_status: "confirmed",
      };

      // Add to local transactions
      this.addTransactionToHistory(appTransaction);

      return appTransaction;
    } catch (error: any) {
      console.error("SOL transfer failed:", error);
      throw new Error(`Failed to send SOL: ${error.message}`);
    }
  }

  // Create offline transaction with durable nonce
  async createOfflineTransaction(
    toAddress: string,
    amount: number,
    memo?: string
  ): Promise<OfflineTransaction> {
    const keypair = walletService.getCurrentKeypair();
    if (!keypair) {
      throw new Error("Wallet not unlocked");
    }

    let nonceAccount: string | undefined;
    try {
      // Generate transaction ID first
      const transactionId = this.generateId();

      // Reserve a nonce for this offline transaction
      // CRITICAL: Pass transactionId to prevent nonce reuse (security fix)
      const { nonce, nonceAccount: reservedNonceAccount } = await nonceManager.reserveNonce(
        keypair.publicKey.toBase58(),
        transactionId
      );
      nonceAccount = reservedNonceAccount;

      const toPublicKey = new PublicKey(toAddress);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Create transaction with durable nonce
      const transaction = new Transaction({
        feePayer: keypair.publicKey,
        blockhash: nonce, // Use nonce as blockhash
        lastValidBlockHeight: (await this.connection.getBlockHeight()) + 150,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Add nonce advance instruction to consume the nonce
      transaction.add(
        SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: keypair.publicKey,
        })
      );

      // Sign transaction
      transaction.sign(keypair);

      // Serialize for P2P transfer
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const envelope = {
        version: 1,
        transaction_data: Buffer.from(serializedTransaction).toString("base64"),
        signatures: transaction.signatures.map((sig) =>
          sig.signature ? Buffer.from(sig.signature).toString("base64") : ""
        ),
        nonce,
        nonce_account: nonceAccount,
        metadata: {
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          network: "devnet",
          amount,
          to_address: toAddress,
          from_address: keypair.publicKey.toBase58(),
        },
      };

      const deviceId = await this.getDeviceId();

      const offlineTransaction: OfflineTransaction = {
        id: transactionId,
        user_id: "",
        type: "transfer",
        status: "signed_offline",
        signature: "", // Will be set when broadcast
        from_address: keypair.publicKey.toBase58(),
        to_address: toAddress,
        amount,
        token_mint: undefined,
        symbol: "SOL",
        usd_value: 0,
        fee: 0.000005,
        nonce,
        durable_nonce_account: nonceAccount,
        memo,
        envelope: JSON.stringify(envelope),
        signed_data: Buffer.from(serializedTransaction).toString("base64"),
        p2p_metadata: {
          transport: "bluetooth",
          sender_device_id: deviceId,
          hop_count: 0,
          discovered_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
        },
        is_offline: true,
        sync_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        blockhash: nonce,
        last_valid_block_height: (await this.connection.getBlockHeight()) + 150,
      };

      // Add to queue
      await transactionQueue.enqueue(offlineTransaction);

      return offlineTransaction;
    } catch (error: any) {
      console.error("Offline transaction creation failed:", error);
      // CRITICAL: Release nonce if transaction creation fails
      // This prevents nonce from being stuck in reserved state
      if (nonceAccount) {
        try {
          nonceManager.releaseNonce(nonceAccount);
        } catch (releaseError) {
          console.error("Failed to release nonce after error:", releaseError);
        }
      }
      throw new Error(`Failed to create offline transaction: ${error.message}`);
    }
  }

  // Broadcast offline transaction
  async broadcastOfflineTransaction(
    transactionId: string
  ): Promise<AppTransaction> {
    try {
      const queuedTx = transactionQueue.get(transactionId);
      if (!queuedTx) {
        throw new Error("Transaction not found in queue");
      }
      const offlineTransaction = queuedTx.transaction as OfflineTransaction;

      if (!offlineTransaction) {
        throw new Error("Transaction not found in pending queue");
      }

      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(offlineTransaction.signed_data, "base64")
      );

      // Send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [], // Transaction is already signed
        {
          commitment: "confirmed",
          skipPreflight: true, // Skip preflight for nonce transactions
        }
      );

      // Create confirmed transaction record
      const confirmedTransaction: AppTransaction = {
        ...offlineTransaction,
        status: "confirmed",
        signature,
        is_offline: false,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove from queue and add to history
      await transactionQueue.remove(transactionId);
      this.addTransactionToHistory(confirmedTransaction);

      // Advance the nonce for next use
      if (offlineTransaction.durable_nonce_account) {
        const keypair = walletService.getCurrentKeypair();
        if (keypair) {
          await nonceManager.advanceNonce(
            offlineTransaction.durable_nonce_account,
            keypair
          );
        }
      }

      return confirmedTransaction;
    } catch (error: any) {
      console.error("Transaction broadcast failed:", error);

      // CRITICAL: Release nonce if broadcast fails permanently
      // Check if this is a permanent failure (not just a retry)
      const queuedTx = transactionQueue.get(transactionId);
      if (queuedTx && queuedTx.transaction) {
        const offlineTx = queuedTx.transaction as OfflineTransaction;
        const maxRetries = 3;
        
        // If we've exceeded max retries, release the nonce
        if (offlineTx.sync_attempts && offlineTx.sync_attempts >= maxRetries) {
          if (offlineTx.durable_nonce_account) {
            try {
              nonceManager.releaseNonce(offlineTx.durable_nonce_account);
              console.log(`🔓 Released nonce after max retries for transaction ${transactionId}`);
            } catch (releaseError) {
              console.error("Failed to release nonce after max retries:", releaseError);
            }
          }
        }
      }

      // Update sync attempts
      await transactionQueue.incrementSyncAttempts(transactionId);

      throw new Error(`Failed to broadcast transaction: ${error.message}`);
    }
  }

  // Process received offline transaction
  async processReceivedOfflineTransaction(
    transactionData: string
  ): Promise<void> {
    try {
      const envelope = JSON.parse(transactionData);

      // Verify transaction structure
      if (!envelope.transaction_data || !envelope.nonce) {
        throw new Error("Invalid transaction envelope");
      }

      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(envelope.transaction_data, "base64")
      );

      // Verify the transaction is for this wallet
      const keypair = walletService.getCurrentKeypair();
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      // Check if this wallet is the recipient
      const isRecipient = transaction.instructions.some((instruction) => {
        // Check transfer instructions for this wallet's address
        return instruction.keys.some(
          (key) =>
            key.pubkey.equals(keypair.publicKey) && key.isSigner === false
        );
      });

      if (!isRecipient) {
        throw new Error("Transaction is not for this wallet");
      }

      // Verify nonce is still valid
      try {
        const nonceAccountInfo = await this.connection.getNonce(
          new PublicKey(envelope.nonce_account)
        );
        if (!nonceAccountInfo || nonceAccountInfo.nonce !== envelope.nonce) {
          throw new Error("Nonce is no longer valid");
        }
      } catch (err) {
        const error = err as Error;
        throw new Error("Failed to verify nonce: " + error.message);
      }

      // Store the received transaction for later broadcasting
      const receivedOfflineTransaction: OfflineTransaction = {
        id: this.generateId(),
        user_id: "",
        type: "receive",
        status: "signed_offline",
        from_address: transaction.feePayer?.toBase58() || "",
        to_address: keypair.publicKey.toBase58(),
        amount: this.calculateReceivedAmount(transaction, keypair.publicKey),
        token_mint: undefined,
        symbol: "SOL",
        usd_value: 0,
        fee: 0,
        nonce: envelope.nonce,
        durable_nonce_account: envelope.nonce_account,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        envelope: transactionData,
        signed_data: envelope.transaction_data,
        p2p_metadata: {
          transport: "bluetooth",
          sender_device_id: envelope.metadata?.from_address || "unknown",
          hop_count: 0,
          discovered_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
        },
        is_offline: true,
        sync_attempts: 0,
      };

      await transactionQueue.enqueue(receivedOfflineTransaction);
    } catch (error: any) {
      console.error("Received transaction processing failed:", error);
      throw new Error(
        `Failed to process received transaction: ${error.message}`
      );
    }
  }

  // Initialize nonce accounts for a wallet
  async initializeNonceAccounts(count: number = 3): Promise<void> {
    const keypair = walletService.getCurrentKeypair();
    if (!keypair) {
      throw new Error("Wallet not unlocked");
    }

    try {
      await nonceManager.createNonceAccountBatch(keypair, count);
    } catch (error: any) {
      console.error("Nonce accounts initialization failed:", error);
      throw new Error(`Failed to initialize nonce accounts: ${error.message}`);
    }
  }

  // Get nonce accounts for current wallet
  async getNonceAccounts() {
    const keypair = walletService.getCurrentKeypair();
    if (!keypair) {
      throw new Error("Wallet not unlocked");
    }

    return await nonceManager.getWalletNonceAccounts(
      keypair.publicKey.toBase58()
    );
  }

  // Private helper methods
  private async sendNonceTransaction(
    transaction: Transaction,
    nonce: string
  ): Promise<string> {
    // For nonce transactions, we need to handle sending differently
    // This is a simplified version - in production you'd use the correct method
    return await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [], // Transaction is already signed
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
  }

  private async getNonceAccountForTransaction(
    nonce: string
  ): Promise<string | undefined> {
    try {
      const keypair = walletService.getCurrentKeypair();
      if (!keypair) return undefined;

      const nonceAccounts = await nonceManager.getWalletNonceAccounts(
        keypair.publicKey.toBase58()
      );
      const nonceAccount = nonceAccounts.find((na) => na.nonce === nonce);
      return nonceAccount?.publicKey;
    } catch {
      return undefined;
    }
  }

  private calculateReceivedAmount(
    transaction: Transaction,
    recipient: PublicKey
  ): number {
    // Calculate received amount from transaction instructions
    let totalReceived = 0;

    transaction.instructions.forEach((instruction) => {
      if (instruction.programId.equals(SystemProgram.programId)) {
        // This is a system program instruction (likely a transfer)
        // Parse the instruction data to get amount
        // This is simplified - in production you'd properly parse the instruction
        const data = instruction.data;
        if (data.length >= 12) {
          // System transfer instruction has 4 bytes for instruction index + 8 bytes for lamports
          const lamports = data.readBigUInt64LE(4);
          totalReceived += Number(lamports) / LAMPORTS_PER_SOL;
        }
      }
    });

    return totalReceived;
  }

  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceId(): Promise<string> {
    let deviceId = await keyManagementService.secureRetrieve("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await keyManagementService.secureStore("device_id", deviceId);
    }
    return deviceId;
  }

  private async addTransactionToHistory(
    transaction: AppTransaction
  ): Promise<void> {
    const currentTransactions =
      await secureStorageManager.getRecentTransactions();
    const updatedTransactions = [transaction, ...currentTransactions].slice(
      0,
      100
    );
    await secureStorageManager.setRecentTransactions(updatedTransactions);
  }
}

export const transactionService = new TransactionService();
