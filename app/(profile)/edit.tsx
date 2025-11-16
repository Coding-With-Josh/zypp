import { Input, SafeAreaView, Text, View, alert } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, TouchableOpacity } from "react-native";

export default function EditProfileScreen() {
  const { user, updateUserProfile, uploadAvatar, deleteAvatar } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [status, setStatus] = useState(user?.status || "active");
  const [metadata, setMetadata] = useState<Record<string, any>>(
    user?.metadata || {}
  );
  const [isLoading, setIsLoading] = useState(false);

  // Effect to update state when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || null);
      setStatus(user.status || "active");
      setMetadata(user.metadata || {});
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Validate username
      if (!username.trim()) {
        alert("Error", "Username is required", [{ text: "OK" }]);
        return;
      }

      // Update user profile with all available fields
      await updateUserProfile({
        username,
        display_name: displayName,
        bio,
        status: status as "active" | "inactive" | "suspended" | "pending_setup",
        metadata,
      });

      alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      alert(
        "Error",
        error.message || "Failed to update profile. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsLoading(true);
      await deleteAvatar();
      setAvatarUrl(null);
      alert("Success", "Profile photo removed successfully", [{ text: "OK" }]);
    } catch (error: any) {
      alert(
        "Error",
        error.message || "Failed to remove profile photo. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    alert("Change Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const permissionResult =
            await ImagePicker.requestCameraPermissionsAsync();

          if (!permissionResult.granted) {
            alert(
              "Permission Required",
              "We need camera access to take a photo.",
              [{ text: "OK" }]
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled) {
            try {
              const avatarUrl = await uploadAvatar(result.assets[0].uri);
              setAvatarUrl(avatarUrl);
            } catch (error: any) {
              alert("Error", "Failed to upload photo. Please try again.", [
                { text: "OK" },
              ]);
            }
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (!permissionResult.granted) {
            alert(
              "Permission Required",
              "We need access to your photos to select an image.",
              [{ text: "OK" }]
            );
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled) {
            try {
              const avatarUrl = await uploadAvatar(result.assets[0].uri);
              setAvatarUrl(avatarUrl);
            } catch (error: any) {
              alert(
                "Error",
                error.message || "Failed to upload photo. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="chevron-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-xl">Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text
              className={`font-semibold ${isLoading ? "text-white/40" : "text-primary"}`}
            >
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Profile Photo */}
          <View className="items-center mb-8">
            <View className="relative">
              <TouchableOpacity onPress={handleChangePhoto}>
                <Image
                  source={
                    avatarUrl
                      ? { uri: avatarUrl }
                      : require("@/assets/images/design/user.png")
                  }
                  className="w-24 h-24 rounded-2xl border-2 border-primary"
                />
                <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
                  <Ionicons name="camera" size={16} color="#081405" />
                </View>
              </TouchableOpacity>
              {avatarUrl && (
                <TouchableOpacity
                  onPress={handleDeleteAvatar}
                  className="absolute -top-2 -right-2 bg-red-500/20 rounded-full p-1"
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Form */}
          <View className="gap-6">
            <View>
              <Text className="text-white/60 text-sm mb-2">Username *</Text>
              <Input
                value={username}
                onChangeText={setUsername}
                className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl"
                placeholder="Enter username"
              />
              <Text className="text-white/40 text-xs mt-1">
                This is your unique identifier on the platform
              </Text>
            </View>

            <View>
              <Text className="text-white/60 text-sm mb-2">Display Name</Text>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl"
                placeholder="Enter display name"
              />
              <Text className="text-white/40 text-xs mt-1">
                Your name as shown to other users
              </Text>
            </View>

            <View>
              <Text className="text-white/60 text-sm mb-2">Bio</Text>
              <Input
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl min-h-[100px]"
                placeholder="Tell us about yourself"
                textAlignVertical="top"
              />
              <Text className="text-white/40 text-xs mt-1">
                A brief description about you (optional)
              </Text>
            </View>

            {/* Preferences Section */}
            <View>
              <Text className="text-white/60 font-medium text-sm uppercase tracking-wider mb-4">
                Account Status
              </Text>
              <View className="bg-black/15 rounded-2xl border border-white/10 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Status</Text>
                  <View
                    className={
                      status === "active"
                        ? "bg-primary/20"
                        : status === "inactive"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                    }
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      className={
                        status === "active"
                          ? "text-primary"
                          : status === "inactive"
                            ? "text-yellow-500"
                            : "text-red-500"
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Custom Fields Section */}
            <View>
              <Text className="text-white/60 font-medium text-sm uppercase tracking-wider mb-4">
                Custom Fields
              </Text>
              {Object.entries(metadata).map(([key, value]) => (
                <View key={key} className="mb-4">
                  <Text className="text-white/60 text-sm mb-2 capitalize">
                    {key.replace(/_/g, " ")}
                  </Text>
                  <Input
                    value={String(value)}
                    onChangeText={(newValue) =>
                      setMetadata((prev) => ({ ...prev, [key]: newValue }))
                    }
                    className="bg-black/15 border-white/10 pl-4 text-white rounded-2xl"
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-8"
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text className="text-primary-foreground font-semibold">
              {isLoading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Danger Zone */}
          <View className="mt-10">
            <Text className="text-red-400/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Danger Zone
            </Text>
            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center"
              onPress={() =>
                alert(
                  "Delete Account",
                  "This action cannot be undone. All your data will be permanently deleted.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete Account",
                      style: "destructive",
                      onPress: () => {
                        // TODO: Implement account deletion
                        alert(
                          "Coming Soon",
                          "This feature is not yet available.",
                          [{ text: "OK" }]
                        );
                      },
                    },
                  ]
                )
              }
            >
              <Text className="text-red-400 font-semibold">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
