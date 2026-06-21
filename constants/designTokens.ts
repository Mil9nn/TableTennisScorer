export const DesignTokens = {
  // Colors
  colors: {
    // Primary palette
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },

    // Semantic colors
    white: '#FFFFFF',
    lightBlue: '#3b82f6',
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
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',

      buttons: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        blue: '#2563eb',
        lightBlue: '#3b82f6',
        darkBlue: '#2563eb',
        lightGreen: '#10b981',
        darkGreen: '#059669',
        lightRed: '#ef4444',
        darkRed: '#dc2626',
        lightYellow: '#f59e0b',
        darkYellow: '#d97706',
      }
    },

    // Border colors
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1',
      dark: '#94A3B8',
    },

    // Text colors
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#6B7280',
      inverse: '#FFFFFF',
    },

    // Status colors
    status: {
      live: '#DC2626', // Deep red for live
      completed: '#059669', // Darker green for completed
      scheduled: '#2563EB', // Blue for scheduled
      ready: '#7C3AED', // Purple for ready
      bye: '#D97706', // Darker orange for bye
      tbd: '#6B7280', // Gray for TBD
    },
  },

  // Typography
  typography: {
    // Font families
    fontFamily: {
      primary: 'System', // Will use system font
      mono: 'Monospace',
    },

    // Font sizes - mobile-first modular scale
    fontSize: {
      xs: 8,
      sm: 10,
      base: 12,
      lg: 14,
      xl: 16,
      '2xl': 18,
      '3xl': 20,
      '4xl': 24,
      '5xl': 28,
    },

    // Font weights - using React Native valid values
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    } as const,

    // Letter spacing
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.2,
      wider: 0.4,
    },
  },

  // Spacing - using 4px base unit, mobile-first approach
  spacing: {
    0: 0,
    1: 2,  // Reduced for mobile
    2: 4,  // Reduced for mobile
    3: 6,  // Reduced for mobile
    4: 8,  // Reduced for mobile
    5: 10, // Reduced for mobile
    6: 12, // Reduced for mobile
    7: 16,
    8: 20,
    10: 24,
    12: 32,
    14: 40,
    16: 48,
    20: 64,
    24: 80,
  },

  // Border radius
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

  // Shadows
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

  // Animation durations
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

  // Z-index values
  zIndex: {
    base: 0,
    overlay: 10,
    dropdown: 20,
    sticky: 30,
    modal: 40,
    tooltip: 50,
  },

  // Component-specific tokens
  components: {
    // Button tokens
    button: {
      primary: {
        backgroundColor: '#2563eb',
        textColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
      },
      secondary: {
        backgroundColor: '#f3f4f6',
        textColor: '#374151',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
      },
    },

    // Card tokens
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadow: 'sm',
    },

    // Avatar tokens
    avatar: {
      size: {
        sm: 32,
        md: 44,
        lg: 64,
      },
      borderRadius: 'full',
      backgroundColor: '#e5e7eb',
      borderColor: '#d1d5db',
      borderWidth: 2,
    },

    // VS badge tokens
    vsBadge: {
      backgroundColor: '#f3f4f6',
      textColor: '#6b7280',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    // Score display tokens
    score: {
      winnerColor: '#10b981',
      defaultColor: '#374151',
      fontSize: 14,
      fontWeight: '600',
      minWidth: 24,
    },

    // Game row tokens
    gameRow: {
      backgroundColor: '#f9fafb',
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },

    // Chip tokens
    chip: {
      default: {
        backgroundColor: '#FFFFFF',
        textColor: '#4B5563',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        fontSize: 10,
      },
      selected: {
        backgroundColor: '#6366F1',
        textColor: '#FFFFFF',
        fontSize: 10,
      },
      live: {
        backgroundColor: '#DC2626',
        textColor: '#FFFFFF',
        fontSize: 10,
      },
      borderRadius: 9999,
      paddingHorizontal: 8,
      paddingVertical: 6,
      margin: 2,
    },
  },
};

// Type definitions for better TypeScript support
export type Spacing = keyof typeof DesignTokens.spacing;
export type FontSize = keyof typeof DesignTokens.typography.fontSize;
export type FontWeight = keyof typeof DesignTokens.typography.fontWeight;
export type BorderRadius = keyof typeof DesignTokens.borderRadius;
