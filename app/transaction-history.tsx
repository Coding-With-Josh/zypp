import { SafeAreaView, Text } from "@/components/ui";
import { useWallet } from "@/contexts/WalletContext";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

export default function TransactionHistory() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { transactions, pendingTransactions } = useWallet();

  const formatDate = (date: string) => {
    const txDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (txDate.toDateString() === today.toDateString()) return "Today";
    if (txDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return txDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Combine and format transactions
  const allTransactions = [...transactions, ...pendingTransactions].map(
    (tx) => ({
      id: tx.id,
      type: tx.type,
      symbol: tx.symbol || "SOL",
      amount: tx.amount.toString(),
      status: tx.status,
      timestamp: formatDistanceToNow(new Date(tx.created_at), {
        addSuffix: true,
      }),
      from_address: tx.from_address,
      to_address: tx.to_address,
      connectionMode: tx.is_offline ? "offline" : "online",
      valueUSD: tx.usd_value ? `$${tx.usd_value.toFixed(2)}` : undefined,
      date: formatDate(tx.created_at),
    })
  );

  const filters = [
    { id: "all", label: "All" },
    { id: "send", label: "Sent" },
    { id: "receive", label: "Received" },
    { id: "pending", label: "Pending" },
  ];

  const getStatusIcon = (
    status: string
  ): {
    icon:
      | "time-outline"
      | "share"
      | "download"
      | "sync-outline"
      | "checkmark-circle"
      | "close-circle"
      | "heart"
      | "help-circle";
    color: string;
    label: string;
  } => {
    switch (status) {
      case "pending":
        return {
          icon: "time-outline",
          color: "#9CA3AF",
          label: "Pending Sync",
        };
      case "sent":
        return {
          icon: "share",
          color: "#FBBF24",
          label: "Awaiting Confirmation",
        };
      case "received":
        return {
          icon: "download",
          color: "#60A5FA",
          label: "Received (Offline)",
        };
      case "syncing":
        return {
          icon: "sync-outline",
          color: "#8B5CF6",
          label: "Syncing to Solana",
        };
      case "confirmed":
        return {
          icon: "checkmark-circle",
          color: "#22C55E",
          label: "Confirmed",
        };
      case "failed":
        return { icon: "close-circle", color: "#EF4444", label: "Failed" };
      case "tipped":
        return { icon: "heart", color: "#EC4899", label: "Tipped" };
      default:
        return { icon: "help-circle", color: "#9CA3AF", label: "Unknown" };
    }
  };

  const getTransactionIcon = (
    type: string
  ): { icon: "download" | "share"; color: string } => {
    if (type === "receive") {
      return { icon: "download", color: "#22C55E" };
    } else {
      return { icon: "share", color: "#EF4444" };
    }
  };

  const getAssetIcon = (symbol: string) => {
    switch (symbol) {
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

  const filteredTransactions = allTransactions.filter((tx) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "send") return tx.type === "transfer";
    if (selectedFilter === "receive") return tx.type === "receive";
    if (selectedFilter === "pending")
      return (
        tx.status === "draft" ||
        tx.status === "queued" ||
        tx.status === "signed_offline"
      );
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (groups: any, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {}
  );

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
              className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-semibold text-xl">
              Transaction History
            </Text>

            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <AntDesign name="filter" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-[-49rem]" // Add margin-bottom
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              className={`px-6 h-12 flex items-center flex-row rounded-full border ${
                selectedFilter === filter.id
                  ? "bg-primary border-primary"
                  : "bg-black/15 border-white/10 pl-4"
              }`}
            >
              <Text
                className={
                  selectedFilter === filter.id
                    ? "text-primary-foreground font-semibold"
                    : "text-white font-medium"
                }
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }} // Add paddingTop
        >
          {Object.keys(groupedTransactions).map((date) => (
            <View key={date} className="mb-6">
              <Text className="text-white/60 font-medium text-sm mb-3">
                {date}
              </Text>

              <View className="bg-black/15 rounded-3xl border border-white/10 overflow-hidden">
                {groupedTransactions[date].map(
                  (transaction: any, index: number) => {
                    const statusInfo = getStatusIcon(transaction.status);
                    const txIcon = getTransactionIcon(transaction.type);

                    return (
                      <TouchableOpacity
                        key={transaction.id}
                        className={`flex-row items-center justify-between p-4 ${
                          index !== groupedTransactions[date].length - 1
                            ? "border-b border-white/10"
                            : ""
                        }`}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push(`/transaction-details?id=${transaction}`)
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
                                name={txIcon.icon}
                                size={24}
                                color={txIcon.color}
                              />
                            </View>
                            {/* Asset Icon Badge */}
                            <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full border border-white/20 items-center justify-center">
                              <Image
                                source={getAssetIcon(transaction.symbol)}
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
                                  name={statusInfo.icon}
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
                                ? `From: ${transaction.from_address.slice(0, 4)}...${transaction.from_address.slice(-4)}`
                                : `To: ${transaction.to_address.slice(0, 4)}...${transaction.to_address.slice(-4)}`}
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
                            {transaction.type === "receive" ? "+" : "-"}
                            {transaction.amount} {transaction.symbol}
                          </Text>
                          <Text className="text-white/60 text-sm mt-1">
                            {transaction.valueUSD}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>
          ))}

          {/* Empty State */}
          {filteredTransactions.length === 0 && (
            <View className="items-center justify-center py-16">
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text className="text-white font-semibold text-xl mt-4">
                No transactions found
              </Text>
              <Text className="text-white/60 text-center mt-2 px-8">
                {selectedFilter === "all"
                  ? "You haven't made any transactions yet"
                  : `No ${selectedFilter} transactions found`}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
