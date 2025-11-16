import { QRScannerModal } from "@/components/blocks/modals/qr-scanner-modal";
import { SafeAreaView, Text, alert } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

export default function MeScreen() {
  const { user, signOut } = useAuth();
  const { wallet, balance, transactions, solPrice } = useWallet();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: "person-outline",
          title: "Profile",
          subtitle: "Manage your personal information",
          onPress: () => router.push("/edit"),
        },
        {
          icon: "scan",
          title: "My QR Code",
          subtitle: "Your personal payment QR code",
          onPress: () => router.push("/(profile)/qr-code"),
        },
        {
          icon: "shield-outline",
          title: "Security",
          subtitle: "PIN, biometrics, and security settings",
          onPress: () => router.push("/(profile)/security"),
        },
        {
          icon: "wallet-outline",
          title: "Wallet Addresses",
          subtitle: "View all your wallet addresses",
          onPress: () => router.push("/(profile)/wallet-addresses"),
        },
        {
          icon: "receipt-outline",
          title: "Transaction History",
          subtitle: "View your transaction history",
          onPress: () => router.push("/transaction-history"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications-outline",
          title: "Notifications",
          subtitle: "Push notifications and alerts",
          type: "toggle",
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: "finger-print",
          title: "Biometric Login",
          subtitle: "Use Face ID or Touch ID",
          type: "toggle",
          value: biometricsEnabled,
          onToggle: setBiometricsEnabled,
        },
        {
          icon: "moon-outline",
          title: "Dark Mode",
          subtitle: "Always on",
          type: "toggle",
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled,
        },
        {
          icon: "card-outline",
          title: "Currency",
          subtitle: "USD - US Dollar",
          onPress: () => router.push("/(profile)/currency"),
        },
      ],
    },
    {
      title: "Support & Information",
      items: [
        {
          icon: "help-circle-outline",
          title: "Help & Support",
          subtitle: "FAQ and contact support",
          onPress: () => router.push("/(profile)/support"),
        },
        {
          icon: "document-outline",
          title: "Terms & Conditions",
          subtitle: "Legal documents",
          onPress: () => router.push("/(profile)/terms"),
        },
        {
          icon: "lock-closed-outline",
          title: "Privacy Policy",
          subtitle: "How we handle your data",
          onPress: () => router.push("/(profile)/privacy"),
        },
        {
          icon: "information-circle-outline",
          title: "About The Zypp Wallet",
          subtitle: "App version 1.0.0",
          onPress: () => router.push("/(profile)/about"),
        },
      ],
    },
  ];

  const handleLogout = () => {
    alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/onboarding");
          } catch (error) {
            console.error("Logout failed:", error);
            alert("Error", "Failed to log out. Please try again.", [
              { text: "OK" },
            ]);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/(profile)/edit");
  };

  const handleSettings = () => {
    router.push("/(profile)/settings");
  };

  return (
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
        <View className="w-full px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-semibold text-3xl">Profile</Text>
            <TouchableOpacity
              onPress={handleSettings}
              className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            >
              <Ionicons name="settings-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Profile Header */}
          <View className="px-6 mb-8">
            <View className="flex-row items-center gap-4 mb-6">
              <TouchableOpacity onPress={handleEditProfile}>
                <Image
                  source={
                    user?.avatar_url
                      ? { uri: user.avatar_url }
                      : require("@/assets/images/design/user.png")
                  }
                  className="w-20 h-20 rounded-2xl border-2 border-primary"
                />
              </TouchableOpacity>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-semibold text-2xl mb-1">
                      {user?.username || "Anonymous"}
                    </Text>
                    <Text className="text-white/60 text-base">
                      {user?.display_name || "Zypp User"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleEditProfile}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                  >
                    <Ionicons name="create-outline" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-2 mt-2">
                  {wallet && (
                    <View className="bg-green-500/20 px-2 py-1 rounded-full">
                      <Text className="text-green-400 text-xs font-medium">
                        Verified
                      </Text>
                    </View>
                  )}
                  <Text className="text-white/40 text-xs">
                    Joined {user ? formatDate(user.created_at) : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between bg-black/15 rounded-2xl p-4 border border-white/10">
              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/transaction-history")}
              >
                <Text className="text-white font-semibold text-lg">
                  {transactions?.length || 0}
                </Text>
                <Text className="text-white/60 text-xs">Transactions</Text>
              </TouchableOpacity>
              <View className="w-px bg-white/10" />
              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/home")}
              >
                <Text className="text-white font-semibold text-lg">
                  {`${(balance?.sol_balance || 0).toFixed(4)} SOL`}
                </Text>
                <Text className="text-white/60 text-xs">
                  {formatCurrency(
                    (balance?.sol_balance || 0) * (solPrice || 20),
                    "USD"
                  )}
                </Text>
              </TouchableOpacity>
              <View className="w-px bg-white/10" />
              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/(profile)/contacts")}
              >
                <Text className="text-white font-semibold text-lg">0</Text>
                <Text className="text-white/60 text-xs">Contacts</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          {/* <View className="px-6 mb-8">
            <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Quick Actions
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/send")}
              >
                <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="share" size={24} color="#22C55E" />
                </View>
                <Text className="text-white text-sm font-medium">Send</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/receive")}
              >
                <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="download" size={24} color="#22C55E" />
                </View>
                <Text className="text-white text-sm font-medium">Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => router.push("/add-cash")}
              >
                <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="add" size={24} color="#22C55E" />
                </View>
                <Text className="text-white text-sm font-medium">Add Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center flex-1"
                onPress={() => setShowQRScannerModal(true)}
              >
                <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="scan" size={24} color="#22C55E" />
                </View>
                <Text className="text-white text-sm font-medium">QR Code</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* Menu Sections */}
          <View className="px-6">
            {menuSections.map((section, sectionIndex) => (
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

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center active:bg-red-500/20 mb-8"
            >
              <Text className="text-red-400 font-semibold text-base">
                Log Out
              </Text>
            </TouchableOpacity>

            {/* App Version */}
            <View className="items-center">
              <Text className="text-white/40 text-sm">Zypp Wallet v1.0.0</Text>
              <Text className="text-white/30 text-xs mt-1">
                Built with ❤️ for the Solana community
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <QRScannerModal
        visible={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
      />
    </View>
  );
}
