import { SafeAreaView, Text, View } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Share, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QRCodeScreen() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!wallet?.public_key) return;

    try {
      await Share.share({
        title: "Share Wallet Address",
        message: `Hey there! 😎 This is my Zypp wallet address: ${wallet.public_key}. Send me some crypto!`,
      });
    } catch {
      Alert.alert("Error", "Failed to share wallet address");
    }
  };

  const handleCopy = async () => {
    if (!wallet?.public_key) return;

    try {
      await Clipboard.setStringAsync(wallet.public_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Success", "Wallet address copied to clipboard");
    } catch {
      Alert.alert("Error", "Failed to copy to clipboard");
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
          <Text className="text-white font-semibold text-xl">My QR Code</Text>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Ionicons name="share-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          {/* QR Code Display */}
          <View className="bg-white p-3 rounded-2xl mb-8">
            <View className="w-64 h-64 items-center justify-center rounded-xl">
              <View className="items-center">
                <Text className="text-black text-sm font-semibold my-2">
                  {user?.username || "Anonymous"}
                </Text>
                <View className="w-450 h-450 bg-white items-center justify-center rounded overflow-hidden">
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
                {wallet?.public_key || "No wallet found"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={handleCopy}
              disabled={!wallet?.public_key}
              className="flex-1 flex-row items-center justify-center gap-2 bg-black/15 py-4 rounded-full border border-white/10"
            >
              <Ionicons
                name={copied ? "checkmark" : "copy"}
                size={18}
                color="white"
              />
              <Text className="text-white font-semibold">
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              disabled={!wallet?.public_key}
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
