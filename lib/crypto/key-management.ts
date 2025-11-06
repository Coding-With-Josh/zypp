import { KeypairEncrypted } from "@/types";
import { Keypair, PublicKey } from "@solana/web3.js"; // ADD PublicKey import
import * as bip39 from "bip39";
import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { secureStorageManager } from "../storage/secure-store";
import "./crypto-polyfill";

interface CustomCryptoKey {
  type: string;
  extractable: boolean;
  algorithm: {
    name: string;
  };
  usages: ("encrypt" | "decrypt" | "deriveBits")[];
  _keyMaterial?: ArrayBuffer;
}

class KeyManagementService {
  private readonly ALGORITHM = "AES-GCM";
  private readonly KEY_LENGTH = 256;
  private readonly PBKDF2_ITERATIONS = 100000;
  private readonly SALT_LENGTH = 32;
  private readonly IV_LENGTH = 12;
  private readonly AUTH_TAG_LENGTH = 16;

  // Generate a new Solana keypair
  async generateKeypair(): Promise<Keypair> {
    try {
      return Keypair.generate();
    } catch (error: any) {
      console.error("Keypair generation failed:", error);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }

  // Derive encryption key from PIN using PBKDF2
  private async deriveKeyFromPin(
    pin: string,
    salt: Uint8Array
  ): Promise<CustomCryptoKey> {
    try {
      const encoder = new TextEncoder();
      const pinBuffer = encoder.encode(pin);

      const baseKey = await crypto.subtle.importKey(
        "raw",
        pinBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: this.PBKDF2_ITERATIONS,
          hash: "SHA-256",
        },
        baseKey,
        this.KEY_LENGTH
      );

      const key = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(derivedBits),
        { name: this.ALGORITHM },
        false,
        ["encrypt", "decrypt"]
      );

      const customKey: CustomCryptoKey = {
        type: key.type,
        extractable: key.extractable,
        algorithm: { name: key.algorithm.name },
        usages: key.usages as ("encrypt" | "decrypt" | "deriveBits")[],
        _keyMaterial: derivedBits,
      };

      return customKey;
    } catch (error: any) {
      console.error("PIN key derivation failed:", error);
      throw new Error(`Failed to derive encryption key: ${error.message}`);
    }
  }

  // Generate random bytes for salt/IV
  private generateRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  // FIXED: Encrypt private key with PIN-derived key - NOW USING BASE58
  async encryptPrivateKey(
    privateKey: Uint8Array,
    pin: string,
    publicKeyBase58: string // ADD THIS PARAMETER
  ): Promise<KeypairEncrypted> {
    try {
      // Generate salt and IV
      const salt = this.generateRandomBytes(this.SALT_LENGTH);
      const iv = this.generateRandomBytes(this.IV_LENGTH);

      // Derive encryption key from PIN
      const encryptionKey = await this.deriveKeyFromPin(pin, salt);
      if (!encryptionKey._keyMaterial) {
        throw new Error("Invalid encryption key");
      }

      // Create a composite array of IV + data for encryption
      const toEncrypt = new Uint8Array(iv.length + privateKey.length);
      toEncrypt.set(iv);
      toEncrypt.set(privateKey, iv.length);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          tagLength: this.AUTH_TAG_LENGTH * 8,
        },
        encryptionKey as any,
        toEncrypt
      );

      // Extract auth tag (last 16 bytes)
      const encryptedArray = new Uint8Array(encryptedData);
      const ciphertext = encryptedArray.slice(
        0,
        encryptedArray.length - this.AUTH_TAG_LENGTH
      );
      const authTag = encryptedArray.slice(
        encryptedArray.length - this.AUTH_TAG_LENGTH
      );

      // Convert to base64 for storage
      const encryptedSecret = Buffer.from(ciphertext).toString("base64");

      // FIXED: Use the provided Base58 public key instead of extracting from private key
      return {
        publicKey: publicKeyBase58, // USE THE BASE58 KEY
        encryptedSecret,
        encryption: {
          algorithm: "aes-256-gcm",
          version: 1,
          salt: Buffer.from(salt).toString("base64"),
          iv: Buffer.from(iv).toString("base64"),
          authTag: Buffer.from(authTag).toString("base64"),
        },
      };
    } catch (error: any) {
      console.error("Private key encryption failed:", error);
      throw new Error(`Failed to encrypt wallet: ${error.message}`);
    }
  }

  // Decrypt private key with PIN
  async decryptPrivateKey(
    encryptedData: KeypairEncrypted,
    pin: string
  ): Promise<Uint8Array> {
    try {
      const { encryption, encryptedSecret } = encryptedData;

      // Convert from base64
      const salt = Buffer.from(encryption.salt, "base64");
      const iv = Buffer.from(encryption.iv, "base64");
      const authTag = Buffer.from(encryption.authTag, "base64");
      const ciphertext = Buffer.from(encryptedSecret, "base64");

      // Combine ciphertext and auth tag
      const encryptedBuffer = new Uint8Array(
        ciphertext.length + authTag.length
      );
      encryptedBuffer.set(ciphertext);
      encryptedBuffer.set(authTag, ciphertext.length);

      // Derive encryption key from PIN
      const encryptionKey = await this.deriveKeyFromPin(
        pin,
        new Uint8Array(salt)
      );

      if (!encryptionKey._keyMaterial) {
        throw new Error("Invalid encryption key");
      }

      // Decrypt the private key
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: new Uint8Array(iv),
          tagLength: this.AUTH_TAG_LENGTH * 8,
        },
        encryptionKey as any,
        encryptedBuffer
      );

      // The decrypted data includes the IV at the beginning, remove it
      const decryptedArray = new Uint8Array(decryptedData);
      return decryptedArray.slice(this.IV_LENGTH);
    } catch (error: any) {
      console.error("Private key decryption failed:", error);
      throw new Error(
        `Failed to decrypt wallet: Invalid PIN or corrupted data`
      );
    }
  }

  // Generate mnemonic phrase (BIP39)
  async generateMnemonic(): Promise<string> {
    try {
      const entropy = this.generateRandomBytes(16);
      return bip39.entropyToMnemonic(Buffer.from(entropy));
    } catch (error: any) {
      console.error("Mnemonic generation failed:", error);
      throw new Error(`Failed to generate recovery phrase: ${error.message}`);
    }
  }

  // Validate mnemonic phrase
  async validateMnemonic(mnemonic: string): Promise<boolean> {
    try {
      return bip39.validateMnemonic(mnemonic.trim());
    } catch {
      return false;
    }
  }

  // Derive keypair from mnemonic
  async deriveFromMnemonic(
    mnemonic: string,
    passphrase?: string
  ): Promise<Keypair> {
    try {
      const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
      return Keypair.fromSeed(seed.slice(0, 32));
    } catch (error: any) {
      console.error("Mnemonic derivation failed:", error);
      throw new Error(
        `Failed to derive wallet from recovery phrase: ${error.message}`
      );
    }
  }

  // Generate backup key for encrypted cloud storage
  async generateBackupKey(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    try {
      const keyPair = await this.generateKeypair();

      return {
        publicKey: keyPair.publicKey.toBase58(), // BASE58
        privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
      };
    } catch (error: any) {
      console.error("Backup key generation failed:", error);
      throw new Error(`Failed to generate backup keys: ${error.message}`);
    }
  }

  // ADD THIS: Validate Solana address format
  isValidSolanaAddress(address: string): boolean {
    try {
      if (!address || address.length < 32 || address.length > 44) {
        return false;
      }
      
      // Try to create a PublicKey from it (this validates Base58)
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Secure storage for sensitive data
  async secureStore(
    key: string,
    value: string,
    options: { withBiometrics?: boolean } = {}
  ): Promise<void> {
    try {
      const accessibilityLevel = options.withBiometrics
        ? SecureStore.WHEN_UNLOCKED
        : SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: accessibilityLevel,
        requireAuthentication: options.withBiometrics || false,
      });
    } catch (error: any) {
      console.error("Secure storage failed:", error);
      throw new Error(`Failed to store secure data: ${error.message}`);
    }
  }

  async secureRetrieve(
    key: string,
    options: { withBiometrics?: boolean } = {}
  ): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, {
        requireAuthentication: options.withBiometrics || false,
        authenticationPrompt: options.withBiometrics
          ? "Authenticate to access encrypted data"
          : undefined,
      });
    } catch (error: any) {
      console.error("Secure retrieval failed:", error);
      return null;
    }
  }

  async secureDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      this.secureDeleteFromBackup(key);
    } catch (error: any) {
      console.error("Secure deletion failed:", error);
      try {
        this.secureDeleteFromBackup(key);
      } catch (e) {
        console.error("Fallback deletion failed:", e);
      }
    }
  }

  private async secureDeleteFromBackup(key: string): Promise<void> {
    const backupKey = `secure_backup_${key}`;
    await secureStorageManager.removeAuthItem(backupKey);
  }
}

export const keyManagementService = new KeyManagementService();