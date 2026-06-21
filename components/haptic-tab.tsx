import { Pressable, Platform, PressableProps, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';

interface HapticTabProps {
  onPress?: (e: any) => void;
  onPressIn?: (e: any) => void;
  style?: ViewStyle | TextStyle | (ViewStyle | TextStyle)[];
  children?: React.ReactNode;
  accessibilityRole?: string;
  accessibilityState?: any;
  testID?: string;
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
