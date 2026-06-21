import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { BorderRadius } from "@/constants/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  /** Stagger row animations for list skeletons */
  delayMs?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.base,
  style,
  delayMs = 0,
}) => {
  const opacity = useRef(new Animated.Value(0.52)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      if (cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.62,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.48,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      loop?.stop();
      opacity.stopAnimation();
    };
  }, [delayMs, opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#eef1f4",
  },
});
