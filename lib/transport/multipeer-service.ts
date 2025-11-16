import type { P2PTransport, PeerDevice } from "@/types";
import { TransactionPackage } from "./tx-package";

/**
 * MultipeerService Stub
 * 
 * This service is deprecated and replaced by BLE, WiFi Direct, and NFC transports.
 * The react-native-multipeer module is no longer maintained and causes initialization issues.
 * 
 * This stub provides graceful degradation - all operations are no-ops.
 * The app will use BLE, WiFi Direct, or NFC for peer-to-peer communication instead.
 */
export class MultipeerService {
  private static instance: MultipeerService;
  private isInitialized: boolean = false;
  private isAvailable: boolean = false;

  private constructor() {
    console.log('MultipeerService: Using stub implementation (transport disabled)');
  }

  static getInstance(): MultipeerService {
    if (!MultipeerService.instance) {
      MultipeerService.instance = new MultipeerService();
    }
    return MultipeerService.instance;
  }

  async initialize(
    onPeerDiscovered?: (peer: PeerDevice) => void,
    onTransactionReceived?: (tx: TransactionPackage) => void,
    onPeerLost?: (peerId: string) => void
  ) {
    if (this.isInitialized) {
      return;
    }
    
    // Mark as initialized but not available
    this.isInitialized = true;
    this.isAvailable = false;
    
    console.log('⚠️ MultipeerService: Transport unavailable. Using BLE, WiFi Direct, or NFC instead.');
  }

  async startAdvertising(userId: string) {
    // No-op: BLE and WiFi Direct will handle advertising
  }

  async startBrowsing() {
    // No-op: BLE and WiFi Direct will handle browsing
  }

  async stopAdvertising() {
    // No-op
  }

  async stopBrowsing() {
    // No-op
  }

  async sendTransaction(peerId: string, transaction: TransactionPackage) {
    console.warn('MultipeerService: Transport unavailable. Use BLE, WiFi Direct, or NFC.');
    return false;
  }

  async disconnect() {
    // No-op
  }

  getTransportType(): P2PTransport {
    return "multipeer";
  }
  
  isTransportAvailable(): boolean {
    return this.isAvailable;
  }
}

export const multipeerService = MultipeerService.getInstance();
