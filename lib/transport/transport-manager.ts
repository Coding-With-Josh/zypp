import type { P2PTransport, PeerDevice } from "@/types";
import { Platform } from "react-native";
import { BLETransport } from './ble-transport';
import { multipeerService } from "./multipeer-service";
import { nfcService } from "./nfc-service";
import { NFCTransport } from './nfc-transport';
import { qrService } from "./qr-service";
import { getFallbackTransports } from './transport-fallback';
import { TransactionPackage } from "./tx-package";
import {
  ITransport,
  TransportOptions,
  TransportPeer,
  TransportState,
  TransportType
} from './types';
import { WiFiDirectTransport } from './wifi-direct-transport';

export class TransportManager {
  private static instance: TransportManager;
  private onPeerDiscovered?: (peer: PeerDevice) => void;
  private onTransactionReceived?: (
    tx: TransactionPackage,
    transport: P2PTransport
  ) => void;

  // Support multiple listeners so different parts of the app can subscribe
  // without stomping on each other.
  private peerListeners: Set<(peer: PeerDevice) => void> = new Set();
  private transactionListeners: Set<
    (tx: TransactionPackage, transport: P2PTransport) => void
  > = new Set();
  private peerLostListeners: Set<(peerId: string) => void> = new Set();

  // New transport system
  private transports: Map<TransportType, ITransport> = new Map();
  private connectedPeers: Map<string, { peer: TransportPeer; transport: ITransport }> = new Map();
  private activeTransports: Set<TransportType> = new Set();

  private constructor() {
    // Initialize supported transports
    if (Platform.OS === 'ios') {
      this.transports.set(TransportType.BLUETOOTH, new BLETransport());
      this.transports.set(TransportType.MULTIPEER, new WiFiDirectTransport());
      this.transports.set(TransportType.NFC, new NFCTransport());
    } else {
      this.transports.set(TransportType.BLUETOOTH, new BLETransport());
      this.transports.set(TransportType.WIFI_DIRECT, new WiFiDirectTransport());
      this.transports.set(TransportType.NFC, new NFCTransport());
    }
  }

  private initialized: boolean = false;
  private debug: boolean = false;

  static getInstance(): TransportManager {
    if (!TransportManager.instance) {
      TransportManager.instance = new TransportManager();
    }
    return TransportManager.instance;
  }

  async initialize(
    onPeerDiscovered: (peer: PeerDevice) => void,
    onTransactionReceived: (
      tx: TransactionPackage,
      transport: P2PTransport
    ) => void
  ) {
    // Keep the single-callback surface for backwards compatibility
    this.onPeerDiscovered = onPeerDiscovered;
    this.onTransactionReceived = onTransactionReceived;

    this.addPeerDiscoveredListener(onPeerDiscovered);
    this.addTransactionListener(onTransactionReceived);

    // Initialize all transports only once
    if (!this.initialized) {
      // Initialize new transport system
      const transportOptions: TransportOptions = {
        serviceId: 'com.zypp.transport',
        displayName: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        multiConnect: true,
        enableBroadcast: true,
      };

      // Initialize all transports in parallel
      const initPromises = Array.from(this.transports.values()).map(async transport => {
        try {
          await transport.initialize(transportOptions);
          if (transport.state === TransportState.AVAILABLE) {
            this.activeTransports.add(transport.type);
          }

          // Set up transport event handlers
          transport.subscribe({
            onPeerDiscovered: (peer) => {
              if (this.debug) {
                console.debug("[transport] peerFound:", peer.id, peer);
              }
              this.peerListeners.forEach((cb) => {
                try {
                  cb({
                    id: peer.id,
                    user_id: '', // Will be updated when user info is available
                    device_id: peer.id,
                    device_name: peer.name,
                    platform: Platform.OS === 'ios' ? 'ios' : 'android',
                    app_version: '1.0.0',
                    last_seen: new Date().toISOString(),
                    is_online: true,
                    transport_capabilities: [peer.type as P2PTransport],
                    public_key: ''
                  });
                } catch (err) {
                  console.error("peer listener error:", err);
                }
              });
            },
            onPeerLost: (peerId) => {
              if (this.debug) {
                console.debug("[transport] peerLost:", peerId);
              }
              this.peerLostListeners.forEach((cb) => {
                try {
                  cb(peerId);
                } catch (err) {
                  console.error("peerLost listener error:", err);
                }
              });
            },
            onPeerConnected: (peer) => {
              this.connectedPeers.set(peer.id, { peer, transport });
            },
            onPeerDisconnected: (peerId) => {
              this.connectedPeers.delete(peerId);
            },
            onDataReceived: (data, from) => {
              try {
                const tx = JSON.parse(data.toString()) as TransactionPackage;
                this.transactionListeners.forEach((cb) => {
                  try {
                    cb(tx, transport.type as P2PTransport);
                  } catch (err) {
                    console.error("transaction listener error:", err);
                  }
                });
              } catch (err) {
                console.error("Failed to parse received data:", err);
              }
            },
            onError: (error) => {
              console.error(`Transport error (${transport.type}):`, error);
            },
          });
        } catch (error) {
          console.warn(`Failed to initialize transport: ${transport.type}`, error);
        }
      });

      await Promise.all(initPromises);

      // Also initialize legacy services
      await this.initializeMultipeer();
      this.initializeQR();
      await this.initializeNFC();
      
      this.initialized = true;
    }
  }

