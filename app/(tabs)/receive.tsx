import { Input, SafeAreaView, Text } from "@/components/ui";
import { alert } from "@/components/ui/alert";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { TransactionPackageBuilder } from "@/lib/transport/tx-package";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function ReceiveScreen() {
  const [activeTab, setActiveTab] = useState<"receive" | "request">("receive");
  const [selectedCurrency, setSelectedCurrency] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [paymentRequestQrData, setPaymentRequestQrData] = useState<
    string | null
  >(null);

  const currencies = [
    {
      code: "USDC",
      name: "USD Coin",
      icon: require("@/assets/images/icons/dollar-icon.png"),
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
    {
      code: "SOL",
      name: "Solana",
      icon: require("@/assets/images/icons/sol-icon.png"),
      mint: undefined, // Native SOL
    },
  ];

  const { wallet, transactions } = useWallet();
  const { user } = useAuth();

  // FIXED: Wallet address is now properly Base58 from WalletContext
  const walletAddress = wallet?.public_key || "";

  console.log("🔍 ReceiveScreen - Wallet address:", walletAddress);

  // Get recent received transactions
  const recentReceived = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "receive")
        .slice(0, 5)
        .map((tx) => ({
          amount: tx.amount,
          timestamp: tx.created_at,
          asset: tx.symbol || "SOL",
        })),
    [transactions]
  );

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  // Reset QR code when amount or currency changes
  useEffect(() => {
    setPaymentRequestQrData(null);
  }, [amount, selectedCurrency]);

  const handleShare = async () => {
    try {
      let message: string;
      if (activeTab === "receive") {
        message = `Hey there! 😎 This is my Zypp wallet address: ${walletAddress}. Send me some crypto!`;
      } else {
        if (paymentRequestQrData) {
          message = `Hey! Please send me ${amount} ${selectedCurrency}${requestNote ? ` for ${requestNote}` : ""} on Zypp!\n\nScan this QR code or use the payment request data:\n${paymentRequestQrData}`;
        } else {
          message = `Hey! Please send me ${amount} ${selectedCurrency}${requestNote ? ` for ${requestNote}` : ""} on Zypp!`;
        }
      }

      await Share.share({
        title:
          activeTab === "receive" ? "Share Wallet Address" : "Payment Request",
        message,
      });
    } catch {
      alert("Share Failed", "Failed to share. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleCopy = async () => {
    try {
      let textToCopy: string;
      if (activeTab === "receive") {
        textToCopy = walletAddress;
      } else {
        if (paymentRequestQrData) {
          textToCopy = paymentRequestQrData;
        } else {
          textToCopy = `Payment Request: ${amount} ${selectedCurrency}${requestNote ? ` for ${requestNote}` : ""}`;
        }
      }

      await Clipboard.setStringAsync(textToCopy);
      alert(
        "Copied!",
        `${activeTab === "receive" ? "Wallet address" : "Payment request"} copied to clipboard`,
        [{ text: "OK" }]
      );
    } catch {
      alert("Copy Failed", "Failed to copy to clipboard. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleCreateRequest = () => {
    if (!amount) {
      alert("Error", "Please enter an amount for the payment request", [
        { text: "OK" },
      ]);
      return;
    }

    if (!walletAddress) {
      alert("Error", "Wallet address not found. Please try again.", [
        { text: "OK" },
      ]);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Error", "Please enter a valid amount", [{ text: "OK" }]);
      return;
    }

    try {
      const selectedCurrencyInfo = currencies.find(
        (c) => c.code === selectedCurrency
      );
      if (!selectedCurrencyInfo) {
        alert("Error", "Invalid currency selected", [{ text: "OK" }]);
        return;
      }

      // Create payment request package
      const txPackage =
        new TransactionPackageBuilder().createFromPaymentRequest(
          numericAmount,
          selectedCurrency,
          selectedCurrencyInfo.mint,
          walletAddress,
          requestNote || undefined,
          "qr_code"
        );

      // Serialize for QR code
      const serialized = new TransactionPackageBuilder().serializeForTransport(
        txPackage
      );

      setPaymentRequestQrData(serialized);
      alert("Success", "Payment request created successfully!", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error creating payment request:", error);
      alert("Error", "Failed to create payment request. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const renderReceiveTab = () => (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* QR Code Section */}
        <View className="mb-8">
          <Text className="text-white font-semibold text-lg mb-4">QR Code</Text>

          <View className="bg-white p-3 rounded-2xl mb-8">
            <View className="w-full h-64 items-center justify-center rounded-xl">
              <View className="items-center">
                <Text className="text-black text-sm font-semibold my-2">
                  {user?.username || "Anonymous"}
                </Text>
                <View className="w-full h-450 bg-white items-center justify-center rounded overflow-hidden">
                  {wallet?.public_key ? (
                    <View style={{ position: "relative" }}>
                      <QRCode
                        value={wallet.public_key}
                        size={192}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        ecl="H"
                      />
                      <View
                        style={{
                          position: "absolute",
                          width: 60,
                          height: 60,
                          backgroundColor: "white",
                          top: "50%",
                          left: "43%",
                          transform: [{ translateX: -30 }, { translateY: -30 }],
                          borderRadius: 8,
                          padding: 4,
                        }}
                      >
                        <Image
                          source={require("@/assets/images/design/logo.png")}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          className="scale-150"
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  ) : (
                    <Text className="text-black text-xs text-center font-mono p-2">
                      No wallet found
                    </Text>
                  )}
                </View>
                <Text className="text-white text-xs mt-2 text-center">
                  Scan to send payment
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Currency Selection */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-4">
            Currency
          </Text>
          <View className="flex-row gap-3">
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                onPress={() => setSelectedCurrency(currency.code)}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-full border ${
                  selectedCurrency === currency.code
                    ? "bg-primary/10 border-primary/90"
                    : "bg-black/15 border-white/10 pl-4"
                }`}
              >
                <Image
                  source={currency.icon}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text
                  className={
                    selectedCurrency === currency.code
                      ? "text-white font-semibold"
                      : "text-white font-medium"
                  }
                >
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wallet Address */}
        <View className="mb-8">
          <Text className="text-white font-semibold text-lg mb-4">
            Your {selectedCurrency} Address
          </Text>

          <View className="bg-black/15 rounded-2xl border border-white/10 p-4 mb-4">
            <Text className="text-white text-base text-center font-mono break-all">
              {walletAddress}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCopy}
              className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-3 rounded-xl border border-white/10 active:bg-white/10"
            >
              <IconSymbol name="doc.on.doc" size={18} color="white" />
              <Text className="text-white font-semibold text-base">Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 flex-row items-center justify-center gap-2 bg-primary py-3 rounded-xl active:bg-primary/90"
            >
              <IconSymbol
                name="square.and.arrow.up"
                size={18}
                color="#081405"
              />
              <Text className="text-primary-foreground font-semibold text-base">
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-4">
            Recent Transactions
          </Text>

          <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
            {recentReceived.length > 0 ? (
              recentReceived.map((tx, index) => (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-3 ${
                    index !== recentReceived.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center">
                      <Ionicons name="arrow-down" size={16} color="#22C55E" />
                    </View>
                    <View>
                      <Text className="text-white font-medium">Received</Text>
                      <Text className="text-white/60 text-xs">
                        {formatDistanceToNow(new Date(tx.timestamp), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-green-400 font-semibold">
                    +{tx.amount} {tx.asset}
                  </Text>
                </View>
              ))
            ) : (
              <View className="py-6 items-center">
                <Text className="text-white/60 text-base">
                  No recent transactions
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="w-full h-24" />
      </ScrollView>
    </View>
  );

  const renderRequestTab = () => (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Currency Selection */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-4">
            Currency
          </Text>
          <View className="flex-row gap-3">
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                onPress={() => setSelectedCurrency(currency.code)}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-full border ${
                  selectedCurrency === currency.code
                    ? "bg-primary/10 border-primary/90"
                    : "bg-black/15 border-white/10 pl-4"
                }`}
              >
                <Image
                  source={currency.icon}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text
                  className={
                    selectedCurrency === currency.code
                      ? "text-white font-semibold"
                      : "text-white font-medium"
                  }
                >
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-4">
            Request Amount
          </Text>

          <View className="flex-row items-center bg-black/15 rounded-2xl border border-white/10 px-4 py-1 mb-4">
            <Image
              source={currencies.find((c) => c.code === selectedCurrency)?.icon}
              className="w-6 h-6 mr-2"
              resizeMode="contain"
            />
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="flex-1 text-white text-2xl h-16 font-semibold tracking-tight bg-transparent border-0"
              keyboardType="decimal-pad"
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
                    : "bg-black/15 border-white/10 pl-4"
                }`}
              >
                <Text
                  className={
                    amount === quickAmount.toString()
                      ? "text-white font-semibold text-sm"
                      : "text-white font-medium text-sm"
                  }
                >
                  {selectedCurrency === "USDC" ? "$" : ""}
                  {quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Input */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-lg mb-3">
            Note (Optional)
          </Text>
          <Input
            value={requestNote}
            onChangeText={setRequestNote}
            placeholder="What is this payment for?"
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="bg-black/15 text-lg px-5 py-4 text-white/90 font-medium border-white/10 rounded-2xl"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Generated Request Preview */}
        {amount && (
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">
              Payment Request
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white/60 text-sm">Amount</Text>
                <View className="flex-row items-center justify-center">
                  <Image
                    source={
                      currencies.find((c) => c.code === selectedCurrency)?.icon
                    }
                    className="w-6 h-6 mr-2"
                    resizeMode="contain"
                  />
                  <Text className="text-white font-semibold">
                    {amount} {selectedCurrency}
                  </Text>
                </View>
              </View>
              {requestNote && (
                <View className="flex-row justify-between items-start">
                  <Text className="text-white/60 text-sm mt-1">Note</Text>
                  <Text className="text-white text-sm text-right flex-1 ml-4">
                    {requestNote}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/10">
                <Text className="text-white/60 text-sm">Status</Text>
                <Text className="text-green-400 text-sm font-medium">
                  {paymentRequestQrData ? "Ready to share" : "Not created"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* QR Code Section - Show after payment request is created */}
        {paymentRequestQrData && (
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-4">
              Payment Request QR Code
            </Text>
            <View className="bg-white p-3 rounded-2xl mb-4">
              <View className="w-full items-center justify-center rounded-xl">
                <View className="items-center">
                  <Text className="text-black text-sm font-semibold my-2">
                    {user?.username || "Anonymous"}
                  </Text>
                  <View className="w-full h-64 bg-white items-center justify-center rounded overflow-hidden">
                    <View style={{ position: "relative" }}>
                      <QRCode
                        value={paymentRequestQrData}
                        size={192}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        ecl="H"
                      />
                      <View
                        style={{
                          position: "absolute",
                          width: 60,
                          height: 60,
                          backgroundColor: "white",
                          top: "50%",
                          left: "43%",
                          transform: [{ translateX: -30 }, { translateY: -30 }],
                          borderRadius: 8,
                          padding: 4,
                        }}
                      >
                        <Image
                          source={require("@/assets/images/design/logo.png")}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          className="scale-150"
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </View>
                  <Text className="text-white text-xs mt-2 text-center">
                    Scan to pay {amount} {selectedCurrency}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCopy}
                className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-3 rounded-xl border border-white/10 active:bg-white/10"
              >
                <IconSymbol name="doc.on.doc" size={18} color="white" />
                <Text className="text-white font-semibold text-base">Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary py-3 rounded-xl active:bg-primary/90"
              >
                <IconSymbol
                  name="square.and.arrow.up"
                  size={18}
                  color="#081405"
                />
                <Text className="text-primary-foreground font-semibold text-base">
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleCreateRequest}
            disabled={!amount}
            className={`py-4 rounded-full items-center ${
              amount ? "bg-primary active:bg-primary/90" : "bg-white/10"
            }`}
          >
            <Text
              className={`font-semibold text-lg ${
                amount ? "text-primary-foreground" : "text-white/40"
              }`}
            >
              Create Payment Request
            </Text>
          </TouchableOpacity>

          {amount && (
            <TouchableOpacity
              onPress={handleShare}
              className="flex-row items-center justify-center gap-2 bg-black/15 py-4 rounded-full border border-white/10 active:bg-white/10"
            >
              <IconSymbol name="square.and.arrow.up" size={20} color="white" />
              <Text className="text-white font-semibold text-lg">
                Share Request
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
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
          <View className="w-full px-6 pt-4 pb-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>

              <Text className="text-white font-semibold text-xl">Receive</Text>

              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View className="px-6 mb-6">
            <View className="flex-row bg-black/15 rounded-2xl py-1 px-1 border border-white/10">
              <TouchableOpacity
                onPress={() => setActiveTab("receive")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  activeTab === "receive" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-semibold text-base ${
                    activeTab === "receive"
                      ? "text-primary-foreground"
                      : "text-white"
                  }`}
                >
                  Receive
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("request")}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  activeTab === "request" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-semibold text-base ${
                    activeTab === "request"
                      ? "text-primary-foreground"
                      : "text-white"
                  }`}
                >
                  Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View className="flex-1 px-6">
            {activeTab === "receive" ? renderReceiveTab() : renderRequestTab()}
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
