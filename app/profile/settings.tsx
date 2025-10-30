import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";

export default function SettingsScreen() {
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const settingsSections = [
    {
      title: "Security",
      items: [
        {
          icon: "finger-print",
          title: "Face ID / Touch ID",
          subtitle: "Use biometric authentication",
          type: "toggle",
          value: faceIdEnabled,
          onToggle: setFaceIdEnabled,
        },
        {
          icon: "lock-closed",
          title: "Auto Lock",
          subtitle: "Lock app after 5 minutes",
          type: "toggle",
          value: autoLockEnabled,
          onToggle: setAutoLockEnabled,
        },
        {
          icon: "shield-checkmark",
          title: "Security Settings",
          subtitle: "PIN, biometrics, and more",
          onPress: () => router.push("/profile/security"),
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: "cloud-upload",
          title: "Cloud Backup",
          subtitle: "Backup wallet to cloud",
          type: "toggle",
          value: cloudBackupEnabled,
          onToggle: setCloudBackupEnabled,
        },
        {
          icon: "eye-off",
          title: "Hide Balances",
          subtitle: "Mask amounts on home screen",
          type: "toggle",
          value: false,
          onToggle: () => {},
        },
        {
          icon: "analytics",
          title: "Analytics",
          subtitle: "Help improve Zypp Wallet",
          type: "toggle",
          value: true,
          onToggle: () => {},
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications",
          title: "Push Notifications",
          subtitle: "Transaction alerts and updates",
          type: "toggle",
          value: true,
          onToggle: () => {},
        },
        {
          icon: "mail",
          title: "Email Notifications",
          subtitle: "Security alerts and news",
          type: "toggle",
          value: marketingEmails,
          onToggle: setMarketingEmails,
        },
        {
          icon: "chatbubble",
          title: "Sound & Vibration",
          subtitle: "Notification preferences",
          onPress: () =>
            Alert.alert("Sound Settings", "Configure notification sounds"),
        },
      ],
    },
    {
      title: "Advanced",
      items: [
        {
          icon: "server",
          title: "Network Settings",
          subtitle: "Blockchain node configuration",
          onPress: () =>
            Alert.alert("Network Settings", "Configure blockchain connections"),
        },
        {
          icon: "speedometer",
          title: "Transaction Speed",
          subtitle: "Priority fee settings",
          onPress: () =>
            Alert.alert("Transaction Speed", "Adjust transaction priority"),
        },
        {
          icon: "bug",
          title: "Debug Mode",
          subtitle: "Advanced debugging options",
          type: "toggle",
          value: false,
          onToggle: () => {},
        },
      ],
    },
  ];

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "This will clear all cached data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => Alert.alert("Success", "Cache cleared successfully!"),
      },
    ]);
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export your transaction history and wallet data."
    );
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
          <Text className="text-white font-semibold text-xl">Settings</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-8">
              <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
                {section.title}
              </Text>

              <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    onPress={item.onPress}
                    className={`flex-row items-center px-4 py-4 ${
                      itemIndex !== section.items.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color="#22C55E"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-white font-medium text-base">
                        {item.title}
                      </Text>
                      <Text className="text-white/60 text-sm mt-1">
                        {item.subtitle}
                      </Text>
                    </View>

                    {item.type === "toggle" ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: "#6B7280", true: "#22C55E" }}
                        thumbColor={item.value ? "#FFFFFF" : "#F3F4F6"}
                      />
                    ) : (
                      <IconSymbol
                        name="chevron.right"
                        size={16}
                        color="#9CA3AF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Data Management */}
          <View className="mb-8">
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Data Management
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
              <TouchableOpacity
                onPress={handleExportData}
                className="flex-row items-center px-4 py-4 border-b border-white/10"
              >
                <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                  <Ionicons name="download" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Export Data
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Download your transaction history
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearCache}
                className="flex-row items-center px-4 py-4"
              >
                <View className="w-10 h-10 rounded-xl bg-yellow-500/20 items-center justify-center mr-3">
                  <Ionicons name="trash" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Clear Cache
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Free up storage space
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View className="bg-black/15 rounded-2xl p-4 items-center">
            <Text className="text-white/60 text-sm">Zypp Wallet v1.0.0</Text>
            <Text className="text-white/40 text-xs mt-1">Build 2024.12.1</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
