import { Platform } from "react-native";
import { MultipeerConnectivity } from "react-native-multipeer";
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

  readonly type = TransportType.WIFI_DIRECT;

  constructor() {
    // Initialize platform-specific setup
    if (Platform.OS === "ios") {
      this.initializeIOS();
    } else {
      this.initializeAndroid();
    }
  }

  private async initializeIOS() {
    // MultipeerConnectivity initialization will be done in initialize()
  }

  private async initializeAndroid() {
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
    } catch (error) {
      this.events.onError?.(error as Error);
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
    this.setState(TransportState.INITIALIZING);

    if (Platform.OS === "ios") {
      MultipeerConnectivity.init({
        serviceType: options.serviceId,
        peerDisplayName: options.displayName,
      });

      MultipeerConnectivity.addListener("peerFound", (peer: any) => {
        const transportPeer: TransportPeer = {
          id: peer.peerId,
          name: peer.displayName,
          type: TransportType.MULTIPEER,
          meta: { ...peer },
        };
        this.events.onPeerDiscovered?.(transportPeer);
      });

      MultipeerConnectivity.addListener("peerLost", (peer: any) => {
        this.events.onPeerLost?.(peer.peerId);
      });

      MultipeerConnectivity.addListener("connected", (peer: any) => {
        const transportPeer: TransportPeer = {
          id: peer.peerId,
          name: peer.displayName,
          type: TransportType.MULTIPEER,
          meta: { ...peer },
        };
        this.connectedPeers.set(peer.peerId, transportPeer);
        this.events.onPeerConnected?.(transportPeer);
      });

      MultipeerConnectivity.addListener("disconnected", (peer: any) => {
        this.connectedPeers.delete(peer.peerId);
        this.events.onPeerDisconnected?.(peer.peerId);
      });

      MultipeerConnectivity.addListener("data", ({ peerId, data }: any) => {
        this.events.onDataReceived?.(data, peerId);
      });

      this.cleanup.push(() => {
        MultipeerConnectivity.removeAllListeners("peerFound");
        MultipeerConnectivity.removeAllListeners("peerLost");
        MultipeerConnectivity.removeAllListeners("connected");
        MultipeerConnectivity.removeAllListeners("disconnected");
        MultipeerConnectivity.removeAllListeners("data");
      });
    }

    this.setState(TransportState.AVAILABLE);
  }

  async destroy(): Promise<void> {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
    await this.disconnectAll();

    if (Platform.OS === "ios") {
      MultipeerConnectivity.stopBrowsing();
      MultipeerConnectivity.stopAdvertising();
    } else {
      await WifiP2p.removeGroup();
      // No need to finalize, initialize() already checks state
    }
  }

  async startScanning(): Promise<void> {
    if (this.state !== TransportState.AVAILABLE) {
      throw new Error("WiFi Direct is not available");
    }

    this.setState(TransportState.SCANNING);

    if (Platform.OS === "ios") {
      MultipeerConnectivity.startBrowsing();
      MultipeerConnectivity.startAdvertising();
    } else {
      await WifiP2p.startDiscoveringPeers();
    }
  }

  async stopScanning(): Promise<void> {
    if (Platform.OS === "ios") {
      MultipeerConnectivity.stopBrowsing();
      MultipeerConnectivity.stopAdvertising();
    } else {
      await WifiP2p.stopDiscoveringPeers();
    }

    if (this.state === TransportState.SCANNING) {
      this.setState(TransportState.AVAILABLE);
    }
  }

  async connect(peerId: PeerID): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        await MultipeerConnectivity.invitePeer(peerId);
      } else {
        await WifiP2p.connect(peerId);
      }
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  async disconnect(peerId: PeerID): Promise<void> {
    if (Platform.OS === "ios") {
      await MultipeerConnectivity.disconnectFromPeer(peerId);
    } else {
      await WifiP2p.cancelConnect();
      await WifiP2p.removeGroup();
    }
    this.connectedPeers.delete(peerId);
  }

  async disconnectAll(): Promise<void> {
    if (Platform.OS === "ios") {
      const disconnections = Array.from(this.connectedPeers.keys()).map(
        (peerId) => MultipeerConnectivity.disconnectFromPeer(peerId)
      );
      await Promise.all(disconnections);
    } else {
      await WifiP2p.removeGroup();
    }
    this.connectedPeers.clear();
  }

  async send(data: TransportData, to: PeerID | PeerID[]): Promise<void> {
    const peerIds = Array.isArray(to) ? to : [to];

    if (Platform.OS === "ios") {
      await MultipeerConnectivity.send(data.toString(), peerIds);
    } else {
      // On Android, send to each peer using the WiFi P2P API
      for (const peerId of peerIds) {
        await WifiP2p.sendMessageTo(data.toString(), peerId);
      }
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
    if (Platform.OS === "ios") {
      return true; // MultipeerConnectivity is always available on iOS
    } else {
      try {
        const status = await WifiP2p.initialize();
        return status === true;
      } catch {
        return false;
      }
    }
  }

  subscribe(events: Partial<TransportEvents>): () => void {
    this.events = { ...this.events, ...events };
    return () => {
      this.events = {};
    };
  }
}
