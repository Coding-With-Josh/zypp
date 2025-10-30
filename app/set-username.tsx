// SetUsername.tsx
import { Input, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";

const SetUsername: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [username, setUsername] = useState("");
  const inputRef = useRef<{ focus: () => void }>(null);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const trimmed = username.trim();
  const canSave = trimmed.length >= 4 && !isLoading;

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const save = () => {
    if (!canSave) return;

    animateButton();
    setIsLoading(true);

    setTimeout(() => {
      console.log("saved username:", trimmed);
      setIsLoading(false);
      setIsSaved(true);
    }, 1200);
  };

  const handleContinue = () => {
    animateButton();
    router.replace("/connect-wallet");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      <View className="flex-1 pb-28 justify-end items-start bg-black relative">
        <Image
          source={require("@/assets/images/design/top-gradient.png")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: 500,
          }}
          resizeMode="cover"
        />

        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center pointer-events-none">
          <Image
            source={require("@/assets/images/brand/logo-text.png")}
            style={{ width: 240, height: 72 }}
            resizeMode="contain"
          />
        </View>

        <View className="flex flex-col items-start justify-center w-full px-5 gap-9">
          {/* Title Section */}
          <View className="gap-3 w-full">
            <Text className="text-white font-semibold tracking-[-0.9] text-5xl">
              Set{" "}
              <Text className="text-primary font-semibold tracking-[-0.9] text-5xl">
                Username
              </Text>
            </Text>
            <Text className="text-white/80 font-medium tracking-[-0.2] text-lg leading-6">
              Let others know who they&apos;re sending to!
            </Text>
          </View>

          {/* Input Section */}
          <View className="w-full gap-4">
            <Input
              ref={inputRef}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username (min 4 characters)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              maxLength={24}
              className="bg-black/15 text-xl px-5 py-4 text-white/90 font-medium border-white/10 rounded-2xl"
              autoFocus
            />

            {/* Character Count & Validation */}
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-sm ${trimmed.length > 0 && trimmed.length < 4 ? "text-red-400" : "text-white/60"}`}
              >
                {trimmed.length > 0 && trimmed.length < 4
                  ? "Username must be at least 4 characters"
                  : `${trimmed.length}/24 characters`}
              </Text>
              {trimmed.length >= 4 && (
                <View className="flex-row items-center gap-1">
                  <IconSymbol
                    name="checkmark.circle"
                    color="#10B981"
                    size={16}
                  />
                  <Text className="text-green-400 text-sm">Valid username</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Button */}
          <View className="w-full">
            {isSaved ? (
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  className="h-14 rounded-full flex flex-row items-center justify-center gap-3 bg-primary active:scale-95 transition-all duration-200"
                  onPress={handleContinue}
                >
                  <Text className="text-primary-foreground font-semibold text-xl tracking-tight">
                    Continue
                  </Text>
                  <IconSymbol
                    name="arrow.right"
                    color="#081405"
                    size={20}
                    weight="bold"
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  className={`h-14 rounded-full flex flex-row items-center justify-center gap-3 transition-all duration-200 active:scale-95
                                            ${!canSave ? "opacity-50" : "opacity-100"} bg-primary`}
                  onPress={save}
                  disabled={!canSave}
                >
                  <Text className="text-primary-foreground font-semibold tracking-tight text-xl">
                    {isLoading ? "Saving..." : "Save Username"}
                  </Text>
                  <IconSymbol
                    name={isLoading ? "arrow.clockwise" : "checkmark"}
                    color="#081405"
                    size={20}
                    weight="bold"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SetUsername;