  // Debug control
  enableDebug(enable: boolean = true) {
    this.debug = enable;
  }

  isDebugEnabled() {
    return this.debug;
  }

  private async initializeMultipeer() {
    try {
      // Legacy multipeer service is now a stub (transport unavailable)
      // Initialize it to suppress warnings, but it won't do anything
      await multipeerService.initialize();
    } catch {
      // Ignore errors - multipeer is deprecated
      if (this.debug) {
        console.debug("[transport] Multipeer initialization skipped (using BLE/WiFi Direct instead)");
      }
    }
  }

  // Listener management
  addPeerDiscoveredListener(cb: (peer: PeerDevice) => void) {
    this.peerListeners.add(cb);
  }

  removePeerDiscoveredListener(cb: (peer: PeerDevice) => void) {
    this.peerListeners.delete(cb);
  }

  addTransactionListener(
    cb: (tx: TransactionPackage, transport: P2PTransport) => void
  ) {
    this.transactionListeners.add(cb);
  }

  removeTransactionListener(
    cb: (tx: TransactionPackage, transport: P2PTransport) => void
  ) {
    this.transactionListeners.delete(cb);
  }

  addPeerLostListener(cb: (peerId: string) => void) {
    this.peerLostListeners.add(cb);
  }

  removePeerLostListener(cb: (peerId: string) => void) {
    this.peerLostListeners.delete(cb);
  }

  private initializeQR() {
    qrService.initialize((tx) => {
      if (this.onTransactionReceived) {
        this.onTransactionReceived(tx, "qr_code");
      }
    });
  }

  private async initializeNFC() {
    if (Platform.OS === "ios") {
      await nfcService.initialize((tx) => {
        if (this.onTransactionReceived) {
          this.onTransactionReceived(tx, "nfc");
        }
      });
    }
  }

  async startAdvertising(userId: string) {
    // Get prioritized transports based on current conditions
    const prioritizedTransports = getFallbackTransports(
      Platform.OS === 'ios' ? 'ios' : 'android',
      undefined, // TODO: Add battery level monitoring
      undefined, // TODO: Add signal strength monitoring
      'reliability' // Default to reliability priority
    );

    // Start scanning on prioritized transports
    for (const transportType of prioritizedTransports) {
      const transport = this.transports.get(transportType);
      if (transport?.state === TransportState.AVAILABLE) {
        try {
          await transport.startScanning();
          this.activeTransports.add(transportType);
          if (this.debug) {
            console.debug(`Started advertising on ${transportType}`);
          }
        } catch (error) {
          console.warn(`Failed to start scanning on ${transportType}:`, error);
        }
      }
    }
  }

