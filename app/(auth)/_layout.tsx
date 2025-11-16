import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="connect-wallet" />
      <Stack.Screen name="set-username" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
