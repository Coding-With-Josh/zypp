import type { P2PTransport, PeerDevice } from "@/types";
import { Platform } from "react-native";
import MCBrowserModule from "react-native-multipeer";
import { TransactionPackage } from "./tx-package";

export class MultipeerService {
  private static instance: MultipeerService;
  private browser: typeof MCBrowserModule;
  private serviceType = "zypp-transfer";
  private currentSession: string | null = null;
  private onPeerDiscovered?: (peer: PeerDevice) => void;
  private onTransactionReceived?: (tx: TransactionPackage) => void;
  private onPeerLost?: (peerId: string) => void;

  private constructor() {
    this.browser = MCBrowserModule;
  }

  static getInstance(): MultipeerService {
    if (!MultipeerService.instance) {
      MultipeerService.instance = new MultipeerService();
    }
    return MultipeerService.instance;
  }

  async initialize(
    onPeerDiscovered: (peer: PeerDevice) => void,
    onTransactionReceived: (tx: TransactionPackage) => void,
    onPeerLost?: (peerId: string) => void
  ) {
    this.onPeerDiscovered = onPeerDiscovered;
    this.onTransactionReceived = onTransactionReceived;
    // store peerLost handler if provided
    if (onPeerLost) {
      this.onPeerLost = onPeerLost;
    }

    // Initialize the browser
    await this.browser.init({
      serviceType: this.serviceType,
      peerTimeout: 10000, // 10 seconds
    });

    // Set up event listeners
    this.browser.on("peerFound", this.handlePeerFound);
    this.browser.on("peerLost", this.handlePeerLost);
    this.browser.on("data", this.handleDataReceived);
  }

  private handlePeerFound = (peer: any) => {
    if (this.onPeerDiscovered) {
      const peerDevice: PeerDevice = {
        id: peer.id,
        user_id: peer.info?.user_id || "",
        device_id: peer.id,
        device_name: peer.info?.device_name || "Unknown Device",
        platform: Platform.OS as "ios" | "android",
        app_version: peer.info?.app_version || "1.0.0",
        last_seen: new Date().toISOString(),
        is_online: true,
        transport_capabilities: ["multipeer"],
        public_key: peer.info?.public_key || "",
        connection_strength: peer.info?.rssi || 0,
      };
      this.onPeerDiscovered(peerDevice);
    }
  };

  private handlePeerLost = (peerId: string) => {
    // Handle peer disconnection
    console.log("Peer lost:", peerId);
    if (this.onPeerLost) {
      try {
        this.onPeerLost(peerId);
      } catch (err) {
        console.error("onPeerLost callback error:", err);
      }
    }
  };

  private handleDataReceived = (data: any) => {
    try {
      if (this.onTransactionReceived && data.type === "transaction") {
        const tx = JSON.parse(data.payload) as TransactionPackage;
        this.onTransactionReceived(tx);
      }
    } catch (error) {
      console.error("Error handling received data:", error);
    }
  };

  async startAdvertising(userId: string) {
    const deviceInfo = {
      user_id: userId,
      device_name: Platform.OS === "ios" ? "iPhone" : "Android",
      app_version: "1.0.0",
      platform: Platform.OS,
    };

    await this.browser.startAdvertising(deviceInfo);
  }

  async startBrowsing() {
    await this.browser.startBrowsing();
  }

  async stopAdvertising() {
    await this.browser.stopAdvertising();
  }

  async stopBrowsing() {
    await this.browser.stopBrowsing();
  }

  async sendTransaction(peerId: string, transaction: TransactionPackage) {
    try {
      const payload = {
        type: "transaction",
        payload: JSON.stringify(transaction),
      };

      await this.browser.send(peerId, payload);
      return true;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      return false;
    }
  }

  async disconnect() {
    if (this.currentSession) {
      await this.browser.disconnect(this.currentSession);
      this.currentSession = null;
    }
  }

  getTransportType(): P2PTransport {
    return "multipeer";
  }
}

export const multipeerService = MultipeerService.getInstance();
