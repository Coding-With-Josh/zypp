// app/(auth)/set-username.tsx - Fixed version
import { Input, Text, View } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { Keypair } from "@solana/web3.js";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";

// Define the return type for signInWithWallet
interface SignInResult {
  user: {
    id: string;
    username: string;
    wallet_address: string;
    is_temporary: boolean;
  };
  session: {
    id: string;
    user_id: string;
    expires_at: string;
  };
}

const SetUsername: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const inputRef = useRef<any>(null);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const { signUpWithUsername, checkUsernameAvailability, signInWithWallet, user } = useAuth();

  const trimmed = username.trim();
  const canSave = trimmed.length >= 3 && trimmed.length <= 20 && !isLoading && !usernameError;

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

  const checkUsername = async (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (trimmedValue.length > 20) {
      setUsernameError("Username must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    try {
      const isAvailable = await checkUsernameAvailability(trimmedValue);

      if (!isAvailable) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError("");
      }
    } catch (error: any) {
      console.error("Username check failed:", error);
      setUsernameError("Failed to check username availability");
    }
  };

  const save = async () => {
    if (!canSave) return;

    animateButton();
    setIsLoading(true);

    try {
      let profileId: string;
      
      if (!user?.id) {
        console.log('👤 No existing user, creating temporary user...');
        const tempKeypair = Keypair.generate();
        const tempAddress = tempKeypair.publicKey.toBase58();
        
        // Type assertion to fix TypeScript errors
        const signInResult = await signInWithWallet(tempAddress, true) as unknown as SignInResult;
        
        if (!signInResult?.user?.id) {
          throw new Error("Failed to create temporary user account");
        }
        
        profileId = signInResult.user.id;
        console.log('✅ Temporary user created with ID:', profileId);
      } else {
        profileId = user.id;
        console.log('👤 Using existing user ID:', profileId);
      }

      console.log('📝 Setting username for profile:', profileId);
      await signUpWithUsername(trimmed, profileId);

      setIsLoading(false);
      setIsSaved(true);
      console.log('✅ Username setup completed successfully!');
    } catch (error: any) {
      console.error("Username setup failed:", error);
      Alert.alert("Error", error.message || "Failed to save username. Please try again.");
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    animateButton();
    router.replace("/(auth)/set-pin");
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
              onChangeText={(value) => {
                setUsername(value);
                if (value.trim().length >= 3) {
                  checkUsername(value);
                } else {
                  setUsernameError("");
                }
              }}
              placeholder="Choose a username (3-20 characters)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              maxLength={20}
              className="bg-black/15 text-xl px-5 py-4 text-white/90 font-medium border-white/10 rounded-2xl"
              autoFocus
            />

            {/* Character Count & Validation */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-sm ${usernameError ? "text-red-400" : "text-white/60"}`}>
                {usernameError || `${trimmed.length}/20 characters`}
              </Text>
              {trimmed.length >= 3 && trimmed.length <= 20 && !usernameError && (
                <View className="flex-row items-center gap-1">
                  <IconSymbol name="checkmark.circle" color="#10B981" size={16} />
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
                  <IconSymbol name="arrow.right" color="#081405" size={20} weight="bold" />
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
                    {isLoading ? "Creating Account..." : "Save Username"}
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