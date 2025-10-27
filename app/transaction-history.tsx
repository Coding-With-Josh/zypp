import React, { useState } from "react";
import { Image, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView, Text } from "@/components/ui";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function TransactionHistory() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Extended sample data
  const allTransactions = [
    {
      id: "1",
      type: "receive",
      asset: "SOL",
      amount: "0.5",
      status: "confirmed",
      timestamp: "2 min ago",
      from: "crypto_wallet",
      connectionMode: "online",
      valueUSD: "$125.50",
      date: "Today",
    },
    {
      id: "2",
      type: "send",
      asset: "USDC",
      amount: "50",
      status: "pending",
      timestamp: "5 min ago",
      to: "maria_sol",
      connectionMode: "offline",
      valueUSD: "$50.00",
      date: "Today",
    },
    {
      id: "3",
      type: "receive",
      asset: "BONK",
      amount: "25000",
      status: "tipped",
      timestamp: "1 hour ago",
      from: "bonk_lover",
      connectionMode: "online",
      valueUSD: "$5.25",
      date: "Today",
    },
    {
      id: "4",
      type: "send",
      asset: "SOL",
      amount: "0.1",
      status: "syncing",
      timestamp: "2 hours ago",
      to: "nft_trader",
      connectionMode: "offline",
      valueUSD: "$25.10",
      date: "Today",
    },
    {
      id: "5",
      type: "receive",
      asset: "SOL",
      amount: "1.2",
      status: "confirmed",
      timestamp: "1 day ago",
      from: "defi_pro",
      connectionMode: "online",
      valueUSD: "$301.20",
      date: "Yesterday",
    },
    {
      id: "6",
      type: "send",
      asset: "USDC",
      amount: "25",
      status: "confirmed",
      timestamp: "2 days ago",
      to: "gaming_guild",
      connectionMode: "online",
      valueUSD: "$25.00",
      date: "Dec 28",
    },
    {
      id: "7",
      type: "receive",
      asset: "BONK",
      amount: "50000",
      status: "tipped",
      timestamp: "3 days ago",
      from: "community_dao",
      connectionMode: "online",
      valueUSD: "$10.50",
      date: "Dec 27",
    },
  ];

  const filters = [
    { id: "all", label: "All" },
    { id: "send", label: "Sent" },
    { id: "receive", label: "Received" },
    { id: "pending", label: "Pending" },
  ];

  const getStatusIcon = (status: string) => {
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

  const getTransactionIcon = (type: string) => {
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
        return require("@/assets/images/icons/dollar-icon.png");
      case "BONK":
        return require("@/assets/images/icons/bonk-icon.png");
      default:
        return require("@/assets/images/icons/dollar-icon.png");
    }
  };

  const filteredTransactions = allTransactions.filter((tx) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "send") return tx.type === "send";
    if (selectedFilter === "receive") return tx.type === "receive";
    if (selectedFilter === "pending")
      return tx.status === "pending" || tx.status === "syncing";
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
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-semibold text-xl">
              Transaction History
            </Text>

            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
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
                  : "bg-white/5 border-white/10"
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

              <View className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
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
                          router.push(
                            `/transaction-details?id=${transaction}`
                          )
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
                            {transaction.type === "receive" ? "+" : "-"}
                            {transaction.amount} {transaction.asset}
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
