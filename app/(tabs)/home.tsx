import { QRScannerModal } from "@/components/blocks/modals/qr-scanner-modal";
import { SafeAreaView, Text } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useNetworkConnection } from "@/hooks/useNetworkConnection";
import { TransactionStatus, TransactionType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    wallet,
    balance,
    transactions,
    pendingTransactions,
    refreshData,
    solPrice,
    isLoading: walletLoading,
  } = useWallet();

  const { user } = useAuth();
  const { isConnected } = useNetworkConnection();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (!isConnected) {
        Alert.alert(
          "Offline Mode",
          "You are currently offline. Some data may not be up to date."
        );
      }
      await refreshData();
    } catch (err) {
      console.error("Failed to refresh:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      Alert.alert(
        "Refresh Failed",
        "Could not update your balance and transactions. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, isConnected]);

  // Transform transactions for display
  const recentTransactions = useMemo(() => {
    // Combine and sort both online and offline transactions
    const allTransactions = [
      ...transactions,
      ...pendingTransactions.map((tx) => ({
        ...tx,
        status: tx.status === "draft" ? "queued" : tx.status,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return allTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      asset: tx.symbol || "SOL",
      amount: tx.amount.toString(),
      status: tx.status,
      timestamp: formatDistanceToNow(new Date(tx.created_at), {
        addSuffix: true,
      }),
      from: tx.from_address,
      to: tx.to_address,
      connectionMode: "is_offline" in tx ? "offline" : "online",
      valueUSD: tx.usd_value ? `$${tx.usd_value.toFixed(2)}` : undefined,
    }));
  }, [transactions, pendingTransactions]);

  type IconType =
    | "arrow-up-outline"
    | "arrow-down-outline"
    | "time-outline"
    | "sync-outline"
    | "checkmark-circle"
    | "close-circle"
    | "heart"
    | "help-circle"
    | "share"
    | "download";

  interface StatusIconInfo {
    icon: IconType;
    color: string;
    label: string;
  }

  const getStatusIcon = (status: TransactionStatus): StatusIconInfo => {
    switch (status) {
      case "draft":
      case "queued":
      case "pending":
        return {
          icon: "time-outline",
          color: "#9CA3AF",
          label: "Pending Sync",
        };
      case "signed_offline":
        return {
          icon: "arrow-up-outline",
          color: "#FBBF24",
          label: "Signed Offline",
        };
      case "confirmed":
        return {
          icon: "checkmark-circle",
          color: "#22C55E",
          label: "Confirmed",
        };
      case "failed":
        return { icon: "close-circle", color: "#EF4444", label: "Failed" };
      case "expired":
        return { icon: "close-circle", color: "#9CA3AF", label: "Expired" };
      default:
        return { icon: "help-circle", color: "#9CA3AF", label: "Unknown" };
    }
  };

  interface TxIconInfo {
    icon: IconType;
    color: string;
  }

  const getTransactionIcon = (type: TransactionType): TxIconInfo => {
    if (type === "receive") {
      return { icon: "download", color: "#22C55E" };
    } else {
      return { icon: "share", color: "#EF4444" };
    }
  };

  const getAssetIcon = (asset: string) => {
    switch (asset) {
      case "SOL":
        return require("@/assets/images/icons/sol-icon.png");
      case "USDC":
        return require("@/assets/images/icons/usdc-icon.png");
      case "BONK":
        return require("@/assets/images/icons/bonk-icon.png");
      case "RAY":
        return require("@/assets/images/icons/ray-icon.png");
      default:
        return require("@/assets/images/icons/unknown-token.png");
    }
  };

  return (
    <View className="flex-1 bg-black relative">
      {/* Gradient Background */}
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 500 }}
        resizeMode="cover"
      />

      <SafeAreaView className="flex-1 bg-transparent items-center">
        {/* Fixed Header */}
        <View className="w-full px-5 pt-4 pb-4 bg-transparent">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center"
              accessibilityLabel="Search"
              activeOpacity={0.8}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="search-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 px-2 pr-3 h-14 rounded-full bg-black/15"
              accessibilityLabel="User profile"
              activeOpacity={0.8}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              onPress={() => router.push("/(profile)/edit" as any)}
            >
              <Image
                source={
                  user?.avatar_url
                    ? { uri: user.avatar_url }
                    : require("@/assets/images/design/user.png")
                }
                className="w-10 h-10 rounded-full"
              />
              <Text className="text-white font-semibold text-base">
                {user?.username || "Unknown User"}
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={14}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
              accessibilityLabel="Scan QR code"
              activeOpacity={0.8}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              onPress={() => setShowQRScannerModal(true)}
            >
              <Ionicons name="scan-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          className="flex-1 w-full"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={["#22C55E"]} // Android
              progressBackgroundColor="#000000" // Android
              title="Refreshing..." // iOS
              titleColor="#ffffff" // iOS
            />
          }
        >
          {/* Balance Section */}
          <View className="mt-8 mb-4 flex flex-col items-center justify-center text-center px-6">
            <Text className="text-white/70 text-lg font-medium">
              Total Balance
            </Text>
            {walletLoading ? (
              <View className="my-2">
                <ActivityIndicator size="small" color="#22C55E" />
              </View>
            ) : (
              <Text className="text-white/60 text-2xl font-medium">
                ≈ ${balance?.usd_value.toFixed(2) || "0.00"}
              </Text>
            )}

            <View className="mt-6 w-full">
              {walletLoading ? (
                // Loading skeleton for balances
                <>
                  <View className="bg-black/15 rounded-2xl border border-white/10 p-4 mb-3 opacity-50">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-white/10 mr-2" />
                        <View className="h-6 w-24 bg-white/10 rounded" />
                      </View>
                      <View className="h-6 w-16 bg-white/10 rounded" />
                    </View>
                  </View>
                  <View className="bg-black/15 rounded-2xl border border-white/10 p-4 mb-3 opacity-50">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-white/10 mr-2" />
                        <View className="h-6 w-24 bg-white/10 rounded" />
                      </View>
                      <View className="h-6 w-16 bg-white/10 rounded" />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* SOL Balance */}
                  <View className="bg-black/15 rounded-2xl border border-white/10 p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Image
                          source={require("@/assets/images/icons/sol-icon.png")}
                          className="w-8 h-8 mr-2"
                        />
                        <Text className="text-white font-semibold text-xl">
                          {balance?.sol_balance.toFixed(4) || "0"} SOL
                        </Text>
                      </View>
                      <Text className="text-white/60">
                        ≈ $
                        {(
                          (balance?.sol_balance || 0) * (solPrice || 20)
                        ).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Token Balances */}
                  {balance?.token_balances &&
                    Object.entries(balance.token_balances)
                      .sort(([, a], [, b]) => b.usd_value - a.usd_value)
                      .map(([tokenSymbol, tokenData]) => (
                        <View
                          key={tokenSymbol}
                          className="bg-black/15 rounded-2xl border border-white/10 p-4 mb-3"
                        >
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <Image
                                source={getAssetIcon(tokenSymbol)}
                                className="w-8 h-8 mr-2"
                              />
                              <Text className="text-white font-semibold text-xl">
                                {tokenData.amount.toFixed(
                                  tokenData.decimals === 6 ? 2 : 4
                                )}{" "}
                                {tokenSymbol}
                              </Text>
                            </View>
                            <Text className="text-white/60">
                              ≈ ${tokenData.usd_value.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ))}
                </>
              )}
            </View>
            {wallet && (
              <View className="flex-row items-center mt-5 gap-2">
                {["SOL", "USDC"].map((symbol) => (
                  <TouchableOpacity
                    key={symbol}
                    className="flex-row items-center gap-2 px-4 h-10 rounded-full bg-black/15"
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.21)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <Image source={getAssetIcon(symbol)} className="size-6" />
                    <Text className="text-white font-semibold text-base">
                      {symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* For now, hiding weekly change until we track historical data */}
          </View>

          {/* Action Buttons */}
          <View className="mt-8 mb-6 flex-row justify-between items-center w-full px-8">
            <View className="flex-1 mx-2 items-center">
              <TouchableOpacity
                className="rounded-full p-6 items-center"
                activeOpacity={0.7}
                style={{
                  backgroundColor: "rgba(0, 15, 0, 0.4)",
                  borderWidth: 1,
                  borderColor: "rgba(151, 151, 151, 0.34)",
                }}
                onPress={() => router.push("/receive")}
              >
                <Image
                  source={require("@/assets/images/icons/receive-icon.png")}
                  className="size-8"
                />
              </TouchableOpacity>
              <Text className="text-white font-medium mt-2">Receive</Text>
            </View>
            <View className="flex-1 mx-2 items-center">
              <TouchableOpacity
                className="rounded-full bg-primary p-7 items-center border"
                activeOpacity={0.7}
                onPress={() => router.push("/add-cash")}
              >
                <Image
                  source={require("@/assets/images/icons/add-icon.png")}
                  className="size-9"
                />
              </TouchableOpacity>
              <Text className="text-white font-medium mt-2">Add Cash</Text>
            </View>
            <View className="flex-1 mx-2 items-center">
              <TouchableOpacity
                className="rounded-full p-6 items-center"
                activeOpacity={0.7}
                style={{
                  backgroundColor: "rgba(0, 15, 0, 0.4)",
                  borderWidth: 1,
                  borderColor: "rgba(151, 151, 151, 0.34)",
                }}
                onPress={() => router.push("/send")}
              >
                <Image
                  source={require("@/assets/images/icons/send-icon.png")}
                  className="size-8"
                />
              </TouchableOpacity>
              <Text className="text-white font-medium mt-2">Send</Text>
            </View>
          </View>

          {/* Recent Transactions Section */}
          <View className="mt-8 px-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white font-semibold text-2xl">
                  Recent Transactions
                </Text>
                {!isConnected && (
                  <View className="flex-row items-center mt-1">
                    <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                    <Text className="text-yellow-500 text-sm">
                      Offline Mode
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push("/transaction-history")}
                className="flex-row items-center gap-1"
              >
                <Text className="text-primary font-semibold">View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#22C55E" />
              </TouchableOpacity>
            </View>

            {walletLoading && !refreshing ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-white/60 mt-4">
                  Loading transactions...
                </Text>
              </View>
            ) : null}

            {/* Transactions List */}
            <View className="bg-black/15 rounded-3xl  overflow-hidden">
              {!error &&
                recentTransactions.length > 0 &&
                recentTransactions.map((transaction, index) => {
                  const statusInfo = getStatusIcon(
                    transaction.status as TransactionStatus
                  );
                  const txIcon = getTransactionIcon(
                    transaction.type as TransactionType
                  );

                  return (
                    <TouchableOpacity
                      key={transaction.id}
                      className={`flex-row items-center justify-between p-4 ${
                        index !== recentTransactions.length - 1
                          ? "border-b border-white/10"
                          : ""
                      }`}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push(`/transaction-details?id=${transaction.id}`)
                      }
                    >
                      {/* Left Side - Icon and Main Info */}
                      <View className="flex-row items-center flex-1">
                        <View className="relative">
                          <View
                            className={`w-12 h-12 rounded-xl items-center justify-center ${
                              transaction.type === "receive"
                                ? "bg-green-500/20"
                                : "bg-red-500/20"
                            }`}
                          >
                            <Ionicons
                              name={txIcon.icon as any}
                              size={24}
                              color={txIcon.color}
                            />
                          </View>
                          {/* Asset Icon Badge */}
                          <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/20 items-center justify-center">
                            <Image
                              source={getAssetIcon(transaction.asset)}
                              className="w-3 h-3"
                            />
                          </View>
                        </View>

                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-white font-semibold text-base capitalize">
                              {transaction.type}
                            </Text>
                            <View className="flex-row items-center gap-1">
                              <Ionicons
                                name={statusInfo.icon as any}
                                size={12}
                                color={statusInfo.color}
                              />
                              <Text className="text-xs text-white/60">
                                {statusInfo.label}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-white/60 text-sm mt-1">
                            {transaction.type === "receive"
                              ? `From: ${transaction.from}`
                              : `To: ${transaction.to}`}
                          </Text>
                          <Text className="text-white/40 text-xs mt-1">
                            {transaction.timestamp} •{" "}
                            {transaction.connectionMode === "offline"
                              ? "📡 Offline"
                              : "🌐 Online"}
                          </Text>
                        </View>
                      </View>

                      {/* Right Side - Amount */}
                      <View className="items-end">
                        <Text
                          className={`text-lg font-semibold ${
                            transaction.type === "receive"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {(Number(transaction.amount) || 0) > 0
                            ? transaction.type === "receive"
                              ? "+"
                              : "-"
                            : ""}
                          {transaction.amount} {transaction.asset}
                        </Text>
                        <Text className="text-white/60 text-sm mt-1">
                          {transaction.valueUSD}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* Error State */}
            {error && !refreshing && (
              <View className="bg-black/15 rounded-3xl border border-white/10 p-8 items-center justify-center">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#EF4444"
                />
                <Text className="text-white font-semibold text-lg mt-4">
                  Could not load transactions
                </Text>
                <Text className="text-white/60 text-center mt-2 mb-4">
                  {error.message}
                </Text>
                <TouchableOpacity
                  onPress={onRefresh}
                  className="bg-primary px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty State (if no transactions) */}
            {!error && recentTransactions.length === 0 && !walletLoading && (
              <View className="bg-black/15 rounded-3xl border border-white/10 p-8 items-center justify-center">
                <Ionicons name="card-outline" size={48} color="#9CA3AF" />
                <Text className="text-white font-semibold text-lg mt-4">
                  No transactions yet
                </Text>
                <Text className="text-white/60 text-center mt-2">
                  Your recent transactions will appear here
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <QRScannerModal
          visible={showQRScannerModal}
          onClose={() => setShowQRScannerModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}
