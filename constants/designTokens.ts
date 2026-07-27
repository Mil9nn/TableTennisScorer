export type ColorScheme = 'light' | 'dark';

/** Unified blue primary scale (aligned with Paper theme + Button gradient). */
const primaryScale = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const;

const sharedSemantic = {
  white: '#FFFFFF',
  lightBlue: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  primary: primaryScale,
  status: {
    live: '#DC2626',
    completed: '#059669',
    scheduled: '#2563EB',
    ready: '#7C3AED',
    bye: '#D97706',
    tbd: '#6B7280',
  },
} as const;

export const lightColors = {
  ...sharedSemantic,
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    buttons: {
      primary: primaryScale,
      blue: '#2563EB',
      lightBlue: '#3B82F6',
      darkBlue: '#2563EB',
      lightGreen: '#10B981',
      darkGreen: '#059669',
      lightRed: '#EF4444',
      darkRed: '#DC2626',
      lightYellow: '#F59E0B',
      darkYellow: '#D97706',
    },
  },
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    inverse: '#FFFFFF',
  },
  tabBar: {
    background: '#FFFFFF',
    border: '#E2E8F0',
    active: '#2563EB',
    inactive: '#9CA3AF',
  },
} as const;

export const darkColors = {
  ...sharedSemantic,
  gray: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
  },
  background: {
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    buttons: {
      primary: primaryScale,
      blue: '#3B82F6',
      lightBlue: '#60A5FA',
      darkBlue: '#2563EB',
      lightGreen: '#34D399',
      darkGreen: '#10B981',
      lightRed: '#F87171',
      darkRed: '#EF4444',
      lightYellow: '#FBBF24',
      darkYellow: '#F59E0B',
    },
  },
  border: {
    light: '#334155',
    medium: '#475569',
    dark: '#64748B',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    inverse: '#0F172A',
  },
  tabBar: {
    background: '#0F172A',
    border: '#334155',
    active: '#60A5FA',
    inactive: '#64748B',
  },
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;

export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

function buildComponents(colors: ThemeColors) {
  return {
    button: {
      primary: {
        backgroundColor: colors.background.buttons.blue,
        textColor: colors.white,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
      },
      secondary: {
        backgroundColor: colors.gray[100],
        textColor: colors.gray[700],
        borderColor: colors.gray[200],
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
      },
    },
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      padding: 16,
      shadow: 'sm' as const,
    },
    avatar: {
      size: { sm: 32, md: 44, lg: 64 },
      borderRadius: 'full' as const,
      backgroundColor: colors.gray[200],
      borderColor: colors.gray[300],
      borderWidth: 2,
    },
    vsBadge: {
      backgroundColor: colors.gray[100],
      textColor: colors.gray[500],
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    score: {
      winnerColor: colors.success,
      defaultColor: colors.gray[700],
      fontSize: 14,
      fontWeight: '600',
      minWidth: 24,
    },
    gameRow: {
      backgroundColor: colors.gray[50],
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },
    chip: {
      default: {
        backgroundColor: colors.background.primary,
        textColor: colors.text.secondary,
        borderColor: colors.border.medium,
        borderWidth: 1,
        fontSize: 12,
      },
      selected: {
        backgroundColor: colors.primary[500],
        textColor: colors.white,
        fontSize: 12,
      },
      live: {
        backgroundColor: colors.status.live,
        textColor: colors.white,
        fontSize: 12,
      },
      borderRadius: 9999,
      paddingHorizontal: 8,
      paddingVertical: 6,
      margin: 2,
    },
  };
}

const staticTokens = {
  typography: {
    fontFamily: {
      primary: 'System',
      mono: 'Monospace',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 22,
      '4xl': 26,
      '5xl': 30,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    } as const,
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.2,
      wider: 0.4,
    },
  },
  spacing: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 10,
    6: 12,
    7: 16,
    8: 20,
    10: 24,
    12: 32,
    14: 40,
    16: 48,
    20: 64,
    24: 80,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  shadows: {
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
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
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
  },
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  zIndex: {
    base: 0,
    overlay: 10,
    dropdown: 20,
    sticky: 30,
    modal: 40,
    tooltip: 50,
  },
} as const;

export type AppTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  components: ReturnType<typeof buildComponents>;
} & typeof staticTokens;

export function getDesignTokens(scheme: ColorScheme = 'light'): AppTheme {
  const colors = getThemeColors(scheme);
  return {
    scheme,
    colors,
    components: buildComponents(colors),
    ...staticTokens,
  };
}

/** Default light tokens — backward compatible with existing imports. */
export const DesignTokens = getDesignTokens('light');

export type Spacing = keyof typeof DesignTokens.spacing;
export type FontSize = keyof typeof DesignTokens.typography.fontSize;
export type FontWeight = keyof typeof DesignTokens.typography.fontWeight;
export type BorderRadius = keyof typeof DesignTokens.borderRadius;
