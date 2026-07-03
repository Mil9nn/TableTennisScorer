import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { DesignTokens } from "@/constants/designTokens";
import { Stack, useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProfileLayoutContent() {
  const { userId, user, loading } = useProfile();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ProfileHeader userId={userId} user={user} loading={loading} />
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
        <Stack.Screen name="insights" options={{ title: "Insights" }} />
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
