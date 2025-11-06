import { OfflineTransaction, P2PTransport, TransactionEnvelope } from "@/types";
import { randomUUID } from "expo-crypto";

export interface TransportInfo {
  transport: P2PTransport;
  sender_device_id: string;
  receiver_device_id?: string;
  channel_id?: string; // For multipeer/BLE pairing
  hop_count: number;
  discovered_at: string;
  received_at: string;
  rssi?: number; // Signal strength for BLE/WiFi
}

export interface TransactionPackage {
  id: string;
  version: number;
  created_at: string;
  expires_at: string;
  transport: TransportInfo;
  envelope: TransactionEnvelope;
  metadata: {
    amount: number;
    symbol: string;
    token_mint?: string;
    memo?: string;
    from_address: string;
    to_address: string;
  };
  signed_data: string; // Base64 serialized transaction
  signature?: string; // After broadcast
  error?: string; // If broadcast fails
}

export class TransactionPackageBuilder {
  private readonly DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

  createFromOfflineTransaction(
    tx: OfflineTransaction,
    transport: P2PTransport,
    senderDeviceId: string,
    receiverDeviceId?: string,
    channelId?: string
  ): TransactionPackage {
    const now = new Date();
    const expires = new Date(now.getTime() + this.DEFAULT_TTL_MS);

    // Transport metadata
    const transportInfo: TransportInfo = {
      transport,
      sender_device_id: senderDeviceId,
      receiver_device_id: receiverDeviceId,
      channel_id: channelId,
      hop_count: 0,
      discovered_at: now.toISOString(),
      received_at: now.toISOString(),
    };

    // Envelope from transaction
    const envelope = tx.envelope
      ? JSON.parse(tx.envelope)
      : {
          version: 1,
          transaction_data: tx.signed_data,
          signatures: [],
          nonce: tx.nonce,
          metadata: {
            created_at: tx.created_at,
            expires_at: expires.toISOString(),
            network: "devnet", // TODO: Get from config
          },
        };

    return {
      id: randomUUID(),
      version: 1,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      transport: transportInfo,
      envelope,
      metadata: {
        amount: tx.amount,
        symbol: tx.symbol,
        token_mint: tx.token_mint,
        memo: tx.memo,
        from_address: tx.from_address,
        to_address: tx.to_address,
      },
      signed_data: tx.signed_data || "",
    };
  }

  createFromPaymentRequest(
    amount: number,
    symbol: string,
    tokenMint: string | undefined,
    recipientAddress: string,
    memo?: string,
    transport: P2PTransport = "qr_code",
    senderDeviceId?: string
  ): TransactionPackage {
    const now = new Date();
    const expires = new Date(now.getTime() + this.DEFAULT_TTL_MS);

    return {
      id: randomUUID(),
      version: 1,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      transport: {
        transport,
        sender_device_id: senderDeviceId || "payment_request",
        hop_count: 0,
        discovered_at: now.toISOString(),
        received_at: now.toISOString(),
      },
      envelope: {
        version: 1,
        transaction_data: "", // Will be filled by sender
        signatures: [],
        nonce: "", // Will be filled by sender
        metadata: {
          created_at: now.toISOString(),
          expires_at: expires.toISOString(),
          network: "devnet", // TODO: Get from config
        },
      },
      metadata: {
        amount,
        symbol,
        token_mint: tokenMint,
        memo,
        from_address: "", // Will be filled by sender
        to_address: recipientAddress,
      },
      signed_data: "", // Will be filled by sender
    };
  }

  serializeForTransport(pkg: TransactionPackage): string {
    return Buffer.from(JSON.stringify(pkg)).toString("base64");
  }

  parseFromTransport(data: string): TransactionPackage {
    try {
      const decoded = Buffer.from(data, "base64").toString();
      const pkg = JSON.parse(decoded) as TransactionPackage;

      // Basic validation
      if (!pkg.id || !pkg.version || !pkg.transport || !pkg.metadata) {
        throw new Error("Invalid package format");
      }

      return pkg;
    } catch (err) {
      throw new Error(`Failed to parse transaction package: ${err}`);
    }
  }
}

export const txPackageBuilder = new TransactionPackageBuilder();
