import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { DesignTokens } from "@/constants/designTokens";
import { Stack, useLocalSearchParams, usePathname } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProfileLayoutContent() {
  const { userId, user, loading } = useProfile();
  const pathname = usePathname();

  // Hide the compact bar on the profile home — Overview owns the identity hero.
  // Nested screens (matches, stats, …) keep a slim identity bar + back.
  const isProfileHome = /\/profile\/[^/]+\/?$/.test(pathname);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {!isProfileHome ? (
        <ProfileHeader
          userId={userId}
          user={user}
          loading={loading}
          showBackButton
          compact
        />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: styles.stackContent,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Profile" }} />
        <Stack.Screen name="match-history" options={{ title: "Matches" }} />
        <Stack.Screen name="head-to-head" options={{ title: "Head to head" }} />
        <Stack.Screen
          name="head-to-head/[opponentId]"
          options={{ title: "Head to head" }}
        />
        <Stack.Screen name="stats" options={{ title: "Stats" }} />
        <Stack.Screen name="teams" options={{ title: "Teams" }} />
        <Stack.Screen name="tournaments" options={{ title: "Tournaments" }} />
        <Stack.Screen name="insights" options={{ title: "Stats" }} />
        <Stack.Screen name="shots" options={{ title: "Shots" }} />
      </Stack>
    </SafeAreaView>
  );
}

export default function ProfileUserLayout() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <ProfileProvider userId={String(userId ?? "")}>
      <ProfileLayoutContent />
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  stackContent: {
    flex: 1,
  },
});
