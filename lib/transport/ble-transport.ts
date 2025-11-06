import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, State } from "react-native-ble-plx";
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

const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_RX = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_TX = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

export class BLETransport implements ITransport {
  private manager: BleManager | null = null;
  private options: TransportOptions | null = null;
  private events: Partial<TransportEvents> = {};
  private connectedDevices: Map<string, Device> = new Map();
  private _state: TransportState = TransportState.UNAVAILABLE;
  private subscriptions: (() => void)[] = [];

  readonly type = TransportType.BLUETOOTH;

  // NOTE: do not create BleManager in the constructor — create lazily in initialize()

  get state(): TransportState {
    return this._state;
  }

  private setState(state: TransportState) {
    this._state = state;
    this.events.onStateChange?.(state);
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "ios") {
      return true;
    }

    if (Platform.OS === "android" && Platform.Version >= 31) {
      const results = await Promise.all([
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Bluetooth Scan Permission",
            message: "App needs Bluetooth scan permission",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        ),
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Bluetooth Connect Permission",
            message: "App needs Bluetooth connect permission",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        ),
      ]);

      return results.every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    return true;
  }

  async initialize(options: TransportOptions): Promise<void> {
    this.options = options;
    this.setState(TransportState.INITIALIZING);

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error("Bluetooth permissions not granted");
    }

    // Lazily create BLE manager. Guard against missing native module.
    try {
      if (!this.manager) {
        this.manager = new BleManager();
      }
    } catch (err) {
      console.error("BLE manager initialization failed:", err);
      this.setState(TransportState.UNAVAILABLE);
      throw new Error("BLE manager not available");
    }

    // Monitor Bluetooth state
    const subscription = this.manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        this.setState(TransportState.AVAILABLE);
      } else {
        this.setState(TransportState.UNAVAILABLE);
      }
    }, true);

    this.subscriptions.push(() => subscription.remove());
  }

  async destroy(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions = [];
    await this.disconnectAll();
    if (this.manager && typeof this.manager.destroy === "function") {
      try {
        this.manager.destroy();
      } catch (err) {
        console.warn("Failed to destroy BLE manager:", err);
      }
    }
  }

  async startScanning(): Promise<void> {
    if (this.state !== TransportState.AVAILABLE) {
      throw new Error("BLE is not available");
    }

    this.setState(TransportState.SCANNING);

    try {
      if (!this.manager) throw new Error("BLE manager not initialized");

      await this.manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.events.onError?.(error);
            return;
          }

          if (device) {
            const peer: TransportPeer = {
              id: device.id,
              name: device.name || "Unknown Device",
              type: TransportType.BLUETOOTH,
              distance: device.rssi,
              meta: {
                manufacturerData: device.manufacturerData,
                serviceData: device.serviceData,
              },
            };
            this.events.onPeerDiscovered?.(peer);
          }
        }
      );
    } catch (error) {
      this.setState(TransportState.ERROR);
      this.events.onError?.(error as Error);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.manager && typeof this.manager.stopDeviceScan === "function") {
      try {
        this.manager.stopDeviceScan();
      } catch (err) {
        console.warn("Failed to stop device scan:", err);
      }
    }
    if (this.state === TransportState.SCANNING) {
      this.setState(TransportState.AVAILABLE);
    }
  }

  async connect(peerId: PeerID): Promise<void> {
    try {
      if (!this.manager) throw new Error("BLE manager not initialized");

      const device = await this.manager.connectToDevice(peerId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevices.set(peerId, device);

      // Monitor disconnection
      device.onDisconnected((error, device) => {
        this.connectedDevices.delete(device.id);
        this.events.onPeerDisconnected?.(device.id);
      });

      // Monitor incoming data
      const subscription = this.manager.monitorCharacteristicForDevice(
        device.id,
        SERVICE_UUID,
        CHARACTERISTIC_UUID_TX,
        (error, characteristic) => {
          if (error) {
            this.events.onError?.(error);
            return;
          }

          if (characteristic?.value) {
            const data = Buffer.from(characteristic.value, "base64");
            this.events.onDataReceived?.(data, device.id);
          }
        }
      );

      this.subscriptions.push(() => subscription.remove());

      const peer: TransportPeer = {
        id: device.id,
        name: device.name || "Unknown Device",
        type: TransportType.BLUETOOTH,
        meta: {
          manufacturerData: device.manufacturerData,
          serviceData: device.serviceData,
        },
      };

      this.events.onPeerConnected?.(peer);
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  async disconnect(peerId: PeerID): Promise<void> {
    const device = this.connectedDevices.get(peerId);
    if (device) {
      await device.cancelConnection();
      this.connectedDevices.delete(peerId);
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnections = Array.from(this.connectedDevices.values()).map(
      (device) => device.cancelConnection()
    );
    await Promise.all(disconnections);
    this.connectedDevices.clear();
  }

  async send(data: TransportData, to: PeerID | PeerID[]): Promise<void> {
    const peerIds = Array.isArray(to) ? to : [to];
    const sendPromises = peerIds.map(async (peerId) => {
      const device = this.connectedDevices.get(peerId);
      if (!device) {
        throw new Error(`Device ${peerId} not connected`);
      }

      const base64Data = Buffer.from(data.toString()).toString("base64");
      if (!this.manager) throw new Error("BLE manager not initialized");
      await this.manager.writeCharacteristicWithResponseForDevice(
        device.id,
        SERVICE_UUID,
        CHARACTERISTIC_UUID_RX,
        base64Data
      );
    });

    await Promise.all(sendPromises);
  }

  async broadcast(data: TransportData): Promise<void> {
    const peerIds = Array.from(this.connectedDevices.keys());
    await this.send(data, peerIds);
  }

  async getConnectedPeers(): Promise<TransportPeer[]> {
    return Array.from(this.connectedDevices.values()).map((device) => ({
      id: device.id,
      name: device.name || "Unknown Device",
      type: TransportType.BLUETOOTH,
      meta: {
        manufacturerData: device.manufacturerData,
        serviceData: device.serviceData,
      },
    }));
  }

  async isAvailable(): Promise<boolean> {
    if (!this.manager) return false;
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  subscribe(events: Partial<TransportEvents>): () => void {
    this.events = { ...this.events, ...events };
    return () => {
      this.events = {};
    };
  }
}
