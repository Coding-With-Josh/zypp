// lib/storage/secure-store.ts
import {
  AppSettings,
  Contact,
  DiscoverySession,
  DurableNonceConfig,
  KeypairEncrypted,
  LocalStorageSchema,
  NonceAccountInfo,
  OfflineTransaction,
  PeerDevice,
  Transaction,
  UserProfile,
  UserSession,
} from "@/types";
import * as SecureStore from "expo-secure-store";

class SecureStorageManager {
  // Helper methods for JSON handling
  private async setJSON(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await SecureStore.setItemAsync(key, jsonValue);

      // Verify the write by reading it back
      const verified = await SecureStore.getItemAsync(key);
      if (verified !== jsonValue) {
        console.error(`❌ Storage verification failed for key: ${key}`);
        throw new Error(`Storage verification failed for ${key}`);
      }
    } catch (error) {
      console.error(`❌ Failed to store ${key}:`, error);
      throw error;
    }
  }

  private async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value);
      return parsed;
    } catch (error) {
      console.error(`❌ Failed to retrieve or parse ${key}:`, error);
      return null;
    }
  }

  // Auth storage
async setSession(session: UserSession | null): Promise<void> {
  if (session) {
    await this.setJSON("auth.session", session);
  }
  // Note: Passing null doesn't clear the session, use clearSession() for that
}

  async getSession(): Promise<UserSession | null> {
    try {
      const session = await this.getJSON<UserSession>("auth.session");
      return session;
    } catch (error) {
      console.error("❌ Failed to retrieve session:", error);
      return null;
    }
  }

  // Profile storage
  async setProfile(profile: UserProfile | null): Promise<void> {
    if (profile) {
      await this.setJSON("auth.profile", profile);
    } else {
      await SecureStore.deleteItemAsync("auth.profile");
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const profile = await this.getJSON<UserProfile>("auth.profile");
      return profile;
    } catch (error) {
      console.error("❌ Failed to retrieve user profile:", error);
      return null;
    }
  }

  // Backward compatibility for auth items
  async getAuthItem(key: string): Promise<string | null> {
    // Special handling for profile to maintain consistency
    if (key === "profile") {
      const profile = await this.getProfile();
      return profile ? JSON.stringify(profile) : null;
    }
    return await SecureStore.getItemAsync(`auth.${key}`);
  }

  async setAuthItem(key: string, value: string): Promise<void> {
    // Special handling for profile to maintain consistency
    if (key === "profile") {
      try {
        const profile = JSON.parse(value) as UserProfile;
        await this.setProfile(profile);
      } catch (parseError) {
        console.error(
          "❌ Failed to parse profile from setAuthItem:",
          parseError
        );
      }
      return;
    }
    await SecureStore.setItemAsync(`auth.${key}`, value);
  }

  async removeAuthItem(key: string): Promise<void> {
    // Special handling for profile to maintain consistency
    if (key === "profile") {
      await SecureStore.deleteItemAsync("auth.profile");
      return;
    }
    await SecureStore.deleteItemAsync(`auth.${key}`);
  }

  async setPinHash(pinHash: string): Promise<void> {
    await SecureStore.setItemAsync("auth.pinHash", pinHash);
  }

  async getPinHash(): Promise<string | null> {
    return await SecureStore.getItemAsync("auth.pinHash");
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync("auth.biometricEnabled", String(enabled));
  }

  async getBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync("auth.biometricEnabled");
    return value === "true";
  }

  // Wallet storage
  async setEncryptedKeypair(keypair: KeypairEncrypted): Promise<void> {
    await this.setJSON("wallet.encryptedKeypair", keypair);
  }

  async getEncryptedKeypair(): Promise<KeypairEncrypted | null> {
    return this.getJSON<KeypairEncrypted>("wallet.encryptedKeypair");
  }

  async setWalletBalances(balances: any): Promise<void> {
    await this.setJSON("wallet.balances", balances);
  }

  async getWalletBalances(): Promise<any> {
    return this.getJSON("wallet.balances");
  }

  async setRecentTransactions(transactions: Transaction[]): Promise<void> {
    await this.setJSON("wallet.recentTransactions", transactions);
  }

  async getRecentTransactions(): Promise<Transaction[]> {
    const transactions = await this.getJSON<Transaction[]>(
      "wallet.recentTransactions"
    );
    return transactions || [];
  }

  async setContacts(contacts: Contact[]): Promise<void> {
    await this.setJSON("wallet.contacts", contacts);
  }

  async getContacts(): Promise<Contact[]> {
    const contacts = await this.getJSON<Contact[]>("wallet.contacts");
    return contacts || [];
  }

  // P2P storage
  async setRecentPeers(peers: PeerDevice[]): Promise<void> {
    await this.setJSON("p2p.recentPeers", peers);
  }

  async getRecentPeers(): Promise<PeerDevice[]> {
    const peers = await this.getJSON<PeerDevice[]>("p2p.recentPeers");
    return peers || [];
  }

  async setPendingTransactions(
    transactions: OfflineTransaction[]
  ): Promise<void> {
    await this.setJSON("p2p.pendingTransactions", transactions);
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    const transactions = await this.getJSON<OfflineTransaction[]>(
      "p2p.pendingTransactions"
    );
    return transactions || [];
  }

  async setDiscoverySessions(sessions: DiscoverySession[]): Promise<void> {
    await this.setJSON("p2p.discoverySessions", sessions);
  }

  async getDiscoverySessions(): Promise<DiscoverySession[]> {
    const sessions = await this.getJSON<DiscoverySession[]>(
      "p2p.discoverySessions"
    );
    return sessions || [];
  }

  // App storage
  async setAppSettings(settings: AppSettings): Promise<void> {
    await this.setJSON("app.settings", settings);
  }

  async getAppSettings(): Promise<AppSettings | null> {
    return this.getJSON<AppSettings>("app.settings");
  }

  async setLastSync(timestamp: string): Promise<void> {
    await SecureStore.setItemAsync("app.lastSync", timestamp);
  }

  async getLastSync(): Promise<string | null> {
    return await SecureStore.getItemAsync("app.lastSync");
  }

  async setOfflineQueue(queue: any[]): Promise<void> {
    await this.setJSON("app.offlineQueue", queue);
  }

  async getOfflineQueue(): Promise<any[]> {
    const queue = await this.getJSON<any[]>("app.offlineQueue");
    return queue || [];
  }

  // Sync metadata
  async setSyncState(state: any): Promise<void> {
    await this.setJSON("sync.state", state);
  }

  async getSyncState(): Promise<any> {
    return this.getJSON("sync.state");
  }

  async setLastServerUpdate(timestamp: string): Promise<void> {
    await SecureStore.setItemAsync("sync.lastServerUpdate", timestamp);
  }

  async getLastServerUpdate(): Promise<string | null> {
    return await SecureStore.getItemAsync("sync.lastServerUpdate");
  }

  // Nonce accounts storage
  async setNonceAccounts(accounts: NonceAccountInfo[]): Promise<void> {
    await this.setJSON("wallet.nonceAccounts", accounts);
  }

  async getNonceAccounts(): Promise<NonceAccountInfo[]> {
    const accounts = await this.getJSON<NonceAccountInfo[]>(
      "wallet.nonceAccounts"
    );
    return accounts || [];
  }

  // Nonce reservations storage
  async setNonceReservations(
    reservations: DurableNonceConfig[]
  ): Promise<void> {
    await this.setJSON("wallet.nonceReservations", reservations);
  }

  async getNonceReservations(): Promise<DurableNonceConfig[]> {
    const reservations = await this.getJSON<DurableNonceConfig[]>(
      "wallet.nonceReservations"
    );
    return reservations || [];
  }

  // Utility methods
  async clearAll(): Promise<void> {
    const keys = [
      "auth.session",
      "auth.profile",
      "auth.pinHash",
      "auth.biometricEnabled",
      "wallet.encryptedKeypair",
      "wallet.balances",
      "wallet.recentTransactions",
      "wallet.contacts",
      "wallet.nonceAccounts",
      "wallet.nonceReservations",
      "p2p.recentPeers",
      "p2p.pendingTransactions",
      "p2p.discoverySessions",
      "app.settings",
      "app.lastSync",
      "app.offlineQueue",
      "sync.state",
      "sync.lastServerUpdate",
    ];

    console.log("🗑️ Clearing all storage data...");
    await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
    console.log("✅ All storage data cleared");
  }

  async clearSensitiveData(): Promise<void> {
    const sensitiveKeys = [
      "auth.session",
      "auth.profile",
      "auth.pinHash",
      "wallet.encryptedKeypair",
      "wallet.balances",
      "p2p.pendingTransactions",
    ];

    console.log("🗑️ Clearing sensitive data...");
    await Promise.all(
      sensitiveKeys.map((key) => SecureStore.deleteItemAsync(key))
    );
    console.log("✅ Sensitive data cleared");
  }

  // Migration helper
  async migrateFromMMKV(data: LocalStorageSchema): Promise<void> {
    // Auth
    if (data.auth.session) await this.setSession(data.auth.session);
    if (data.auth.pinHash) await this.setPinHash(data.auth.pinHash);
    await this.setBiometricEnabled(data.auth.biometricEnabled);

    // Wallet
    if (data.wallet.encryptedKeypair)
      await this.setEncryptedKeypair(data.wallet.encryptedKeypair);
    if (data.wallet.balances)
      await this.setWalletBalances(data.wallet.balances);
    if (data.wallet.recentTransactions)
      await this.setRecentTransactions(data.wallet.recentTransactions);
    if (data.wallet.contacts) await this.setContacts(data.wallet.contacts);

    // P2P
    if (data.p2p.recentPeers) await this.setRecentPeers(data.p2p.recentPeers);
    if (data.p2p.pendingTransactions)
      await this.setPendingTransactions(data.p2p.pendingTransactions);
    if (data.p2p.discoverySessions)
      await this.setDiscoverySessions(data.p2p.discoverySessions);

    // App
    if (data.app.settings) await this.setAppSettings(data.app.settings);
    if (data.app.lastSync) await this.setLastSync(data.app.lastSync);
    if (data.app.offlineQueue)
      await this.setOfflineQueue(data.app.offlineQueue);
  }

  async clearSession(): Promise<void> {
    console.log("🕵️‍♂️ DEBUG - clearSession called from:", new Error().stack);
    console.log("🗑️ Clearing session from secure storage");
    await SecureStore.deleteItemAsync("auth.session");
  }

  // Debug method
  async debugStorageState(): Promise<void> {
    try {
      const session = await this.getSession();
      const profile = await this.getProfile();
      const profileViaAuthItem = await this.getAuthItem("profile");

      console.log("🔍 DEBUG - Storage State:", {
        session: !!session,
        profile: !!profile,
        profileViaAuthItem: !!profileViaAuthItem,
        sessionId: session?.id,
        profileId: profile?.id,
        profileUsername: profile?.username,
      });

      // Check if they're the same
      if (profile && profileViaAuthItem) {
        try {
          const parsedAuthItem = JSON.parse(profileViaAuthItem) as UserProfile;
          console.log("🔍 DEBUG - Profile Consistency:", {
            sameId: profile.id === parsedAuthItem.id,
            sameUsername: profile.username === parsedAuthItem.username,
          });
        } catch (parseError) {
          console.error(
            "❌ Failed to parse profile from auth item:",
            parseError
          );
        }
      }
    } catch (error) {
      console.error("🚨 Debug storage state failed:", error);
    }
  }
}

export const secureStorageManager = new SecureStorageManager();
