import { AlertProvider } from "@/components/ui/alert";
import "@/lib/crypto/crypto-polyfill";
import { transportManager } from "@/lib/transport/transport-manager";
import {
  InstrumentSans_400Regular,
  InstrumentSans_400Regular_Italic,
  InstrumentSans_500Medium,
  InstrumentSans_500Medium_Italic,
  InstrumentSans_600SemiBold,
  InstrumentSans_600SemiBold_Italic,
  InstrumentSans_700Bold,
  InstrumentSans_700Bold_Italic,
} from "@expo-google-fonts/instrument-sans";
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";

import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider as UIThemeProvider } from "@/components/ui/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

// Import our production providers
import { AuthProvider } from "@/contexts/AuthContext";
import { SyncProvider } from "@/contexts/SyncContext";
import { WalletProvider } from "@/contexts/WalletContext";
import "react-native-reanimated";

// Prevent the splash screen from auto-hiding before assets are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    InstrumentSans_400Regular_Italic,
    InstrumentSans_500Medium_Italic,
    InstrumentSans_600SemiBold_Italic,
    InstrumentSans_700Bold_Italic,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Initialize transport manager once at app startup so native modules are
  // ready before screens (like Send) call startBrowsing/startAdvertising.
  useEffect(() => {
    const initTransports = async () => {
      try {
        await transportManager.initialize(
          // Minimal peer handler (most app code should register its own
          // listeners via transportManager.add*Listener or via
          // TransactionProvider which also calls initialize).
          (peer) => {
            // noop: listeners elsewhere will handle peer updates
            // console.debug("App-level peer discovered:", peer?.device_id);
          },
          (tx, transport) => {
            // noop: TransactionProvider handles incoming transactions
            // console.debug("App-level transaction received:", transport);
          }
        );
      } catch (err) {
        console.error(
          "Failed to initialize transport manager at startup:",
          err
        );
      }
    };

    initTransports();
    // Enable verbose transport logs in development for easier debugging
    if (__DEV__) {
      try {
        transportManager.enableDebug(true);
      } catch (err) {
        console.error("Failed to enable transport debug:", err);
      }
    }
  }, []);

  if (!loaded && !error) {
    // Keep showing splash screen while loading
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <UIThemeProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <AlertProvider>
                  {/* Fixed: Proper nesting of providers */}
                  <SyncProvider>
                    <WalletProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: "fade",
                        }}
                      >
                        {/* Onboarding Flow */}
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(profile)" />

                        {/* Main App */}
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="+not-found" />
                      </Stack>

                      <StatusBar style="auto" />
                    </WalletProvider>
                  </SyncProvider>
                </AlertProvider>
              </ThemeProvider>
            </UIThemeProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </ErrorBoundary>
  );
}
