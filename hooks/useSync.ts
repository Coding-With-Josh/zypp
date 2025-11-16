import { secureStorageManager } from "@/lib/storage/secure-store";
import { networkManager } from "@/lib/supabase/client";
import { syncEngine } from "@/lib/sync/sync-engine";
import { transactionQueue } from "@/lib/wallet/transaction-queue";
import { SyncResult, SyncState } from "@/types";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const SYNC_TASK_NAME = "background-sync";
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const useSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    last_sync: "", // We'll update this in useEffect
    pending_transactions: transactionQueue.getAll().length,
    pending_messages: 0,
    is_syncing: false,
    error_count: 0,
  });

  // Initialize last sync time
  useEffect(() => {
    const initLastSync = async () => {
      const lastSync = await secureStorageManager.getLastSync();
      setSyncState((prev) => ({
        ...prev,
        last_sync: lastSync ?? "",
      }));
    };
    initLastSync();
  }, []);

  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Background sync task
  useEffect(() => {
    const setupBackgroundSync = async () => {
      try {
        TaskManager.defineTask(SYNC_TASK_NAME, async () => {
          const result = await syncEngine.sync();
          console.log("Background sync completed:", result);
          return result.success
            ? BackgroundFetch.BackgroundFetchResult.NewData
            : BackgroundFetch.BackgroundFetchResult.Failed;
        });

        await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
          minimumInterval: SYNC_INTERVAL / 1000,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (error) {
        console.log("Background sync setup failed:", error);
      }
    };

    setupBackgroundSync();

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME).catch(() => {});
    };
  }, []);

  // Sync state listener
  useEffect(() => {
    const unsubscribe = syncEngine.addSyncListener((state) => {
      setSyncState(state);
    });

    return unsubscribe;
  }, []);

  // Network state listener
  useEffect(() => {
    const unsubscribe = networkManager.addListener((isOnline) => {
      if (isOnline && !syncState.is_syncing) {
        performSync();
      }
    });

    return unsubscribe;
  }, [syncState.is_syncing]);

  // App state listener for foreground sync
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && networkManager.getIsOnline()) {
        performSync();
      }
    });

    return () => subscription.remove();
  }, []);

  // Perform sync function with useCallback to avoid dependency issues
  const performSync = useCallback(async (): Promise<SyncResult> => {
    const result = await syncEngine.sync();
    setLastSyncResult(result);

    setSyncState((prev) => ({
      ...prev,
      last_sync: result.success ? new Date().toISOString() : prev.last_sync,
      error_count: result.errors.length,
      pending_transactions: transactionQueue.getAll().length,
    }));

    return result;
  }, []);

  // Periodic sync
  useEffect(() => {
    if (networkManager.getIsOnline()) {
      syncIntervalRef.current = setInterval(() => {
        if (!syncState.is_syncing) {
          performSync();
        }
      }, SYNC_INTERVAL);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncState.is_syncing, performSync]);

  const forceSync = useCallback(async (): Promise<SyncResult> => {
    const result = await syncEngine.forceSync();
    setLastSyncResult(result);

    setSyncState((prev) => ({
      ...prev,
      last_sync: result.success ? new Date().toISOString() : prev.last_sync,
      error_count: result.errors.length,
      pending_transactions: transactionQueue.getAll().length,
    }));

    return result;
  }, []);

  const addToOfflineQueue = useCallback(async (item: any) => {
    const queue = await secureStorageManager.getOfflineQueue();
    queue.push({
      ...item,
      timestamp: new Date().toISOString(),
    });
    await secureStorageManager.setOfflineQueue(queue);

    setSyncState((prev) => ({
      ...prev,
      pending_transactions: transactionQueue.getAll().length,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setSyncState((prev) => ({
      ...prev,
      error_count: 0,
    }));
    setLastSyncResult(null);
  }, []);

  return {
    // State
    syncState,
    lastSyncResult,
    isOnline: networkManager.getIsOnline(),
    isSyncing: syncState.is_syncing,

    // Actions
    sync: performSync,
    forceSync,
    addToOfflineQueue,
    clearErrors,

    // Derived state
    hasPendingChanges: syncState.pending_transactions > 0,
    lastSyncTime: syncState.last_sync ? new Date(syncState.last_sync) : null,
    syncError: lastSyncResult?.errors.length ? lastSyncResult.errors[0] : null,
  };
};

export { SYNC_TASK_NAME };
