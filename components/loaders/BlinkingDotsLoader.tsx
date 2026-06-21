import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

interface BlinkingDotsLoaderProps {
  size?: number;
  color?: string;
  speed?: number;
  style?: any;
}

export default function BlinkingDotsLoader({
  size = 6,
  color = "#9ca3af",
  speed = 2,
  style,
}: BlinkingDotsLoaderProps) {
  const dotSize = Math.max(6, Math.round(size));
  const gap = Math.max(3, Math.round(size * 0.4));

  const dot1 = useRef(new Animated.Value(0.18)).current;
  const dot2 = useRef(new Animated.Value(0.18)).current;
  const dot3 = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot, {
              toValue: 1,
              duration: (speed * 1000) / 3,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.18,
              duration: (speed * 1000) / 3,
              delay: (speed * 1000) / 3,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, (speed * 1000) / 3);
    const anim3 = createAnimation(dot3, (speed * 1000 * 2) / 3);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3, speed]);

  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
  };

  return (
    <View style={[styles.container, { gap }, style]}>
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot1,
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot2,
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot3,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});

