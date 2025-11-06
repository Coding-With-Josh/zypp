import { Platform } from "react-native";

export type PeerID = string;
export type TransportData = string | Uint8Array;

export interface TransportPeer {
  id: PeerID;
  name: string;
  type: TransportType;
  distance?: number; // Optional RSSI or signal strength indicator
  meta?: Record<string, any>; // Additional platform-specific metadata
}

export enum TransportType {
  BLUETOOTH = "bluetooth",
  WIFI_DIRECT = "wifi_direct",
  NFC = "nfc",
  MULTIPEER = "multipeer", // iOS only
}

export enum TransportState {
  UNAVAILABLE = "unavailable",
  INITIALIZING = "initializing",
  AVAILABLE = "available",
  SCANNING = "scanning",
  CONNECTED = "connected",
  ERROR = "error",
}

export interface TransportOptions {
  serviceId: string;
  displayName: string;
  scanTimeout?: number; // in milliseconds
  connectionTimeout?: number; // in milliseconds
  multiConnect?: boolean; // Whether to allow multiple simultaneous connections
  enableBroadcast?: boolean; // Whether to allow sending to multiple peers at once
}

export interface TransportEvents {
  onStateChange: (state: TransportState) => void;
  onPeerDiscovered: (peer: TransportPeer) => void;
  onPeerLost: (peerId: PeerID) => void;
  onPeerConnected: (peer: TransportPeer) => void;
  onPeerDisconnected: (peerId: PeerID) => void;
  onDataReceived: (data: TransportData, from: PeerID) => void;
  onError: (error: Error) => void;
}

export interface ITransport {
  readonly type: TransportType;
  readonly state: TransportState;

  // Lifecycle methods
  initialize(options: TransportOptions): Promise<void>;
  destroy(): Promise<void>;

  // Discovery methods
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;

  // Connection methods
  connect(peerId: PeerID): Promise<void>;
  disconnect(peerId: PeerID): Promise<void>;
  disconnectAll(): Promise<void>;

  // Data transfer methods
  send(data: TransportData, to: PeerID | PeerID[]): Promise<void>;
  broadcast(data: TransportData): Promise<void>;

  // State methods
  getConnectedPeers(): Promise<TransportPeer[]>;
  isAvailable(): Promise<boolean>;

  // Event subscription
  subscribe(events: Partial<TransportEvents>): () => void;
}

export const isTransportSupported = (type: TransportType): boolean => {
  switch (type) {
    case TransportType.BLUETOOTH:
      return true; // BLE is supported on both platforms
    case TransportType.WIFI_DIRECT:
      return true; // We have implementations for both platforms
    case TransportType.NFC:
      return true; // NFC manager is supported on both platforms
    case TransportType.MULTIPEER:
      return Platform.OS === "ios"; // MultipeerConnectivity is iOS only
    default:
      return false;
  }
};
