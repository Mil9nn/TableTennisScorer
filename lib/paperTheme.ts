import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

/**
 * App-aligned Material 3 theme for react-native-paper.
 * Primary / primaryContainer match `matches` filter chips: #3B82F6 selected pill,
 * #EEF2FF + #3730A3 unselected (Tailwind indigo-50 / indigo-800).
 */
export const appPaperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#3B82F6",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EEF2FF",
    onPrimaryContainer: "#3730A3",
    secondary: "#4F46E5",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E0E7FF",
    onSecondaryContainer: "#312E81",
    tertiary: "#0D9488",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#CCFBF1",
    onTertiaryContainer: "#134E4A",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F5F9",
    background: "#FFFFFF",
    onBackground: "#111827",
    onSurface: "#111827",
    onSurfaceVariant: "#64748B",
    outline: "#CBD5E1",
    outlineVariant: "#E2E8F0",
    inverseSurface: "#1E293B",
    inverseOnSurface: "#F8FAFC",
    inversePrimary: "#93C5FD",
    elevation: {
      level0: "transparent",
      level1: "#F8FAFC",
      level2: "#F1F5F9",
      level3: "#E2E8F0",
      level4: "#CBD5E1",
      level5: "#94A3B8",
    },
  },
};

export const appPaperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    /** Selected chip — same blue as light mode */
    primary: "#3B82F6",
    onPrimary: "#FFFFFF",
    /** Unselected chip — dark indigo rail */
    primaryContainer: "#312E81",
    onPrimaryContainer: "#E0E7FF",
    secondary: "#818CF8",
    onSecondary: "#0F172A",
    secondaryContainer: "#3730A3",
    onSecondaryContainer: "#E0E7FF",
    tertiary: "#2DD4BF",
    onTertiary: "#042F2E",
    tertiaryContainer: "#115E59",
    onTertiaryContainer: "#CCFBF1",
    surface: "#0F172A",
    surfaceVariant: "#1E293B",
    background: "#0F172A",
    onBackground: "#F8FAFC",
    onSurface: "#F8FAFC",
    onSurfaceVariant: "#94A3B8",
    outline: "#475569",
    outlineVariant: "#334155",
    inverseSurface: "#F1F5F9",
    inverseOnSurface: "#1E293B",
    inversePrimary: "#1D4ED8",
    elevation: {
      level0: "transparent",
      level1: "#1E293B",
      level2: "#334155",
      level3: "#475569",
      level4: "#64748B",
      level5: "#94A3B8",
    },
  },
};

export function paperThemeForScheme(scheme: "light" | "dark" | null | undefined): MD3Theme {
  return scheme === "dark" ? appPaperDarkTheme : appPaperLightTheme;
}
