import { useAuth } from "@/contexts/AuthContext";
import {
  TransactionError,
  TransactionErrorCode,
} from "@/lib/errors/transaction-errors";
import {
  QueuedTransaction,
  transactionQueue,
} from "@/lib/wallet/transaction-queue";
import { transactionService } from "@/lib/wallet/transaction-service";
import { walletService } from "@/lib/wallet/wallet-service";
import { Transaction } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseTransactionsOptions {
  autoRetry?: boolean;
  syncInterval?: number;
  showNotifications?: boolean;
}

export interface UseTransactionsState {
  isLoading: boolean;
  isSyncing: boolean;
  error: Error | null;
  transactions: Transaction[];
  pendingTransactions: QueuedTransaction[];
  failedTransactions: QueuedTransaction[];
  unconfirmedCount: number;
}

export interface UseTransactionsActions {
  sendSOL: (params: {
    toAddress: string;
    amount: number;
    memo?: string;
    isOffline?: boolean;
  }) => Promise<Transaction>;
  retryTransaction: (id: string) => Promise<void>;
  syncTransactions: () => Promise<void>;
  clearError: () => void;
}

export type UseTransactionsResult = UseTransactionsState &
  UseTransactionsActions;

const DEFAULT_OPTIONS: UseTransactionsOptions = {
  autoRetry: true,
  syncInterval: 30000, // 30 seconds
  showNotifications: true,
};

export function useTransactions(
  options: UseTransactionsOptions = {}
): UseTransactionsResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { user } = useAuth();

  // State
  const [state, setState] = useState<UseTransactionsState>({
    isLoading: false,
    isSyncing: false,
    error: null,
    transactions: [],
    pendingTransactions: [],
    failedTransactions: [],
    unconfirmedCount: 0,
  });

  // Refs
  // Using number for setTimeout/setInterval return type
  const syncTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  // Load initial transactions
  useEffect(() => {
    if (user && walletService.isUnlocked()) {
      loadTransactions();
    }
  }, [user]);

  // Load transaction data
  const loadTransactions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const transactions = await walletService.getTransactionHistory(50);
      setState((prev) => ({
        ...prev,
        transactions,
        isLoading: false,
        pendingTransactions: transactionQueue.getPending(),
        failedTransactions: transactionQueue.getFailed(),
        unconfirmedCount: transactions.filter(
          (tx: Transaction) => !tx.confirmed_at
        ).length,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to load transactions"),
        isLoading: false,
      }));
    }
  }, []);

  // Process pending transactions
  const processTransaction = useCallback(
    async (queuedTx: QueuedTransaction) => {
      try {
        transactionQueue.markAsProcessing(queuedTx.id);

        if ("envelope" in queuedTx.transaction) {
          // This is an offline transaction
          await transactionService.broadcastOfflineTransaction(queuedTx.id);
        }

        transactionQueue.markAsCompleted(queuedTx.id);
        await loadTransactions();
      } catch (error) {
        transactionQueue.markAsFailed(
          queuedTx.id,
          error instanceof Error
            ? error
            : new Error("Transaction processing failed")
        );
        throw error;
      }
    },
    [loadTransactions]
  );

  // Sync transactions
  const syncTransactions = useCallback(async () => {
    if (state.isSyncing) return;

    try {
      setState((prev) => ({ ...prev, isSyncing: true }));

      // Process pending transactions in queue
      const nextTx = transactionQueue.getNext();
      if (nextTx) {
        await processTransaction(nextTx);
      }

      // Update transaction list
      await loadTransactions();
    } catch (error) {
      console.error("Transaction sync failed:", error);
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.isSyncing, processTransaction, loadTransactions]);

  // Retry transaction
  const retryTransactions = useCallback(async () => {
    const failedTxs = transactionQueue.getFailed();
    for (const tx of failedTxs) {
      try {
        await transactionService.broadcastOfflineTransaction(tx.id);
        await loadTransactions();
      } catch (error) {
        console.error(
          "Auto-retry failed for transaction " + tx.id + ":",
          error
        );
      }
    }
  }, [loadTransactions]);

  // Interval management
  const startSyncInterval = useCallback(() => {
    if (syncTimeoutRef.current) return;
    syncTimeoutRef.current = setInterval(
      syncTransactions,
      mergedOptions.syncInterval
    ) as unknown as number;
  }, [mergedOptions.syncInterval, syncTransactions]);

  const stopSyncInterval = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearInterval(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, [syncTimeoutRef]);

  const startAutoRetry = useCallback(() => {
    if (retryTimeoutRef.current) return;
    retryTimeoutRef.current = setInterval(
      () => retryTransactions(),
      60000
    ) as unknown as number;
  }, [retryTransactions, retryTimeoutRef]);

  const stopAutoRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearInterval(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [retryTimeoutRef]);

  // Effects
  useEffect(() => {
    if (mergedOptions.syncInterval && user && walletService.isUnlocked()) {
      startSyncInterval();
      return () => stopSyncInterval();
    }
  }, [mergedOptions.syncInterval, user, startSyncInterval, stopSyncInterval]);

  useEffect(() => {
    if (mergedOptions.autoRetry && state.failedTransactions.length > 0) {
      startAutoRetry();
      return () => stopAutoRetry();
    }
  }, [
    mergedOptions.autoRetry,
    state.failedTransactions,
    startAutoRetry,
    stopAutoRetry,
  ]);

  // Actions
  const sendSOL = useCallback(
    async ({
      toAddress,
      amount,
      memo,
      isOffline = false,
    }: {
      toAddress: string;
      amount: number;
      memo?: string;
      isOffline?: boolean;
    }): Promise<Transaction> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const tx = isOffline
          ? await transactionService.createOfflineTransaction(
              toAddress,
              amount,
              memo
            )
          : await transactionService.sendSOL(toAddress, amount, memo);

        await loadTransactions();
        return tx;
      } catch (err) {
        const error = err as Error;
        const txError =
          error instanceof TransactionError
            ? error
            : new TransactionError(
                TransactionErrorCode.TRANSACTION_FAILED,
                error.message || "Transaction failed",
                error
              );

        setState((prev) => ({ ...prev, error: txError }));
        throw txError;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  const retryTransaction = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await transactionService.broadcastOfflineTransaction(id);
      await loadTransactions();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Retry failed"),
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    sendSOL,
    retryTransaction,
    syncTransactions,
    clearError,
  };
}
