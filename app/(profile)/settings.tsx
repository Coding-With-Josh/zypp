import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { secureStorageManager } from "@/lib/storage/secure-store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";

export default function SettingsScreen() {
  const { user, updateUserProfile } = useAuth();
  const [preferences, setPreferences] = useState(
    user?.preferences || {
      currency: "USD",
      language: "en",
      theme: "system",
      notifications: true,
    }
  );
  const [appSettings, setAppSettings] = useState(
    user?.settings || {
      notifications: {
        transactions: true,
        promotions: false,
        security: true,
        p2p_discovery: true,
      },
      security: {
        auto_lock: 5, // minutes
        biometrics: false,
        hide_balances: false,
        transaction_confirmation: true,
      },
      p2p: {
        auto_accept: false,
        discovery_range: "medium",
        preferred_transport: "local_network",
      },
    }
  );

  // Load settings from user profile when it changes
  useEffect(() => {
    if (user) {
      setPreferences(
        user.preferences || {
          currency: "USD",
          language: "en",
          theme: "system",
          notifications: true,
        }
      );
      setAppSettings(
        user.settings || {
          notifications: {
            transactions: true,
            promotions: false,
            security: true,
            p2p_discovery: true,
          },
          security: {
            auto_lock: 5,
            biometrics: false,
            hide_balances: false,
            transaction_confirmation: true,
          },
          p2p: {
            auto_accept: false,
            discovery_range: "medium",
            preferred_transport: "local_network",
          },
        }
      );
    }
  }, [user]);

  // Handle updating settings in the database
  const handleSettingUpdate = useCallback(
    async (
      type: "preferences" | "settings",
      key: string,
      value: any,
      section?: string
    ) => {
      try {
        if (type === "preferences") {
          const newPreferences = { ...preferences, [key]: value };
          setPreferences(newPreferences);
          await updateUserProfile({ preferences: newPreferences });
        } else {
          const newSettings = { ...appSettings };
          if (section) {
            newSettings[section] = { ...newSettings[section], [key]: value };
          } else {
            newSettings[key] = value;
          }
          setAppSettings(newSettings);
          await updateUserProfile({ settings: newSettings });
        }
      } catch (error) {
        console.error("Failed to update settings:", error);
        Alert.alert("Error", "Failed to update settings");
      }
    },
    [preferences, appSettings, updateUserProfile]
  );

  // Save biometric setting to secure storage as well
  const handleBiometricToggle = useCallback(
    async (enabled: boolean) => {
      try {
        await secureStorageManager.setAuthItem(
          "biometrics_enabled",
          enabled.toString()
        );
        await handleSettingUpdate(
          "settings",
          "biometrics",
          enabled,
          "security"
        );
      } catch (error) {
        console.error("Failed to toggle biometrics:", error);
        Alert.alert("Error", "Failed to update biometric settings");
      }
    },
    [handleSettingUpdate]
  );

  const settingsSections = [
    {
      title: "Security",
      items: [
        {
          icon: "finger-print",
          title: "Face ID / Touch ID",
          subtitle: "Use biometric authentication",
          type: "toggle",
          value: appSettings.security.biometrics,
          onToggle: (enabled) =>
            handleSettingUpdate("settings", "biometrics", enabled, "security"),
        },
        {
          icon: "lock-closed",
          title: "Auto Lock",
          subtitle: `Lock app after ${appSettings.security.auto_lock} minutes`,
          type: "select",
          options: [
            { label: "1 minute", value: 1 },
            { label: "5 minutes", value: 5 },
            { label: "15 minutes", value: 15 },
            { label: "30 minutes", value: 30 },
          ],
          value: appSettings.security.auto_lock,
          onChange: (value) =>
            handleSettingUpdate("settings", "auto_lock", value, "security"),
        },
        {
          icon: "shield-checkmark",
          title: "Security Settings",
          subtitle: "PIN, biometrics, and more",
          type: "link",
          route: "(profile)/security",
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: "eye-off",
          title: "Hide Balances",
          subtitle: "Mask amounts on home screen",
          type: "toggle",
          value: appSettings.security.hide_balances,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "hide_balances",
              enabled,
              "security"
            ),
        },
        {
          icon: "key",
          title: "Transaction Confirmation",
          subtitle: "Confirm before sending",
          type: "toggle",
          value: appSettings.security.transaction_confirmation,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "transaction_confirmation",
              enabled,
              "security"
            ),
        },
        {
          icon: "analytics",
          title: "Analytics",
          subtitle: "Help improve Zypp Wallet",
          type: "toggle",
          value: preferences.analytics ?? false,
          onToggle: (enabled) =>
            handleSettingUpdate("preferences", "analytics", enabled),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications",
          title: "Push Notifications",
          subtitle: "Enable/disable all notifications",
          type: "toggle",
          value: preferences.notifications,
          onToggle: (enabled) =>
            handleSettingUpdate("preferences", "notifications", enabled),
        },
        {
          icon: "swap-vertical",
          title: "Transaction Alerts",
          subtitle: "New transactions and updates",
          type: "toggle",
          value: appSettings.notifications.transactions,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "transactions",
              enabled,
              "notifications"
            ),
          disabled: !preferences.notifications,
        },
        {
          icon: "gift",
          title: "Promotions",
          subtitle: "News and special offers",
          type: "toggle",
          value: appSettings.notifications.promotions,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "promotions",
              enabled,
              "notifications"
            ),
          disabled: !preferences.notifications,
        },
        {
          icon: "shield",
          title: "Security Alerts",
          subtitle: "Important security updates",
          type: "toggle",
          value: appSettings.notifications.security,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "security",
              enabled,
              "notifications"
            ),
          disabled: !preferences.notifications,
        },
      ],
    },
    {
      title: "Peer-to-Peer",
      items: [
        {
          icon: "people",
          title: "P2P Discovery",
          subtitle: "Find nearby users",
          type: "toggle",
          value: appSettings.notifications.p2p_discovery,
          onToggle: (enabled) =>
            handleSettingUpdate(
              "settings",
              "p2p_discovery",
              enabled,
              "notifications"
            ),
        },
        {
          icon: "checkmark-done",
          title: "Auto Accept",
          subtitle: "Automatically accept transactions",
          type: "toggle",
          value: appSettings.p2p.auto_accept,
          onToggle: (enabled) =>
            handleSettingUpdate("settings", "auto_accept", enabled, "p2p"),
        },
        {
          icon: "radio",
          title: "Discovery Range",
          subtitle: `Current: ${appSettings.p2p.discovery_range}`,
          type: "select",
          options: [
            { label: "Short (5m)", value: "short" },
            { label: "Medium (15m)", value: "medium" },
            { label: "Long (50m)", value: "long" },
          ],
          value: appSettings.p2p.discovery_range,
          onChange: (value) =>
            handleSettingUpdate("settings", "discovery_range", value, "p2p"),
        },
        {
          icon: "wifi",
          title: "Connection Method",
          subtitle: "Preferred connection type",
          type: "select",
          options: [
            { label: "Bluetooth", value: "bluetooth" },
            { label: "Wi-Fi Direct", value: "wifi_direct" },
            { label: "Local Network", value: "local_network" },
          ],
          value: appSettings.p2p.preferred_transport,
          onChange: (value) =>
            handleSettingUpdate(
              "settings",
              "preferred_transport",
              value,
              "p2p"
            ),
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
                        disabled={item.disabled}
                      />
                    ) : item.type === "select" ? (
                      <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => {
                          const currentOption = item.options?.find(
                            (opt) => opt.value === item.value
                          );
                          Alert.alert(item.title, "Choose an option", [
                            ...(item.options?.map((option) => ({
                              text: option.label,
                              onPress: () => item.onChange?.(option.value),
                              style:
                                option.value === item.value
                                  ? "default"
                                  : "default",
                            })) || []),
                            { text: "Cancel", style: "cancel" },
                          ]);
                        }}
                      >
                        <Text className="text-white/60 mr-2">
                          {item.options?.find((opt) => opt.value === item.value)
                            ?.label || "Select"}
                        </Text>
                        <IconSymbol
                          name="chevron.right"
                          size={16}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    ) : item.type === "link" ? (
                      <TouchableOpacity
                        onPress={() => item.route && router.push(item.route)}
                        className="flex-row items-center"
                      >
                        <IconSymbol
                          name="chevron.right"
                          size={16}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
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
