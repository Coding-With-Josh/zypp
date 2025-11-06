// AddCash.tsx
import { SafeAreaView, Text } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { AlertModal } from "@/components/ui/modal";
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

export default function AddCash() {
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDC");
  const [alertVisible, setAlertVisible] = useState(false);

  const currencies = [
    {
      code: "USDC",
      symbol: "$",
      name: "USD Coin",
      icon: require("@/assets/images/icons/dollar-icon.png"),
    },
    {
      code: "SOL",
      symbol: "◎",
      name: "Solana",
      icon: require("@/assets/images/icons/sol-icon.png"),
    },
  ];

  const handleNumberPress = (num: number | string) => {
    if (num === "." && amount.includes(".")) return;

    if (num === "." && amount === "") {
      setAmount("0.");
      return;
    }

    const newAmount = amount + num.toString();

    // Limit to 2 decimal places
    if (newAmount.includes(".") && newAmount.split(".")[1]?.length > 2) {
      return;
    }

    // Limit total digits
    if (newAmount.replace(".", "").length > 8) {
      return;
    }

    setAmount(newAmount);
  };

  const handleBackspace = () => {
    if (amount.length > 0) {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmount("");
  };

  const formatAmount = (value: string) => {
    if (!value) return "0.00";

    if (value.includes(".")) {
      const [whole, decimal] = value.split(".");
      return `${whole}.${decimal.padEnd(2, "0")}`;
    }

    return `${value}.00`;
  };

  const getQuickAmounts = () => {
    if (selectedCurrency === "SOL") {
      return [0.1, 0.5, 1, 2, 5, 10].map((base) => ({
        amount: base,
        label: `${base} SOL`,
      }));
    } else {
      return [10, 25, 50, 100, 250, 500].map((base) => ({
        amount: base,
        label: `$${base}`,
      }));
    }
  };

  const quickAmounts = getQuickAmounts();

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const showInfo = () => {
    Alert.alert(
      "Add Cash",
      "Add funds to your wallet by entering an amount. You can choose between USDC (stablecoin) or SOL (Solana).\n\nYour funds will be securely deposited and available for transactions immediately.",
      [{ text: "Got it", style: "default" }]
    );
  };

  const getCurrentIcon = () => {
    const currency = currencies.find((c) => c.code === selectedCurrency);
    return currency?.icon;
  };

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
          style={{ height: 500 }}
          resizeMode="cover"
        />

        <SafeAreaView className="flex-1 bg-transparent">
          <AlertModal
            visible={alertVisible}
            onClose={() => setAlertVisible(false)}
            title="Add Cash"
            message="Add funds to your wallet by entering an amount. You can choose between USDC (stablecoin) or SOL (Solana). Your funds will be securely deposited and available for transactions immediately."
            buttons={[
              {
                text: "Ok, that's nice",
                onPress: () => {
                  // Handle confirmation
                  setAlertVisible(false);
                },
                variant: "primary",
              },
            ]}
          />
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

              <Text className="text-white font-semibold text-xl">Add Cash</Text>

              <TouchableOpacity
                onPress={() => setAlertVisible(true)}
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Display */}
          <View className="items-center justify-center py-8 px-6">
            <Text className="text-white/60 text-lg font-medium mb-4">
              Enter Amount
            </Text>

            <View className="flex-row items-center justify-center">
              <Image
                source={getCurrentIcon()}
                className="w-8 h-8 mr-3"
                resizeMode="contain"
              />
              <Text className="text-white text-6xl font-semibold tracking-tight">
                {amount ? formatAmount(amount) : "0.00"}
              </Text>
            </View>

            {/* Currency Selector */}
            <View className="flex-row gap-3 mt-6">
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  onPress={() => setSelectedCurrency(currency.code)}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
                    selectedCurrency === currency.code
                      ? "bg-primary/10 border-primary/90 text-white"
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

          {/* Quick Amount Buttons */}
          <View className="px-6 mb-8">
            <Text className="text-white/60 text-base font-medium mb-4 text-center">
              Quick Add
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
            >
              {quickAmounts.map((item) => (
                <TouchableOpacity
                  key={item.amount}
                  onPress={() => handleQuickAmount(item.amount)}
                  className={`px-5 py-3 rounded-full border ${
                    amount === item.amount.toString()
                      ? "bg-primary/10 border-primary/90 text-white"
                      : "bg-black/15 border-white/10 pl-4"
                  }`}
                >
                  <Text
                    className={
                      amount === item.amount.toString()
                        ? "text-white font-semibold text-sm"
                        : "text-white font-medium text-sm"
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Number Pad */}
          <View className="flex-1 justify-end px-6 pb-8">
            <View className="rounded-3xl overflow-hidden">
              {/* Number Pad Rows */}
              <View className="mb-2">
                {/* Row 1: 1, 2, 3 */}
                <View className="flex-row justify-between mb-2">
                  {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                      key={num}
                      className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text className="text-white text-3xl font-medium">
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 2: 4, 5, 6 */}
                <View className="flex-row justify-between mb-2">
                  {[4, 5, 6].map((num) => (
                    <TouchableOpacity
                      key={num}
                      className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text className="text-white text-3xl font-medium">
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 3: 7, 8, 9 */}
                <View className="flex-row justify-between mb-2">
                  {[7, 8, 9].map((num) => (
                    <TouchableOpacity
                      key={num}
                      className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text className="text-white text-3xl font-medium">
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 4: ., 0, ← */}
                <View className="flex-row justify-between">
                  {/* Decimal */}
                  <TouchableOpacity
                    className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                    onPress={() => handleNumberPress(".")}
                    disabled={amount.includes(".")}
                  >
                    <Text className="text-white text-3xl font-medium">.</Text>
                  </TouchableOpacity>

                  {/* Zero */}
                  <TouchableOpacity
                    className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                    onPress={() => handleNumberPress(0)}
                  >
                    <Text className="text-white text-3xl font-medium">0</Text>
                  </TouchableOpacity>

                  {/* Backspace */}
                  <TouchableOpacity
                    className="w-20 h-16 rounded-full items-center justify-center active:bg-black/15"
                    onPress={handleBackspace}
                    disabled={!amount}
                  >
                    <IconSymbol
                      name="delete.left"
                      color={amount ? "white" : "#6B7280"}
                      size={28}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={handleClear}
                  className="flex-1 bg-black/15 py-4 rounded-full items-center active:bg-white/10"
                  disabled={!amount}
                >
                  <Text
                    className={`font-semibold text-lg ${amount ? "text-white" : "text-white/40"}`}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Handle add cash action
                    console.log("Adding:", amount, selectedCurrency);
                  }}
                  className={`flex-1 py-4 rounded-full items-center ${
                    amount && parseFloat(amount) > 0
                      ? "bg-primary active:bg-primary/90"
                      : "bg-black/15"
                  }`}
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  <Text
                    className={`font-semibold text-lg ${
                      amount && parseFloat(amount) > 0
                        ? "text-primary-foreground"
                        : "text-white/40"
                    }`}
                  >
                    Add Cash
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
