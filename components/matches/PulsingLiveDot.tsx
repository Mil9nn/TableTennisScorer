import { DesignTokens } from "@/constants/designTokens";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface PulsingLiveDotProps {
  size?: number;
  color?: string;
  /** When false, renders a static dot (better for long scroll lists). */
  animated?: boolean;
}

/** Soft breathing red dot for live match status. */
export function PulsingLiveDot({
  size = 8,
  color = DesignTokens.colors.status.live,
  animated = true,
}: PulsingLiveDotProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!animated) return;
    pulse.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [animated, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: animated ? pulse.value * 0.45 : 0,
    transform: [{ scale: animated ? 1 + (1 - pulse.value) * 0.9 : 1 }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 2.2, height: size * 2.2 }]}>
      {animated ? (
        <Animated.View
          style={[
            styles.ring,
            {
              width: size * 2.2,
              height: size * 2.2,
              borderRadius: size * 1.1,
              backgroundColor: color,
            },
            ringStyle,
          ]}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
});
