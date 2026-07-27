import { useColorScheme as useRNColorScheme } from "react-native";
import type { ColorScheme } from "@/constants/designTokens";
import { useThemePreferenceStore } from "@/hooks/useThemePreferenceStore";

export function useColorScheme(): ColorScheme {
  const systemScheme = useRNColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const hasHydrated = useThemePreferenceStore((state) => state.hasHydrated);

  if (!hasHydrated || preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return preference;
}
