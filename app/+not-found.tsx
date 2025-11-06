import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Text, Button, SafeAreaView } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center p-5">
          <Text variant="h1" className="mb-4 text-white font-semibold">
            404
          </Text>
          <Text variant="h3" className="mb-2 text-white font-semibold">
            Page not found
          </Text>
          <Text variant="muted" className="text-center text-neutral-400 mb-8">
            This screen does not exist.
          </Text>
          <Link href="/home" asChild>
            <Button variant="default">
              <Text className="font-semibold">Go to home screen</Text>
            </Button>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
