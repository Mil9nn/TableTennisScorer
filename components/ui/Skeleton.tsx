import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { BorderRadius } from "@/constants/theme";
import { useThemeColors } from "@/hooks/useThemeColors";

interface SkeletonProps {
  width?: number | `${number}%` | "auto" | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  /** Stagger row animations for list skeletons */
  delayMs?: number;
  /** Override shimmer fill (e.g. on gradient headers) */
  color?: string;
  /** Softer fill that blends into list/screen backgrounds */
  muted?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.base,
  style,
  delayMs = 0,
  color,
  muted = false,
}) => {
  const theme = useThemeColors();
  const opacityMin = muted ? 0.28 : 0.48;
  const opacityMax = muted ? 0.42 : 0.62;
  const opacity = useRef(new Animated.Value(opacityMin)).current;
  const fillColor =
    color ?? (muted ? theme.colors.border.light : theme.colors.gray[200]);

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      if (cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: opacityMax,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: opacityMin,
            duration: 1400,
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
  }, [delayMs, opacity, opacityMin, opacityMax]);

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
          backgroundColor: fillColor,
          opacity,
        },
        style,
      ]}
    />
  );
};
