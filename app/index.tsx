// app/index.tsx
import { View } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image } from "react-native";

const Index = () => {
  const { session, isLoading: isAuthLoading, user } = useAuth();
  const { wallet } = useWallet();
  const [hasRedirected, setHasRedirected] = useState(false);
  const { isInitialized, isInitializing, error } = useAppInitialization();

  // Handle navigation based on authentication and initialization state
  useEffect(() => {
    const handleNavigation = async () => {
      // Don't redirect multiple times
      if (hasRedirected) {
        console.log("🔄 Already redirected, skipping");
        return;
      }

      // Wait if still loading or initializing
      if (isAuthLoading || isInitializing) {
        console.log("⏳ Still loading/initializing, waiting...");
        return;
      }

      console.log("🎯 Navigation check:", {
        authLoading: isAuthLoading,
        initialized: isInitialized,
        initializing: isInitializing,
        hasSession: !!session,
        hasUser: !!user,
        hasWallet: !!wallet,
        error: error?.message,
      });

      // Handle authenticated state
      if (session && user) {
        console.log("✅ User authenticated:", {
          username: user.username,
          isTemporary: user.is_temporary,
          userId: user.id,
        });

        setHasRedirected(true);
        
        // Check if user needs to complete onboarding
        const needsUsernameSetup = 
          !user.username || 
          user.username.startsWith("temp_") || 
          user.username.startsWith("user_0x") || 
          user.is_temporary;

        if (needsUsernameSetup) {
          console.log("📝 Redirecting to username setup");
          router.replace("/(auth)/set-username");
        } else {
          console.log("🏠 Redirecting to home");
          router.replace("/(tabs)/home");
        }
        return;
      }

      // Handle unauthenticated state
      console.log("🎪 No active session, redirecting to onboarding");
      setHasRedirected(true);
      router.replace("/(auth)/onboarding");
    };

    handleNavigation();
  }, [
    session,
    user,
    isAuthLoading,
    isInitialized,
    isInitializing,
    hasRedirected,
    wallet,
    error,
  ]);

  // Reset redirect flag when auth state changes significantly
  useEffect(() => {
    if ((!session || !user) && hasRedirected) {
      console.log("🔄 Auth state changed, resetting redirect flag");
      setHasRedirected(false);
    }
  }, [session, user, hasRedirected]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <Image
        source={require("@/assets/images/design/top-gradient.png")}
        className="scale-50 absolute top-[-25rem]"
      />
      <Image
        source={require("@/assets/images/brand/logo.png")}
        width={1}
        height={1}
        className="scale-[0.2]"
      />
    </View>
  );
};

export default Index;