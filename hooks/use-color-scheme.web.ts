import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import type { ColorScheme } from "@/constants/designTokens";
import { useThemePreferenceStore } from "@/hooks/useThemePreferenceStore";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 */
export function useColorScheme(): ColorScheme {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const storeHydrated = useThemePreferenceStore((state) => state.hasHydrated);

  if (!hasHydrated || !storeHydrated || preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return preference;
}
