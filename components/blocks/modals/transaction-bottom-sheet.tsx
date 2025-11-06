import { IconSymbol } from "@/components/ui/IconSymbol";
import { useShakeGesture } from "@/hooks/useShakeGesture";
import { TransactionPackage } from "@/lib/transport/tx-package";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSend: (transport: "qr_code" | "multipeer" | "bluetooth" | "nfc") => void;
  transaction?: TransactionPackage;
  recipient: {
    username: string;
    displayName: string;
    avatar: any;
    isOnline: boolean;
  };
  amount: number;
  symbol: string;
}

const { width } = Dimensions.get("window");

export function TransactionBottomSheet({
  isVisible,
  onClose,
  onSend,
  transaction,
  recipient,
  amount,
  symbol,
}: Props) {
  // Sheet refs and config
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ["50%", "90%"];

  // Animated swipe button
  const swipeProgress = useSharedValue(0);
  const swipeThreshold = width * 0.7;

  // Handle shake gesture
  const handleShake = useCallback(() => {
    // Start with Bluetooth/Multipeer for shake-to-send
    onSend("bluetooth");
  }, [onSend]);

  useShakeGesture(handleShake, {
    threshold: 1.8,
    minShakes: 2,
    timeWindowMs: 2000,
  });

  // Handle sheet changes
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  // Handle swipe button animation
  const swipeButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(swipeProgress.value * swipeThreshold, {
            damping: 20,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  // Handle swipe complete
  useEffect(() => {
    if (swipeProgress.value >= 1) {
      // Default to QR for swipe-to-send
      onSend("qr_code");
      swipeProgress.value = 0;
    }
  }, [swipeProgress, onSend]);

  // Reset on close
  useEffect(() => {
    if (!isVisible) {
      swipeProgress.value = 0;
    }
  }, [isVisible, swipeProgress]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {/* Transaction Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Transaction</Text>
          <Text style={styles.subtitle}>
            Swipe to send or shake your device to send via Bluetooth
          </Text>
        </View>

        {/* Recipient Card */}
        <View style={styles.recipientCard}>
          <View style={styles.recipientInfo}>
            <Image source={recipient.avatar} style={styles.avatar} />
            <View>
              <Text style={styles.displayName}>{recipient.displayName}</Text>
              <Text style={styles.username}>@{recipient.username}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: recipient.isOnline ? "#22C55E" : "#9CA3AF" },
              ]}
            />
            <Text style={styles.statusText}>
              {recipient.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountValue}>
              <IconSymbol
                name={symbol === "USDC" ? "dollarsign" : "bitcoinsign"}
                size={24}
                color="white"
              />
              <Text style={styles.amountText}>
                {amount} {symbol}
              </Text>
            </View>
          </View>
        </View>

        {/* Swipe to Send */}
        <View style={styles.swipeContainer}>
          <View style={styles.swipeTrack}>
            <Animated.View style={[styles.swipeButton, swipeButtonStyle]}>
              <IconSymbol name="arrow.right" size={24} color="#081405" />
            </Animated.View>
            <Text style={styles.swipeText}>Swipe to Send via QR</Text>
          </View>
        </View>

        {/* Alternative Methods */}
        <View style={styles.altMethodsContainer}>
          <Text style={styles.altMethodsTitle}>Other Send Methods</Text>
          <View style={styles.methodsGrid}>
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => onSend("qr_code")}
            >
              <IconSymbol name="qrcode" size={24} color="white" />
              <Text style={styles.methodText}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => onSend("bluetooth")}
            >
              <IconSymbol
                name="antenna.radiowaves.left.and.right"
                size={24}
                color="white"
              />
              <Text style={styles.methodText}>Bluetooth</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => onSend("nfc")}
            >
              <IconSymbol name="wave.3.right" size={24} color="white" />
              <Text style={styles.methodText}>NFC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#000000",
    borderRadius: 24,
  },
  handle: {
    backgroundColor: "#FFFFFF40",
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF80",
  },
  recipientCard: {
    backgroundColor: "#FFFFFF10",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  username: {
    fontSize: 14,
    color: "#FFFFFF80",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF80",
  },
  amountContainer: {
    backgroundColor: "#FFFFFF10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#FFFFFF80",
  },
  amountValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  swipeContainer: {
    marginBottom: 32,
  },
  swipeTrack: {
    backgroundColor: "#FFFFFF10",
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  swipeButton: {
    position: "absolute",
    left: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF80",
  },
  altMethodsContainer: {
    gap: 16,
  },
  altMethodsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  methodsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: "#FFFFFF10",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  methodText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
});

export default TransactionBottomSheet;
