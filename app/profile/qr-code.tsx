import { SafeAreaView, Text, View } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import { Alert, Image, Share, TouchableOpacity } from "react-native";

export default function QRCodeScreen() {
  const walletAddress = "9gY72Kp38hJ9kL2mN5qR8tBvC7xW4aD1z";

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Share Wallet Address",
        message: `Hey there! 😎 This is my Zypp wallet address: ${walletAddress}.   Send me some crypto!`,
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to share wallet address: ", error);
    }
  };

  const handleCopy = () => {
    Clipboard.setStringAsync(walletAddress);
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
          <Text className="text-white font-semibold text-xl">My QR Code</Text>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Ionicons name="share-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          {/* QR Code Display */}
          <View className="bg-white p-6 rounded-3xl mb-8">
            <View className="w-64 h-64 bg-gray-800 items-center justify-center rounded-xl">
              <View className="items-center">
                <Text className="text-white text-sm font-medium mb-2">
                  josh_scriptz
                </Text>
                <View className="w-48 h-48 bg-white items-center justify-center rounded border-2 border-dashed border-gray-300">
                  <Text className="text-black text-xs text-center font-mono p-2">
                    QR CODE PLACEHOLDER
                  </Text>
                </View>
                <Text className="text-white text-xs mt-2 text-center">
                  Scan to send payment
                </Text>
              </View>
            </View>
          </View>

          {/* Wallet Address */}
          <View className="w-full mb-8">
            <Text className="text-white/60 text-center mb-3">
              Your Wallet Address
            </Text>
            <TouchableOpacity
              onPress={handleCopy}
              className="bg-black/15 rounded-2xl p-4 border border-white/10"
            >
              <Text className="text-white text-center font-mono text-sm">
                {walletAddress}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={handleCopy}
              className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-4 rounded-full border border-white/10"
            >
              <Ionicons name="copy" size={18} color="white" />
              <Text className="text-white font-semibold">Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 flex-row items-center justify-center gap-2 bg-primary py-4 rounded-full"
            >
              <Ionicons name="share" size={23} color="#081405" />
              <Text className="text-primary-foreground font-semibold">
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
