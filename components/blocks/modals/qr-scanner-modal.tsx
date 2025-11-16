// components/QRScannerModal.tsx
import {
  SafeAreaView,
  Text,
  View,
  useCameraPermissions,
} from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TouchableOpacity,
} from "react-native";

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSelect?: (userData: any) => void;
  onScan?: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onUserSelect,
  onScan,
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    try {
      if (onScan) {
        onScan(data);
        setTimeout(() => setScanned(false), 750);
        return;
      }

      // Try to parse QR code data as user information
      let userData;
      try {
        userData = JSON.parse(data);
      } catch {
        // If not JSON, treat as username
        userData = { username: data };
      }

      // Simulate finding a user (in real app, this would be an API call)
      const mockUsers = [
        {
          id: "1",
          username: "maria_sol",
          displayName: "Maria Solana",
          avatar: require("@/assets/images/design/user.png"),
          isOnline: true,
        },
        {
          id: "2",
          username: "crypto_wallet",
          displayName: "Crypto Pro",
          avatar: require("@/assets/images/design/user.png"),
          isOnline: false,
        },
      ];

      const foundUser = mockUsers.find(
        (user) =>
          user.username.toLowerCase().includes(data.toLowerCase()) ||
          user.displayName.toLowerCase().includes(data.toLowerCase())
      );

      if (foundUser) {
        onUserSelect(foundUser);
        onClose();
        Alert.alert("Success", `Found user: ${foundUser.displayName}`);
      } else {
        Alert.alert("QR Code Scanned", `Scanned data: ${data}`, [
          {
            text: "Scan Again",
            onPress: () => setScanned(false),
          },
          {
            text: "Close",
            onPress: onClose,
            style: "cancel",
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process QR code data");
      setScanned(false);
    }
  };

  const handleRequestPermission = async () => {
    if (cameraPermission?.status === "denied") {
      Alert.alert(
        "Camera Access Required",
        "Please enable camera permissions in your device settings to scan QR codes.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await requestCameraPermission();
    if (!result.granted) {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to scan QR codes."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1 bg-transparent">
          {/* Header */}
          <View className="w-full px-5 pt-4 pb-4 border-b border-white/10">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={onClose}
                className="w-12 h-12 rounded-full bg-black/15 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <Text className="text-white font-semibold text-xl">
                Scan QR Code
              </Text>

              <View className="w-12 h-12" />
            </View>
          </View>

          <View className="flex-1">
            {cameraPermission === null ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-white mt-4">
                  Requesting camera permission...
                </Text>
              </View>
            ) : !cameraPermission.granted ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons name="camera-outline" size={64} color="#EF4444" />
                <Text className="text-white font-semibold text-xl mt-4 text-center">
                  Camera Access Required
                </Text>
                <Text className="text-white/60 text-center mt-2 mb-6">
                  Please enable camera permissions to scan QR codes
                </Text>
                <TouchableOpacity
                  onPress={handleRequestPermission}
                  className="bg-primary py-3 px-6 rounded-full active:bg-primary/90"
                >
                  <Text className="text-primary-foreground font-semibold text-lg">
                    Grant Permission
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-1">
                <CameraView
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  style={{ flex: 1 }}
                >
                  <View className="flex-1 bg-transparent">
                    {/* Scanner Overlay */}
                    <View className="flex-1 items-center justify-center">
                      <View className="w-64 h-64 border-2 border-primary rounded-2xl overflow-hidden">
                        <View className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-primary" />
                        <View className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-primary" />
                        <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-primary" />
                        <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-primary" />
                      </View>

                      <Text className="text-white font-semibold text-lg mt-8 text-center">
                        Position QR Code in Frame
                      </Text>
                      <Text className="text-white/60 text-center mt-2 px-8">
                        Scan a Zypp user&apos;s QR code to quickly add them as a
                        recipient
                      </Text>
                    </View>

                    {/* Bottom Controls */}
                    <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
                      <TouchableOpacity
                        onPress={() => setScanned(false)}
                        disabled={!scanned}
                        className={`flex-row items-center justify-center gap-3 py-4 rounded-full ${
                          scanned
                            ? "bg-primary active:bg-primary/90"
                            : "bg-white/10"
                        }`}
                      >
                        <Ionicons
                          name="scan"
                          size={20}
                          color={scanned ? "#081405" : "#9CA3AF"}
                        />
                        <Text
                          className={`font-semibold text-lg ${
                            scanned
                              ? "text-primary-foreground"
                              : "text-white/40"
                          }`}
                        >
                          {scanned ? "Tap to Scan Again" : "Scanning..."}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </CameraView>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
