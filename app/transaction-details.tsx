import { SafeAreaView, Text } from "@/components/ui";
import { useWallet } from "@/contexts/WalletContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

export default function TransactionDetails() {
  const params = useLocalSearchParams();

  // In a real app, you'd fetch this data based on the transaction ID
  // For now, we'll use sample data that matches the tapped transaction
  // Get actual transaction from context
  const { transactions, pendingTransactions, solPrice } = useWallet();

  const tx = [...transactions, ...pendingTransactions].find(
    (tx) => tx.id === params.id
  );

  const getAssetIcon = (token?: { symbol: string; mint: string }) => {
    if (!token || token.symbol === "SOL") {
      return require("@/assets/images/icons/sol-icon.png");
    }
    switch (token.symbol) {
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

  // Format transaction data for display
  const transaction = tx
    ? {
        ...tx,
        created_timestamp: new Date(tx.created_at),
        updated_timestamp: new Date(tx.updated_at),
        valueUSD: tx.usd_value ? `$${tx.usd_value.toFixed(2)}` : undefined,
        from_address: tx.from_address,
        to_address: tx.to_address,
        networkFee: `${tx.fee} SOL`,
        networkFeeUSD: `$${((tx.fee || 0) * (solPrice || 20)).toFixed(4)}`,
        symbol: tx.symbol || "SOL",
        assetIcon: getAssetIcon({
          symbol: tx.symbol || "SOL",
          mint: tx.token_mint || "",
        }),
        connectionMode: tx.is_offline ? "offline" : "online",
      }
    : null;

  if (!transaction) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Transaction not found</Text>
      </View>
    );
  }

  const getStatusInfo = (txStatus: string) => {
    const status = txStatus.toLowerCase();
    switch (status) {
      case "pending":
      case "queued":
      case "draft":
        return {
          icon: "time-outline" as const,
          color: "#9CA3AF",
          label: "Pending",
          description: "Transaction initiated but not yet processed",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
        };
      case "signed_offline":
        return {
          icon: "share" as const,
          color: "#FBBF24",
          label: "Awaiting Confirmation",
          description: "Transaction signed offline, waiting for sync",
          bgColor: "bg-yellow-500/20",
          textColor: "text-yellow-400",
        };
      case "received":
        return {
          icon: "download" as const,
          color: "#60A5FA",
          label: "Received (Offline)",
          description: "Transaction received offline, awaiting verification",
          bgColor: "bg-blue-500/20",
          textColor: "text-blue-400",
        };
      case "syncing":
        return {
          icon: "sync-outline" as const,
          color: "#8B5CF6",
          label: "Syncing to Solana",
          description: "Reconnecting online and verifying on blockchain",
          bgColor: "bg-purple-500/20",
          textColor: "text-purple-400",
        };
      case "confirmed":
        return {
          icon: "checkmark-circle" as const,
          color: "#22C55E",
          label: "Confirmed on Solana",
          description: "Transaction verified and finalized on blockchain",
          bgColor: "bg-green-500/20",
          textColor: "text-green-400",
        };
      case "failed":
        return {
          icon: "close-circle" as const,
          color: "#EF4444",
          label: "Failed",
          description: "Transaction failed due to error",
          bgColor: "bg-red-500/20",
          textColor: "text-red-400",
        };
      case "expired":
        return {
          icon: "close-circle" as const,
          color: "#9CA3AF",
          label: "Expired",
          description: "Transaction expired",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
        };
      default:
        return {
          icon: "help-circle" as const,
          color: "#9CA3AF",
          label: "Unknown Status",
          description: "Transaction status unknown",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
        };
    }
  };

  const statusInfo = getStatusInfo(transaction.status);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      relative: "2 minutes ago", // You'd calculate this relative to now
    };
  };

  const { date, time, relative } = formatDate(transaction.created_at);

  const handleViewOnExplorer = () => {
    // In a real app, this would open the transaction in Solana Explorer
    console.log("View on explorer:", transaction.signature);
  };

  const handleShare = () => {
    // Share transaction details
    console.log("Share transaction");
  };

  const handleContact = () => {
    // Open contact details or start chat
    console.log("Contact user");
  };

  return (
    <View className="flex-1 bg-black relative">
      {/* Gradient Background */}
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 400 }}
        resizeMode="cover"
      />

      <SafeAreaView className="flex-1 bg-transparent">
        {/* Header */}
        <View className="w-full px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-semibold text-xl">
              Transaction
            </Text>

            <TouchableOpacity
              onPress={handleShare}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Main Transaction Card */}
          <View className="px-5 mb-6">
            <View className="bg-white/5 rounded-3xl border border-white/10 p-6">
              {/* Amount Section */}
              <View className="items-center mb-6">
                <View
                  className={`w-20 h-20 rounded-2xl items-center justify-center ${
                    transaction.type === "receive"
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  <Ionicons
                    name={
                      transaction.type === "receive" ? "arrow-down" : "arrow-up"
                    }
                    size={32}
                    color={
                      transaction.type === "receive" ? "#22C55E" : "#EF4444"
                    }
                  />
                </View>
                <Text
                  className={`text-3xl font-semibold mt-4 ${
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
                  {transaction.amount} {transaction.symbol}
                </Text>
                <Text className="text-white/60 text-lg mt-2">
                  {transaction.valueUSD}
                </Text>
                <Text className="text-white/40 text-sm mt-1">{relative}</Text>
              </View>

              {/* Status Badge */}
              <View
                className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl mb-6 ${statusInfo.bgColor}`}
              >
                <Ionicons
                  name={statusInfo.icon}
                  size={20}
                  color={statusInfo.color}
                />
                <Text className={`font-semibold ${statusInfo.textColor}`}>
                  {statusInfo.label}
                </Text>
              </View>

              {/* Status Description */}
              <Text className="text-white/60 text-center text-sm mb-6">
                {statusInfo.description}
              </Text>

              {/* Primary Action Buttons */}
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  onPress={handleViewOnExplorer}
                  className="flex-1 bg-primary h-14 justify-center rounded-full items-center"
                >
                  <Text className="text-primary-foreground font-semibold">
                    View on Explorer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContact}
                  className="flex-1 bg-white/10 h-14 justify-center rounded-full items-center border border-white/20"
                >
                  <Text className="text-white font-semibold">Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Transaction Details */}
          <View className="px-5 mb-6">
            <Text className="text-white font-semibold text-xl mb-4">
              Transaction Details
            </Text>

            <View className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
              {/* Date & Time */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <Text className="text-white font-medium">Date & Time</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white">{date}</Text>
                    <Text className="text-white/60 text-sm">{time}</Text>
                  </View>
                </View>
              </View>

              {/* From/To */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name={
                        transaction.type === "receive"
                          ? "person-outline"
                          : "person-add-outline"
                      }
                      size={20}
                      color="#9CA3AF"
                    />
                    <Text className="text-white font-medium">
                      {transaction.type === "receive" ? "From" : "To"}
                    </Text>
                  </View>
                  <View className="items-end flex-1 ml-4">
                    <Text className="text-white text-right">
                      {transaction.type === "receive"
                        ? transaction.from_address
                        : transaction.to_address}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons
                        name={
                          transaction.connectionMode === "offline"
                            ? "cellular-outline"
                            : "wifi-outline"
                        }
                        size={12}
                        color="#9CA3AF"
                      />
                      <Text className="text-white/60 text-xs">
                        {transaction.connectionMode === "offline"
                          ? "Offline Mode"
                          : "Online Mode"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Transaction Hash */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="finger-print-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <Text className="text-white font-medium">
                      Transaction ID
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Text className="text-primary font-medium">
                      {transaction.signature}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Network Fee */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="flash-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Network Fee</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white">{transaction.networkFee}</Text>
                    <Text className="text-white/60 text-sm">
                      {transaction.networkFeeUSD}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Block Number */}
              <View className="p-4 border-b border-white/10">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="cube-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Block</Text>
                  </View>
                  <Text className="text-white">
                    {transaction.last_valid_block_height}
                  </Text>
                </View>
              </View>

              {/* Nonce */}
              <View className="p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="list-outline" size={20} color="#9CA3AF" />
                    <Text className="text-white font-medium">Nonce</Text>
                  </View>
                  <Text className="text-white">{transaction.nonce}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          {transaction.memo && (
            <View className="px-5 mb-6">
              <Text className="text-white font-semibold text-xl mb-4">
                Note
              </Text>
              <View className="bg-white/5 rounded-3xl border border-white/10 p-4">
                <Text className="text-white/80 text-base leading-6">
                  {transaction.memo}
                </Text>
              </View>
            </View>
          )}

          {/* Transaction Timeline */}
          <View className="px-5">
            <Text className="text-white font-semibold text-xl mb-4">
              Transaction Timeline
            </Text>
            <View className="bg-white/5 rounded-3xl border border-white/10 p-4">
              {/* Timeline steps would go here */}
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">
                  Transaction created offline
                </Text>
                <Text className="text-white/60 text-sm">10:28 AM</Text>
              </View>
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">
                  Encrypted payload delivered
                </Text>
                <Text className="text-white/60 text-sm">10:29 AM</Text>
              </View>
              <View className="flex-row items-center gap-3 py-2">
                <View className="w-3 h-3 bg-green-400 rounded-full" />
                <Text className="text-white flex-1">Confirmed on Solana</Text>
                <Text className="text-white/60 text-sm">10:30 AM</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
