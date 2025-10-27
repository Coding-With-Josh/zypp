import { Input, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import { Image, TouchableOpacity, Animated, Alert } from "react-native";

const ConnectWallet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    "wallet" | "manual" | null
  >(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [step, setStep] = useState<"select" | "connect" | "success">("select");
  const inputRef = useRef<{ focus: () => void }>(null);
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (selectedOption === "manual" && step === "connect" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [selectedOption, step]);

  const handleConnect = async () => {
    if (selectedOption === "manual" && walletAddress.length < 10) {
      Alert.alert("Invalid Address", "Please enter a valid wallet address");
      return;
    }

    setIsLoading(true);

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    setStep("success");

    // Auto navigate after success
    setTimeout(() => {
      router.replace("/set-pin");
    }, 1500);
  };

  const handleBack = () => {
    if (step === "connect") {
      setStep("select");
      setSelectedOption(null);
      setWalletAddress("");
    }
  };

  const handleSkip = () => {
    router.replace("/set-pin");
  };

  const WalletOption = ({
    title,
    description,
    icon,
    type,
  }: {
    title: string;
    description: string;
    icon: string;
    type: "wallet" | "manual";
  }) => (
    <TouchableOpacity
      className={`w-full p-6 rounded-3xl border-2 transition-all duration-200 active:scale-95
                      ${
                        selectedOption === type
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5"
                      }`}
      onPress={() => {
        setSelectedOption(type);
        setStep("connect");
        if (type === "wallet") {
          handleConnect();
        }
      }}
    >
      <View className="flex-row items-center gap-4">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center
                                ${selectedOption === type ? "bg-primary" : "bg-white/10"}`}
        >
          <IconSymbol
            name={icon}
            color={selectedOption === type ? "#081405" : "white"}
            size={24}
            weight="bold"
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg mb-1">{title}</Text>
          <Text className="text-white/60 text-sm leading-5">{description}</Text>
        </View>
        <IconSymbol name="chevron.right" color="white" size={20} />
      </View>
    </TouchableOpacity>
  );

  const renderSuccessState = () => (
    <View className="items-center justify-center gap-6 w-full">
      <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center">
        <IconSymbol name="checkmark" color="white" size={32} weight="bold" />
      </View>
      <View className="gap-2">
        <Text className="text-white font-semibold text-2xl text-center">
          Wallet Connected!
        </Text>
        <Text className="text-white/60 text-lg text-center">
          Taking you to your dashboard...
        </Text>
      </View>
    </View>
  );

  const renderConnectionStep = () => (
    <View className="gap-6 w-full">
      {/* Back button */}
      <TouchableOpacity
        onPress={handleBack}
        className="flex-row items-center gap-2 mb-2 active:opacity-70"
      >
        <IconSymbol name="chevron.left" color="white" size={24} />
        <Text className="text-white text-lg font-semibold">Back</Text>
      </TouchableOpacity>

      {/* Connection content */}
      {selectedOption === "manual" ? (
        <View className="gap-6">
          <View className="gap-3">
            <Text className="text-white font-semibold text-2xl">
              Enter Wallet Address
            </Text>
            <Text className="text-white/60 text-lg leading-6">
              Paste your wallet address to connect manually
            </Text>
          </View>

          <Input
            ref={inputRef}
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="Enter your wallet address"
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="bg-white/5 text-lg px-5 py-4 text-white/90 font-medium border-white/10 rounded-2xl"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View className="gap-3">
            <TouchableOpacity
              className={`h-14 rounded-full flex flex-row items-center justify-center gap-3
                                      transition-all duration-200 active:scale-95
                                      ${isLoading || walletAddress.length < 10 ? "opacity-50" : "opacity-100"} 
                                      bg-primary w-full`}
              onPress={handleConnect}
              disabled={isLoading || walletAddress.length < 10}
            >
              <Text className="text-primary-foreground font-semibold text-xl">
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Text>
              <IconSymbol
                name={isLoading ? "arrow.clockwise" : "link"}
                color="#081405"
                size={20}
                weight="bold"
              />
            </TouchableOpacity>

            {/* Skip button for manual connection */}
            <TouchableOpacity
              className="h-12 rounded-full flex flex-row items-center justify-center gap-2 border border-white/30 active:bg-white/10"
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text className="text-white/80 font-semibold text-lg">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="gap-6">
          <View className="items-center justify-center gap-6">
            <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
              <IconSymbol
                name="wallet.pass"
                color="#081405"
                size={32}
                weight="bold"
              />
            </View>
            <View className="gap-2">
              <Text className="text-white font-semibold text-2xl text-center">
                Connecting Wallet...
              </Text>
              <Text className="text-white/60 text-lg text-center">
                Please check your wallet app to confirm the connection
              </Text>
            </View>
          </View>

          {/* Skip button for wallet app connection */}
          <TouchableOpacity
            className="h-12 rounded-full flex flex-row items-center justify-center gap-2 border border-white/30 active:bg-white/10"
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text className="text-white/80 font-semibold text-lg">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSelectionStep = () => (
    <View className="gap-6 w-full">
      <View className="gap-3">
        <Text className="text-white font-semibold tracking-[-2.5] text-5xl">
          Connect{" "}
          <Text className="text-primary font-semibold tracking-[-2.5] text-5xl">
            Wallet
          </Text>
        </Text>
        <Text className="text-white/80 font-medium tracking-[-0.2] text-lg leading-6">
          Choose how you&apos;d like to connect your wallet to get started
        </Text>
      </View>

      <View className="gap-4">
        <WalletOption
          title="Connect Wallet App"
          description="Connect using your preferred wallet app like MetaMask, Phantom, or Trust Wallet"
          icon="wallet.pass"
          type="wallet"
        />

        <WalletOption
          title="Enter Address Manually"
          description="Connect by entering your wallet address directly"
          icon="square.and.pencil"
          type="manual"
        />
      </View>

      <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mt-2">
        <View className="flex-row items-start gap-3">
          <IconSymbol name="info.circle" color="#00FF84" size={20} />
          <View className="flex-1">
            <Text className="text-green-400 font-semibold text-sm mb-1">
              Secure Connection
            </Text>
            <Text className="text-green-400/80 text-xs leading-4">
              Your wallet connection is encrypted and secure. We never store
              your private keys.
            </Text>
          </View>
        </View>
      </View>

      {/* Skip button on selection step */}
      <TouchableOpacity
        className="h-12 rounded-full flex flex-row items-center justify-center gap-2 border border-white/30 active:bg-white/10 mt-4"
        onPress={handleSkip}
      >
        <Text className="text-white/80 font-semibold text-lg">
          Skip for now
        </Text>
        <IconSymbol name="arrow.right" color="white" size={18} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        paddingBottom: 70,
        justifyContent: "flex-end",
        alignItems: "flex-start",
        backgroundColor: "#000",
        position: "relative",
        opacity: fadeAnimation,
      }}
    >
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

      {/* <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                }}
            >
                <Image
                    source={require('@/assets/images/brand/logo-text.png')}
                    style={{ width: 240, height: 72 }}
                    resizeMode="contain"
                />
            </View> */}

      <View className="flex flex-col items-start justify-center w-full px-5 gap-9">
        {step === "success"
          ? renderSuccessState()
          : step === "connect"
            ? renderConnectionStep()
            : renderSelectionStep()}
      </View>
    </Animated.View>
  );
};

export default ConnectWallet;
