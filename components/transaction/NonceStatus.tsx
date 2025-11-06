import { Text } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTransactionContext } from "@/contexts/TransactionContext";
import { DurableNonceConfig } from "@/types";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

interface NonceStatusProps {
  nonceConfig: DurableNonceConfig;
  transactionId?: string;
}

export const NonceStatus: React.FC<NonceStatusProps> = ({
  nonceConfig,
  transactionId,
}) => {
  const [nonceStatus, setNonceStatus] = useState<{
    isValid: boolean;
    isUsed: boolean;
    expiresAt: string;
    error?: string;
  } | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const { checkNonceStatus } = useTransactionContext();

  const checkStatusCallback = React.useCallback(async () => {
    if (!nonceConfig?.nonceValue) return;

    setIsChecking(true);
    try {
      const status = await checkNonceStatus(nonceConfig.nonceValue);
      setNonceStatus(status);
    } catch (error: any) {
      console.error("Failed to check nonce status:", error);
      setNonceStatus((prev) => ({
        ...(prev || { isValid: false, isUsed: false, expiresAt: "" }),
        error: error?.message || "Failed to check nonce status",
      }));
    } finally {
      setIsChecking(false);
    }
  }, [nonceConfig?.nonceValue, checkNonceStatus]);

  useEffect(() => {
    if (nonceConfig?.nonceValue) {
      checkStatusCallback();
    }
  }, [nonceConfig?.nonceValue, checkStatusCallback]);

  // Set up auto-refresh every minute if nonce is valid and not used
  useEffect(() => {
    if (nonceStatus?.isValid && !nonceStatus?.isUsed) {
      const timer = setInterval(checkStatusCallback, 60000);
      return () => clearInterval(timer);
    }
  }, [nonceStatus?.isValid, nonceStatus?.isUsed, checkStatusCallback]);

  const checkStatus = async () => {
    if (!nonceConfig?.nonceValue) return;

    setIsChecking(true);
    try {
      const status = await checkNonceStatus(nonceConfig.nonceValue);
      setNonceStatus(status);
    } catch (error: any) {
      console.error("Failed to check nonce status:", error);
      setNonceStatus((prev) => ({
        ...(prev || { isValid: false, isUsed: false, expiresAt: "" }),
        error: error?.message || "Failed to check nonce status",
      }));
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (!nonceStatus) return "text-gray-400";
    if (nonceStatus.isUsed) return "text-green-400";
    if (!nonceStatus.isValid) return "text-red-400";

    // Check if expiring soon (less than 5 minutes)
    const expiresIn = new Date(nonceStatus.expiresAt).getTime() - Date.now();
    if (expiresIn < 5 * 60 * 1000) {
      return "text-yellow-400";
    }

    return "text-blue-400";
  };

  const getStatusText = () => {
    if (!nonceStatus) return "Checking...";
    if (nonceStatus.isUsed) return "Used";
    if (!nonceStatus.isValid) return "Expired";

    const expiresIn = new Date(nonceStatus.expiresAt).getTime() - Date.now();
    if (expiresIn < 60 * 1000) {
      return "Expiring soon";
    }

    return "Valid";
  };

  const getStatusIcon = () => {
    if (!nonceStatus || isChecking) return "clock";
    if (nonceStatus.isUsed) return "checkmark.circle";
    if (!nonceStatus.isValid) return "xmark.circle";
    return "lock";
  };

  const formatTimeRemaining = () => {
    if (!nonceStatus || nonceStatus.isUsed || !nonceStatus.isValid) return "";

    const expiresIn = new Date(nonceStatus.expiresAt).getTime() - Date.now();
    if (expiresIn <= 0) return "Expired";

    const minutes = Math.floor(expiresIn / 60000);
    const seconds = Math.floor((expiresIn % 60000) / 1000);

    if (minutes <= 0) {
      return `Expires in ${seconds}s`;
    } else if (minutes < 60) {
      return `Expires in ${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `Expires in ${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-semibold text-sm">Nonce Status</Text>
        <TouchableOpacity
          onPress={checkStatus}
          disabled={isChecking}
          accessibilityLabel="Refresh nonce status"
          accessibilityHint="Double tap to check the current status of the nonce"
        >
          <IconSymbol
            name={isChecking ? "arrow.clockwise" : "arrow.clockwise"}
            color={isChecking ? "#6B7280" : "#22C55E"}
            size={16}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-2 mb-1">
        <IconSymbol
          name={getStatusIcon()}
          color={
            nonceStatus?.isUsed
              ? "#10B981"
              : !nonceStatus?.isValid
                ? "#EF4444"
                : nonceStatus?.error
                  ? "#F59E0B"
                  : "#3B82F6"
          }
          size={16}
        />
        <Text className={`text-sm font-medium ${getStatusColor()}`}>
          {isChecking ? "Checking..." : getStatusText()}
        </Text>
      </View>

      {nonceStatus?.error ? (
        <Text className="text-red-400 text-xs mb-2">
          Error: {nonceStatus.error}
        </Text>
      ) : (
        nonceStatus && (
          <>
            <View className="bg-black/20 rounded-lg p-2 mb-2">
              <Text className="text-white/60 text-xs mb-1">
                Nonce: {nonceConfig.nonceValue.slice(0, 8)}...
                {nonceConfig.nonceValue.slice(-8)}
              </Text>
              <Text className="text-white/60 text-xs">
                Account: {nonceConfig.nonceAccount.slice(0, 8)}...
                {nonceConfig.nonceAccount.slice(-8)}
              </Text>
            </View>
            {formatTimeRemaining() && (
              <Text
                className={`text-xs ${
                  new Date(nonceStatus.expiresAt).getTime() - Date.now() <
                  5 * 60 * 1000
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {formatTimeRemaining()}
              </Text>
            )}
          </>
        )
      )}

      {transactionId && (
        <View className="border-t border-white/10 pt-2 mt-2">
          <Text className="text-white/40 text-xs">
            Transaction: {transactionId.slice(0, 8)}...{transactionId.slice(-8)}
          </Text>
        </View>
      )}
    </View>
  );
};
