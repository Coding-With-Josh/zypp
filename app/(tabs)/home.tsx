import React from "react";
import { View } from "react-native";
import {
  KeyboardAvoidingView,
  SafeAreaView,
} from "@/components/ui";

export default function Home() {


  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <KeyboardAvoidingView className="flex-1">
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
