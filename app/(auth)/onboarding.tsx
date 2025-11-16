import { Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMarketPrice } from "@/hooks/useMarketPrice";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, TouchableOpacity } from "react-native";

const Onboarding = () => {
  const { refreshPrice } = useMarketPrice();

  useEffect(() => {
    // Warm the price cache during onboarding so the app shows USD values immediately
    refreshPrice().catch(() => {
      /* non-fatal */
    });
  }, [refreshPrice]);
  return (
    <View
      style={{
        flex: 1,
        paddingBottom: 100,
        justifyContent: "flex-end",
        alignItems: "flex-start",
        backgroundColor: "#000",
        position: "relative",
      }}
    >
      {/* Gradient: full width at the top */}
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

      {/* Logo: centered in the page regardless of parent alignment */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none", // allow touches to pass through
        }}
      >
        <Image
          source={require("@/assets/images/brand/logo-text.png")}
          style={{ width: 240, height: 72 }}
          resizeMode="contain"
        />
      </View>

      <View className="flex flex-col items-start justify-center w-full px-5 mt-8 gap-9">
        <View className="gap-4">
          <Text className="text-white font-semibold tracking-[-0.9] text-5xl">
            Payment {"\n"}Infrastructure at {"\n"}
            <Text className="tracking-[-0.9] font-semibold text-5xl text-primary">
              Zypp Speed
            </Text>
          </Text>
          <Text className="text-white opacity-85 font-semibold tracking-[-0.2] web:font-medium text-lg">
            Transact onchain with or without internet. with unmatched speed and
            in-depth security.
          </Text>
        </View>

        <TouchableOpacity
          className="native:h-14 native:px-8 native:py-4 h-11 px-8
                               web:ring-offset-background web:transition-colors
                               rounded-full flex flex-row items-center justify-center gap-1
                               web:focus-visible:outline-none web:focus-visible:ring-2
                               web:focus-visible:ring-ring web:focus-visible:ring-offset-2 group bg-primary"
          onPress={() => router.replace("/connect-wallet")}
        >
          <Text className="text-primary-foreground font-semibold text-xl">
            Get Started
          </Text>
          <IconSymbol
            name="arrow.up.right"
            color="#081405"
            size={20}
            weight="bold"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Onboarding;
