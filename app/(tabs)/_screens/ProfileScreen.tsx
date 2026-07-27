import { ProfileHomeScreen } from "@/components/profile/ProfileHomeScreen";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/hooks/useAuthStore";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";

function ProfileTabContent() {
  const { userId } = useProfile();

  return (
    <View style={{ flex: 1 }}>
      <ProfileHomeScreen userId={userId} />
    </View>
  );
}

export default function ProfileTab() {
  const theme = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background.primary,
        },
      }),
    [theme],
  );

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (!user?._id) return null;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ProfileProvider userId={user._id}>
        <ProfileTabContent />
      </ProfileProvider>
    </SafeAreaView>
  );
}
