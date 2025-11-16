// components/UserListModal.tsx
import { SafeAreaView, Text, View } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import type { ZyppUser } from "@/types/user";

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSelect: (user: ZyppUser) => void;
  isScanning?: boolean;
  onScanAgain?: () => void;
  users: ZyppUser[];
}

export const UserListModal: React.FC<UserListModalProps> = ({
  visible,
  onClose,
  onUserSelect,
  isScanning = false,
  onScanAgain,
  users = [],
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
                Find Users
              </Text>

              <View className="w-12 h-12" />
            </View>
          </View>

          <View className="flex-1 px-6 pt-6">
            {isScanning ? (
              <View className="flex-1 items-center justify-center">
                <View className="w-48 h-48 bg-black/15 rounded-3xl items-center justify-center border-2 border-dashed border-primary/50 mb-6">
                  <ActivityIndicator size="large" color="#22C55E" />
                </View>
                <Text className="text-white font-semibold text-xl mb-2 text-center">
                  Scanning for Users...
                </Text>
                <Text className="text-white/60 text-center text-base">
                  Looking for nearby Zypp users to connect with
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                <Text className="text-white font-semibold text-xl mb-6 text-center">
                  Available Zypp Users
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                >
                  <View className="gap-3 pb-6">
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        onPress={() => onUserSelect(user)}
                        className="flex-row items-center bg-black/15 rounded-2xl p-4 border border-white/10 active:bg-white/10"
                      >
                        <Image
                          source={user.avatar}
                          className="w-12 h-12 rounded-xl"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold text-base">
                            {user.displayName}
                          </Text>
                          <Text className="text-white/60 text-sm">
                            @{user.username}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-2 h-2 rounded-full ${
                              user.isOnline ? "bg-green-400" : "bg-gray-400"
                            }`}
                          />
                          <Text className="text-white/60 text-xs">
                            {user.isOnline ? "Online" : "Offline"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {onScanAgain && (
                  <TouchableOpacity
                    onPress={onScanAgain}
                    className="flex-row items-center justify-center gap-2 bg-primary py-4 rounded-full mb-6 active:bg-primary/90"
                  >
                    <Ionicons name="refresh" size={20} color="#081405" />
                    <Text className="text-primary-foreground font-semibold text-lg">
                      Scan Again
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