  async stopAdvertising() {
    // Stop scanning on all transports
    for (const transport of this.transports.values()) {
      try {
        await transport.stopScanning();
      } catch (error) {
        console.warn(`Failed to stop scanning on ${transport.type}:`, error);
      }
    }
  }

  async startBrowsing() {
    // Start scanning on all active transports
    for (const transport of this.transports.values()) {
      if (transport.state === TransportState.AVAILABLE) {
        try {
          await transport.startScanning();
          if (this.debug) {
            console.debug(`Started browsing on ${transport.type}`);
          }
        } catch (error) {
          console.warn(`Failed to start scanning on ${transport.type}:`, error);
        }
      }
    }
  }

  async stopBrowsing() {
    // Stop scanning on all transports
    for (const transport of this.transports.values()) {
      try {
        await transport.stopScanning();
      } catch (error) {
        console.warn(`Failed to stop scanning on ${transport.type}:`, error);
      }
    }
  }

  async sendTransaction(
    tx: TransactionPackage,
    transport: P2PTransport,
    peerId?: string
  ): Promise<boolean> {
    const txData = JSON.stringify(tx);

    try {
      // Handle QR code separately since it doesn't use our transport interface
      if (transport === 'qr_code') {
        qrService.generateQRData(tx);
        return true;
      }

      // For transport interface implementations
      const targetTransport = Array.from(this.transports.values()).find(
        t => t.type.toLowerCase() === transport
      );

      if (targetTransport) {
        if (!peerId) {
          // Broadcast to all connected peers using this transport
          await targetTransport.broadcast(txData);
        } else {
          // Send to specific peer
          await targetTransport.send(txData, peerId);
        }
        return true;
      }

      // Fall back to legacy implementations
      switch (transport) {
        case "multipeer":
          // Multipeer is deprecated, should use BLE or WiFi Direct instead
          console.warn('Multipeer transport is unavailable. Use BLE or WiFi Direct.');
          return false;

        case "nfc":
          if (Platform.OS === "ios") {
            return await nfcService.writeTransaction(tx);
          }
          return false;

        default:
          throw new Error(`Unsupported transport type: ${transport}`);
      }
    } catch (error) {
      console.error(`Failed to send transaction via ${transport}:`, error);
      return false;
    }
  }

  async startNFCReading(): Promise<void> {
    // Use new NFC transport if available
    const nfcTransport = this.transports.get(TransportType.NFC);
    if (nfcTransport && await nfcTransport.isAvailable()) {
      await nfcTransport.startScanning();
    }
    // Fall back to legacy NFC service
    else if (Platform.OS === "ios" && nfcService.isNFCEnabled()) {
      await nfcService.startReading();
    }
  }

  async stopNFCReading(): Promise<void> {
    // Stop new NFC transport if available
    const nfcTransport = this.transports.get(TransportType.NFC);
    if (nfcTransport && await nfcTransport.isAvailable()) {
      await nfcTransport.stopScanning();
    }
    // Stop legacy NFC service
    else if (Platform.OS === "ios" && nfcService.isNFCEnabled()) {
      await nfcService.stopReading();
    }
  }

  handleScannedQRData(data: string): boolean {
    return qrService.handleScannedData(data);
  }

  getSupportedTransports(): P2PTransport[] {
    const supported: P2PTransport[] = ["qr_code"];

    // Add transports from the new transport system
    for (const [type, transport] of this.transports.entries()) {
      if (transport.state !== TransportState.UNAVAILABLE) {
        switch (type) {
          case TransportType.BLUETOOTH:
            supported.push("bluetooth");
            break;
          case TransportType.WIFI_DIRECT:
            supported.push("wifi_direct");
            break;
          case TransportType.MULTIPEER:
            supported.push("multipeer");
            break;
          case TransportType.NFC:
            supported.push("nfc");
            break;
        }
      }
    }

    // Add legacy transports
    if (!supported.includes("multipeer")) {
      supported.push("multipeer");
    }
    if (Platform.OS === "ios" && nfcService.isNFCEnabled() && !supported.includes("nfc")) {
      supported.push("nfc");
    }

    return supported;
  }
}

export const transportManager = TransportManager.getInstance();
