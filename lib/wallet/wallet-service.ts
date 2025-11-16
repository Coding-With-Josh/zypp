import { getSolUsdPrice } from "@/lib/utils/price";
import {
  Transaction as AppTransaction,
  KeypairEncrypted,
  OfflineTransaction,
  SolanaWallet,
  TokenBalance,
  WalletBalance,
} from "@/types";
import { createTransferInstruction } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { keyManagementService } from "../crypto/key-management";
import { nonceManager } from "../solana/nonce-manager";
import { secureStorageManager } from "../storage/secure-store";
import { transactionQueue } from "./transaction-queue";

class WalletService {
  private connection: Connection;
  private currentKeypair: Keypair | null = null;

  constructor() {
    // Use Helius RPC for better performance
    this.connection = new Connection(
      process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
      }
    );
  }

  // In WalletService - update the createCustodialWallet method
  async createCustodialWallet(pin: string): Promise<{
    wallet: SolanaWallet;
    mnemonic: string;
    keypairEncrypted: KeypairEncrypted;
  }> {
    try {
      // Generate new keypair
      const keypair = Keypair.generate();
      const publicKeyBase58 = keypair.publicKey.toBase58(); // BASE58

      console.log("🔑 Generated wallet with address:", publicKeyBase58);

      // Generate mnemonic for backup
      const mnemonic = await keyManagementService.generateMnemonic();

      // FIXED: Pass the Base58 public key to encryption
      const keypairEncrypted = await keyManagementService.encryptPrivateKey(
        keypair.secretKey,
        pin,
        publicKeyBase58 // PASS BASE58 KEY
      );

      // Create wallet record
      const wallet: SolanaWallet = {
        id: this.generateId(),
        user_id: "",
        public_key: publicKeyBase58, // USE BASE58
        encrypted_private_key: JSON.stringify(keypairEncrypted),
        key_encryption_version: 1,
        derivation_path: "m/44'/501'/0'/0'",
        wallet_type: "custodial",
        is_primary: true,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };

      // Store encrypted keypair locally
      await secureStorageManager.setEncryptedKeypair(keypairEncrypted);

      // Set the current keypair to keep wallet unlocked after creation
      this.currentKeypair = keypair;

      console.log("✅ Wallet created successfully:", publicKeyBase58);

      return {
        wallet,
        mnemonic,
        keypairEncrypted,
      };
    } catch (error: any) {
      console.error("Wallet creation failed:", error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // Also update importFromMnemonic method
  async importFromMnemonic(
    mnemonic: string,
    pin: string
  ): Promise<{
    wallet: SolanaWallet;
    keypairEncrypted: KeypairEncrypted;
  }> {
    try {
      // Validate mnemonic
      const isValid = await keyManagementService.validateMnemonic(mnemonic);
      if (!isValid) {
        throw new Error("Invalid recovery phrase");
      }

      // Derive keypair from mnemonic
      const keypair = await keyManagementService.deriveFromMnemonic(mnemonic);
      const publicKeyBase58 = keypair.publicKey.toBase58(); // BASE58

      // FIXED: Pass Base58 public key
      const keypairEncrypted = await keyManagementService.encryptPrivateKey(
        keypair.secretKey,
        pin,
        publicKeyBase58
      );

      // Create wallet record
      const wallet: SolanaWallet = {
        id: this.generateId(),
        user_id: "",
        public_key: publicKeyBase58, // BASE58
        encrypted_private_key: JSON.stringify(keypairEncrypted),
        key_encryption_version: 1,
        derivation_path: "m/44'/501'/0'/0'",
        wallet_type: "custodial",
        is_primary: true,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };

      // Store encrypted keypair locally
      await secureStorageManager.setEncryptedKeypair(keypairEncrypted);

      // Set as current keypair
      this.currentKeypair = keypair;

      return {
        wallet,
        keypairEncrypted,
      };
    } catch (error: any) {
      console.error("Wallet import failed:", error);
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }

  // Unlock wallet with PIN
  async unlockWallet(pin: string): Promise<Keypair> {
    try {
      const encryptedKeypair = await secureStorageManager.getEncryptedKeypair();
      if (!encryptedKeypair) {
        throw new Error("No wallet found");
      }

      // Decrypt private key
      const privateKey = await keyManagementService.decryptPrivateKey(
        encryptedKeypair,
        pin
      );

      // Create keypair from decrypted private key
      this.currentKeypair = Keypair.fromSecretKey(privateKey);

      // Update last used timestamp
      this.updateWalletLastUsed();

      return this.currentKeypair;
    } catch (error: any) {
      console.error("Wallet unlock failed:", error);
      throw new Error(`Failed to unlock wallet: ${error.message}`);
    }
  }

  // Get wallet balance - FIXED: Can fetch balance with just public key, no need for private key
  async getBalance(publicKey?: string): Promise<WalletBalance> {
    try {
      let pubkey: PublicKey;

      if (publicKey) {
        // Use provided public key (no need for wallet to be unlocked)
        pubkey = new PublicKey(publicKey);
      } else if (this.currentKeypair) {
        // Use current keypair if available
        pubkey = this.currentKeypair.publicKey;
      } else {
        // Try to get public key from storage
        const encryptedKeypair =
          await secureStorageManager.getEncryptedKeypair();
        if (!encryptedKeypair) {
          throw new Error("No wallet found");
        }
        pubkey = new PublicKey(encryptedKeypair.publicKey);
      }

      console.log("💰 Fetching balance for:", pubkey.toBase58());

      // Get SOL balance
      const solBalance = await this.connection.getBalance(pubkey);
      console.log("💰 SOL balance:", solBalance / LAMPORTS_PER_SOL);

      // Get token accounts
      let tokenCount = 0;
      let nftCount = 0;
      let tokens: TokenBalance[] = [];

      try {
        const tokenAccounts =
          await this.connection.getParsedTokenAccountsByOwner(pubkey, {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          });

        for (const account of tokenAccounts.value) {
          const accountInfo = account.account.data.parsed.info;
          const tokenAmount = accountInfo.tokenAmount;

          if (tokenAmount.uiAmount > 0) {
            // Check if it's an NFT (amount = 1 and decimals = 0)
            const isNFT =
              tokenAmount.uiAmount === 1 && tokenAmount.decimals === 0;

            if (isNFT) {
              nftCount++;
            } else {
              tokenCount++;
              // Check if this is USDC
              const isUSDC =
                accountInfo.mint ===
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

              tokens.push({
                mint: accountInfo.mint,
                symbol: isUSDC ? "USDC" : "UNKNOWN",
                name: isUSDC ? "USD Coin" : "Unknown Token",
                decimals: tokenAmount.decimals,
                amount: tokenAmount.uiAmount || 0,
                usd_value: isUSDC ? tokenAmount.uiAmount || 0 : 0,
                logo_uri: isUSDC
                  ? "/assets/images/icons/dollar-icon.png"
                  : undefined,
              });
            }
          }
        }
      } catch (tokenError) {
        console.log(
          "⚠️ Token balance fetch failed, continuing with SOL only:",
          tokenError
        );
      }

      // Convert token array to map
      const tokenBalancesMap: { [key: string]: any } = {};
      tokens.forEach((token) => {
        tokenBalancesMap[token.symbol] = {
          amount: token.amount,
          usd_value: token.usd_value,
          mint: token.mint,
          decimals: token.decimals,
        };
      });

      // Get latest SOL price (cached/fallback) and compute USD value
      const solPrice = await getSolUsdPrice();
      const solUsdValue = (solBalance / LAMPORTS_PER_SOL) * solPrice;
      const tokenTotalValue = tokens.reduce(
        (acc, token) => acc + token.usd_value,
        0
      );

      const balance: WalletBalance = {
        id: this.generateId(),
        wallet_id: pubkey.toBase58(),
        sol_balance: solBalance / LAMPORTS_PER_SOL,
        usd_value: solUsdValue + tokenTotalValue,
        token_count: tokenCount,
        nft_count: nftCount,
        last_updated: new Date().toISOString(),
        token_balances: tokenBalancesMap,
      };

      // Update local storage
      await secureStorageManager.setWalletBalances(balance);
      console.log("✅ Balance fetched successfully:", balance);

      return balance;
    } catch (error: any) {
      console.error("❌ Balance fetch failed:", error);

      // Return zero balance instead of throwing error
      const fallbackBalance: WalletBalance = {
        id: this.generateId(),
        wallet_id: publicKey || "unknown",
        sol_balance: 0,
        usd_value: 0,
        token_count: 0,
        nft_count: 0,
        last_updated: new Date().toISOString(),
      };

      return fallbackBalance;
    }
  }

  // Send token transaction
  async sendToken(
    toAddress: string,
    amount: number,
    tokenMint: string,
    memo?: string
  ): Promise<AppTransaction> {
    try {
      const keypair = this.currentKeypair;
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      const toPublicKey = new PublicKey(toAddress);
      const tokenMintPubkey = new PublicKey(tokenMint);

      // Get token program
      const tokenProgram = new PublicKey(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      );

      // Get source token account
      const sourceAccounts =
        await this.connection.getParsedTokenAccountsByOwner(keypair.publicKey, {
          mint: tokenMintPubkey,
        });

      if (sourceAccounts.value.length === 0) {
        throw new Error("No token account found for this mint");
      }

      const sourceAccount = sourceAccounts.value[0].pubkey;

      // Get or create destination token account
      let destinationAccount: PublicKey;
      const destinationAccounts =
        await this.connection.getParsedTokenAccountsByOwner(toPublicKey, {
          mint: tokenMintPubkey,
        });

      if (destinationAccounts.value.length === 0) {
        throw new Error(
          "Recipient does not have a token account for this mint"
        );
      }
      destinationAccount = destinationAccounts.value[0].pubkey;

      // Calculate token amount based on decimals
      const tokenInfo =
        await this.connection.getParsedAccountInfo(tokenMintPubkey);
      const decimals = (tokenInfo.value?.data as any).parsed.info.decimals;
      const tokenAmount = Math.floor(amount * Math.pow(10, decimals));

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();

      // Create transaction
      const transaction = new Transaction({
        feePayer: keypair.publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceAccount,
          destinationAccount,
          keypair.publicKey,
          tokenAmount
        )
      );

      // Sign transaction
      transaction.sign(keypair);

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair],
        {
          commitment: "confirmed",
          skipPreflight: false,
        }
      );

      // Get token symbol
      const symbol = this.getTokenSymbol(tokenMint);

      // Create transaction record
      const appTransaction: AppTransaction = {
        id: this.generateId(),
        user_id: "",
        type: "transfer",
        status: "confirmed",
        signature,
        from_address: keypair.publicKey.toBase58(),
        to_address: toAddress,
        amount,
        token_mint: tokenMint,
        symbol,
        usd_value: symbol === "USDC" ? amount : 0,
        fee: 0.000005,
        nonce: blockhash,
        memo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        is_offline: false,
      };

      // Add to local transactions
      this.addTransactionToHistory(appTransaction);

      return appTransaction;
    } catch (error: any) {
      console.error("Token transfer failed:", error);
      throw new Error(`Failed to send token: ${error.message}`);
    }
  }

  // Helper method to get token symbol
  private getTokenSymbol(mint: string): string {
    const knownTokens: Record<string, string> = {
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
      DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "BONK",
      // Add more known tokens here
    };
    return knownTokens[mint] || "UNKNOWN";
  }

  // Send SOL transaction
  async sendSOL(
    toAddress: string,
    amount: number,
    memo?: string
  ): Promise<AppTransaction> {
    try {
      const keypair = this.currentKeypair;
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      const toPublicKey = new PublicKey(toAddress);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();

      // Create transaction
      const transaction = new Transaction({
        feePayer: keypair.publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Sign transaction
      transaction.sign(keypair);

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair],
        {
          commitment: "confirmed",
          skipPreflight: false,
        }
      );

      // Create transaction record
      const appTransaction: AppTransaction = {
        id: this.generateId(),
        user_id: "",
        type: "transfer",
        status: "confirmed",
        signature,
        from_address: keypair.publicKey.toBase58(),
        to_address: toAddress,
        amount,
        token_mint: undefined,
        symbol: "SOL",
        usd_value: 0,
        fee: 0.000005,
        nonce: blockhash,
        memo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        is_offline: false,
      };

      // Add to local transactions
      this.addTransactionToHistory(appTransaction);

      return appTransaction;
    } catch (error: any) {
      console.error("SOL transfer failed:", error);
      throw new Error(`Failed to send SOL: ${error.message}`);
    }
  }

  // Create offline transaction (for P2P transfers)
  async createOfflineTransaction(
    toAddress: string,
    amount: number,
    memo?: string,
    token?: { symbol: string; mint: string }
  ): Promise<OfflineTransaction> {
    let nonceAccount: string | undefined;
    try {
      const keypair = this.currentKeypair;
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      const toPublicKey = new PublicKey(toAddress);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Generate transaction ID first
      const transactionId = this.generateId();

      // Reserve a durable nonce for this offline transaction
      // CRITICAL: Pass transactionId to prevent nonce reuse (security fix)
      // This ensures the transaction doesn't expire like regular blockhashes do
      const { nonce, nonceAccount: reservedNonceAccount } =
        await nonceManager.reserveNonce(
          keypair.publicKey.toBase58(),
          transactionId
        );
      nonceAccount = reservedNonceAccount;

      // Create transaction with durable nonce
      const transaction = new Transaction({
        feePayer: keypair.publicKey,
        blockhash: nonce, // Use nonce as blockhash for offline transactions
        lastValidBlockHeight: (await this.connection.getBlockHeight()) + 150,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Add nonce advance instruction to consume the nonce when transaction is executed
      transaction.add(
        SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: keypair.publicKey,
        })
      );

      // Sign transaction
      transaction.sign(keypair);

      // Convert to base64 for P2P transfer
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const envelope = {
        version: 1,
        transaction_data: Buffer.from(serializedTransaction).toString("base64"),
        signatures: transaction.signatures.map((sig) =>
          sig.signature ? Buffer.from(sig.signature).toString("base64") : ""
        ),
        nonce,
        nonce_account: nonceAccount,
        metadata: {
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes for durable nonces
          network: "devnet",
        },
      };

      const deviceId = await this.getDeviceId();

      const offlineTransaction: OfflineTransaction = {
        id: transactionId,
        user_id: "",
        type: "transfer",
        status: "signed_offline",
        signature: "",
        from_address: keypair.publicKey.toBase58(),
        to_address: toAddress,
        amount,
        token_mint: token?.mint,
        symbol: token?.symbol || "SOL",
        usd_value: 0,
        fee: 0.000005,
        nonce,
        durable_nonce_account: nonceAccount,
        memo,
        envelope: JSON.stringify(envelope),
        signed_data: Buffer.from(serializedTransaction).toString("base64"),
        p2p_metadata: {
          transport: "bluetooth",
          sender_device_id: deviceId,
          hop_count: 0,
          discovered_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
        },
        is_offline: true,
        sync_attempts: 0,
        retry_count: 0,
        sync_priority: 1,
        offline_version: 1,
        offline_metadata: {
          local_signed_at: new Date().toISOString(),
          original_created_at: new Date().toISOString(),
          device_id: deviceId,
          network_status: "offline",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        blockhash: nonce,
        last_valid_block_height: (await this.connection.getBlockHeight()) + 150,
      };

      // Add to transaction queue
      await transactionQueue.enqueue(offlineTransaction);

      return offlineTransaction;
    } catch (error: any) {
      console.error("Offline transaction creation failed:", error);
      // CRITICAL: Release nonce if transaction creation fails
      // This prevents nonce from being stuck in reserved state
      if (nonceAccount) {
        try {
          nonceManager.releaseNonce(nonceAccount);
        } catch (releaseError) {
          console.error("Failed to release nonce after error:", releaseError);
        }
      }
      throw new Error(`Failed to create offline transaction: ${error.message}`);
    }
  }

  // Process received offline transaction
  async processReceivedOfflineTransaction(
    transactionData: string
  ): Promise<void> {
    try {
      const envelope = JSON.parse(transactionData);

      // Verify transaction
      const transaction = Transaction.from(
        Buffer.from(envelope.transaction_data, "base64")
      );

      // Check if transaction is for this wallet
      const keypair = this.currentKeypair;
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      // Add to local state as received transaction
      const receivedTransaction: AppTransaction = {
        id: this.generateId(),
        user_id: "",
        type: "receive",
        status: "pending",
        from_address: transaction.feePayer?.toBase58() || "",
        to_address: keypair.publicKey.toBase58(),
        amount: 0,
        token_mint: undefined,
        symbol: "SOL",
        usd_value: 0,
        fee: 0,
        nonce: envelope.nonce,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_offline: false,
      };

      this.addTransactionToHistory(receivedTransaction);
    } catch (error: any) {
      console.error("Offline transaction processing failed:", error);
      throw new Error(
        `Failed to process received transaction: ${error.message}`
      );
    }
  }

  // Airdrop SOL (devnet only)
  async requestAirdrop(amount: number = 1): Promise<string> {
    try {
      const keypair = this.currentKeypair;
      if (!keypair) {
        throw new Error("Wallet not unlocked");
      }

      console.log("💰 Requesting airdrop for:", keypair.publicKey.toBase58());
      const signature = await this.connection.requestAirdrop(
        keypair.publicKey,
        amount * LAMPORTS_PER_SOL
      );

      console.log("✅ Airdrop requested, signature:", signature);

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, "confirmed");

      return signature;
    } catch (error: any) {
      console.error("Airdrop failed:", error);
      throw new Error(`Failed to request airdrop: ${error.message}`);
    }
  }

  // Get transaction history
  async getTransactionHistory(limit: number = 50): Promise<AppTransaction[]> {
    try {
      // Try to get from local storage first
      const localTransactions =
        await secureStorageManager.getRecentTransactions();

      if (localTransactions.length > 0) {
        return localTransactions.slice(0, limit);
      }

      // Fetch from blockchain if no local data
      const keypair = this.currentKeypair;
      if (!keypair) {
        return [];
      }

      const signatures = await this.connection.getSignaturesForAddress(
        keypair.publicKey,
        { limit }
      );

      const transactions: AppTransaction[] = [];

      for (const signatureInfo of signatures) {
        const transaction = await this.connection.getTransaction(
          signatureInfo.signature,
          {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          }
        );

        if (transaction) {
          const appTransaction: AppTransaction = {
            id: this.generateId(),
            user_id: "",
            type: "transfer",
            status: "confirmed",
            signature: signatureInfo.signature,
            from_address: keypair.publicKey.toBase58(),
            to_address: "",
            amount: 0,
            token_mint: undefined,
            symbol: "SOL",
            usd_value: 0,
            fee: transaction.meta?.fee
              ? transaction.meta.fee / LAMPORTS_PER_SOL
              : 0,
            nonce: transaction.transaction.message.recentBlockhash,
            created_at: new Date(
              (transaction.blockTime || 0) * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
            confirmed_at: new Date(
              (transaction.blockTime || 0) * 1000
            ).toISOString(),
            is_offline: false,
          };

          transactions.push(appTransaction);
        }
      }

      // Store in local storage
      await secureStorageManager.setRecentTransactions(transactions);

      return transactions;
    } catch (error: any) {
      console.error("Transaction history fetch failed:", error);
      return [];
    }
  }

  // NEW: Get balance with just public key (no unlock needed)
  async getBalanceByPublicKey(publicKey: string): Promise<WalletBalance> {
    return this.getBalance(publicKey);
  }

  // Private helper methods
  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceId(): Promise<string> {
    let deviceId = await keyManagementService.secureRetrieve("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await keyManagementService.secureStore("device_id", deviceId);
    }
    return deviceId;
  }

  private async addTransactionToHistory(
    transaction: AppTransaction
  ): Promise<void> {
    const currentTransactions =
      await secureStorageManager.getRecentTransactions();
    const updatedTransactions = [transaction, ...currentTransactions].slice(
      0,
      100
    );
    await secureStorageManager.setRecentTransactions(updatedTransactions);
  }

  private async updateWalletLastUsed(): Promise<void> {
    const encryptedKeypair = await secureStorageManager.getEncryptedKeypair();
    if (encryptedKeypair) {
      // Update last used timestamp in local storage
    }
  }

  // Lock wallet (clear from memory)
  lockWallet(): void {
    this.currentKeypair = null;
  }

  // Check if wallet is unlocked
  isUnlocked(): boolean {
    return this.currentKeypair !== null;
  }

  // Get current public key
  getCurrentPublicKey(): string | null {
    return this.currentKeypair?.publicKey.toBase58() || null;
  }

  // Get current keypair
  getCurrentKeypair(): Keypair | null {
    return this.currentKeypair;
  }

  // NEW: Get public key from storage (even when locked)
  async getStoredPublicKey(): Promise<string | null> {
    const encryptedKeypair = await secureStorageManager.getEncryptedKeypair();
    return encryptedKeypair?.publicKey || null;
  }
}

export const walletService = new WalletService();
