import { Web3Signature } from "@/types";
import {
  transact
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { secureStorageManager } from "../storage/secure-store";

class SolanaWalletAdapter {
  async connectWallet(): Promise<{
    publicKey: string;
    signature: Web3Signature;
  }> {
    try {
      const authorizationResult = await transact(async (wallet) => {
        // Request authorization
        const authResult = await wallet.authorize({
          cluster: "devnet", // or 'mainnet-beta'
          identity: {
            name: "Zypp Wallet",
            uri: "https://zypp.fun",
            icon: "../../assets/icon.png",
          },
        });

        // Get primary account
        const primaryAccount = authResult.accounts[0];
        // Store authorized public key
        this.setAuthorizedPublicKey(new PublicKey(primaryAccount.address));

        const signResult = await wallet.signMessages({
          addresses: [primaryAccount.address],
          payloads: [
            new TextEncoder().encode(
              `Sign this message to connect to Zypp Wallet. Session: ${Date.now()}`
            ),
          ],
        });

        return {
          account: primaryAccount,
          signature: signResult[0],
        };
      });

      const publicKey = authorizationResult.account.address;

      // Create signature object
      const signature: Web3Signature = {
        message: `Sign this message to connect to Zypp Wallet. Session: ${Date.now()}`,
        signature: Buffer.from(authorizationResult.signature).toString(
          "base64"
        ),
        publicKey,
        signedAt: new Date().toISOString(),
      };

      return {
        publicKey,
        signature,
      };
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  async signMessage(message: string): Promise<Web3Signature> {
    try {
      const authorizedKey = await this.getAuthorizedPublicKey();
      const signedData = await transact(async (wallet) => {
        // Request message signature
        return await wallet.signMessages({
          addresses: [authorizedKey.toBase58()],
          payloads: [new TextEncoder().encode(message)],
        });
      });

      if (!signedData[0]) {
        throw new Error("No signature returned from wallet");
      }

      const signature: Web3Signature = {
        message,
        signature: Buffer.from(signedData[0]).toString("base64"),
        publicKey: authorizedKey.toBase58(),
        signedAt: new Date().toISOString(),
      };

      return signature;
    } catch (error: any) {
      console.error("Message signing failed:", error);
      throw new Error(`Message signing failed: ${error.message}`);
    }
  }

  async signTransaction(transaction: Transaction): Promise<string> {
    try {
      const authorizedKey = await this.getAuthorizedPublicKey();
      const signedData = await transact(async (wallet) => {
        // Request transaction signature
        return await wallet.signTransactions({
          transactions: [transaction],
        });
      });

      if (!signedData[0] || !signedData[0].signatures[0]) {
        throw new Error("No signature returned from wallet");
      }

      const signature = signedData[0].signatures[0];
      return Buffer.from(signature.signature as Uint8Array).toString("base64");
    } catch (error: any) {
      console.error("Transaction signing failed:", error);
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }

  async getAuthorizedPublicKey(): Promise<PublicKey> {
    const address = await secureStorageManager.getAuthItem("authorized_wallet");
    if (!address) {
      throw new Error("No wallet authorized. Please connect a wallet first.");
    }
    return new PublicKey(address);
  }

  private async setAuthorizedPublicKey(publicKey: PublicKey): Promise<void> {
    await secureStorageManager.setAuthItem(
      "authorized_wallet",
      publicKey.toBase58()
    );
  }
}

export const solanaWalletAdapter = new SolanaWalletAdapter();
