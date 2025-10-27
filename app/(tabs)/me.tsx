import { SafeAreaView, Text } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View, Alert } from "react-native";

export default function MeScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: "person-outline",
          title: "Profile",
          subtitle: "Manage your personal information",
          onPress: () => console.log("Navigate to profile"),
        },
        {
          icon: "scan",
          title: "My QR Code",
          subtitle: "Your personal payment QR code",
          onPress: () => console.log("Show QR code"),
        },
        {
          icon: "shield-outline",
          title: "Security",
          subtitle: "PIN, biometrics, and security settings",
          onPress: () => console.log("Navigate to security"),
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
          icon: "globe-outline",
          title: "Language",
          subtitle: "English",
          onPress: () => console.log("Change language"),
        },
        {
          icon: "moon-outline",
          title: "Dark Mode",
          subtitle: "Always on",
          onPress: () => console.log("Toggle theme"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle-outline",
          title: "Help & Support",
          subtitle: "FAQ and contact support",
          onPress: () => console.log("Open help"),
        },
        {
          icon: "document-outline",
          title: "Terms & Privacy",
          subtitle: "Legal documents",
          onPress: () => console.log("Show terms"),
        },
        {
          icon: "information-circle-outline",
          title: "About The Zypp Wallet",
          subtitle: "App version 1.0.0",
          onPress: () => console.log("Show about"),
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          console.log("Logging out...");
          // Handle logout logic
        },
      },
    ]);
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
            <Text className="text-black font-semibold text-3xl">Profile</Text>
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white/5 items-center justify-center"
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
              <Image
                source={require("@/assets/images/design/user.png")}
                className="w-20 h-20 rounded-2xl border-2 border-primary"
              />
              <View className="flex-1">
                <Text className="text-white font-semibold text-2xl mb-1">
                  josh_scriptz
                </Text>
                <Text className="text-white/60 text-base">Premium Member</Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <View className="bg-green-500/20 px-2 py-1 rounded-full">
                    <Text className="text-green-400 text-xs font-medium">
                      Verified
                    </Text>
                  </View>
                  <Text className="text-white/40 text-xs">Joined Dec 2024</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">24</Text>
                <Text className="text-white/60 text-xs">Transactions</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">$2,458</Text>
                <Text className="text-white/60 text-xs">Balance</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">12</Text>
                <Text className="text-white/60 text-xs">Contacts</Text>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          <View className="px-6">
            {menuSections.map((section, sectionIndex) => (
              <View key={sectionIndex} className="mb-8">
                <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
                  {section.title}
                </Text>

                <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
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
                        <Ionicons name={item.icon} size={20} color="#22C55E" />
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
                        <TouchableOpacity
                          onPress={() => item.onToggle?.(!item.value)}
                          className={`w-12 h-6 rounded-full ${
                            item.value ? "bg-primary" : "bg-white/20"
                          }`}
                        >
                          <View
                            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                              item.value ? "right-0.5" : "left-0.5"
                            }`}
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

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center active:bg-red-500/20"
            >
              <Text className="text-red-400 font-semibold text-base">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
