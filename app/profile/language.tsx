import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, TouchableOpacity } from "react-native";

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
  ];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    Alert.alert("Language Changed", "App language updated successfully!");
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
          <Text className="text-white font-semibold text-xl">Language</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <Text className="text-white/60 text-sm mb-6">
            Choose your preferred language for the app
          </Text>

          <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
            {languages.map((language, index) => (
              <TouchableOpacity
                key={language.code}
                onPress={() => handleLanguageSelect(language.code)}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  index !== languages.length - 1
                    ? "border-b border-white/10"
                    : ""
                }`}
              >
                <View>
                  <Text className="text-white font-medium text-base">
                    {language.name}
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {language.nativeName}
                  </Text>
                </View>

                {selectedLanguage === language.code && (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={24}
                    color="#22C55E"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-400 font-medium text-sm">
                  Language Support
                </Text>
                <Text className="text-blue-400/80 text-sm mt-1">
                  Some features may not be fully translated. English is the
                  primary language for support and documentation.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
