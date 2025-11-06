import { transportManager } from "@/lib/transport/transport-manager";
import type { TransactionPackage } from "@/lib/transport/tx-package";
import type { P2PTransport, PeerDevice } from "@/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface TransactionContextType {
  // Transaction Status
  checkNonceStatus: (nonce: string) => Promise<{
    isValid: boolean;
    isUsed: boolean;
    expiresAt: string;
  }>;

  // P2P Features
  nearbyPeers: PeerDevice[];
  supportedTransports: P2PTransport[];
  isDiscoveryActive: boolean;

  // Actions
  startPeerDiscovery: () => Promise<void>;
  stopPeerDiscovery: () => Promise<void>;
  sendTransactionToPeer: (
    transaction: TransactionPackage,
    transport: P2PTransport,
    peerId?: string
  ) => Promise<boolean>;
  readNFCTransaction: () => Promise<void>;
  handleQRCodeScan: (data: string) => boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [nearbyPeers, setNearbyPeers] = useState<PeerDevice[]>([]);
  const [isDiscoveryActive, setIsDiscoveryActive] = useState(false);
  const [supportedTransports, setSupportedTransports] = useState<
    P2PTransport[]
  >([]);

  // Initialize transport manager
  useEffect(() => {
    const initializeTransports = async () => {
      await transportManager.initialize(
        // Handle peer discovery
        (peer) => {
          setNearbyPeers((current) => {
            const exists = current.find((p) => p.id === peer.id);
            if (exists) {
              return current.map((p) =>
                p.id === peer.id ? { ...p, ...peer } : p
              );
            }
            return [...current, peer];
          });
        },
        // Handle received transactions
        (transaction, transport) => {
          // TODO: Process received transaction
          console.log("Received transaction via:", transport, transaction);
        }
      );

      // Get supported transports
      setSupportedTransports(transportManager.getSupportedTransports());
    };

    initializeTransports();

    // Cleanup
    return () => {
      stopPeerDiscovery();
    };
  }, []);

  const checkNonceStatus = async (nonce: string) => {
    // TODO: Implement actual nonce checking logic
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60000); // 30 minutes from now

    return {
      isValid: true,
      isUsed: false,
      expiresAt: expiresAt.toISOString(),
    };
  };

  const startPeerDiscovery = async () => {
    if (!user?.id) return;

    try {
      await transportManager.startAdvertising(user.id);
      await transportManager.startBrowsing();
      setIsDiscoveryActive(true);
    } catch (error) {
      console.error("Failed to start peer discovery:", error);
      setIsDiscoveryActive(false);
    }
  };

  const stopPeerDiscovery = async () => {
    try {
      await transportManager.stopAdvertising();
      await transportManager.stopBrowsing();
    } finally {
      setIsDiscoveryActive(false);
      setNearbyPeers([]);
    }
  };

  const sendTransactionToPeer = async (
    transaction: TransactionPackage,
    transport: P2PTransport,
    peerId?: string
  ): Promise<boolean> => {
    try {
      return await transportManager.sendTransaction(
        transaction,
        transport,
        peerId
      );
    } catch (error) {
      console.error("Failed to send transaction:", error);
      return false;
    }
  };

  const readNFCTransaction = async () => {
    try {
      await transportManager.startNFCReading();
    } catch (error) {
      console.error("Failed to read NFC:", error);
    }
  };

  const handleQRCodeScan = (data: string): boolean => {
    try {
      return transportManager.handleScannedQRData(data);
    } catch (error) {
      console.error("Failed to handle QR code:", error);
      return false;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        // Transaction Status
        checkNonceStatus,

        // P2P Features
        nearbyPeers,
        supportedTransports,
        isDiscoveryActive,

        // Actions
        startPeerDiscovery,
        stopPeerDiscovery,
        sendTransactionToPeer,
        readNFCTransaction,
        handleQRCodeScan,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      "useTransactionContext must be used within a TransactionProvider"
    );
  }
  return context;
};
