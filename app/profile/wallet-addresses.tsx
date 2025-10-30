import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, TouchableOpacity } from "react-native";

export default function WalletAddressesScreen() {
  const [addresses] = useState([
    {
      id: "1",
      name: "Primary Wallet",
      address: "9gY72Kp38hJ9kL2mN5qR8tBvC7xW4aD1z",
      type: "SOL",
      balance: "24.5 SOL",
      isPrimary: true,
    },
    {
      id: "2",
      name: "USDC Wallet",
      address: "7xW4aD1z9gY72Kp38hJ9kL2mN5qR8tBvC",
      type: "USDC",
      balance: "$2,458.90",
      isPrimary: false,
    },
    {
      id: "3",
      name: "Savings",
      address: "5qR8tBvC7xW4aD1z9gY72Kp38hJ9kL2mN",
      type: "SOL",
      balance: "10.2 SOL",
      isPrimary: false,
    },
  ]);

  const handleCopyAddress = (address: string) => {
    Alert.alert("Copied!", "Wallet address copied to clipboard");
  };

  const handleShareAddress = (address: string) => {
    Alert.alert("Shared", "Wallet address shared successfully!");
  };

  const handleAddWallet = () => {
    Alert.alert("Add Wallet", "Create a new wallet address");
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
          <Text className="text-white font-semibold text-xl">
            Wallet Addresses
          </Text>
          <TouchableOpacity onPress={handleAddWallet} className="p-2">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white/60 text-sm mb-6">
            Manage your wallet addresses and view balances
          </Text>

          {addresses.map((wallet, index) => (
            <View key={wallet.id} className="mb-4">
              <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold text-lg mr-2">
                      {wallet.name}
                    </Text>
                    {wallet.isPrimary && (
                      <View className="bg-primary/20 px-2 py-1 rounded-full">
                        <Text className="text-primary text-xs font-medium">
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white font-semibold">
                    {wallet.balance}
                  </Text>
                </View>

                <Text className="text-white/60 text-sm mb-3 font-mono">
                  {wallet.address}
                </Text>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleCopyAddress(wallet.address)}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-2 rounded-xl"
                  >
                    <IconSymbol name="doc.on.doc" size={16} color="white" />
                    <Text className="text-white text-sm font-medium">Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareAddress(wallet.address)}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-primary/20 py-2 rounded-xl"
                  >
                    <IconSymbol
                      name="square.and.arrow.up"
                      size={16}
                      color="#22C55E"
                    />
                    <Text className="text-primary text-sm font-medium">
                      Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Add New Wallet */}
          <TouchableOpacity
            onPress={handleAddWallet}
            className="border-2 border-dashed border-white/20 rounded-2xl p-6 items-center justify-center mt-4"
          >
            <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
            <Text className="text-white/60 font-medium mt-2">
              Add New Wallet
            </Text>
            <Text className="text-white/40 text-sm mt-1">
              Create additional wallet addresses
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
