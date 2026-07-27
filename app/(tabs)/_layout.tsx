import { Redirect, Slot } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function TabLayout() {
  const theme = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.authLoading);

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return <Slot />;
}
