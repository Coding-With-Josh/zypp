import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function CurrencyScreen() {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const prefs = user?.preferences as Record<string, any>;
    return prefs?.currency || "USD";
  });

  // Update selected currency when user preferences change
  useEffect(() => {
    const prefs = user?.preferences as Record<string, any>;
    if (prefs?.currency) {
      setSelectedCurrency(prefs.currency);
    }
  }, [user?.preferences]);

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$", rate: "1.00" },
    { code: "EUR", name: "Euro", symbol: "€", rate: "0.92" },
    { code: "GBP", name: "British Pound", symbol: "£", rate: "0.79" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: "148.50" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: "1.35" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: "1.52" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: "7.18" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", rate: "83.12" },
  ];

  const handleCurrencySelect = async (currencyCode: string) => {
    try {
      setIsLoading(true);
      setSelectedCurrency(currencyCode);

      // Update user preferences
      const currentPreferences =
        (user?.preferences as Record<string, any>) || {};
      await updateUserProfile({
        preferences: {
          ...currentPreferences,
          currency: currencyCode,
        } as Record<string, any>,
      });

      Alert.alert(
        "Currency Changed",
        "Display currency updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to update currency. Please try again."
      );
      // Revert selection on error
      const prefs = user?.preferences as Record<string, any>;
      setSelectedCurrency(prefs?.currency || "USD");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="absolute top-0 left-0 right-0 w-full"
        style={{ height: 400 }}
        resizeMode="cover"
      />
      <SafeAreaView className="flex-1 bg-transparent">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-xl">Currency</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white/60 text-sm mb-6">
            Choose your preferred display currency
          </Text>

          <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
            {currencies.map((currency, index) => (
              <TouchableOpacity
                key={currency.code}
                onPress={() =>
                  !isLoading && handleCurrencySelect(currency.code)
                }
                className={`flex-row items-center justify-between px-4 py-4 ${
                  index !== currencies.length - 1
                    ? "border-b border-white/10"
                    : ""
                } ${isLoading ? "opacity-50" : ""}`}
                disabled={isLoading}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-semibold">
                      {currency.symbol}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white font-medium text-base">
                      {currency.name}
                    </Text>
                    <Text className="text-white/60 text-sm mt-1">
                      {currency.code} • 1 USD = {currency.rate} {currency.code}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  {isLoading && selectedCurrency === currency.code ? (
                    <ActivityIndicator size="small" color="#22C55E" />
                  ) : selectedCurrency === currency.code ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color="#22C55E"
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <View className="ml-3 flex-1">
                <Text className="text-yellow-400 font-medium text-sm">
                  Display Only
                </Text>
                <Text className="text-yellow-400/80 text-sm mt-1">
                  This only changes how amounts are displayed. All transactions
                  are still processed in their original currency.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
