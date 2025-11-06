import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Linking, ScrollView, TouchableOpacity } from "react-native";

export default function AboutScreen() {
  const appInfo = {
    version: "1.0.0",
    build: "2024.12.1",
    releaseDate: "December 2024",
  };

  const teamMembers = [
    { name: "Joshua Idele", role: "Founder & CEO" },
    { name: "Yagazie Web", role: "Co-founder" },
    { name: "Judah Oyedele", role: "Designer" },
  ];

  const socialLinks = [
    {
      icon: "logo-twitter",
      name: "Twitter",
      url: "https://x.com/use_zypp",
    },
    {
      icon: "logo-github",
      name: "GitHub",
      url: "https://github.com/zyppprotocol",
    },
    {
      icon: "logo-discord",
      name: "Discord",
      url: "https://discord.gg/use_zypp",
    },
    { icon: "document", name: "Website", url: "https://zypp.fun" },
  ];

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
          <Text className="text-white font-semibold text-xl">About</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* App Logo & Info */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/brand/logo-text.png")}
              className="w-48 h-16 mb-6"
              resizeMode="contain"
            />
            <Text className="text-white font-semibold text-2xl mb-2">
              Zypp Wallet
            </Text>
            <Text className="text-white/60 text-center mb-4">
              The fastest and most secure way to send and receive crypto
              payments
            </Text>
            <View className="bg-black/15 rounded-2xl px-4 py-3">
              <Text className="text-white text-sm">
                Version {appInfo.version} (Build {appInfo.build})
              </Text>
              <Text className="text-white/60 text-xs text-center mt-1">
                Released {appInfo.releaseDate}
              </Text>
            </View>
          </View>
          {/* Description */}
          <View className="mb-8">
            <Text className="text-white font-semibold text-lg mb-3">
              Our Mission
            </Text>
            <Text className="text-white/60 text-sm leading-6">
              Zypp Wallet is built to make cryptocurrency accessible to
              everyone. We believe in a future where sending money globally is
              as easy as sending a text message. Our platform combines
              cutting-edge blockchain technology with a user-friendly interface
              to provide the best crypto payment experience.
            </Text>
          </View>
          {/* Features */}
          <View className="mb-8">
            <Text className="text-white font-semibold text-lg mb-3">
              Key Features
            </Text>
            <View className="gap-2">
              <FeatureItem text="Instant cross-border payments" />
              <FeatureItem text="Bank-grade security" />
              <FeatureItem text="Zero transaction fees" />
              <FeatureItem text="Offline payment capability" />
              <FeatureItem text="Multi-currency support" />
              <FeatureItem text="Built on Solana blockchain" />
            </View>
          </View>
          {/* Team */}
          <View className="mb-8">
            <Text className="text-white font-semibold text-lg mb-3">
              Our Team
            </Text>
            <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
              {teamMembers.map((member, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between py-2 ${
                    index !== teamMembers.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <Text className="text-white font-medium">{member.name}</Text>
                  <Text className="text-white/60">{member.role}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Social Links */}
          <View className="mb-8">
            <Text className="text-white font-semibold text-lg mb-3">
              Connect With Us
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {socialLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(link.url)}
                  className="flex-1 min-w-[45%] bg-black/15 rounded-2xl p-4 items-center border border-white/10"
                >
                  <Ionicons name={link.icon as any} size={24} color="#22C55E" />
                  <Text className="text-white font-medium mt-2 text-center">
                    {link.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Legal */}
          <View className="bg-black/15 rounded-2xl p-4">
            <Text className="text-white font-medium mb-2">
              Legal Information
            </Text>
            <Text className="text-white/60 text-sm">
              Zypp Wallet LLC {"\n"}
            </Text>
          </View>
          ı
          <View className="w-full h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center">
      <IconSymbol name="checkmark.circle.fill" size={16} color="#22C55E" />
      <Text className="text-white/60 text-sm ml-2">{text}</Text>
    </View>
  );
}
