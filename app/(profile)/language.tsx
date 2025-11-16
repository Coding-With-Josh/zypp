import { SafeAreaView, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function LanguageScreen() {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const prefs = user?.preferences as Record<string, any>;
    return prefs?.language || "en";
  });

  // Update selected language when user preferences change
  useEffect(() => {
    const prefs = user?.preferences as Record<string, any>;
    if (prefs?.language) {
      setSelectedLanguage(prefs.language);
    }
  }, [user?.preferences]);

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
  ];

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setIsLoading(true);
      setSelectedLanguage(languageCode);

      // Update user preferences
      const currentPreferences =
        (user?.preferences as Record<string, any>) || {};
      await updateUserProfile({
        preferences: {
          ...currentPreferences,
          language: languageCode,
        } as Record<string, any>,
      });

      Alert.alert(
        "Language Changed",
        "Display language updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to update language. Please try again."
      );
      // Revert selection on error
      const prefs = user?.preferences as Record<string, any>;
      setSelectedLanguage(prefs?.language || "en");
    } finally {
      setIsLoading(false);
    }
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
            Choose your preferred display language
          </Text>

          <View className="bg-black/15 rounded-2xl border border-white/10 overflow-hidden">
            {languages.map((language, index) => (
              <TouchableOpacity
                key={language.code}
                onPress={() =>
                  !isLoading && handleLanguageSelect(language.code)
                }
                className={`flex-row items-center justify-between px-4 py-4 ${
                  index !== languages.length - 1
                    ? "border-b border-white/10"
                    : ""
                } ${isLoading ? "opacity-50" : ""}`}
                disabled={isLoading}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-semibold">
                      {language.code.toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white font-medium text-base">
                      {language.name}
                    </Text>
                    <Text className="text-white/60 text-sm mt-1">
                      {language.nativeName}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  {isLoading && selectedLanguage === language.code ? (
                    <ActivityIndicator size="small" color="#22C55E" />
                  ) : selectedLanguage === language.code ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color="#22C55E"
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <View className="ml-3 flex-1">
                <Text className="text-yellow-400 font-medium text-sm">
                  Partial Translation
                </Text>
                <Text className="text-yellow-400/80 text-sm mt-1">
                  Some content may still appear in English during the initial
                  rollout of language support.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
