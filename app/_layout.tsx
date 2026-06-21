import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { paperThemeForScheme } from "@/lib/paperTheme";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProfileCompletionCheck from "@/components/ProfileCompletionCheck";
import NavigationGuard from "@/components/NavigationGuard";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    useAuthStore.getState().fetchUser();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={paperThemeForScheme(colorScheme)}>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
                <Stack.Screen name="match" options={{ headerShown: false }} />
                <Stack.Screen name="team" options={{ headerShown: false }} />
                <Stack.Screen name="tournaments" options={{ headerShown: false }} />
                <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
              <NavigationGuard />
              <ProfileCompletionCheck />
              <StatusBar style="auto" />
              <Toast />
            </ThemeProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
