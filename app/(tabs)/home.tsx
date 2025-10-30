import { QRScannerModal } from "@/components/blocks/modals/qr-scanner-modal";
import { SafeAreaView, Text } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

export default function Home() {
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);

  // Sample transaction data with Zypp states
  const recentTransactions = [
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
    },
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
          icon: "arrow-up-outline",
          color: "#FBBF24",
          label: "Awaiting Confirmation",
        };
      case "received":
        return {
          icon: "arrow-down-outline",
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

  const getTransactionIcon = (type: string, asset: string) => {
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
        return require("@/assets/images/icons/bonk-icon.png"); // You might need to add this
      default:
        return require("@/assets/images/icons/dollar-icon.png");
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
            >
              <Image
                source={require("@/assets/images/design/user.png")}
                className="w-10 h-10 rounded-full"
              />
              <Text className="text-white font-semibold text-base">
                josh_scriptz
              </Text>
              <Ionicons name="chevron-down-outline" size={14} color="white" />
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
        >
          {/* Balance Section */}
          <View className="mt-8 mb-4 flex flex-col items-center justify-center text-center px-6">
            <Text className="text-white/70 text-lg font-medium">
              Deposited Balance
            </Text>
            <Text className="text-white text-5xl font-semibold">2 SOL</Text>
            <View className="flex-row items-center mt-5 gap-2">
              <TouchableOpacity
                className="flex-row items-center gap-2 px-4 h-10 rounded-full bg-black/15"
                activeOpacity={0.8}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.21)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Image
                  source={require("@/assets/images/icons/dollar-icon.png")}
                  className="size-6"
                />
                <Text className="text-white font-semibold text-base">USDC</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-2 px-4 h-10 rounded-full bg-black/15"
                activeOpacity={0.8}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.21)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Image
                  source={require("@/assets/images/icons/sol-icon.png")}
                  className="size-6"
                />
                <Text className="text-white font-semibold text-base">SOL</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="trending-up-outline" size={16} color="#22C55E" />
              <Text className="text-green-500 ml-1 font-semibold">
                +5.2% this week
              </Text>
            </View>
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
              <Text className="text-white font-semibold text-2xl">
                Recent Transactions
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/transaction-history")}
                className="flex-row items-center gap-1"
              >
                <Text className="text-primary font-semibold">View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#22C55E" />
              </TouchableOpacity>
            </View>

            {/* Transactions List */}
            <View className="bg-black/15 rounded-3xl border border-white/10 overflow-hidden">
              {recentTransactions.map((transaction, index) => {
                const statusInfo = getStatusIcon(transaction.status);
                const txIcon = getTransactionIcon(
                  transaction.type,
                  transaction.asset
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
              })}
            </View>

            {/* Empty State (if no transactions) */}
            {recentTransactions.length === 0 && (
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
