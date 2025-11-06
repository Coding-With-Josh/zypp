import { OfflineTransaction, Transaction } from "@/types";
import {
  TransactionError,
  TransactionErrorCode,
} from "../errors/transaction-errors";

export interface QueuedTransaction {
  id: string;
  transaction: Transaction;
  status: "pending" | "processing" | "failed" | "completed";
  attempts: number;
  maxAttempts: number;
  lastError?: Error;
  lastAttempt?: Date;
  nextAttempt?: Date;
}

class TransactionQueue {
  private queue: Map<string, QueuedTransaction> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 30000; // 30 seconds

  public enqueue(transaction: Transaction): QueuedTransaction {
    const queuedTx: QueuedTransaction = {
      id: transaction.id,
      transaction,
      status: "pending",
      attempts: 0,
      maxAttempts: this.MAX_RETRIES,
    };

    this.queue.set(transaction.id, queuedTx);
    return queuedTx;
  }

  public markAsProcessing(id: string): QueuedTransaction {
    const tx = this.queue.get(id);
    if (!tx) {
      throw new TransactionError(
        TransactionErrorCode.TRANSACTION_FAILED,
        `Transaction ${id} not found in queue`
      );
    }

    tx.status = "processing";
    tx.attempts += 1;
    tx.lastAttempt = new Date();
    this.queue.set(id, tx);

    return tx;
  }

  public markAsFailed(id: string, error: Error): QueuedTransaction {
    const tx = this.queue.get(id);
    if (!tx) {
      throw new TransactionError(
        TransactionErrorCode.TRANSACTION_FAILED,
        `Transaction ${id} not found in queue`
      );
    }

    tx.status = tx.attempts >= tx.maxAttempts ? "failed" : "pending";
    tx.lastError = error;

    if (tx.status === "pending") {
      // Calculate next attempt with exponential backoff
      const delay = Math.min(
        this.BASE_DELAY * Math.pow(2, tx.attempts),
        this.MAX_DELAY
      );
      tx.nextAttempt = new Date(Date.now() + delay);
    }

    this.queue.set(id, tx);
    return tx;
  }

  public markAsCompleted(id: string): void {
    const tx = this.queue.get(id);
    if (!tx) {
      throw new TransactionError(
        TransactionErrorCode.TRANSACTION_FAILED,
        `Transaction ${id} not found in queue`
      );
    }

    tx.status = "completed";
    this.queue.set(id, tx);
  }

  public remove(id: string): void {
    this.queue.delete(id);
  }

  public getNext(): QueuedTransaction | undefined {
    const now = new Date();

    for (const tx of this.queue.values()) {
      if (
        tx.status === "pending" &&
        (!tx.nextAttempt || tx.nextAttempt <= now)
      ) {
        return tx;
      }
    }

    return undefined;
  }

  public get(id: string): QueuedTransaction | undefined {
    return this.queue.get(id);
  }

  public getAll(): QueuedTransaction[] {
    return Array.from(this.queue.values());
  }

  public getPending(): QueuedTransaction[] {
    return this.getAll().filter((tx) => tx.status === "pending");
  }

  public getFailed(): QueuedTransaction[] {
    return this.getAll().filter((tx) => tx.status === "failed");
  }

  public clear(): void {
    this.queue.clear();
  }

  public incrementSyncAttempts(id: string): void {
    const tx = this.queue.get(id);
    if (!tx) {
      throw new TransactionError(
        TransactionErrorCode.TRANSACTION_FAILED,
        `Transaction ${id} not found in queue`
      );
    }

    if ("sync_attempts" in tx.transaction) {
      (tx.transaction as OfflineTransaction).sync_attempts += 1;
      this.queue.set(id, tx);
    }
  }
}

export const transactionQueue = new TransactionQueue();
