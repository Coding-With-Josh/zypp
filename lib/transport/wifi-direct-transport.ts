import { Platform } from "react-native";
import WifiP2p, { Device, WifiP2pInfo } from "react-native-wifi-p2p";
import {
  ITransport,
  PeerID,
  TransportData,
  TransportEvents,
  TransportOptions,
  TransportPeer,
  TransportState,
  TransportType,
} from "./types";

export class WiFiDirectTransport implements ITransport {
  private options: TransportOptions | null = null;
  private events: Partial<TransportEvents> = {};
  private _state: TransportState = TransportState.UNAVAILABLE;
  private connectedPeers: Map<string, TransportPeer> = new Map();
  private cleanup: (() => void)[] = [];
  private isAndroidInitialized: boolean = false;

  readonly type = TransportType.WIFI_DIRECT;

  constructor() {
    // WiFi Direct is Android-only. iOS uses BLE for P2P.
    if (Platform.OS !== "android") {
      this._state = TransportState.UNAVAILABLE;
    }
  }

  private async initializeAndroid() {
    if (this.isAndroidInitialized) {
      return true;
    }

    try {
      await WifiP2p.initialize();
      const peerSubscription = WifiP2p.subscribeOnPeersUpdates(
        this.handleAndroidPeersUpdate
      );
      const connectionSubscription = WifiP2p.subscribeOnConnectionInfoUpdates(
        this.handleAndroidConnectionInfo
      );
      this.cleanup.push(() => {
        peerSubscription.remove();
        connectionSubscription.remove();
      });
      this.isAndroidInitialized = true;
      return true;
    } catch (error) {
      console.warn('WiFi Direct initialization failed:', error);
      this.events.onError?.(error as Error);
      return false;
    }
  }

  private handleAndroidPeersUpdate = (data: { devices: Device[] }) => {
    data.devices.forEach((peer) => {
      const transportPeer: TransportPeer = {
        id: peer.deviceAddress,
        name: peer.deviceName,
        type: TransportType.WIFI_DIRECT,
        meta: { ...peer },
      };
      this.events.onPeerDiscovered?.(transportPeer);
    });
  };

  private handleAndroidConnectionInfo = (info: WifiP2pInfo) => {
    if (info.groupFormed && info.groupOwnerAddress) {
      const peer: TransportPeer = {
        id: info.groupOwnerAddress.hostAddress,
        name: "Group Owner",
        type: TransportType.WIFI_DIRECT,
        meta: { ...info },
      };
      this.connectedPeers.set(peer.id, peer);
      this.events.onPeerConnected?.(peer);
    }
  };

  get state(): TransportState {
    return this._state;
  }

  private setState(state: TransportState) {
    this._state = state;
    this.events.onStateChange?.(state);
  }

  async initialize(options: TransportOptions): Promise<void> {
    this.options = options;
    
    if (Platform.OS !== "android") {
      // WiFi Direct is Android-only
      this.setState(TransportState.UNAVAILABLE);
      return;
    }

    this.setState(TransportState.INITIALIZING);
    
    // Initialize Android WiFi P2P
    const success = await this.initializeAndroid();
    
    if (success) {
      this.setState(TransportState.AVAILABLE);
    } else {
      this.setState(TransportState.UNAVAILABLE);
    }
  }

  async destroy(): Promise<void> {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
    await this.disconnectAll();

    if (Platform.OS === "android") {
      await WifiP2p.removeGroup();
    }
  }

  async startScanning(): Promise<void> {
    if (this.state !== TransportState.AVAILABLE) {
      throw new Error("WiFi Direct is not available");
    }

    if (Platform.OS !== "android" || !this.isAndroidInitialized) {
      return; // No-op on iOS or if not initialized
    }

    try {
      this.setState(TransportState.SCANNING);
      await WifiP2p.startDiscoveringPeers();
    } catch (error) {
      console.warn('Failed to start WiFi Direct scanning:', error);
      this.setState(TransportState.AVAILABLE);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (Platform.OS === "android" && this.isAndroidInitialized) {
      try {
        await WifiP2p.stopDiscoveringPeers();
      } catch (error) {
        console.warn('Failed to stop WiFi Direct scanning:', error);
      }
    }

    if (this.state === TransportState.SCANNING) {
      this.setState(TransportState.AVAILABLE);
    }
  }

  async connect(peerId: PeerID): Promise<void> {
    if (Platform.OS !== "android" || !this.isAndroidInitialized) {
      throw new Error('WiFi Direct is only available on Android');
    }

    try {
      await WifiP2p.connect(peerId);
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  async disconnect(peerId: PeerID): Promise<void> {
    if (Platform.OS === "android" && this.isAndroidInitialized) {
      try {
        await WifiP2p.cancelConnect();
        await WifiP2p.removeGroup();
      } catch (error) {
        console.warn('WiFi Direct disconnect error:', error);
      }
    }
    this.connectedPeers.delete(peerId);
  }

  async disconnectAll(): Promise<void> {
    if (Platform.OS === "android" && this.isAndroidInitialized) {
      try {
        await WifiP2p.removeGroup();
      } catch (error) {
        console.warn('WiFi Direct remove group error:', error);
      }
    }
    this.connectedPeers.clear();
  }

  async send(data: TransportData, to: PeerID | PeerID[]): Promise<void> {
    if (Platform.OS !== "android" || !this.isAndroidInitialized) {
      throw new Error('WiFi Direct is only available on Android');
    }

    const peerIds = Array.isArray(to) ? to : [to];
    
    // On Android, send to each peer using the WiFi P2P API
    for (const peerId of peerIds) {
      await WifiP2p.sendMessageTo(data.toString(), peerId);
    }
  }

  async broadcast(data: TransportData): Promise<void> {
    const peerIds = Array.from(this.connectedPeers.keys());
    await this.send(data, peerIds);
  }

  async getConnectedPeers(): Promise<TransportPeer[]> {
    return Array.from(this.connectedPeers.values());
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false; // WiFi Direct is Android-only
    }
    
    try {
      const status = await WifiP2p.initialize();
      return status === true;
    } catch {
      return false;
    }
  }

  subscribe(events: Partial<TransportEvents>): () => void {
    this.events = { ...this.events, ...events };
    return () => {
      this.events = {};
    };
  }
}
