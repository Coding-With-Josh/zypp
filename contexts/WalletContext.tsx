import { useMarketPrice } from "@/hooks/useMarketPrice";
import { secureStorageManager } from "@/lib/storage/secure-store";
import { transactionQueue } from "@/lib/wallet/transaction-queue";
import { walletService } from "@/lib/wallet/wallet-service";
import {
  OfflineTransaction,
  SolanaWallet,
  Transaction,
  WalletBalance,
} from "@/types";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useSyncContext } from "./SyncContext";

interface WalletContextType {
  // State
  wallet: SolanaWallet | null;
  balance: WalletBalance | null;
  transactions: Transaction[];
  pendingTransactions: OfflineTransaction[];
  solPrice: number | null;
  isUnlocked: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  createWallet: (
    pin: string
  ) => Promise<{ wallet: SolanaWallet; mnemonic: string }>;
  importWallet: (mnemonic: string, pin: string) => Promise<SolanaWallet>;
  unlockWallet: (pin: string) => Promise<void>;
  lockWallet: () => void;
  getBalance: () => Promise<WalletBalance>;
  sendSOL: (
    toAddress: string,
    amount: number,
    memo?: string
  ) => Promise<Transaction>;
  sendToken: (
    toAddress: string,
    amount: number,
    tokenMint: string,
    memo?: string
  ) => Promise<Transaction>;
  createOfflineTransaction: (
    toAddress: string,
    amount: number,
    token?: { symbol: string; mint: string },
    memo?: string
  ) => Promise<OfflineTransaction>;
  processReceivedTransaction: (transactionData: string) => Promise<void>;
  getTransactionHistory: (limit?: number) => Promise<Transaction[]>;
  requestAirdrop: (amount?: number) => Promise<string>;
  refreshData: () => Promise<void>;
  initializeWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<
    OfflineTransaction[]
  >([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Use central market price hook
  const { solPrice, refreshPrice } = useMarketPrice();

  const { user, isAuthenticated } = useAuth();
  const { addToOfflineQueue } = useSyncContext();

  // ADD THIS FUNCTION - Public initialize method
  const initializeWallet = React.useCallback(async (): Promise<void> => {
    try {
      if (isInitialized) {
        console.log("💰 Wallet already initialized");
        return;
      }

      console.log("💰 Initializing wallet context...");
      setIsLoading(true);

      // Check for existing wallet in secure storage REGARDLESS of auth
      const encryptedKeypair = await secureStorageManager.getEncryptedKeypair();
      const storedBalance = await secureStorageManager.getWalletBalances();
      const storedTransactions =
        await secureStorageManager.getRecentTransactions();
      const storedPending = transactionQueue
        .getAll()
        .map((q) => q.transaction as OfflineTransaction);

      if (encryptedKeypair) {
        console.log("💰 Found existing wallet in storage");

        // Get Base58 public key (convert if needed)
        const publicKeyBase58 = await walletService.getStoredPublicKey();

        if (!publicKeyBase58) {
          console.error("❌ Could not get valid public key from storage");
          setIsInitialized(true);
          return;
        }

        const tempWallet: SolanaWallet = {
          id: "local_wallet",
          user_id: user?.id || "",
          public_key: publicKeyBase58, // USE BASE58
          encrypted_private_key: JSON.stringify(encryptedKeypair),
          key_encryption_version: 1,
          wallet_type: "custodial",
          is_primary: true,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        };

        setWallet(tempWallet);
        setBalance(storedBalance);
        setTransactions(storedTransactions);
        setPendingTransactions(storedPending);

        // We rely on useMarketPrice to load cached/fresh price. No-op here.

        console.log("✅ Wallet initialized with address:", publicKeyBase58);
      } else {
        console.log("💰 No existing wallet found");
      }

      console.log("✅ Wallet context initialized");
      setIsInitialized(true);
    } catch (error) {
      console.error("❌ Wallet initialization failed:", error);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, user]);

  // Initialize wallet state - SIMPLIFIED VERSION
  useEffect(() => {
    const init = async () => {
      // Only auto-initialize if authenticated, otherwise wait for manual initializeWallet call
      if (isAuthenticated && !isInitialized) {
        await initializeWallet();
      }
    };

    init();
  }, [isAuthenticated, initializeWallet, isInitialized]);

  const createWallet = async (
    pin: string
  ): Promise<{ wallet: SolanaWallet; mnemonic: string }> => {
    try {
      setIsLoading(true);

      const result = await walletService.createCustodialWallet(pin);

      // Update wallet state
      setWallet(result.wallet);
      setIsUnlocked(true);

      return {
        wallet: result.wallet,
        mnemonic: result.mnemonic,
      };
    } catch (error: any) {
      console.error("Wallet creation failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (
    mnemonic: string,
    pin: string
  ): Promise<SolanaWallet> => {
    try {
      setIsLoading(true);

      const result = await walletService.importFromMnemonic(mnemonic, pin);

      setWallet(result.wallet);
      setIsUnlocked(true);

      return result.wallet;
    } catch (error: any) {
      console.error("Wallet import failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWallet = async (pin: string): Promise<void> => {
    try {
      setIsLoading(true);

      await walletService.unlockWallet(pin);
      setIsUnlocked(true);

      // Refresh wallet data
      await refreshData();
    } catch (error: any) {
      console.error("Wallet unlock failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const lockWallet = (): void => {
    walletService.lockWallet();
    setIsUnlocked(false);
  };

  const getBalance = async (): Promise<WalletBalance> => {
    try {
      // Use public key from wallet, or get from storage
      const publicKey =
        wallet?.public_key || (await walletService.getStoredPublicKey());

      if (!publicKey) {
        throw new Error("No wallet public key available");
      }

      // Force fresh balance from network
      const newBalance = await walletService.getBalanceByPublicKey(publicKey);

      console.log("💰 Updated balance:", newBalance.sol_balance, "SOL");

      // Update state and storage
      setBalance(newBalance);
      await secureStorageManager.setWalletBalances(newBalance);

      // Refresh cached SOL price (best effort)
      try {
        await refreshPrice(true);
      } catch {
        // ignore
      }

      return newBalance;
    } catch (error: any) {
      console.error("Balance fetch failed:", error);

      // Return zero balance as fallback
      const zeroBalance: WalletBalance = {
        id: "fallback",
        wallet_id: wallet?.public_key || "unknown",
        sol_balance: 0,
        usd_value: 0,
        token_count: 0,
        nft_count: 0,
        last_updated: new Date().toISOString(),
        token_balances: {
          USDC: {
            amount: 0,
            usd_value: 0,
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
          },
        },
      };

      setBalance(zeroBalance);
      return zeroBalance;
    }
  };

  const sendSOL = async (
    toAddress: string,
    amount: number,
    memo?: string
  ): Promise<Transaction> => {
    try {
      setIsLoading(true);

      const transaction = await walletService.sendSOL(toAddress, amount, memo);

      // Add to local transactions
      setTransactions((prev) => [transaction, ...prev]);

      // Refresh balance after a delay to allow for network confirmation
      setTimeout(async () => {
        await getBalance();
      }, 2000);

      return transaction;
    } catch (error: any) {
      console.error("SOL transfer failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendToken = async (
    toAddress: string,
    amount: number,
    tokenMint: string,
    memo?: string
  ): Promise<Transaction> => {
    try {
      setIsLoading(true);

      const transaction = await walletService.sendToken(
        toAddress,
        amount,
        tokenMint,
        memo
      );

      // Add to local transactions
      setTransactions((prev) => [transaction, ...prev]);

      // Refresh balance after a delay to allow for network confirmation
      setTimeout(async () => {
        await getBalance();
      }, 2000);

      return transaction;
    } catch (error: any) {
      console.error("Token transfer failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createOfflineTransaction = async (
    toAddress: string,
    amount: number,
    token?: { symbol: string; mint: string },
    memo?: string
  ): Promise<OfflineTransaction> => {
    try {
      setIsLoading(true);

      const transaction = await walletService.createOfflineTransaction(
        toAddress,
        amount,
        memo,
        token
      );

      // Add to pending transactions
      setPendingTransactions((prev) => [transaction, ...prev]);

      // Add to offline queue for sync
      addToOfflineQueue({
        type: "transaction",
        data: transaction,
      });

      return transaction;
    } catch (error: any) {
      console.error("Offline transaction creation failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const processReceivedTransaction = async (
    transactionData: string
  ): Promise<void> => {
    try {
      await walletService.processReceivedOfflineTransaction(transactionData);

      // Refresh transactions
      await getTransactionHistory();
    } catch (error: any) {
      console.error("Transaction processing failed:", error);
      throw error;
    }
  };

  const getTransactionHistory = async (
    limit: number = 50
  ): Promise<Transaction[]> => {
    try {
      const history = await walletService.getTransactionHistory(limit);
      setTransactions(history);
      return history;
    } catch (error: any) {
      console.error("Transaction history fetch failed:", error);
      throw error;
    }
  };

  const requestAirdrop = async (amount: number = 1): Promise<string> => {
    try {
      const signature = await walletService.requestAirdrop(amount);

      // Refresh balance after airdrop
      setTimeout(() => {
        getBalance();
      }, 5000);

      return signature;
    } catch (error: any) {
      console.error("Airdrop failed:", error);
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    try {
      // Always refresh balance, only get transactions if unlocked
      await getBalance();
      if (isUnlocked) {
        await getTransactionHistory();
      }
    } catch (error) {
      console.error("Data refresh failed:", error);
    }
  };

  const value: WalletContextType = {
    // State
    wallet,
    balance,
    transactions,
    pendingTransactions,
    solPrice,
    isUnlocked,
    isLoading,
    isInitialized,

    // Actions
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    getBalance,
    sendSOL,
    sendToken,
    createOfflineTransaction,
    processReceivedTransaction,
    getTransactionHistory,
    requestAirdrop,
    refreshData,
    initializeWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
