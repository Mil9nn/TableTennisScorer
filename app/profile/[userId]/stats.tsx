import { ProfileStatsContent } from "@/components/profile/ProfileStatsContent";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { DesignTokens } from "@/constants/designTokens";

/** Stack route wrapper — deep links and QuickStats presses land here. */
export default function ProfileStatsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <View style={styles.container}>
      <ProfileStatsContent userId={String(userId ?? "")} enabled />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
});
