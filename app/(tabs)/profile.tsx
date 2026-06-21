import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHomeScreen } from "@/components/profile/ProfileHomeScreen";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/hooks/useAuthStore";
import { ActivityIndicator, StyleSheet, View } from "react-native";

function ProfileTabContent() {
  const { userId, user, loading } = useProfile();

  return (
    <View style={styles.root}>
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
    <ProfileProvider userId={user._id}>
      <ProfileTabContent />
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
