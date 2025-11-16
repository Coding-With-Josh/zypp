import React, { createContext, useContext, ReactNode } from "react";
import { SyncResult } from "@/types";
import { useSync } from "@/hooks/useSync";

interface SyncContextType {
  syncState: ReturnType<typeof useSync>["syncState"];
  lastSyncResult: ReturnType<typeof useSync>["lastSyncResult"];
  isOnline: boolean;
  isSyncing: boolean;
  sync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  addToOfflineQueue: (item: any) => void;
  clearErrors: () => void;
  hasPendingChanges: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const sync = useSync();

  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
};

export const useSyncContext = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return context;
};
