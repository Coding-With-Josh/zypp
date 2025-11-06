import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Modal as RNModal,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { IconSymbol } from "./IconSymbol";
import { Text } from "./text";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  onDismiss?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  height?: number | string;
  maxHeight?: number | string;
  animationType?: "slide" | "fade" | "none";
  backdropBlur?: boolean;
  customHeader?: React.ReactNode;
  swipeToClose?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  statusBarTranslucent?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  onDismiss,
  title,
  subtitle,
  children,
  showHeader = true,
  showCloseButton = true,
  closeOnBackdropPress = true,
  height = "auto",
  maxHeight = "90%",
  animationType = "slide",
  backdropBlur = true,
  customHeader,
  swipeToClose = true,
  showBackButton = false,
  onBack,
  statusBarTranslucent = true,
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === "slide") {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      if (animationType === "slide") {
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animationType, fadeAnim, slideAnim]);

  const handleClose = () => {
    if (onClose) onClose();
    if (onDismiss) onDismiss();
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      handleClose();
    }
  };

  const renderHeader = () => {
    if (customHeader) {
      return customHeader;
    }

    if (!showHeader) {
      return null;
    }

    return (
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <TouchableWithoutFeedback onPress={onBack}>
              <View className="w-10 h-10 rounded-full bg-black/15 items-center justify-center mr-3">
                <Ionicons name="chevron-back" size={20} color="white" />
              </View>
            </TouchableWithoutFeedback>
          )}

          <View className="flex-1">
            {title && (
              <Text className="text-white font-semibold text-xl text-center">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-white/60 text-sm text-center mt-1">
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {showCloseButton && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View className="w-10 h-10 rounded-full bg-black/15 items-center justify-center ml-3">
              <IconSymbol name="xmark" size={20} color="white" />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          className="flex-1 bg-black"
          style={{ opacity: fadeAnim }}
        >
          {backdropBlur && Platform.OS === "ios" && (
            <BlurView intensity={80} tint="dark" className="flex-1" />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Modal Content */}
      <View className="absolute bottom-0 left-0 right-0 justify-end">
        <TouchableWithoutFeedback>
          <Animated.View
            style={{
              transform:
                animationType === "slide" ? [{ translateY: slideAnim }] : [],
            }}
            className="bg-black border-t border-white/10 rounded-t-3xl overflow-hidden"
          >
            {/* Handle Bar */}
            <View className="items-center py-3">
              <View className="w-12 h-1 bg-white/20 rounded-full" />
            </View>

            {renderHeader()}

            <View className="flex-1">{children}</View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </RNModal>
  );
};

// Pre-built modal components for common use cases
export const AlertModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons?: {
    text: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "destructive";
  }[];
}> = ({ visible, onClose, title, message, buttons = [] }) => {
  const defaultButtons =
    buttons.length === 0
      ? [
          {
            text: "OK",
            onPress: onClose,
            variant: "primary" as const,
          },
        ]
      : buttons;

  const getButtonStyle = (variant: string) => {
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "destructive":
        return "bg-red-500";
      case "secondary":
      default:
        return "bg-white/10";
    }
  };

  const getButtonTextStyle = (variant: string) => {
    switch (variant) {
      case "primary":
        return "text-primary-foreground";
      case "destructive":
        return "text-white";
      case "secondary":
      default:
        return "text-white";
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      height="auto"
      showCloseButton={false}
    >
      <View className="px-6 py-6 pb-20">
        <Text className="text-white/80 text-base text-center leading-6 mb-6">
          {message}
        </Text>

        <View
          className={`gap-3 ${defaultButtons.length > 2 ? "flex-col" : "flex-row"}`}
        >
          {defaultButtons.map((button, index) => (
            <TouchableWithoutFeedback key={index} onPress={button.onPress}>
              <View
                className={`flex-1 py-4 rounded-full items-center ${getButtonStyle(button.variant || "secondary")}`}
              >
                <Text
                  className={`font-semibold text-base ${getButtonTextStyle(button.variant || "secondary")}`}
                >
                  {button.text}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    </Modal>
  );
};

export const ActionSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: {
    icon?: any; // We should type this properly with Ionicons types
    title: string;
    subtitle?: string;
    onPress: () => void;
    variant?: "default" | "destructive";
  }[];
  showCancel?: boolean;
}> = ({ visible, onClose, title, actions, showCancel = true }) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      height="auto"
      showCloseButton={false}
    >
      <View className="px-4 py-2">
        {actions.map((action, index) => (
          <TouchableWithoutFeedback
            key={index}
            onPress={() => {
              action.onPress();
              onClose();
            }}
          >
            <View
              className={`flex-row items-center px-4 py-4 ${
                index !== actions.length - 1 ? "border-b border-white/10" : ""
              } ${action.variant === "destructive" ? "text-red-400" : "text-white"}`}
            >
              {action.icon && (
                <View className="w-10 h-10 rounded-full bg-black/15 items-center justify-center mr-3">
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={
                      action.variant === "destructive" ? "#EF4444" : "white"
                    }
                  />
                </View>
              )}

              <View className="flex-1">
                <Text
                  className={`font-medium text-base ${
                    action.variant === "destructive"
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {action.title}
                </Text>
                {action.subtitle && (
                  <Text className="text-white/60 text-sm mt-1">
                    {action.subtitle}
                  </Text>
                )}
              </View>

              <IconSymbol
                name="chevron.right"
                size={16}
                color={action.variant === "destructive" ? "#EF4444" : "#9CA3AF"}
              />
            </View>
          </TouchableWithoutFeedback>
        ))}

        {showCancel && (
          <>
            <View className="h-4" />
            <TouchableWithoutFeedback onPress={onClose}>
              <View className="bg-black/15 rounded-2xl py-4 items-center">
                <Text className="text-white font-semibold text-base">
                  Cancel
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </>
        )}
      </View>
    </Modal>
  );
};

export const BottomSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: number | string;
}> = ({ visible, onClose, children, title, height = "50%" }) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      height={height}
      showHeader={!!title}
    >
      {children}
    </Modal>
  );
};
