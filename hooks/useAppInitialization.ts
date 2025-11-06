import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useEffect, useState } from "react";

export const useAppInitialization = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isInitialized: isWalletInitialized, initializeWallet } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (isInitializing || initializationAttempted || isAuthLoading) {
        return;
      }

      try {
        setIsInitializing(true);
        console.log("🚀 Starting app initialization...", {
          isAuthLoading,
          isAuthenticated,
          isWalletInitialized,
        });

        if (!isAuthenticated) {
          console.log("🔐 No active authentication, skipping initialization");
          setInitializationAttempted(true);
          return;
        }

        if (!isWalletInitialized) {
          console.log("💰 Initializing wallet...");
          await initializeWallet();
          console.log("✅ Wallet initialization completed");
        }

        setInitializationAttempted(true);
        console.log("✅ App initialization completed successfully");
      } catch (err) {
        console.error("🚨 App initialization failed:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown initialization error")
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [
    isAuthLoading,
    isAuthenticated,
    isWalletInitialized,
    initializeWallet,
    isInitializing,
    initializationAttempted,
  ]);

  return {
    isInitializing,
    error,
    isInitialized: initializationAttempted && !isInitializing && !error,
  };
};
