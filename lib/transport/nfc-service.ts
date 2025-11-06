import type { P2PTransport } from "@/types";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";
import { TransactionPackage, txPackageBuilder } from "./tx-package";

export class NFCService {
  private static instance: NFCService;
  private onTransactionReceived?: (tx: TransactionPackage) => void;
  private isEnabled: boolean = false;

  private constructor() {
    this.initNFC();
  }

  static getInstance(): NFCService {
    if (!NFCService.instance) {
      NFCService.instance = new NFCService();
    }
    return NFCService.instance;
  }

  private async initNFC() {
    try {
      // Check if NFC is supported
      const isSupported = await NfcManager.isSupported();
      if (isSupported) {
        await NfcManager.start();
        this.isEnabled = true;
      }
    } catch (error) {
      console.error("NFC initialization failed:", error);
      this.isEnabled = false;
    }
  }

  initialize(onTransactionReceived: (tx: TransactionPackage) => void) {
    this.onTransactionReceived = onTransactionReceived;
  }

  async startReading(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Register for NFC reading
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Read NDEF message
      const tag = await NfcManager.getTag();
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        const message = tag.ndefMessage[0];
        const payload = Ndef.text.decodePayload(
          new Uint8Array(message.payload)
        );

        try {
          const transaction = txPackageBuilder.parseFromTransport(payload);
          if (this.onTransactionReceived) {
            this.onTransactionReceived(transaction);
          }
        } catch (error) {
          console.error("Failed to parse NFC payload:", error);
        }
      }
    } catch (error) {
      console.error("Error reading NFC:", error);
    } finally {
      await this.stopReading();
    }
  }

  async writeTransaction(transaction: TransactionPackage): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Prepare the transaction data
      const bytes = txPackageBuilder.serializeForTransport(transaction);
      const ndefRecord = Ndef.encodeMessage([Ndef.textRecord(bytes)]);

      if (!ndefRecord) {
        throw new Error("Failed to encode NDEF message");
      }

      // Write to NFC tag
      await NfcManager.ndefHandler.writeNdefMessage(ndefRecord);
      return true;
    } catch (error) {
      console.error("Error writing to NFC:", error);
      return false;
    } finally {
      await this.stopReading();
    }
  }

  async stopReading(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error("Error stopping NFC:", error);
    }
  }

  getTransportType(): P2PTransport {
    return "nfc";
  }

  isNFCEnabled(): boolean {
    return this.isEnabled;
  }
}

export const nfcService = NFCService.getInstance();
