import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface CompactCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  variant?: 'default' | 'elevated' | 'minimal';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Compact card component for list items
 * Minimal padding, clean design matching Next.js
 */
export const CompactCard: React.FC<CompactCardProps> = ({
  children,
  onPress,
  style,
  padding = 'sm',
  variant = 'default',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'minimal' && styles.minimal,
    { padding: Spacing[padding] },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  elevated: {
    ...Shadows.sm,
    borderWidth: 0,
  },
  minimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

