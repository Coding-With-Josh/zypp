import { cn, Input, SafeAreaView, Text } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useNetworkConnection } from "@/hooks/useNetworkConnection";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ZyppUser {
  id: string;
  username: string;
  displayName: string;
  avatar: any;
  isOnline: boolean;
}

export default function SendScreen() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Ready to send");
  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ZyppUser | null>(null);

  const { isConnected, isInternetReachable, type, checkConnection } =
    useNetworkConnection();

  const tokens = [
    {
      symbol: "SOL",
      name: "Solana",
      icon: require("@/assets/images/icons/sol-icon.png"),
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: require("@/assets/images/icons/dollar-icon.png"),
    },
  ];

  const zyppUsers: ZyppUser[] = [
    {
      id: "1",
      username: "maria_sol",
      displayName: "Maria Solana",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
    },
    {
      id: "2",
      username: "crypto_wallet",
      displayName: "Crypto Pro",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: false,
    },
    {
      id: "3",
      username: "nft_trader",
      displayName: "NFT Trader",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
    },
    {
      id: "4",
      username: "solana_fan",
      displayName: "Solana Fan",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
    },
  ];

  const quickAmounts = [10, 25, 50, 100];

  // Mock username verification
  const verifyUsername = (username: string): ZyppUser | null => {
    const user = zyppUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    return user || null;
  };

  const handleRecipientChange = (text: string) => {
    setRecipient(text);
    setSelectedUser(null);

    // Auto-verify if user types a complete username
    if (text.length >= 3) {
      const verifiedUser = verifyUsername(text);
      if (verifiedUser) {
        setSelectedUser(verifiedUser);
      }
    }
  };

  const handleUserSelect = (user: ZyppUser) => {
    setSelectedUser(user);
    setRecipient(user.username);
    setShowScanModal(false);
  };

  const handleSend = () => {
    if (!selectedUser || !amount) {
      Alert.alert(
        "Error",
        "Please select a valid Zypp user and enter an amount"
      );
      return;
    }

    if (!selectedUser.isOnline && isConnected) {
      Alert.alert(
        "User Offline",
        `${selectedUser.displayName} is currently offline. They'll receive the payment when they come online.`,
        [{ text: "Continue", style: "default" }]
      );
    }

    setIsProcessing(true);
    setStatusText(
      isConnected
        ? `Sending to ${selectedUser.displayName}...`
        : `Queuing for ${selectedUser.displayName}...`
    );

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setStatusText(
        isConnected ? "Transaction completed!" : "Queued for offline delivery"
      );
      // Reset form after success
      setTimeout(() => {
        setAmount("");
        setRecipient("");
        setSelectedUser(null);
        setStatusText("Ready to send");
      }, 2000);
    }, 2000);
  };

  const handleScanForUsers = () => {
    setShowScanModal(true);
    setIsScanning(true);

    // Simulate scanning for users
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const getConnectionStatus = () => {
    if (!isConnected)
      return { text: "Offline Mode", color: "#EF4444", icon: "cloud-offline" };
    if (!isInternetReachable)
      return {
        text: "Limited Connectivity",
        color: "#F59E0B",
        icon: "warning",
      };
    return { text: "Online Mode", color: "#22C55E", icon: "wifi" };
  };

  const connectionStatus = getConnectionStatus();

  const ScanModal = () => (
    <Modal
      visible={showScanModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1 bg-transparent">
          {/* Header */}
          <View className="w-full px-5 pt-4 pb-4 border-b border-white/10">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <Text className="text-white font-semibold text-xl">
                Find Users
              </Text>

              <View className="w-12 h-12" />
            </View>
          </View>

          <View className="flex-1 px-6 pt-6">
            {isScanning ? (
              <View className="flex-1 items-center justify-center">
                <View className="w-48 h-48 bg-white/5 rounded-3xl items-center justify-center border-2 border-dashed border-primary/50 mb-6">
                  <ActivityIndicator size="large" color="#22C55E" />
                </View>
                <Text className="text-white font-semibold text-xl mb-2 text-center">
                  Scanning for Users...
                </Text>
                <Text className="text-white/60 text-center text-base">
                  Looking for nearby Zypp users to connect with
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                <Text className="text-white font-semibold text-xl mb-6 text-center">
                  Available Zypp Users
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                >
                  <View className="gap-3 pb-6">
                    {zyppUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        onPress={() => handleUserSelect(user)}
                        className="flex-row items-center bg-white/5 rounded-2xl p-4 border border-white/10 active:bg-white/10"
                      >
                        <Image
                          source={user.avatar}
                          className="w-12 h-12 rounded-xl"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold text-base">
                            {user.displayName}
                          </Text>
                          <Text className="text-white/60 text-sm">
                            @{user.username}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-2 h-2 rounded-full ${
                              user.isOnline ? "bg-green-400" : "bg-gray-400"
                            }`}
                          />
                          <Text className="text-white/60 text-xs">
                            {user.isOnline ? "Online" : "Offline"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setIsScanning(true)}
                  className="flex-row items-center justify-center gap-2 bg-primary py-4 rounded-full mb-6 active:bg-primary/90"
                >
                  <Ionicons name="refresh" size={20} color="#081405" />
                  <Text className="text-primary-foreground font-semibold text-lg">
                    Scan Again
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Gradient Background */}
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 400 }}
        resizeMode="cover"
      />

      <SafeAreaView className="flex-1 bg-transparent">
        {/* Header */}
        <View className="w-full px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-semibold text-xl">Send</Text>

            <TouchableOpacity
              onPress={handleScanForUsers}
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="scan-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Network Status */}
          <View className="px-6 mb-8">
            <TouchableOpacity
              onPress={checkConnection}
              className="flex-row items-center justify-between bg-black/40 rounded-2xl p-4 border border-white/10"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={connectionStatus.icon as any}
                  size={20}
                  color={connectionStatus.color}
                />
                <View>
                  <Text className="text-white font-medium text-base">
                    {connectionStatus.text}
                  </Text>
                  <Text className="text-white/60 text-xs">
                    Connection Type: {type || "Unknown"}
                  </Text>
                </View>
              </View>
              <Ionicons name="refresh" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Currency Selection */}
          <View className="px-6 mb-6">
            <Text className="text-white font-semibold text-lg mb-4">
              Currency
            </Text>
            <View className="flex-row gap-3">
              {tokens.map((token) => (
                <TouchableOpacity
                  key={token.symbol}
                  onPress={() => setSelectedToken(token.symbol)}
                  className={`flex-row items-center gap-2 px-4 py-3 rounded-full border ${
                    selectedToken === token.symbol
                      ? "bg-primary/10 border-primary/90"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Image
                    source={token.icon}
                    className="w-5 h-5"
                    resizeMode="contain"
                  />
                  <Text
                    className={
                      selectedToken === token.symbol
                        ? "text-white font-semibold"
                        : "text-white font-medium"
                    }
                  >
                    {token.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View className="px-6 mb-6">
            <Text className="text-white font-semibold text-lg mb-4">
              Send Amount
            </Text>

            <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/10 px-4 py-1 mb-4">
              <Image
                source={tokens.find((t) => t.symbol === selectedToken)?.icon}
                className="w-6 h-6 mr-2"
                resizeMode="contain"
              />
              <Text className="text-white/60 text-lg mr-2">
                {selectedToken === "USDC" ? "$" : "◎"}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="flex-1 text-white text-2xl h-16 font-semibold tracking-tight"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Quick Amounts */}
            <Text className="text-white/60 text-sm mb-3">Quick Amounts</Text>
            <View className="flex-row flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  onPress={() => setAmount(quickAmount.toString())}
                  className={`px-4 py-2 rounded-full border ${
                    amount === quickAmount.toString()
                      ? "bg-primary/10 border-primary/90"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text
                    className={
                      amount === quickAmount.toString()
                        ? "text-white font-semibold text-sm"
                        : "text-white font-medium text-sm"
                    }
                  >
                    {selectedToken === "USDC" ? "$" : ""}
                    {quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipient Selection */}
          <View className="px-6 mb-6">
            <Text className="text-white font-medium text-lg mb-4">
              Send To Zypp User
            </Text>

            <View className="space-y-4">
              {/* Input Field */}
              <Input
                value={recipient}
                onChangeText={handleRecipientChange}
                placeholder="Enter Zypp username"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className={cn(
                  "bg-white/5 text-lg px-5 py-4 text-white/90 font-medium border-white/10 rounded-t-2xl",
                  recipient === "" && "rounded-b-2xl"
                )}
              />

              {/* Selected User Display */}
              {selectedUser && (
                <View className="bg-primary/10 rounded-b-2xl p-4 border border-primary/20">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={selectedUser.avatar}
                        className="w-10 h-10 rounded-xl"
                      />
                      <View>
                        <Text className="text-white font-semibold">
                          {selectedUser.displayName}
                        </Text>
                        <Text className="text-white/60 text-sm">
                          @{selectedUser.username}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-2 h-2 rounded-full ${
                          selectedUser.isOnline ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                      <Text className="text-white/60 text-xs">
                        {selectedUser.isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Verification Status */}
              {recipient && !selectedUser && (
                <View className="bg-yellow-500/10 rounded-b-2xl p-3 border border-yellow-500/20">
                  <Text className="text-yellow-400 text-sm text-center">
                    User not found. Please select from available users.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recent Zypp Users */}
          <View className="px-6 mb-6">
            <Text className="text-white font-semibold text-lg mb-4">
              Recent Zypp Users
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {zyppUsers.slice(0, 3).map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => handleUserSelect(user)}
                    className="items-center"
                  >
                    <View className="relative">
                      <Image
                        source={user.avatar}
                        className="w-16 h-16 rounded-2xl border-2 border-white/10"
                      />
                      <View
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                          user.isOnline ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                    </View>
                    <Text className="text-white text-sm mt-2 max-w-16 text-center">
                      {user.username}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  className="items-center"
                  onPress={handleScanForUsers}
                >
                  <View className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 items-center justify-center">
                    <IconSymbol name="plus" size={20} color="#9CA3AF" />
                  </View>
                  <Text className="text-white/60 text-sm mt-2">Find More</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Balance & Status */}
          <View className="px-6 mb-6">
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-white/60 text-sm">Available Balance</Text>
                <Text className="text-white font-semibold">
                  {selectedToken === "USDC" ? "$2,458.90" : "24.5 SOL"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
              <Text className="text-white/60 text-sm">Transaction Status</Text>
              <Text className="text-primary text-sm font-medium">
                {statusText}
              </Text>
            </View>
          </View>

          {/* Send Button */}
          <View className="px-6">
            <TouchableOpacity
              onPress={handleSend}
              disabled={!amount || !selectedUser || isProcessing}
              className={`py-4 rounded-full items-center ${
                amount && selectedUser && !isProcessing
                  ? "bg-primary active:bg-primary/90"
                  : "bg-white/10"
              }`}
            >
              {isProcessing ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator size="small" color="#081405" />
                  <Text className="text-primary-foreground font-semibold text-lg">
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text
                  className={`font-semibold text-lg ${
                    amount && selectedUser
                      ? "text-primary-foreground"
                      : "text-white/40"
                  }`}
                >
                  {isConnected ? "Send Payment" : "Queue Offline Payment"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Connection Info */}
          <View className="px-6 mt-6">
            <Text className="text-white/60 text-sm text-center">
              {isConnected
                ? "Transactions will be processed immediately"
                : "Transactions will be queued and synced when online"}
            </Text>
          </View>
        </ScrollView>

        {/* Scan Modal */}
        <ScanModal />
      </SafeAreaView>
    </View>
  );
}
