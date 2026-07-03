import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHomeScreen } from "@/components/profile/ProfileHomeScreen";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { DesignTokens } from "@/constants/designTokens";
import { useAuthStore } from "@/hooks/useAuthStore";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProfileTabContent() {
  const { userId, user, loading } = useProfile();

  return (
    <View style={styles.content}>
      <ProfileHeader
        userId={userId}
        user={user}
        loading={loading}
        showBackButton={false}
      />
      <ProfileHomeScreen userId={userId} />
    </View>
  );
}

export default function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
