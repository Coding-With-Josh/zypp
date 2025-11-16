// SendScreen.tsx
import { QRScannerModal } from "@/components/blocks/modals/qr-scanner-modal";
import { TransactionConfirmationSheet } from "@/components/blocks/modals/transaction-confirmation-sheet";
import { UserListModal } from "@/components/blocks/modals/user-list-modal";
import {
  alert,
  cn,
  Input,
  SafeAreaView,
  Text,
} from "@/components/ui";

import { useWallet } from "@/contexts/WalletContext";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useNetworkConnection } from "@/hooks/useNetworkConnection";
import { transportManager } from "@/lib/transport/transport-manager";
import type { TransactionPackage } from "@/lib/transport/tx-package";
import { TransactionPackageBuilder } from "@/lib/transport/tx-package";
import type { ZyppUser } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
// import { FlatList } from "@/components/ui/flat-list";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  View,
} from "react-native";

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const DEFAULT_USER_AVATAR = require("@/assets/images/design/user.png");

const truncateAddress = (address: string) => {
  if (!address) return "";
  return address.length > 10
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : address;
};

const createWalletRecipient = (address: string): ZyppUser => ({
  id: `wallet-${address}`,
  username: "wallet",
  displayName: "Wallet Address",
  avatar: DEFAULT_USER_AVATAR,
  isOnline: true,
  address,
  transport_capabilities: ["qr_code"],
});

