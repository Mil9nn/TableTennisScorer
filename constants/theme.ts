/**
 * Modern theme system with colors, spacing, typography, and shadows
 * Matching Next.js frontend design language
 */

import { Platform } from 'react-native';

const tintColorLight = '#3b82f6';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    tint: tintColorLight,
    primary: '#3b82f6',
    primaryDark: '#0a7ea4',
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  dark: {
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    background: '#111827',
    backgroundSecondary: '#1f2937',
    tint: tintColorDark,
    primary: '#60a5fa',
    primaryDark: '#3b82f6',
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    border: '#374151',
    borderLight: '#4b5563',
    card: '#1f2937',
    cardBorder: '#374151',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
};

// Spacing scale (4px base unit)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

// Typography scale
export const Typography = {
  xs: {
    fontSize: 12,
    lineHeight: 16,
  },
  sm: {
    fontSize: 14,
    lineHeight: 20,
  },
  base: {
    fontSize: 16,
    lineHeight: 24,
  },
  lg: {
    fontSize: 18,
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
  },
  '2xl': {
    fontSize: 24,
    lineHeight: 32,
  },
  '3xl': {
    fontSize: 30,
    lineHeight: 36,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Border radius
export const BorderRadius = {
  sm: 6,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadow presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Gradient colors matching Next.js design
export const Gradients = {
  primary: ['#3b82f6', '#2563eb'],
  primaryLight: ['#60a5fa', '#3b82f6'],
  teams: ['#6878E1', '#5a6fd6'], // Teams page gradient
  tournaments: ['#6366f1', '#4f46e5', '#4338ca'], // Tournaments page gradient (indigo)
  accent: ['#6366f1', '#8b5cf6', '#d946ef'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#d97706'],
  neutral: ['#f9fafb', '#ffffff'],
};

// Compact spacing for list items (matching Next.js minimal design)
export const CompactSpacing = {
  itemPadding: 12, // px-4 py-3 equivalent
  itemGap: 8,
  sectionGap: 16,
};

// Animation timing constants
export const Animation = {
  fast: 150,
  base: 200,
  slow: 300,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});