import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { EyeIcon, EyeSlashIcon } from './EyeIcon';
import { Colors } from '@/constants/theme';

export type IconLibrary = 'ionicons' | 'material';

// Material Community Icons name mappings for common icons
const MATERIAL_ICON_MAP: Record<string, string> = {
  'plus': 'plus',
  'search': 'magnify',
  'filter': 'filter-outline',
  'users': 'account-group',
  'x': 'close',
  'chevron-right': 'chevron-right',
  'map-pin': 'map-marker-outline',
  'trending-up': 'trending-up',
  'bar-chart-2': 'chart-bar',
  'target': 'target',
  'award': 'trophy-outline',
  'clock': 'clock-outline',
  'calendar': 'calendar-outline',
  'camera': 'camera-outline',
  'check': 'check',
  'edit-2': 'pencil-outline',
  'mail': 'email-outline',
  'info': 'information-outline',
  'activity': 'pulse',
  'trash-2': 'trash-can-outline',
  'swords': 'sword-cross',
  'trophy': 'trophy-outline',
  'user': 'account-outline',
  'menu': 'menu',
  'close': 'close',
  'connection': 'connection',
  'podium': 'podium',
  'arrow-left': 'arrow-left',
  'adjust': 'tune',
  'donut-large': 'chart-donut',
  'swap-horiz': 'swap-horizontal',
  'person': 'account-outline',
  'groups': 'account-group',
  'local-fire-department': 'fire',
  'join-right': 'arrow-right-bold',
  'sports-tennis': 'tennis',
  'hand': 'hand-back-right-outline',
};

export interface IconProps {
  name: string;
  library?: IconLibrary;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
}

/**
 * Unified Icon component supporting Material Community Icons, Ionicons, and custom SVG icons
 * - material: MaterialCommunityIcons (default, extensive Material Design icon set)
 * - ionicons: Expo Ionicons (system-style icons)
 * - custom: Custom SVG icons (eye, eye-slash)
 */
export const Icon: React.FC<IconProps> = ({
  name,
  library = 'material',
  size = 24,
  color = Colors.light.text,
  style,
}) => {
  const iconStyle: StyleProp<TextStyle> = [{ width: size, height: size }, style as StyleProp<TextStyle>];

  // Handle custom SVG icons
  if (name === 'eye') {
    return <EyeIcon size={size} color={color} style={style as StyleProp<ViewStyle>} />;
  }
  
  if (name === 'eye-slash') {
    return <EyeSlashIcon size={size} color={color} style={style as StyleProp<ViewStyle>} />;
  }

  if (library === 'material') {
    const materialIconName = MATERIAL_ICON_MAP[name] || name;
    return (
      <MaterialCommunityIcons
        name={materialIconName as any}
        size={size}
        color={color}
        style={iconStyle}
      />
    );
  }

  if (library === 'ionicons') {
    return (
      <Ionicons
        name={name as any}
        size={size}
        color={color}
        style={iconStyle}
      />
    );
  }

  return null;
};
