import { useEffect } from "react";
import { useSharedValue, withTiming, withSpring, Easing } from "react-native-reanimated";

export const useChartAnimation = (
  enabled: boolean = true,
  duration: number = 800
) => {
  const progress = useSharedValue(enabled ? 0 : 1);

  useEffect(() => {
    if (enabled) {
      progress.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = 1;
    }
  }, [enabled, duration]);

  const animateValue = (value: number) => {
    "worklet";
    return progress.value * value;
  };

  return { progress, animateValue };
};

export const useSpringAnimation = (
  initialValue: number = 0,
  config?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  }
) => {
  const value = useSharedValue(initialValue);

  const animateTo = (target: number) => {
    value.value = withSpring(target, {
      damping: config?.damping || 15,
      stiffness: config?.stiffness || 150,
      mass: config?.mass || 1,
    });
  };

  return { value, animateTo };
};
