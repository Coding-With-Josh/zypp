import { Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, Animated, Easing } from "react-native";

const SettingUpScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    // Start all animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse animation for the checkmark
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Update progress percentage in real-time
    const progressListener = progressAnim.addListener(({ value }) => {
      const percentage = Math.floor(value * 100);
      setCurrentProgress(percentage);
    });

    // Simulate setup process and navigate
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 5000);

    return () => {
      clearTimeout(timer);
      progressAnim.removeListener(progressListener);
    };
  }, [fadeAnim, scaleAnim, progressAnim, pulseAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Dynamic steps based on progress
  const getSteps = () => {
    const steps = [
      { id: 1, text: "Setting up your profile", threshold: 25 },
      { id: 2, text: "Securing your wallet", threshold: 50 },
      { id: 3, text: "Setting up encryption", threshold: 75 },
      { id: 4, text: "Creating backup keys", threshold: 100 },
    ];

    return steps.map((step) => ({
      ...step,
      completed: currentProgress >= step.threshold,
    }));
  };

  const steps = getSteps();

  return (
    <View className="flex-1 justify-end items-start bg-black relative pb-28">
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

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="flex flex-col items-start justify-center w-full px-6 gap-9"
      >
        {/* Main Content */}
        <View className="gap-6 w-full">
          {/* Animated Icon */}
          <View className="items-center justify-center mb-4">
            <Animated.View
              style={{ transform: [{ scale: pulseAnim }] }}
              className="w-24 h-24 bg-primary/20 rounded-3xl items-center justify-center border-2 border-primary/30"
            >
              <Ionicons
                name="checkmark-circle-outline"
                color="#22C55E"
                size={40}
                weight="600"
              />
              {/* <Image
                                         source={require("@/assets/images/brand/logo-small.png")}
                                         className="w-8 h-8 mr-3"
                                         resizeMode="contain"
                                       /> */}
            </Animated.View>
          </View>

          {/* Title */}
          <View className="gap-3">
            <Text className="text-white font-semibold tracking-[-0.9] text-5xl text-center w-full">
              Setting{" "}
              <Text className="text-primary font-semibold tracking-[-0.9] text-5xl">
                Up
              </Text>
            </Text>
            <Text className="text-white/80 font-medium tracking-[-0.2] text-lg text-center leading-7">
              We&apos;re getting everything ready for you
            </Text>
          </View>

          {/* Progress Steps */}
          <View className="gap-5 mt-4">
            {steps.map((step) => (
              <View key={step.id} className="flex-row items-center gap-4">
                <Animated.View
                  className={`w-6 h-6 rounded-full items-center justify-center border-2 
                                        ${
                                          step.completed
                                            ? "bg-primary border-primary"
                                            : "border-white/30"
                                        }`}
                >
                  {step.completed && (
                    <IconSymbol
                      name="checkmark"
                      color="#081405"
                      size={12}
                      weight="bold"
                    />
                  )}
                </Animated.View>
                <Text
                  className={`text-lg font-medium flex-1 ${
                    step.completed ? "text-white" : "text-white/50"
                  }`}
                >
                  {step.text}
                </Text>
                {!step.completed && (
                  <Animated.View
                    style={{ transform: [{ scale: pulseAnim }] }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </View>
            ))}
          </View>

          {/* Progress Bar */}
          <View className="gap-3 mt-6">
            <View className="h-2 bg-white/10 rounded-full overflow-hidden">
              <Animated.View
                style={{ width: progressWidth }}
                className="h-full bg-primary rounded-full"
              />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-white/60 text-sm">
                {currentProgress < 25 && "Setting up your profile..."}
                {currentProgress >= 25 &&
                  currentProgress < 50 &&
                  "Securing your wallet..."}
                {currentProgress >= 50 &&
                  currentProgress < 75 &&
                  "Setting up encryption..."}
                {currentProgress >= 75 &&
                  currentProgress < 100 &&
                  "Creating backup keys..."}
                {currentProgress === 100 && "Complete!"}
              </Text>
              <Text className="text-primary text-sm font-medium">
                {currentProgress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Loading Indicator */}
        <View className="items-center justify-center w-full mt-8">
          <View className="flex-row items-center gap-3">
            <Animated.View
              style={{
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.6, 1],
                }),
              }}
            >
              <IconSymbol name="sparkles" color="#22C55E" size={20} />
            </Animated.View>
            <Text className="text-white/60 text-base">
              {currentProgress < 100 ? "Almost ready..." : "Ready to go!"}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default SettingUpScreen;
