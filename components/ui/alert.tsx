import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Modal } from "./modal";
import { Text } from "./text";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
};

const Alert = ({
  visible,
  title,
  message,
  buttons = [],
  onDismiss,
}: AlertProps) => {
  return (
    <Modal visible={visible} onDismiss={onDismiss} animationType="fade">
      <View className="bg-[#1A1A1A] rounded-3xl p-6 mx-6 max-w-full w-full self-center">
        {/* Title */}
        <Text className="text-white text-xl font-semibold text-center mb-2">
          {title}
        </Text>

        {/* Message */}
        {message && (
          <Text className="text-white/70 text-base text-center mb-6">
            {message}
          </Text>
        )}

        {/* Buttons */}
        <View className="flex-row gap-3 mt-2">
          {buttons.map((button, index) => {
            const isDestructive = button.style === "destructive";
            const isCancel = button.style === "cancel";

            return (
              <TouchableOpacity
                key={index}
                className={`flex-1 py-3.5 rounded-full items-center justify-center ${
                  isDestructive
                    ? "bg-red-600"
                    : isCancel
                      ? "bg-black/30 border border-white/10"
                      : "bg-primary"
                }`}
                onPress={() => {
                  button.onPress?.();
                  onDismiss?.();
                }}
              >
                <Text
                  className={`font-semibold text-base ${
                    isCancel
                      ? "text-white"
                      : isDestructive
                        ? "text-white"
                        : "text-primary-foreground"
                  }`}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

// Static methods to mimic React Native Alert API
let alertInstance: {
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
} | null = null;

const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    title: "",
  });

  React.useEffect(() => {
    alertInstance = {
      show: (title: string, message?: string, buttons?: AlertButton[]) => {
        setConfig({ title, message, buttons });
        setVisible(true);
      },
    };

    return () => {
      alertInstance = null;
    };
  }, []);

  return (
    <>
      {children}
      <Alert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={() => setVisible(false)}
      />
    </>
  );
};

// Static method to show alert
const show = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (alertInstance) {
    alertInstance.show(title, message, buttons);
  }
};

export { Alert, show as alert, AlertProvider };
