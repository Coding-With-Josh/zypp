import { Input, SafeAreaView, Text, View } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, TouchableOpacity } from "react-native";

export default function EditProfileScreen() {
  const [username, setUsername] = useState("josh_scriptz");
  const [displayName, setDisplayName] = useState("Josh Scriptz");
  const [email, setEmail] = useState("josh@example.com");
  const [bio, setBio] = useState("Crypto enthusiast and blockchain developer");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    Alert.alert("Success", "Profile updated successfully!");
    router.back();
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => console.log("Take photo") },
      {
        text: "Choose from Library",
        onPress: () => console.log("Choose photo"),
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
            <TouchableOpacity onPress={handleChangePhoto} className="relative">
              <Image
                source={require("@/assets/images/design/user.png")}
                className="w-24 h-24 rounded-2xl border-2 border-primary"
              />
              <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
                <Ionicons name="camera" size={16} color="#081405" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="gap-6">
            <View>
              <Text className="text-white/60 text-sm mb-2">Username</Text>
              <Input
                value={username}
                onChangeText={setUsername}
                className="bg-black/15 border-white/10 text-white rounded-2xl"
                placeholder="Enter username"
              />
            </View>

            <View>
              <Text className="text-white/60 text-sm mb-2">Display Name</Text>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                className="bg-black/15 border-white/10 text-white rounded-2xl"
                placeholder="Enter display name"
              />
            </View>

            <View>
              <Text className="text-white/60 text-sm mb-2">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                className="bg-black/15 border-white/10 text-white rounded-2xl"
                placeholder="Enter email"
              />
            </View>

            <View>
              <Text className="text-white/60 text-sm mb-2">Bio</Text>
              <Input
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                className="bg-black/15 border-white/10 text-white rounded-2xl min-h-[100px]"
                placeholder="Tell us about yourself"
                textAlignVertical="top"
              />
            </View>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-20"
            onPress={handleSave}
          >
            <Text className="text-primary-foreground font-semibold">Save</Text>
          </TouchableOpacity>

          {/* Danger Zone */}
          <View className="mt-10">
            {/* <Text className="text-white/60 font-medium text-sm mb-4 uppercase tracking-wider">
              Danger Zone
            </Text> */}
            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center"
              onPress={() =>
                Alert.alert("Delete Account", "This action cannot be undone.")
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
