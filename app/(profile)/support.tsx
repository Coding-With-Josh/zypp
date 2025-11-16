import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function SupportScreen() {
  const faqItems = [
    {
      question: "How do I send money?",
      answer:
        "Tap the Send button, enter the recipient's username or scan their QR code, enter the amount, and confirm the transaction.",
    },
    {
      question: "What currencies are supported?",
      answer:
        "Zypp Wallet currently supports SOL (Solana) and USDC (USD Coin) with more currencies coming soon.",
    },
    {
      question: "Is my money safe?",
      answer:
        "Yes! Zypp Wallet uses bank-level security including PIN protection, biometric authentication, and encrypted storage.",
    },
    {
      question: "How do I backup my wallet?",
      answer:
        "Go to Security settings and use the 'Backup Wallet' feature to securely save your recovery phrase.",
    },
  ];

  const supportOptions = [
    {
      icon: "chatbubble-ellipses",
      title: "Contact Support",
      description: "Chat with our support team",
      onPress: () => Alert.alert("Contact Support", "Opening support chat..."),
    },
    {
      icon: "mail",
      title: "Email Us",
      description: "support@zyppwallet.com",
      onPress: () => Linking.openURL("mailto:support@zyppwallet.com"),
    },
    {
      icon: "globe",
      title: "Visit Help Center",
      description: "Find answers in our knowledge base",
      onPress: () => Linking.openURL("https://help.zyppwallet.com"),
    },
    {
      icon: "logo-twitter",
      title: "Twitter Support",
      description: "@use_zypp",
      onPress: () => Linking.openURL("https://twitter.com/use_zypp"),
    },
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
          <Text className="text-white font-semibold text-xl">
            Help & Support
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Support Options */}
          <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
            Get Help
          </Text>
          <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden mb-8">
            {supportOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.onPress}
                className={`flex-row items-center px-4 py-4 ${
                  index !== supportOptions.length - 1
                    ? "border-b border-white/10"
                    : ""
                }`}
              >
                <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color="#22C55E"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">
                    {option.title}
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {option.description}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQ Section */}
          <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
            Frequently Asked Questions
          </Text>
          <View className="gap-3">
            {faqItems.map((faq, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Alert.alert(faq.question, faq.answer)}
                className="bg-black/15 rounded-2xl p-4 border border-white/10"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-medium flex-1 mr-2">
                    {faq.question}
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergency Section */}
          <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-8">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#EF4444" />
              <View className="ml-3 flex-1">
                <Text className="text-red-400 font-medium text-sm">
                  Emergency Support
                </Text>
                <Text className="text-red-400/80 text-sm mt-1">
                  If you suspect unauthorized activity or lost access to your
                  account, contact us immediately at security@zyppwallet.com
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
