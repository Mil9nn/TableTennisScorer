import LiveMatchDetails from "@/components/live-match/LiveMatchDetails";
import { Icon } from "@/components/ui/Icon";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MatchLivePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { id: matchIdParam, category } = useLocalSearchParams();
  const matchId = normalizeMatchIdParam(matchIdParam);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: "#071018",
        },
        bridgeBar: {
          paddingTop: insets.top,
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[2],
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          backgroundColor: "rgba(7, 16, 24, 0.96)",
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "rgba(148, 163, 184, 0.25)",
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.08)",
        },
        bridgeTitle: {
          flex: 1,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: "#F8FAFC",
        },
        bridgeSubtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: "#94A3B8",
        },
      }),
    [insets.top, theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.bridgeBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={22} color="#F8FAFC" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.bridgeTitle}>Live match</Text>
          <Text style={styles.bridgeSubtitle}>Scoring view</Text>
        </View>
      </View>
      <LiveMatchDetails
        matchId={matchId}
        category={(category as "individual" | "team") || "individual"}
      />
    </View>
  );
}
