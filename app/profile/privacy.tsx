import { SafeAreaView, Text, View } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, TouchableOpacity } from "react-native";

export default function PrivacyScreen() {
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
            Privacy Policy
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white text-lg font-semibold mb-6">
            Privacy Policy
          </Text>

          <Text className="text-white/80 text-sm leading-6 mb-6">
            Last updated: December 2024
          </Text>

          <View className="gap-6">
            <Section
              title="Information We Collect"
              content="We collect information you provide directly to us, such as when you create an account, make a transaction, or contact us for support. This includes your username, email address, and transaction history."
            />

            <Section
              title="How We Use Your Information"
              content="We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and security alerts, and respond to your comments and questions."
            />

            <Section
              title="Information Sharing"
              content="We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners."
            />

            <Section
              title="Security"
              content="We implement appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information."
            />

            <Section
              title="Your Rights"
              content="You have the right to access, correct, or delete your personal information. You can also object to our use of your personal information or ask us to restrict processing."
            />

            <Section
              title="Data Retention"
              content="We retain your personal information only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements."
            />

            <Section
              title="Changes to This Policy"
              content="We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date."
            />
          </View>

          <View className="bg-black/15 rounded-2xl p-4 mt-8">
            <Text className="text-white font-medium mb-2">Contact Us</Text>
            <Text className="text-white/60 text-sm">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </Text>
            <Text className="text-primary text-sm mt-1">
              privacy@zyppwallet.com
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