export default function SendScreen() {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Ready to send");
  const [selectedUser, setSelectedUser] = useState<ZyppUser | null>(null);
  const [recipient, setRecipient] = useState("");
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [currentTxPackage, setCurrentTxPackage] =
    useState<TransactionPackage | null>(null);

  const { isConnected, isInternetReachable, type, checkConnection } =
    useNetworkConnection();

  const {
    balance,
    sendSOL: sendSolana,
    sendToken,
    createOfflineTransaction: queueOfflineTransaction,
    solPrice,
  } = useWallet();

  const tokens = [
    {
      symbol: "SOL",
      name: "Solana",
      icon: require("@/assets/images/icons/sol-icon.png"),
      mint: undefined, // Native SOL
      decimals: 9,
      minAmount: 0.000001,
      network: "mainnet-beta",
      getBalance: () => balance?.sol_balance || 0,
      getUsdValue: () =>
        ((balance?.sol_balance || 0) * (solPrice || 0)).toFixed(2),
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: require("@/assets/images/icons/dollar-icon.png"),
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      minAmount: 0.01,
      network: "mainnet-beta",
      getBalance: () => balance?.token_balances?.USDC?.amount || 0,
      getUsdValue: () =>
        balance?.token_balances?.USDC?.usd_value.toFixed(2) || "0.00",
    },
    {
      symbol: "BONK",
      name: "Bonk",
      icon: require("@/assets/images/icons/bonk-icon.png"),
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      decimals: 5,
      minAmount: 1,
      network: "mainnet-beta",
      getBalance: () => balance?.token_balances?.BONK?.amount || 0,
      getUsdValue: () =>
        balance?.token_balances?.BONK?.usd_value.toFixed(2) || "0.00",
    },
  ];

  const zyppUsers: ZyppUser[] = [
    {
      id: "1",
      username: "maria_sol",
      displayName: "Maria Solana",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
      address: "BvzKvn6nUUAYtKu2pH3h5SbUkUNcRPQawg4bURBiojJx",
      device_id: "device_1",
      transport_capabilities: ["wifi_direct", "multipeer", "nfc"],
      connection_strength: 90,
    },
    {
      id: "2",
      username: "crypto_wallet",
      displayName: "Crypto Pro",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: false,
      address: "6YR39wtYQTbrVCRJqyjneTR3NAaAF8bDxGrwUTkBxCTm",
      device_id: "device_2",
      transport_capabilities: ["wifi_direct"],
      connection_strength: 60,
    },
    {
      id: "3",
      username: "nft_trader",
      displayName: "NFT Trader",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
      address: "8zqYzMfJ2DgmT9L78H2W8CMPqB6FeRUNCBSjvHpuSRVD",
      device_id: "device_3",
      transport_capabilities: ["multipeer", "nfc"],
      connection_strength: 85,
    },
    {
      id: "4",
      username: "solana_fan",
      displayName: "Solana Fan",
      avatar: require("@/assets/images/design/user.png"),
      isOnline: true,
      address: "4KVvKqMPqNBe8MxrDfYUqVofRW5wsq6bWVjMXoMz6Rqm",
      device_id: "device_4",
      transport_capabilities: ["wifi_direct", "multipeer"],
      connection_strength: 95,
    },
  ];

  const quickAmounts = [10, 25, 50, 100];

  const {
    nearbyUsers,
    isScanning,
    error: scanError,
    startScanning,
    stopScanning,
  } = useNearbyUsers();

  const applyRecipientFromAddress = (address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;

    const matchedUser =
      nearbyUsers.find((user) => user.address === trimmed) ||
      zyppUsers.find((user) => user.address === trimmed);

    const resolvedUser = matchedUser || createWalletRecipient(trimmed);

    setSelectedUser(resolvedUser);
    setRecipient(
      resolvedUser.username === "wallet"
        ? truncateAddress(trimmed)
        : resolvedUser.username
    );
  };

  const tryApplyPaymentRequestFromQR = (payload: string): boolean => {
    try {
      const parsedPackage = new TransactionPackageBuilder().parseFromTransport(
        payload
      );

      if (!parsedPackage?.metadata?.to_address) {
        return false;
      }

      const { metadata } = parsedPackage;

      if (metadata.amount) {
        setAmount(metadata.amount.toString());
      }

      if (metadata.symbol) {
        const normalized = metadata.symbol.toUpperCase();
        const supported = tokens.some((token) => token.symbol === normalized)
          ? normalized
          : "SOL";
        setSelectedToken(supported);
      }

      applyRecipientFromAddress(metadata.to_address);
      setStatusText("Payment request loaded from QR code");
      alert(
        "Payment Request Loaded",
        `Ready to send ${metadata.amount ?? ""} ${metadata.symbol ?? ""}`,
        [{ text: "OK" }]
      );
      return true;
    } catch {
      return false;
    }
  };

  const tryApplyUserPayload = (payload: string): boolean => {
    try {
      const parsed = JSON.parse(payload);
      const addressCandidate =
        parsed.address ||
        parsed.wallet_address ||
        parsed.public_key ||
        parsed.publicKey;

      if (!addressCandidate || !SOLANA_ADDRESS_REGEX.test(addressCandidate)) {
        return false;
      }

      const resolvedUser: ZyppUser = {
        id: parsed.id?.toString() || `qr-${addressCandidate}`,
        username: parsed.username || parsed.handle || "wallet",
        displayName:
          parsed.displayName || parsed.name || parsed.username || "Zypp User",
        avatar: parsed.avatar ? { uri: parsed.avatar } : DEFAULT_USER_AVATAR,
        isOnline: parsed.isOnline ?? true,
        address: addressCandidate,
        transport_capabilities: parsed.transport_capabilities || ["qr_code"],
        device_id: parsed.device_id,
      };

      setSelectedUser(resolvedUser);
      setRecipient(
        resolvedUser.username === "wallet"
          ? truncateAddress(addressCandidate)
          : resolvedUser.username
      );
      setStatusText("Recipient loaded from QR code");
      return true;
    } catch {
      return false;
    }
  };

  const tryApplyWalletAddress = (payload: string): boolean => {
    const trimmed = payload.trim();
    if (!SOLANA_ADDRESS_REGEX.test(trimmed)) {
      return false;
    }

    applyRecipientFromAddress(trimmed);
    setStatusText("Wallet address scanned");
    return true;
  };

  const handleScanResult = (data: string) => {
    const cleaned = data.trim();
    if (!cleaned) {
      alert("Scan Failed", "The QR code was empty.", [{ text: "OK" }]);
      return;
    }

    setShowQRScannerModal(false);

    if (
      tryApplyPaymentRequestFromQR(cleaned) ||
      tryApplyUserPayload(cleaned) ||
      tryApplyWalletAddress(cleaned)
    ) {
      return;
    }

    alert(
      "Unsupported QR Code",
      "We couldn't recognize this QR code. Please ensure it was generated from Zypp.",
      [{ text: "OK" }]
    );
  };

  // Filter and verify nearby users
  const handleRecipientChange = (text: string) => {
    setRecipient(text);
    setSelectedUser(null);

    if (text.length >= 2) {
      // Only search through nearby users
      const matchedUser = nearbyUsers.find(
        (u) =>
          u.username.toLowerCase().includes(text.toLowerCase()) ||
          u.displayName.toLowerCase().includes(text.toLowerCase())
      );

      if (matchedUser) {
        setSelectedUser(matchedUser);
      }
    }
  };

  // Initialize transport manager and start scanning when the screen is focused
  useEffect(() => {
    // Use the centralized transport manager initialized at app startup.
    // The `useNearbyUsers` hook already subscribes to peer discovery, so here
    // we only need to start/stop scanning when the screen mounts/unmounts.
    const start = async () => {
      try {
        await startScanning();
      } catch (err) {
        console.error("Failed to start scanning on Send screen:", err);
      }
    };

    start();

    return () => {
      stopScanning().catch(console.error);
    };
  }, [startScanning, stopScanning]);

  const handleUserSelect = (user: ZyppUser) => {
    setSelectedUser(user);
    setRecipient(user.username);
    setShowUserListModal(false);
  };

  const validateAmount = (
    value: string,
    tokenSymbol: string
  ): { isValid: boolean; error?: string } => {
    const numericAmount = parseFloat(value);

    if (!value) {
      return { isValid: false, error: "Please enter an amount" };
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { isValid: false, error: "Please enter a valid amount" };
    }

    // Token specific validations
    if (tokenSymbol === "SOL") {
      if (numericAmount < 0.000001) {
        // Minimum SOL transfer
        return { isValid: false, error: "Minimum amount is 0.000001 SOL" };
      }
      if ((balance?.sol_balance || 0) < numericAmount) {
        return { isValid: false, error: "Insufficient SOL balance" };
      }
    } else if (tokenSymbol === "USDC") {
      if (numericAmount < 0.01) {
        // Minimum USDC transfer (1 cent)
        return { isValid: false, error: "Minimum amount is 0.01 USDC" };
      }
      const usdcBalance = balance?.token_balances?.USDC?.amount || 0;
      if (usdcBalance < numericAmount) {
        return { isValid: false, error: "Insufficient USDC balance" };
      }
    }

    return { isValid: true };
  };

  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);

  const handleSend = async () => {
    if (!selectedUser) {
      alert("Error", "Please select a valid Zypp user", [{ text: "OK" }]);
      return;
    }

    const amountValidation = validateAmount(amount, selectedToken);
    if (!amountValidation.isValid) {
      alert("Error", amountValidation.error, [{ text: "OK" }]);
      return;
    }

    const numericAmount = parseFloat(amount);
    const selectedTokenInfo = tokens.find((t) => t.symbol === selectedToken);
    if (!selectedTokenInfo) {
      alert("Error", "Invalid token selected", [{ text: "OK" }]);
      return;
    }

    // Check balance
    if (selectedToken === "SOL") {
      if ((balance?.sol_balance || 0) < numericAmount) {
        alert("Error", "Insufficient SOL balance", [{ text: "OK" }]);
        return;
      }
    } else {
      const tokenBalance =
        balance?.token_balances?.[selectedToken]?.amount || 0;
      if (tokenBalance < numericAmount) {
        alert("Error", `Insufficient ${selectedToken} balance`, [
          { text: "OK" },
        ]);
        return;
      }
    }

    if (!selectedUser.isOnline && isConnected) {
      alert(
        "User Offline",
        `${selectedUser.displayName} is currently offline. They'll receive the payment when they come online.`,
        [{ text: "Continue" }]
      );
    }

    // Create transaction package
    const txPackage = new TransactionPackageBuilder().createFromPaymentRequest(
      numericAmount,
      selectedToken,
      selectedTokenInfo.mint,
      selectedUser.address,
      undefined, // memo
      isConnected ? "wifi_direct" : "local_network" // transport type
    );

    // Show confirmation sheet with transaction package
    setCurrentTxPackage(txPackage);
    setShowConfirmationSheet(true);
  };

  const handleConfirmTransaction = async () => {
    if (!currentTxPackage || !selectedUser) return;

    setShowConfirmationSheet(false);
    setIsProcessing(true);
    setStatusText(
      isConnected
        ? `Sending to ${selectedUser.displayName}...`
        : `Queuing for ${selectedUser.displayName}...`
    );

    try {
      // Send via P2P transport if possible
      if (selectedUser.isOnline) {
        // Get user's supported transports in priority order
        const availableTransports = selectedUser.transport_capabilities || [];
        let sent = false;

        // Try each transport in order
        for (const transport of availableTransports) {
          try {
            const success = await transportManager.sendTransaction(
              currentTxPackage,
              transport,
              selectedUser.device_id
            );

            if (success) {
              setStatusText(`Transaction sent via ${transport}!`);
              sent = true;
              break;
            }
          } catch (error) {
            console.warn(`Failed to send via ${transport}:`, error);
          }
        }

        if (sent) {
          setTimeout(() => {
            setAmount("");
            setRecipient("");
            setSelectedUser(null);
            setStatusText("Ready to send");
            setCurrentTxPackage(null);
          }, 2000);
          return;
        }
      }

      // Fallback to regular transaction if P2P fails or user is offline
      if (isConnected) {
        // Online transaction
        if (selectedToken === "SOL") {
          await sendSolana(selectedUser.address, parseFloat(amount));
        } else {
          // Token transaction
          const tokenMint = tokens.find(
            (t) => t.symbol === selectedToken
          )?.mint;
          if (!tokenMint) {
            throw new Error(`No token mint found for ${selectedToken}`);
          }
          await sendToken(selectedUser.address, parseFloat(amount), tokenMint);
        }
        setStatusText("Transaction sent via blockchain!");
      } else {
        // Offline transaction
        const selectedTokenInfo = tokens.find(
          (t) => t.symbol === selectedToken
        );
        await queueOfflineTransaction(
          selectedUser.address,
          parseFloat(amount),
          {
            symbol: selectedToken,
            mint: selectedTokenInfo!.mint,
          }
        );
        setStatusText("Transaction queued for delivery");
      }

      // Reset form after success
      setTimeout(() => {
        setAmount("");
        setRecipient("");
        setSelectedUser(null);
        setStatusText("Ready to send");
        setCurrentTxPackage(null);
      }, 2000);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      alert("Error", error.message || "Failed to process transaction", [
        { text: "OK" },
      ]);
      setStatusText("Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanAgain = () => {
    stopScanning().then(() => startScanning());
  };

  const handleScanQRCode = () => {
    setShowQRScannerModal(true);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
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
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>

              <Text className="text-white font-semibold text-xl">Send</Text>

              <TouchableOpacity
                onPress={handleScanQRCode}
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
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
              <FlatList
                data={tokens}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item: token }) => {
                  const isSelected = selectedToken === token.symbol;
                  const balance = token.getBalance();
                  const usdValue = token.getUsdValue();

                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedToken(token.symbol)}
                      className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                        isSelected
                          ? "bg-primary/10 border-primary/90"
                          : "bg-black/15 border-white/10"
                      }`}
                      style={{ minWidth: 140 }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Image
                          source={token.icon}
                          className="w-8 h-8"
                          resizeMode="contain"
                        />
                        <View>
                          <Text
                            className={
                              isSelected
                                ? "text-white font-semibold text-base"
                                : "text-white font-medium text-base"
                            }
                          >
                            {token.symbol}
                          </Text>
                          <Text className="text-white/60 text-xs">
                            {balance.toFixed(token.decimals === 6 ? 2 : 4)}
                          </Text>
                          <Text className="text-white/40 text-xs">
                            ${usdValue}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View className="h-6 w-6 rounded-full bg-primary items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="black" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* Amount Input */}
            <View className="px-6 mb-6">
              <Text className="text-white font-semibold text-lg mb-4">
                Send Amount
              </Text>

              <View className="bg-black/15 rounded-2xl border border-white/10 mb-4">
                <View className="flex-row items-center px-4 py-1">
                  <Image
                    source={
                      tokens.find((t) => t.symbol === selectedToken)?.icon
                    }
                    className="w-6 h-6 mr-2"
                    resizeMode="contain"
                  />
                  <Text className="text-white/60 text-lg mr-2">
                    {selectedToken === "USDC" ? "$" : "◎"}
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={(text) => {
                      // Only allow valid decimal numbers
                      if (text === "" || /^\d*\.?\d*$/.test(text)) {
                        // For USDC, limit to 2 decimal places
                        if (selectedToken === "USDC" && text.includes(".")) {
                          const [, decimal] = text.split(".");
                          if (decimal && decimal.length > 2) return;
                        }
                        // For SOL, limit to 9 decimal places
                        if (selectedToken === "SOL" && text.includes(".")) {
                          const [, decimal] = text.split(".");
                          if (decimal && decimal.length > 9) return;
                        }
                        setAmount(text);
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="flex-1 text-white text-2xl h-16 font-semibold tracking-tight"
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>

                {/* USD Value Display */}
                <View className="px-4 py-2 border-t border-white/10">
                  <Text className="text-white/60 text-sm">
                    ≈ $
                    {selectedToken === "USDC"
                      ? parseFloat(amount || "0").toFixed(2)
                      : (parseFloat(amount || "0") * (solPrice || 0)).toFixed(
                          2
                        )}{" "}
                    USD
                  </Text>
                </View>
              </View>

              {/* Quick Amounts */}
              <Text className="text-white/60 text-sm mb-3">Quick Amounts</Text>
              <View className="flex-row flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    onPress={() => setAmount(quickAmount.toString())}
                    className={`px-4 py-2 rounded-full border flex flex-row gap-1 ${
                      amount === quickAmount.toString()
                        ? "bg-primary/10 border-primary/90"
                        : "bg-black/15 border-white/10 pl-4"
                    }`}
                  >
                    <Image
                      source={
                        tokens.find((t) => t.symbol === selectedToken)?.icon
                      }
                      className="w-6 h-6 mr-2"
                      resizeMode="contain"
                    />
                    <Text
                      className={
                        amount === quickAmount.toString()
                          ? "text-white font-semibold text-sm"
                          : "text-white font-medium text-sm"
                      }
                    >
                      {quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recipient Selection */}
            <View className="px-6 mb-6">
              <Text className="text-white font-semibold text-lg mb-4">
                Send To Zypp User
              </Text>

              <View className="gap-">
                {/* Input Field */}
                <Input
                  value={recipient}
                  onChangeText={handleRecipientChange}
                  placeholder="Enter Zypp username"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  className={cn(
                    "bg-black/15 text-lg px-5 py-4 text-white/90 font-medium border-white/10 rounded-t-2xl",
                    recipient === "" && "rounded-b-2xl"
                  )}
                />

                {/* Selected User Display */}
                {selectedUser && (
                  <View
                    className={cn(
                      "rounded-b-2xl p-4 border",
                      selectedUser.username === "wallet"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-primary/10 border-primary/20"
                    )}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        {selectedUser.username === "wallet" ? (
                          <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center">
                            <Ionicons
                              name="wallet-outline"
                              size={24}
                              color="#3B82F6"
                            />
                          </View>
                        ) : (
                          <Image
                            source={selectedUser.avatar}
                            className="w-10 h-10 rounded-xl"
                          />
                        )}
                        <View>
                          <Text className="text-white font-semibold">
                            {selectedUser.username === "wallet"
                              ? "Direct to Wallet"
                              : selectedUser.displayName}
                          </Text>
                          <Text className="text-white/60 text-sm">
                            {selectedUser.username === "wallet"
                              ? `${selectedUser.address.slice(
                                  0,
                                  4
                                )}...${selectedUser.address.slice(-4)}`
                              : `@${selectedUser.username}`}
                          </Text>
                        </View>
                      </View>
                      {selectedUser.username !== "wallet" && (
                        <View className="flex-row items-center gap-2">
                          {/* Online Status */}
                          <View
                            className={`w-2 h-2 rounded-full ${
                              selectedUser.isOnline
                                ? "bg-green-400"
                                : "bg-gray-400"
                            }`}
                          />
                          <Text className="text-white/60 text-xs">
                            {selectedUser.isOnline ? "Online" : "Offline"}
                          </Text>

                          {/* Transport Icons */}
                          <View className="flex-row items-center gap-1 ml-2">
                            {selectedUser.transport_capabilities?.map(
                              (transport) => {
                                let icon = "wifi-outline";
                                switch (transport) {
                                  case "bluetooth":
                                    icon = "bluetooth";
                                    break;
                                  case "nfc":
                                    icon = "radio-outline";
                                    break;
                                  case "wifi_direct":
                                    icon = "wifi-outline";
                                    break;
                                  case "multipeer":
                                    icon = "phone-portrait-outline";
                                    break;
                                }
                                return (
                                  <Ionicons
                                    key={transport}
                                    name={icon as any}
                                    size={12}
                                    color="rgba(255,255,255,0.6)"
                                  />
                                );
                              }
                            )}
                          </View>
                        </View>
                      )}
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
                <View>
                  {/* Scanning Status */}
                  {isScanning && nearbyUsers.length === 0 && (
                    <View className="flex-row items-center justify-center py-4 gap-2">
                      <ActivityIndicator color="#22C55E" />
                      <Text className="text-white/60">
                        Scanning for nearby users...
                      </Text>
                    </View>
                  )}

                  {/* Error State */}
                  {scanError && (
                    <View className="bg-red-500/10 rounded-2xl p-4 mb-4">
                      <Text className="text-red-400 text-center">
                        {scanError.message}
                      </Text>
                      <TouchableOpacity
                        onPress={startScanning}
                        className="bg-red-500 rounded-full px-4 py-2 mt-2"
                      >
                        <Text className="text-white text-center">
                          Try Again
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Nearby Users */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-3">
                      {nearbyUsers.map((user) => (
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
                            <View className="absolute -top-1 -right-1 flex-row items-center">
                              {/* Online Status */}
                              <View
                                className={`w-3 h-3 rounded-full border-2 border-black ${
                                  user.isOnline ? "bg-green-400" : "bg-gray-400"
                                }`}
                              />
                              {/* Nearby Indicator */}
                              <View className="w-3 h-3 rounded-full bg-blue-400 border-2 border-black ml-1" />
                            </View>
                          </View>
                          <Text className="text-white text-sm mt-2 max-w-16 text-center">
                            {user.username}
                          </Text>
                          <Text className="text-white/60 text-xs">Nearby</Text>
                        </TouchableOpacity>
                      ))}

                      {/* Start Scanning Button */}
                      {!isScanning && nearbyUsers.length === 0 && (
                        <TouchableOpacity
                          className="items-center"
                          onPress={startScanning}
                        >
                          <View className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 items-center justify-center">
                            <Ionicons
                              name="scan-outline"
                              size={24}
                              color="#9CA3AF"
                            />
                          </View>
                          <Text className="text-white/60 text-sm mt-2">
                            Start Scanning
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>

            {/* Balance & Status */}
            <View className="px-6 mb-6">
              <View className="bg-black/15 rounded-2xl p-4 border border-white/10 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/60 text-sm">
                    Available Balance
                  </Text>
                  <Text className="text-white font-semibold">
                    {selectedToken === "USDC" ? (
                      <>
                        $
                        {(balance?.token_balances?.USDC?.amount || 0).toFixed(
                          2
                        )}{" "}
                        USDC
                        <Text className="text-white/60 text-sm ml-1">
                          ($
                          {(
                            balance?.token_balances?.USDC?.usd_value || 0
                          ).toFixed(2)}
                          )
                        </Text>
                      </>
                    ) : (
                      <>
                        {balance?.sol_balance.toFixed(2) || 0} SOL
                        <Text className="text-white/60 text-sm ml-1">
                          ($
                          {(
                            (balance?.sol_balance || 0) * (solPrice || 20)
                          ).toFixed(2)}
                          )
                        </Text>
                      </>
                    )}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between bg-black/15 rounded-2xl p-4 border border-white/10">
                <Text className="text-white/60 text-sm">
                  Transaction Status
                </Text>
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

          {/* User List Modal */}
          <UserListModal
            visible={showUserListModal}
            onClose={() => setShowUserListModal(false)}
            onUserSelect={handleUserSelect}
            isScanning={isScanning}
            onScanAgain={handleScanAgain}
            users={zyppUsers}
          />

          {/* QR Scanner Modal */}
          <QRScannerModal
            visible={showQRScannerModal}
            onClose={() => setShowQRScannerModal(false)}
            onScan={handleScanResult}
          />

          {/* Transaction Confirmation Sheet */}
          {selectedUser && showConfirmationSheet && currentTxPackage && (
            <TransactionConfirmationSheet
              isVisible={showConfirmationSheet}
              transaction={currentTxPackage}
              onConfirm={handleConfirmTransaction}
              onCancel={() => setShowConfirmationSheet(false)}
              confirmationType={isConnected ? "shake" : "swipe"}
            />
          )}
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
