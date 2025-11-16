import type {
  TransactionPackage,
  TransportInfo,
} from "@/lib/transport/tx-package";
import type {
  OfflineTransaction,
  P2PTransport,
  TransactionEnvelope,
} from "@/types";
import NetInfo from "@react-native-community/netinfo";
import { transportManager } from "../transport/transport-manager";
import { transactionQueue } from "./transaction-queue";
import { transactionService } from "./transaction-service";

// P2P Transaction Package for offline transactions
export interface P2PTransactionPackage {
  id: string;
  version: number;
  created_at: string;
  expires_at: string;
  transport: TransportInfo;
  envelope: TransactionEnvelope;
  metadata: {
    amount: number;
    symbol: string;
    token_mint?: string;
    memo?: string;
    from_address: string;
    to_address: string;
  };
  signed_data: string;
  signature?: string;
  error?: string;
}

class P2PTransactionService {
  private static instance: P2PTransactionService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): P2PTransactionService {
    if (!P2PTransactionService.instance) {
      P2PTransactionService.instance = new P2PTransactionService();
    }
    return P2PTransactionService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    await transportManager.initialize(
      // Handle peer discovery in TransactionContext
      () => {},
      // Handle received transactions
      this.handleReceivedTransaction.bind(this)
    );

    this.isInitialized = true;
  }

  async sendTransaction(
    transaction: P2PTransactionPackage,
    transport: P2PTransport,
    recipientId?: string
  ): Promise<boolean> {
    try {
      // Convert to TransactionPackage format
      const txPackage: TransactionPackage = {
        id: transaction.id,
        version: transaction.version,
        created_at: transaction.created_at,
        expires_at: transaction.expires_at,
        transport: transaction.transport,
        envelope: transaction.envelope,
        metadata: transaction.metadata,
        signed_data: transaction.signed_data,
        signature: transaction.signature,
        error: transaction.error,
      };

      // Try P2P transport first
      const success = await transportManager.sendTransaction(
        txPackage,
        transport,
        recipientId
      );

      if (success) {
        // Add to queue for sync/backup
        await this.queueTransaction(transaction);
        return true;
      }

      // If P2P fails and we're online, try regular transaction
      if (transport !== "qr_code" && transport !== "nfc") {
        await this.fallbackToRegularTransaction(transaction);
      }

      return false;
    } catch (error) {
      console.error("P2P transaction failed:", error);
      throw error;
    }
  }

  private async handleReceivedTransaction(
    receivedTx: P2PTransactionPackage,
    transport: P2PTransport
  ) {
    try {
      // Verify the transaction
      if (!this.verifyTransaction(receivedTx)) {
        throw new Error("Invalid transaction package");
      }

      // Create offline transaction record
      const offlineTx: OfflineTransaction = {
        id: `p2p_${Date.now()}`,
        user_id: "", // Will be set from auth
        type: "transfer",
        status: "signed_offline",
        from_address: receivedTx.metadata.from_address,
        to_address: receivedTx.metadata.to_address,
        amount: receivedTx.metadata.amount,
        symbol: receivedTx.metadata.symbol,
        token_mint: receivedTx.metadata.token_mint,
        fee: 0, // TODO: Calculate proper fee
        nonce: receivedTx.envelope.nonce,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        envelope: JSON.stringify(receivedTx.envelope),
        signed_data: receivedTx.signed_data,
        p2p_metadata: {
          transport,
          sender_device_id: receivedTx.transport.sender_device_id,
          receiver_device_id: receivedTx.transport.receiver_device_id,
          hop_count: receivedTx.transport.hop_count,
          discovered_at: receivedTx.transport.discovered_at,
          received_at: new Date().toISOString(),
          rssi: receivedTx.transport.rssi,
          channel_id: receivedTx.transport.channel_id,
        },
        is_offline: true,
        sync_attempts: 0,
        offline_metadata: {
          local_signed_at: new Date().toISOString(),
          original_created_at: receivedTx.created_at,
          device_id: receivedTx.transport.sender_device_id,
          network_status: "offline",
        },
        retry_count: 0,
        sync_priority: 1,
        offline_version: 1,
      };

      // Queue for processing
      await transactionQueue.enqueue(offlineTx);

      // Process immediately if online
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        await transactionService.processReceivedOfflineTransaction(
          JSON.stringify(receivedTx)
        );
      }
    } catch (error) {
      console.error("Error handling received transaction:", error);
      throw error;
    }
  }

  private async queueTransaction(tx: P2PTransactionPackage) {
    try {
      const offlineTx: OfflineTransaction = {
        id: `p2p_${Date.now()}`,
        user_id: "", // Will be set from auth
        type: "transfer",
        status: "signed_offline",
        from_address: tx.metadata.from_address,
        to_address: tx.metadata.to_address,
        amount: tx.metadata.amount,
        symbol: tx.metadata.symbol,
        token_mint: tx.metadata.token_mint,
        fee: 0, // TODO: Calculate proper fee
        nonce: tx.envelope.nonce,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        envelope: JSON.stringify(tx.envelope),
        signed_data: tx.signed_data,
        p2p_metadata: {
          transport: tx.transport.transport,
          sender_device_id: tx.transport.sender_device_id,
          receiver_device_id: tx.transport.receiver_device_id,
          hop_count: tx.transport.hop_count,
          discovered_at: tx.transport.discovered_at,
          received_at: new Date().toISOString(),
          rssi: tx.transport.rssi,
          channel_id: tx.transport.channel_id,
        },
        is_offline: true,
        sync_attempts: 0,
        offline_version: 1,
        retry_count: 0,
        sync_priority: 1,
        next_retry_at: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutes
        offline_metadata: {
          local_signed_at: new Date().toISOString(),
          original_created_at: tx.created_at,
          device_id: tx.transport.sender_device_id,
          network_status: "offline",
        },
      };

      await transactionQueue.enqueue(offlineTx);
    } catch (error) {
      console.error("Error queueing transaction:", error);
      throw error;
    }
  }

  private async fallbackToRegularTransaction(tx: P2PTransactionPackage) {
    try {
      if (tx.metadata.symbol === "SOL") {
        await transactionService.sendSOL(
          tx.metadata.to_address,
          tx.metadata.amount,
          tx.metadata.memo
        );
      } else if (tx.metadata.token_mint) {
        // Handle token transfers (implementation depends on your token service)
        throw new Error("Token transfers not implemented for fallback");
      }
    } catch (error) {
      console.error("Fallback transaction failed:", error);
      throw error;
    }
  }

  private verifyTransaction(tx: P2PTransactionPackage): boolean {
    // Basic verification
    if (!tx.metadata || !tx.envelope || !tx.signed_data) {
      return false;
    }

    // Verify amounts and addresses
    if (
      !tx.metadata.amount ||
      !tx.metadata.to_address ||
      !tx.metadata.from_address
    ) {
      return false;
    }

    // Verify signature if available
    if (tx.signature) {
      // TODO: Implement signature verification
    }

    // Verify nonce/timestamp
    const now = Date.now();
    const txTime = new Date(tx.created_at).getTime();
    if (now - txTime > 10 * 60 * 1000) {
      // Expired after 10 minutes
      return false;
    }

    return true;
  }
}

export const p2pTransactionService = P2PTransactionService.getInstance();
