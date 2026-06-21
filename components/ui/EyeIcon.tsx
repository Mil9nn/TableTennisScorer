import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export interface EyeIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const EyeIcon: React.FC<EyeIconProps> = ({
  size = 20,
  color = 'currentColor',
  style,
}) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={true}
      >
        <Path
          d="M3 13C4.8 8.5 8.1 6 12 6s7.2 2.5 9 7"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx="12"
          cy="13"
          r="3.2"
          stroke={color}
          strokeWidth="1.4"
        />
      </Svg>
    </View>
  );
};

export const EyeSlashIcon: React.FC<EyeIconProps> = ({
  size = 20,
  color = 'currentColor',
  style,
}) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={true}
      >
        <Path
          d="M3 13C4.8 8.5 8.1 6 12 6s7.2 2.5 9 7"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx="12"
          cy="13"
          r="3.2"
          stroke={color}
          strokeWidth="1.4"
        />
        <Path
          d="M5 19L19 5"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
