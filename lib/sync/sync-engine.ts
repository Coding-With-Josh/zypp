import {
  AppSettings,
  Contact,
  OfflineTransaction,
  OnlineTransaction,
  P2PTransport,
  PeerDevice,
  Platform,
  SyncResult,
  SyncState,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types";
import { secureStorageManager } from "../storage/secure-store";
import { supabase } from "../supabase/client";
import { logDebug, logError, logInfo } from "../utils/error";
import { transactionQueue } from "../wallet/transaction-queue";

import { Database } from "../supabase/database.types";

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

type Tables = Database["public"]["Tables"];

interface SyncResultInternal {
  success: boolean;
  pulled: {
    transactions: number;
    contacts: number;
    peers: number;
    nonceAccounts: number;
  };
  pushed: {
    transactions: number;
    contacts: number;
    peers: number;
    nonceAccounts: number;
  };
  conflicts: number;
  errors: string[];
}

class SyncEngine {
  private isSyncing = false;
  private syncQueue: (() => Promise<void>)[] = [];
  private lastSuccessfulSync: string | null = null;
  private syncListeners: ((state: SyncState) => void)[] = [];

  // Retry mechanism for network operations
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    retries = MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === retries) throw error;
        console.warn(`${context} retry ${attempt}/${retries}:`, error.message);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
      }
    }
    throw new Error(`${context} failed after ${retries} attempts`);
  }

  // Main sync method
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return new Promise((resolve) => {
        this.syncQueue.push(async () => {
          const result = await this.performSync();
          resolve(result);
        });
      });
    }

    return this.performSync();
  }

  private async performSync(): Promise<SyncResult> {
    this.isSyncing = true;
    logInfo("Starting sync process", "sync");

    const result: SyncResultInternal = {
      success: false,
      pulled: { transactions: 0, contacts: 0, peers: 0, nonceAccounts: 0 },
      pushed: { transactions: 0, contacts: 0, peers: 0, nonceAccounts: 0 },
      conflicts: 0,
      errors: [],
    };

    logDebug("Initialized sync result", "sync", result);

    try {
      this.notifySyncState({
        last_sync: new Date().toISOString(),
        pending_transactions: 0,
        pending_messages: 0,
        is_syncing: true,
        error_count: 0,
      });

      const session = await secureStorageManager.getSession();
      if (!session?.user_id) {
        logError(
          "Sync failed - No user session",
          new Error("No user session found")
        );
        throw new Error("No user session found");
      }
      logInfo("User session found", "sync", { userId: session.user_id });

      const lastSync = await secureStorageManager.getLastSync();
      logInfo("Last sync timestamp", "sync", { lastSync });

      logDebug("Starting transaction sync", "sync");
      await this.syncTransactions(session.user_id, lastSync, result);
      logInfo("Transactions synced", "sync", {
        pulled: result.pulled.transactions,
        pushed: result.pushed.transactions,
        conflicts: result.conflicts,
      });

      logDebug("Starting contact sync", "sync");
      await this.syncContacts(session.user_id, lastSync, result);
      logInfo("Contacts synced", "sync", {
        pulled: result.pulled.contacts,
        pushed: result.pushed.contacts,
      });

      logDebug("Starting peer devices sync", "sync");
      await this.syncPeerDevices(session.user_id, lastSync, result);
      logInfo("Peer devices synced", "sync", {
        pulled: result.pulled.peers,
        pushed: result.pushed.peers,
      });

      logDebug("Starting settings sync", "sync");
      await this.syncSettings(session.user_id, result);
      logInfo("Settings synced", "sync");

      logDebug("Processing offline queue", "sync");
      await this.processOfflineQueue(session.user_id, result);
      logInfo("Offline queue processed", "sync");

      this.lastSuccessfulSync = new Date().toISOString();
      await secureStorageManager.setLastSync(this.lastSuccessfulSync);

      result.success = true;
    } catch (error: any) {
      logError("Sync failed", error, "critical");
      result.errors.push(error.message);
      result.success = false;
    } finally {
      this.isSyncing = false;
      this.processNextInQueue();

      this.notifySyncState({
        last_sync: this.lastSuccessfulSync || new Date().toISOString(),
        pending_transactions: transactionQueue.getAll().length,
        pending_messages: 0,
        is_syncing: false,
        error_count: result.errors.length,
      });
    }

    return result;
  }

  private async syncTransactions(
    userId: string,
    lastSync: string | null,
    result: SyncResultInternal
  ): Promise<void> {
    try {
      const localTransactions =
        await secureStorageManager.getRecentTransactions();

      // Get remote transactions in batches
      const remoteTransactions: Transaction[] = [];
      let hasMore = true;
      let page = 0;

      while (hasMore) {
        const { data: rows, error } = await this.withRetry(async () => {
          let query = supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

          if (lastSync) {
            query = query.gte("updated_at", lastSync);
          }

          return query;
        }, "Fetch transactions");

        if (error) throw error;
        if (!rows || rows.length < BATCH_SIZE) hasMore = false;
        if (rows) {
          const mappedTransactions = rows.map((tx) => {
            const txData =
              tx as unknown as Database["public"]["Tables"]["transactions"]["Row"];
            const base = {
              id: txData.id,
              user_id: txData.user_id,
              type: txData.type as TransactionType,
              status: txData.status as TransactionStatus,
              from_address: txData.from_address,
              to_address: txData.to_address,
              amount: txData.amount,
              token_mint: txData.token_mint,
              symbol: txData.symbol,
              usd_value: txData.usd_value,
              fee: txData.fee,
              signature: txData.signature,
              blockhash: txData.blockhash,
              created_at: txData.created_at,
              updated_at: txData.updated_at,
              nonce: txData.nonce,
            };

            if (txData.is_offline) {
              // Map to OfflineTransaction
              return {
                ...base,
                is_offline: true as const,
                envelope: txData.envelope || "",
                signed_data: txData.signed_data || "",
                p2p_metadata: {
                  transport: "wifi_direct" as P2PTransport,
                  sender_device_id: txData.device_id || "",
                  receiver_device_id: undefined,
                  hop_count: 0,
                  discovered_at: txData.created_at,
                  received_at: txData.created_at,
                },
                sync_attempts: txData.sync_attempts || 0,
                last_sync_attempt: txData.last_sync_attempt,
              } as OfflineTransaction;
            } else {
              // Map to OnlineTransaction
              return {
                ...base,
                is_offline: false as const,
                slot: txData.slot,
                confirmation_status: txData.confirmation_status || "processed",
              } as OnlineTransaction;
            }
          });
          remoteTransactions.push(...mappedTransactions);
        }
        page++;
      }

      if (error) throw error;

      const mergedTransactions = this.mergeTransactions(
        localTransactions,
        remoteTransactions || [],
        result
      );

      await secureStorageManager.setRecentTransactions(mergedTransactions);

      await this.pushNewTransactions(
        userId,
        localTransactions,
        remoteTransactions || [],
        result
      );
    } catch (error: any) {
      logError("Transaction sync failed", error);
      result.errors.push(`Transactions: ${error.message}`);
    }
  }

  private async syncContacts(
    userId: string,
    lastSync: string | null,
    result: SyncResultInternal
  ): Promise<void> {
    try {
      const localContacts = await secureStorageManager.getContacts();

      // Get remote contacts in batches
      const remoteContacts: Contact[] = [];
      let hasMore = true;
      let page = 0;

      while (hasMore) {
        const { data: rows, error } = await this.withRetry(async () => {
          let query = supabase
            .from("contacts")
            .select("*")
            .eq("user_id", userId)
            .order("last_interaction", { ascending: false })
            .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

          if (lastSync) {
            query = query.gte("updated_at", lastSync);
          }

          return query;
        }, "Fetch contacts");

        if (error) throw error;
        if (!rows || rows.length < BATCH_SIZE) hasMore = false;
        if (rows) {
          const mappedContacts = rows.map((contact) => ({
            id: contact.id,
            user_id: contact.user_id,
            contact_user_id: contact.contact_user_id,
            contact_username: contact.contact_username,
            contact_public_key: contact.contact_public_key,
            nickname: contact.nickname,
            tags: contact.tags || [],
            is_favorite: contact.is_favorite,
            last_interaction: contact.last_interaction,
            transaction_count: contact.transaction_count,
            created_at: contact.created_at,
          }));
          remoteContacts.push(...mappedContacts);
        }
        page++;
      }

      const mergedContacts = this.mergeContacts(
        localContacts,
        remoteContacts,
        result
      );

      await secureStorageManager.setContacts(mergedContacts);

      // Push new contacts in batches
      await this.pushNewContacts(userId, localContacts, remoteContacts, result);
    } catch (error: any) {
      logError("Contact sync failed", error);
      result.errors.push(`Contacts: ${error.message}`);
    }
  }

  private async syncPeerDevices(
    userId: string,
    lastSync: string | null,
    result: SyncResultInternal
  ): Promise<void> {
    try {
      const localPeers = await secureStorageManager.getRecentPeers();

      const { data: remotePeerRows, error } = await this.withRetry(
        async () =>
          supabase
            .from("peer_devices")
            .select("*")
            .eq("user_id", userId)
            .order("last_seen", { ascending: false }),
        "Fetch peers"
      );

      if (error) throw error;

      const remotePeers: PeerDevice[] = (remotePeerRows || []).map((peer) => ({
        id: peer.id,
        user_id: peer.user_id,
        device_id: peer.device_id,
        device_name: peer.device_name,
        platform: peer.platform as Platform,
        app_version: peer.app_version,
        last_seen: peer.last_seen,
        is_online: peer.is_online,
        transport_capabilities: peer.transport_capabilities as P2PTransport[],
        public_key: peer.public_key,
        connection_strength: peer.connection_strength,
      }));

      const mergedPeers = this.mergePeers(localPeers, remotePeers, result);
      await secureStorageManager.setRecentPeers(mergedPeers);

      await this.pushNewPeers(userId, localPeers, remotePeers, result);
    } catch (error: any) {
      console.error("Peer sync failed:", error);
      result.errors.push(`Peers: ${error.message}`);
    }
  }

  private async syncSettings(
    userId: string,
    result: SyncResultInternal
  ): Promise<void> {
    try {
      const localSettings = await secureStorageManager.getAppSettings();

      const { data: remoteSettings, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && (error.code as any) !== "PGRST116") {
        throw error;
      }

      // Handle settings sync logic
      const remoteSettingsTyped =
        remoteSettings as unknown as AppSettings | null;
      const localSettingsTyped = localSettings as AppSettings | null;

      if (remoteSettingsTyped) {
        if (
          !localSettingsTyped ||
          new Date(remoteSettingsTyped.updated_at) >
            new Date(localSettingsTyped.updated_at)
        ) {
          await secureStorageManager.setAppSettings(remoteSettingsTyped);
        } else if (
          localSettingsTyped &&
          new Date(localSettingsTyped.updated_at) >
            new Date(remoteSettingsTyped.updated_at)
        ) {
          await this.pushSettings(userId, localSettingsTyped);
        }
      } else if (localSettingsTyped) {
        await this.pushSettings(userId, localSettingsTyped);
      }
    } catch (error: any) {
      console.error("Settings sync failed:", error);
      result.errors.push(`Settings: ${error.message}`);
    }
  }

  private async processOfflineQueue(
    userId: string,
    result: SyncResultInternal
  ): Promise<void> {
    const offlineQueue = await secureStorageManager.getOfflineQueue();
    const successfulItems: any[] = [];

    for (const item of offlineQueue) {
      try {
        switch (item.type) {
          case "transaction":
            await this.processOfflineTransaction(userId, item.data);
            break;
          case "contact_request":
            // Implementation for contact request processing
            break;
          case "peer_discovery":
            // Implementation for peer discovery processing
            break;
        }

        successfulItems.push(item);
      } catch (error: any) {
        console.error("Offline queue processing failed:", error);
        result.errors.push(`Offline queue: ${error.message}`);
      }
    }

    // Remove successful items from queue
    if (successfulItems.length > 0) {
      const newQueue = offlineQueue.filter(
        (item: any) => !successfulItems.includes(item)
      );
      await secureStorageManager.setOfflineQueue(newQueue);
    }
  }

  // Merge strategies
  private mergeTransactions(
    local: Transaction[],
    remote: Transaction[],
    result: SyncResultInternal
  ): Transaction[] {
    const merged = [...local];
    const localMap = new Map(local.map((t) => [t.id, t]));

    for (const remoteTx of remote) {
      const localTx = localMap.get(remoteTx.id);

      if (!localTx) {
        merged.push(remoteTx);
        result.pulled.transactions++;
      } else {
        if (new Date(remoteTx.updated_at) > new Date(localTx.updated_at)) {
          const index = merged.findIndex((t) => t.id === remoteTx.id);
          if (index !== -1) {
            merged[index] = remoteTx;
            result.conflicts++;
          }
        }
      }
    }

    return merged.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private mergeContacts(
    local: Contact[],
    remote: Contact[],
    result: SyncResultInternal
  ): Contact[] {
    const merged = [...local];
    const localMap = new Map(local.map((c) => [c.id, c]));

    for (const remoteContact of remote) {
      const localContact = localMap.get(remoteContact.id);

      if (!localContact) {
        merged.push(remoteContact);
        result.pulled.contacts++;
      } else {
        if (
          new Date(remoteContact.last_interaction) >
          new Date(localContact.last_interaction)
        ) {
          const index = merged.findIndex((c) => c.id === remoteContact.id);
          if (index !== -1) {
            merged[index] = remoteContact;
            result.conflicts++;
          }
        }
      }
    }

    return merged;
  }

  private mergePeers(
    local: PeerDevice[],
    remote: PeerDevice[],
    result: SyncResultInternal
  ): PeerDevice[] {
    const merged = [...local];
    const localMap = new Map(local.map((p) => [p.id, p]));

    for (const remotePeer of remote) {
      const localPeer = localMap.get(remotePeer.id);

      if (!localPeer) {
        merged.push(remotePeer);
        result.pulled.peers++;
      } else {
        if (new Date(remotePeer.last_seen) > new Date(localPeer.last_seen)) {
          const index = merged.findIndex((p) => p.id === remotePeer.id);
          if (index !== -1) {
            merged[index] = remotePeer;
            result.conflicts++;
          }
        }
      }
    }

    return merged;
  }

  // Push methods with proper typing
  private async pushNewTransactions(
    userId: string,
    local: Transaction[],
    remote: Transaction[],
    result: SyncResultInternal
  ): Promise<void> {
    logDebug("Starting transaction push", "sync", {
      localCount: local.length,
      remoteCount: remote.length,
    });

    const remoteIds = new Set(remote.map((t) => t.id));
    const newTransactions = local.filter((t) => !remoteIds.has(t.id));

    logInfo("Found new transactions to push", "sync", {
      newTransactionsCount: newTransactions.length,
      transactionIds: newTransactions.map((t) => t.id),
    });

    // Push in batches
    for (let i = 0; i < newTransactions.length; i += BATCH_SIZE) {
      const batch = newTransactions.slice(i, i + BATCH_SIZE);
      try {
        logDebug("Pushing transaction batch", "sync", {
          batchNumber: i / BATCH_SIZE + 1,
          batchSize: batch.length,
          transactionIds: batch.map((t) => t.id),
        });

        const { error } = await this.withRetry(
          async () =>
            supabase.from("transactions").upsert(
              batch.map((tx) => {
                const base = {
                  id: tx.id,
                  user_id: userId,
                  type: tx.type,
                  status: tx.status,
                  from_address: tx.from_address,
                  to_address: tx.to_address,
                  amount: tx.amount,
                  token_mint: tx.token_mint,
                  symbol: tx.symbol,
                  usd_value: tx.usd_value,
                  fee: tx.fee,
                  signature: tx.signature,
                  blockhash: tx.blockhash,
                  updated_at: new Date().toISOString(),
                  nonce: tx.nonce,
                };

                if (tx.is_offline) {
                  // Add offline-specific fields
                  return {
                    ...base,
                    is_offline: true,
                    envelope: (tx as OfflineTransaction).envelope,
                    signed_data: (tx as OfflineTransaction).signed_data,
                    device_id: (tx as OfflineTransaction).p2p_metadata
                      ?.sender_device_id,
                    sync_attempts: (tx as OfflineTransaction).sync_attempts,
                    last_sync_attempt: (tx as OfflineTransaction)
                      .last_sync_attempt,
                  };
                } else {
                  // Add online-specific fields
                  return {
                    ...base,
                    is_offline: false,
                    slot: (tx as OnlineTransaction).slot,
                    confirmation_status: (tx as OnlineTransaction)
                      .confirmation_status,
                  };
                }
              })
            ),
          `Push transactions batch ${i / BATCH_SIZE + 1}`
        );

        if (!error) {
          result.pushed.transactions += batch.length;
        } else {
          throw error;
        }
      } catch (error: any) {
        logError("Failed to push transactions batch", error);
        result.errors.push(
          `Push transactions batch ${i / BATCH_SIZE + 1}: ${error.message}`
        );
      }
    }
  }

  private async pushNewContacts(
    userId: string,
    local: Contact[],
    remote: Contact[],
    result: SyncResultInternal
  ): Promise<void> {
    const remoteIds = new Set(remote.map((c) => c.id));
    const newContacts = local.filter((c) => !remoteIds.has(c.id));

    // Push in batches
    for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
      const batch = newContacts.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await this.withRetry(
          async () =>
            supabase.from("contacts").upsert(
              batch.map((contact) => ({
                ...contact,
                user_id: userId,
                updated_at: new Date().toISOString(),
              }))
            ),
          `Push contacts batch ${i / BATCH_SIZE + 1}`
        );

        if (!error) {
          result.pushed.contacts += batch.length;
        } else {
          throw error;
        }
      } catch (error: any) {
        logError("Failed to push contacts batch", error);
        result.errors.push(
          `Push contacts batch ${i / BATCH_SIZE + 1}: ${error.message}`
        );
      }
    }
  }

  private async pushNewPeers(
    userId: string,
    local: PeerDevice[],
    remote: PeerDevice[],
    result: SyncResultInternal
  ): Promise<void> {
    const remoteIds = new Set(remote.map((p) => p.id));
    const newPeers = local.filter((p) => !remoteIds.has(p.id));

    // Push in batches
    for (let i = 0; i < newPeers.length; i += BATCH_SIZE) {
      const batch = newPeers.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await this.withRetry(
          async () =>
            supabase.from("peer_devices").upsert(
              batch.map((peer) => ({
                id: peer.id,
                user_id: userId,
                device_id: peer.device_id,
                device_name: peer.device_name,
                platform: peer.platform,
                app_version: peer.app_version,
                last_seen: new Date().toISOString(),
                is_online: peer.is_online,
                transport_capabilities: peer.transport_capabilities,
                public_key: peer.public_key,
                connection_strength: peer.connection_strength,
              }))
            ),
          `Push peers batch ${i / BATCH_SIZE + 1}`
        );

        if (!error) {
          result.pushed.peers += batch.length;
        } else {
          throw error;
        }
      } catch (error: any) {
        logError("Failed to push peers batch", error);
        result.errors.push(
          `Push peers batch ${i / BATCH_SIZE + 1}: ${error.message}`
        );
      }
    }
  }

  private async pushSettings(
    userId: string,
    settings: AppSettings
  ): Promise<void> {
    await (supabase.from("app_settings").upsert({
      ...settings,
      user_id: userId,
      updated_at: new Date().toISOString(),
    } as any) as any);
  }

  // Offline queue processing
  private async processOfflineTransaction(
    userId: string,
    transaction: OfflineTransaction
  ): Promise<void> {
    const { error } = await (supabase.from("transactions").upsert({
      ...transaction,
      user_id: userId,
      updated_at: new Date().toISOString(),
    } as any) as any);

    if (error) throw error;

    // Remove from queue
    transactionQueue.remove(transaction.id);
  }

  // Queue management
  private processNextInQueue(): void {
    if (this.syncQueue.length > 0) {
      const nextSync = this.syncQueue.shift();
      if (nextSync) {
        nextSync();
      }
    }
  }

  // Listeners
  addSyncListener(listener: (state: SyncState) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notifySyncState(state: SyncState): void {
    this.syncListeners.forEach((listener) => listener(state));
  }

  // Utility methods
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  getLastSuccessfulSync(): string | null {
    return this.lastSuccessfulSync;
  }

  async forceSync(): Promise<SyncResult> {
    // Clear last sync so the next sync pulls everything
    await secureStorageManager.setLastSync("");
    return this.sync();
  }
}

export const syncEngine = new SyncEngine();
