import NfcManager, { Ndef, NfcEvents, NfcTech } from "react-native-nfc-manager";
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

export class NFCTransport implements ITransport {
  private options: TransportOptions | null = null;
  private events: Partial<TransportEvents> = {};
  private _state: TransportState = TransportState.UNAVAILABLE;
  private connectedPeers: Map<string, TransportPeer> = new Map();
  private isReading: boolean = false;
  private cleanup: (() => void)[] = [];

  readonly type = TransportType.NFC;

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

    try {
      const supported = await NfcManager.isSupported();
      if (!supported) {
        this.setState(TransportState.UNAVAILABLE);
        throw new Error("NFC is not supported on this device");
      }

      await NfcManager.start();

      // Enable reader mode when the app starts
      await NfcManager.setEventListener(
        NfcEvents.DiscoverTag,
        this.handleTagDiscovered
      );

      this.cleanup.push(() => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      });

      this.setState(TransportState.AVAILABLE);
    } catch (error) {
      this.setState(TransportState.ERROR);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  private handleTagDiscovered = async (tag: any) => {
    try {
      const peer: TransportPeer = {
        id: tag.id,
        name: "NFC Tag",
        type: TransportType.NFC,
        meta: { ...tag },
      };

      this.events.onPeerDiscovered?.(peer);

      if (this.isReading) {
        const message = await this.readNdefMessage(tag);
        if (message) {
          this.events.onDataReceived?.(message, tag.id);
        }
      }
    } catch (error) {
      this.events.onError?.(error as Error);
    }
  };

  private async readNdefMessage(tag: any): Promise<string | null> {
    if (!tag.ndefMessage || !tag.ndefMessage.length) {
      return null;
    }

    const ndefMessage = tag.ndefMessage[0];
    if (ndefMessage.tnf !== Ndef.TNF_WELL_KNOWN) {
      return null;
    }

    const textBytes = ndefMessage.payload.slice(3);
    const text = String.fromCharCode.apply(null, textBytes);
    return text;
  }

  private async writeNdefMessage(message: string): Promise<void> {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(message)]);

    if (bytes) {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tech = await NfcManager.getTag();
      if (tech) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
      }
      await NfcManager.cancelTechnologyRequest();
    }
  }

  async destroy(): Promise<void> {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
    await this.disconnectAll();
    await NfcManager.cancelTechnologyRequest();
    await NfcManager.unregisterTagEvent();
  }

  async startScanning(): Promise<void> {
    if (this.state !== TransportState.AVAILABLE) {
      throw new Error("NFC is not available");
    }

    this.setState(TransportState.SCANNING);
    this.isReading = true;

    try {
      await NfcManager.registerTagEvent();
    } catch (error) {
      this.setState(TransportState.ERROR);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    this.isReading = false;
    await NfcManager.unregisterTagEvent();

    if (this.state === TransportState.SCANNING) {
      this.setState(TransportState.AVAILABLE);
    }
  }

  async connect(peerId: PeerID): Promise<void> {
    // NFC doesn't maintain persistent connections
    // Instead, we'll just note that we've seen this peer
    const peer: TransportPeer = {
      id: peerId,
      name: "NFC Tag",
      type: TransportType.NFC,
    };
    this.connectedPeers.set(peerId, peer);
    this.events.onPeerConnected?.(peer);
  }

  async disconnect(peerId: PeerID): Promise<void> {
    // For NFC, disconnecting just means forgetting about the peer
    this.connectedPeers.delete(peerId);
    this.events.onPeerDisconnected?.(peerId);
  }

  async disconnectAll(): Promise<void> {
    const peerIds = Array.from(this.connectedPeers.keys());
    peerIds.forEach((peerId) => this.events.onPeerDisconnected?.(peerId));
    this.connectedPeers.clear();
  }

  async send(data: TransportData, to: PeerID | PeerID[]): Promise<void> {
    // NFC can only write to one tag at a time
    try {
      await this.writeNdefMessage(data.toString());
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  async broadcast(data: TransportData): Promise<void> {
    // For NFC, broadcast is the same as send since we can only write to one tag at a time
    await this.send(data, "");
  }

  async getConnectedPeers(): Promise<TransportPeer[]> {
    return Array.from(this.connectedPeers.values());
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await NfcManager.isEnabled();
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
