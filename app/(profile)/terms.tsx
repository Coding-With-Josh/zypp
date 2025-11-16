import { SafeAreaView, Text, View } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, TouchableOpacity } from "react-native";

export default function TermsScreen() {
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
            Terms & Conditions
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white text-lg font-semibold mb-6">
            Zypp Wallet Terms of Service
          </Text>

          <Text className="text-white/80 text-sm leading-6 mb-6">
            Last updated: December 2024
          </Text>

          <View className="gap-6">
            <Section
              title="1. Acceptance of Terms"
              content="By accessing and using Zypp Wallet, you accept and agree to be bound by the terms and provision of this agreement."
            />

            <Section
              title="2. Use License"
              content="Permission is granted to temporarily use Zypp Wallet for personal, non-commercial transitory viewing only."
            />

            <Section
              title="3. Disclaimer"
              content="The materials on Zypp Wallet are provided on an 'as is' basis. Zypp Wallet makes no warranties, expressed or implied."
            />

            <Section
              title="4. Limitations"
              content="In no event shall Zypp Wallet or its suppliers be liable for any damages arising out of the use or inability to use the materials."
            />

            <Section
              title="5. Accuracy of Materials"
              content="The materials appearing in Zypp Wallet could include technical, typographical, or photographic errors."
            />

            <Section
              title="6. Links"
              content="Zypp Wallet has not reviewed all of the sites linked to its app and is not responsible for the contents of any such linked site."
            />

            <Section
              title="7. Modifications"
              content="Zypp Wallet may revise these terms of service for its app at any time without notice."
            />

            <Section
              title="8. Governing Law"
              content="These terms and conditions are governed by and construed in accordance with the laws of the United States."
            />
          </View>

          <View className="bg-black/15 rounded-2xl p-4 mt-8">
            <Text className="text-white font-medium mb-2">
              Contact Information
            </Text>
            <Text className="text-white/60 text-sm">
              For any questions about these Terms, please contact us at:
            </Text>
            <Text className="text-primary text-sm mt-1">
              legal@zyppwallet.com
            </Text>
          </View>
          <View className="w-full h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View>
      <Text className="text-white font-semibold text-base mb-2">{title}</Text>
      <Text className="text-white/60 text-sm leading-6">{content}</Text>
    </View>
  );
}
