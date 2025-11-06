import { cn } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useShakeGesture } from "@/hooks/useShakeGesture";
import { TransactionPackage } from "@/lib/transport/tx-package";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TransactionConfirmationSheetProps {
  isVisible: boolean;
  transaction: TransactionPackage;
  onConfirm: () => void;
  onCancel: () => void;
  confirmationType?: "shake" | "swipe";
}

export function TransactionConfirmationSheet({
  isVisible,
  transaction,
  onConfirm,
  onCancel,
  confirmationType = "shake",
}: TransactionConfirmationSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const [isPanEnabled, setPanEnabled] = useState(false);

  // Shake gesture
  const { isShaking } = useShakeGesture(onConfirm, {
    minShakes: 3,
    threshold: 2.0,
    enabled: confirmationType === "shake" && isVisible,
  });

  // Show/hide animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  // Handle swipe gesture
  const handleSwipeComplete = useCallback(() => {
    if (confirmationType === "swipe") {
      onConfirm();
    }
  }, [confirmationType, onConfirm]);

  const formatAmount = (amount: number, symbol: string) => {
    if (symbol === "USDC") {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(9)} ${symbol}`;
  };

  return (
    <Animated.View
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-black/95 rounded-t-3xl",
        !isVisible && "pointer-events-none"
      )}
      style={[
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Header */}
      <View className="pt-2 pb-4">
        <View className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <Text className="text-white text-xl font-semibold text-center">
          Confirm Transaction
        </Text>
      </View>

      {/* Transaction Details */}
      <View className="px-6 py-4">
        <View className="bg-white/10 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white/60">Amount</Text>
            <Text className="text-white font-semibold text-xl">
              {formatAmount(
                transaction.metadata.amount,
                transaction.metadata.symbol
              )}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white/60">To</Text>
            <Text className="text-white font-medium">
              {transaction.metadata.to_address.slice(0, 4)}...
              {transaction.metadata.to_address.slice(-4)}
            </Text>
          </View>

          {transaction.metadata.memo && (
            <View className="flex-row justify-between items-center">
              <Text className="text-white/60">Note</Text>
              <Text className="text-white">{transaction.metadata.memo}</Text>
            </View>
          )}
        </View>

        {/* Confirmation Instructions */}
        <View className="bg-white/5 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-center gap-2">
            {confirmationType === "shake" ? (
              <>
                <IconSymbol
                  name="iphone.and.arrow.forward"
                  size={20}
                  color="#9CA3AF"
                />
                <Text className="text-white/60 text-center">
                  Shake your device {isShaking ? "harder" : ""} to confirm
                </Text>
              </>
            ) : (
              <>
                <IconSymbol
                  name="arrow.right.circle"
                  size={20}
                  color="#9CA3AF"
                />
                <Text className="text-white/60 text-center">
                  Swipe right to confirm
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Swipe Area */}
        {confirmationType === "swipe" && (
          <View className="bg-white/10 rounded-full h-16 mb-6 overflow-hidden">
            <Animated.View
              className="absolute top-0 bottom-0 left-0 bg-primary"
              style={{
                width: swipeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
            <View className="absolute top-0 bottom-0 left-0 right-0 flex-row items-center justify-center">
              <Text className="text-white font-medium">Slide to Send</Text>
            </View>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={onCancel}
          className="py-4 rounded-full border border-white/20"
        >
          <Text className="text-white text-center font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
