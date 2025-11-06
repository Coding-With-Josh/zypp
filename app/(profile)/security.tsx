import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useWallet } from "@/contexts/WalletContext";
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

export default function SecurityScreen() {
  const { wallet } = useWallet();
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [transactionNotifications, setTransactionNotifications] =
    useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const bioEnabled =
          await secureStorageManager.getAuthItem("biometrics_enabled");
        setBiometricsEnabled(bioEnabled === "true");
      } catch (error) {
        console.error("Failed to load biometrics setting:", error);
      }
    };
    loadSettings();
  }, []);

  const handleBiometricToggle = useCallback(async (enabled: boolean) => {
    try {
      await secureStorageManager.setAuthItem(
        "biometrics_enabled",
        enabled.toString()
      );
      setBiometricsEnabled(enabled);
    } catch (error) {
      console.error("Failed to toggle biometrics:", error);
      Alert.alert("Error", "Failed to update biometric settings");
    }
  }, []);

  const handleChangePIN = () => {
    router.push("/(auth)/set-pin");
  };

  const handleBackupWallet = async () => {
    if (!wallet) {
      Alert.alert("Error", "No wallet found to backup");
      return;
    }

    Alert.alert(
      "Backup Wallet",
      "Backing up your wallet means saving your recovery phrase. Make sure you're in a private place where no one can see your screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "default",
          onPress: () => router.push("/profile/backup-wallet"),
        },
      ]
    );
  };

  const handleViewRecoveryPhrase = async () => {
    if (!wallet) {
      Alert.alert("Error", "No wallet found");
      return;
    }

    // First ask for PIN
    Alert.alert(
      "Security Check",
      "For your security, please enter your PIN to view the recovery phrase.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "default",
          onPress: () =>
            router.push(
              "/profile/verify-pin?redirectTo=/profile/recovery-phrase"
            ),
        },
      ]
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
          <Text className="text-white font-semibold text-xl">Security</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* PIN & Authentication */}
          <View className="mb-8">
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Authentication
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
              <TouchableOpacity
                onPress={handleChangePIN}
                className="flex-row items-center px-4 py-4 border-b border-white/10"
              >
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="lock-closed" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Change PIN
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Update your transaction PIN
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <View className="flex-row items-center px-4 py-4">
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="finger-print" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Biometric Login
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Use Face ID or Touch ID
                  </Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: "#6B7280", true: "#22C55E" }}
                />
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View className="mb-8">
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Notifications
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
              <View className="flex-row items-center px-4 py-4 border-b border-white/10">
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="notifications" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Transaction Alerts
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Get notified for all transactions
                  </Text>
                </View>
                <Switch
                  value={transactionNotifications}
                  onValueChange={setTransactionNotifications}
                  trackColor={{ false: "#6B7280", true: "#22C55E" }}
                />
              </View>

              <View className="flex-row items-center px-4 py-4">
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Security Alerts
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Important security notifications
                  </Text>
                </View>
                <Switch
                  value={securityAlerts}
                  onValueChange={setSecurityAlerts}
                  trackColor={{ false: "#6B7280", true: "#22C55E" }}
                />
              </View>
            </View>
          </View>

          {/* Wallet Security */}
          <View className="mb-8">
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Wallet Security
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
              <TouchableOpacity
                onPress={handleBackupWallet}
                className="flex-row items-center px-4 py-4 border-b border-white/10"
              >
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="cloud-upload" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Backup Wallet
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Secure your recovery phrase
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleViewRecoveryPhrase}
                className="flex-row items-center px-4 py-4"
              >
                <View className="w-10 h-10 rounded-xl bg-yellow-500/20 items-center justify-center mr-3">
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    View Recovery Phrase
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Keep this safe and secure
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Session Management */}
          <View>
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Sessions
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
              <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-white/10"
                onPress={() =>
                  Alert.alert(
                    "Active Sessions",
                    "View and manage your active sessions",
                    [{ text: "OK" }]
                  )
                }
              >
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="phone-portrait" size={20} color="#22C55E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Device Sessions
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Manage active sessions
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center px-4 py-4"
                onPress={() =>
                  Alert.alert(
                    "Log Out All Devices",
                    "Are you sure you want to log out from all devices? This will require you to log in again on each device.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Log Out All",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await secureStorageManager.clearSensitiveData();
                            router.replace("/(auth)/onboarding");
                          } catch (error) {
                            console.error(
                              "Failed to log out all devices:",
                              error
                            );
                            Alert.alert(
                              "Error",
                              "Failed to log out all devices"
                            );
                          }
                        },
                      },
                    ]
                  )
                }
              >
                <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    Log Out All Devices
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Clear all active sessions
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
