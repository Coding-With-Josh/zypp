import { useAuth } from "@/contexts/AuthContext";
import { transportManager } from "@/lib/transport/transport-manager";
import type { ZyppUser } from "@/types/user";
import { useCallback, useEffect, useState } from "react";

export function useNearbyUsers() {
  const [nearbyUsers, setNearbyUsers] = useState<ZyppUser[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Start scanning for nearby users
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      // Ensure we have a user id for advertising metadata
      const userId = user?.id || "";

      // Start advertising/browsing using the project's transport manager
      await transportManager.startAdvertising(userId);
      await transportManager.startBrowsing();
      
      // Also start NFC reading if available
      if (transportManager.getSupportedTransports().includes('nfc')) {
        await transportManager.startNFCReading();
      }
      
      setIsScanning(true);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to start scanning")
      );
    }
  }, [user?.id]);

  // Stop scanning for nearby users
  const stopScanning = useCallback(async () => {
    try {
      await transportManager.stopAdvertising();
      await transportManager.stopBrowsing();
      
      // Also stop NFC reading if it was active
      if (transportManager.getSupportedTransports().includes('nfc')) {
        await transportManager.stopNFCReading();
      }
    } catch (err) {
      console.error("Error stopping transport services:", err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe to peer discovery via transportManager so we use the
    // project's shared utilities instead of direct native event emitters.
    const handlePeer = (peer: any) => {
      const newUser: ZyppUser = {
        id: peer.id,
        username: peer.device_name,
        displayName: peer.device_name,
        avatar: require("@/assets/images/design/user.png"),
        isOnline: peer.is_online ?? true,
        isNearby: true,
        address: peer.public_key || "",
        device_id: peer.device_id,
        transport_capabilities: peer.transport_capabilities,
        connection_strength: peer.connection_strength,
      };

      setNearbyUsers((current) => {
        const exists = current.find((u) => u.device_id === peer.device_id);
        if (exists) {
          return current.map((u) =>
            u.device_id === peer.device_id ? newUser : u
          );
        }
        return [...current, newUser];
      });
    };

    // Register listeners
    transportManager.addPeerDiscoveredListener(handlePeer as any);
    const handlePeerLost = (peerId: string) => {
      setNearbyUsers((current) =>
        current.filter((u) => u.device_id !== peerId)
      );
    };

    transportManager.addPeerLostListener(handlePeerLost);

    // Note: transportManager currently doesn't expose a separate "peerLost"
    // specific API; the multipeer service calls peerLost via the same
    // initialize path. If the underlying service sends peerLost events via the
    // discovery callback we may need to handle it there. For now, listen to
    // peer discovery and rely on start/stop flow to manage list cleanup.

    return () => {
      transportManager.removePeerDiscoveredListener(handlePeer as any);
      transportManager.removePeerLostListener(handlePeerLost);
      stopScanning();
    };
  }, [stopScanning]);

  return {
    nearbyUsers,
    setNearbyUsers,
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
}
