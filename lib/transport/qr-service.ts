import type { P2PTransport } from "@/types";
import { TransactionPackage, txPackageBuilder } from "./tx-package";

export class QRService {
  private static instance: QRService;
  private onTransactionScanned?: (tx: TransactionPackage) => void;

  private constructor() {}

  static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  initialize(onTransactionScanned: (tx: TransactionPackage) => void) {
    this.onTransactionScanned = onTransactionScanned;
  }

  generateQRData(transaction: TransactionPackage): string {
    return txPackageBuilder.serializeForTransport(transaction);
  }

  handleScannedData(data: string): boolean {
    try {
      const transaction = txPackageBuilder.parseFromTransport(data);

      if (this.onTransactionScanned) {
        this.onTransactionScanned(transaction);
      }

      return true;
    } catch (error) {
      console.error("Failed to parse QR data:", error);
      return false;
    }
  }

  getTransportType(): P2PTransport {
    return "qr_code";
  }
}

export const qrService = QRService.getInstance();
