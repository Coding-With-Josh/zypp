import type { DeviceMotionMeasurement } from "expo-sensors";
import { DeviceMotion } from "expo-sensors";
import { useCallback, useEffect, useState } from "react";

interface ShakeConfig {
  threshold?: number; // Acceleration threshold to trigger shake (default: 1.8)
  cooldownMs?: number; // Min time between shakes (default: 1000ms)
  minShakes?: number; // Min number of shakes to trigger (default: 2)
  timeWindowMs?: number; // Time window to count shakes (default: 2000ms)
  enabled?: boolean; // Whether shake detection is enabled (default: true)
}

interface ShakeState {
  isShaking: boolean;
  lastShake: number;
  shakeCount: number;
  subscription: ReturnType<typeof DeviceMotion.addListener> | null;
}

/**
 * Hook that detects device shaking and triggers a callback.
 * Uses DeviceMotion sensor to detect rapid acceleration changes.
 */
export function useShakeGesture(onShake: () => void, config: ShakeConfig = {}) {
  const [state, setState] = useState<ShakeState>({
    isShaking: false,
    lastShake: 0,
    shakeCount: 0,
    subscription: null,
  });

  // Config with defaults
  const {
    threshold = 1.8,
    cooldownMs = 1000,
    minShakes = 2,
    timeWindowMs = 2000,
    enabled = true,
  } = config;

  const handleMotion = useCallback(
    (motion: DeviceMotionMeasurement) => {
      const now = Date.now();
      const { x, y, z } = motion.acceleration || {};
      if (!x || !y || !z) return;

      // Calculate total acceleration magnitude
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      // Check if acceleration exceeds threshold
      if (acceleration > threshold) {
        setState((prev) => {
          // Ignore if within cooldown
          if (now - prev.lastShake < cooldownMs) {
            return prev;
          }

          // Count shakes within time window
          const relevantShakeCount =
            now - prev.lastShake <= timeWindowMs ? prev.shakeCount + 1 : 1;

          // Trigger if we hit minShakes within window
          if (relevantShakeCount >= minShakes) {
            onShake();
            return {
              ...prev,
              isShaking: true,
              lastShake: now,
              shakeCount: 0,
            };
          }

          return {
            ...prev,
            isShaking: true,
            lastShake: now,
            shakeCount: relevantShakeCount,
          };
        });
      } else {
        // Reset shake state when acceleration drops
        setState((prev) => ({
          ...prev,
          isShaking: false,
        }));
      }
    },
    [threshold, cooldownMs, minShakes, timeWindowMs, onShake]
  );

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const startListening = async () => {
      try {
        // Don't start if not enabled
        if (!enabled) return;

        // Request permissions if needed (iOS)
        const { granted } = await DeviceMotion.requestPermissionsAsync();
        if (!granted) {
          console.warn("No permission to use DeviceMotion");
          return;
        }

        // Configure sensor
        await DeviceMotion.setUpdateInterval(100); // 10 updates per second

        // Start listening
        subscription = DeviceMotion.addListener(handleMotion);
        setState((prev) => ({ ...prev, subscription }));
      } catch (err) {
        console.error("Failed to start shake detection:", err);
      }
    };

    startListening();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [handleMotion, enabled]);

  return {
    isShaking: state.isShaking,
    shakeCount: state.shakeCount,
  };
}

export default useShakeGesture;
