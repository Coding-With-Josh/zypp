import { View } from "@/components/ui";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image } from "react-native";

const Index = () => {
  useEffect(() => {
    // This will run when the component mounts
    setTimeout(() => {
      router.replace("/home");
    }, 2000);
  }, []);
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
