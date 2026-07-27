import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

interface ThemePreferenceState {
  preference: ThemePreference;
  hasHydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(
    (set) => ({
      preference: "system",
      hasHydrated: false,
      setPreference: (preference) => set({ preference }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "ttpro-theme-preference",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
