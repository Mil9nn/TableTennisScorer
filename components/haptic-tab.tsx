import { Pressable, Platform, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';

interface HapticTabProps extends Omit<PressableProps, "style" | "onPress" | "onPressIn" | "children"> {
  onPress?: PressableProps["onPress"];
  onPressIn?: PressableProps["onPressIn"];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function HapticTab(props: HapticTabProps) {
  const { onPress, onPressIn, style, children, ...restProps } = props;
  
  return (
    <Pressable
      {...restProps}
      style={style}
      onPress={onPress}
      onPressIn={(ev) => {
        if (Platform.OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    >
      {children}
    </Pressable>
  );
}
