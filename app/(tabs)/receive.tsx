// ReceiveScreen.tsx
import { Input, SafeAreaView, Text } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReceiveScreen() {
  const [activeTab, setActiveTab] = useState<"receive" | "request">("receive");
  const [selectedCurrency, setSelectedCurrency] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");

  const currencies = [
    {
      code: "USDC",
      name: "USD Coin",
      icon: require("@/assets/images/icons/dollar-icon.png"),
    },
    {
      code: "SOL",
      name: "Solana",
      icon: require("@/assets/images/icons/sol-icon.png"),
    },
  ];

  const walletAddress = "9gY72Kp38hJ9kL2mN5qR8tBvC7xW4aD1z";
  const quickAmounts = [10, 25, 50, 100, 250, 500];

  const handleShare = async () => {
    Alert.alert(
      "Shared",
      `${activeTab === "receive" ? "Wallet address" : "Payment request"} shared successfully!`
    );
  };

  const handleCopy = () => {
    Alert.alert(
      "Copied!",
      `${activeTab === "receive" ? "Wallet address" : "Payment request"} copied to clipboard`
    );
  };

  const handleCreateRequest = () => {
    if (!amount) {
      Alert.alert("Error", "Please enter an amount for the payment request");
      return;
    }
    Alert.alert("Success", "Payment request created successfully!");
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

          <View className="bg-black/15 rounded-2xl border border-white/10 p-6 items-center">
            <View className="bg-white p-4 rounded-xl mb-4">
              <View className="w-64 h-64 bg-gray-800 items-center justify-center rounded-lg">
                <View className="items-center">
                  <Text className="text-white text-sm font-medium mb-2">
                    {selectedCurrency} Address
                  </Text>
                  <View className="w-48 h-48 bg-white items-center justify-center rounded border-2 border-dashed border-gray-300">
                    <Text className="text-black text-xs text-center font-mono p-2">
                      {walletAddress}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text className="text-white/60 text-sm text-center">
              Scan this code to send {selectedCurrency}
            </Text>
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
                    : "bg-black/15 border-white/10"
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
            <Text className="text-white text-base text-center font-mono">
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
            <View className="flex-row items-center justify-between py-3 border-b border-white/10">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center">
                  <Ionicons name="arrow-down" size={16} color="#22C55E" />
                </View>
                <View>
                  <Text className="text-white font-medium">Received</Text>
                  <Text className="text-white/60 text-xs">2 hours ago</Text>
                </View>
              </View>
              <Text className="text-green-400 font-semibold">+50 USDC</Text>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center">
                  <Ionicons name="arrow-down" size={16} color="#22C55E" />
                </View>
                <View>
                  <Text className="text-white font-medium">Received</Text>
                  <Text className="text-white/60 text-xs">1 day ago</Text>
                </View>
              </View>
              <Text className="text-green-400 font-semibold">+2.5 SOL</Text>
            </View>
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
                    : "bg-black/15 border-white/10"
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
            {/* <Text className="text-white/60 text-lg mr-2">
              {selectedCurrency === "USDC" ? "$" : "◎"}
            </Text> */}
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
                    : "bg-black/15 border-white/10"
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
                  Ready to share
                </Text>
              </View>
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
