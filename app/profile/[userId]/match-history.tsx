import ProfileMatchesList from "@/components/ProfileMatchesList";
import { DesignTokens } from "@/constants/designTokens";
import { fetchProfileMatchHistory } from "@/lib/profile/api";
import type { ProfileMatchHistoryItem } from "@/lib/profile/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { isProfileMatchWin } from "@/lib/profile/matchResult";
import { FontAwesome5 } from "@expo/vector-icons";

function getMatchTimestamp(match: ProfileMatchHistoryItem) {
  const raw = match.createdAt ?? (match as { date?: string }).date;
  return raw ? Date.parse(raw) : 0;
}

export default function ProfileMatchHistoryScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ProfileMatchHistoryItem[]>([]);

  const sortedMatches = useMemo(() => {
    const items = Array.isArray(matches) ? [...matches] : [];
    items.sort((a, b) => getMatchTimestamp(b) - getMatchTimestamp(a));
    return items;
  }, [matches]);

  const overview = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let individual = 0;
    let team = 0;

    for (const match of sortedMatches) {
      if (match.matchCategory === "team") team++;
      else individual++;

      const result = isProfileMatchWin(match, resolvedUserId);
      if (result === true) wins++;
      else if (result === false) losses++;
    }

    const decided = wins + losses;
    const winRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;

    return {
      total: sortedMatches.length,
      wins,
      losses,
      winRate,
      individual,
      team,
    };
  }, [sortedMatches, resolvedUserId]);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    try {
      const historyRes = await fetchProfileMatchHistory(resolvedUserId);

      if (!historyRes || historyRes.success !== true) {
        throw new Error(
          historyRes?.error ||
            historyRes?.message ||
            "Failed to load match history",
        );
      }
      setMatches(Array.isArray(historyRes.matches) ? historyRes.matches : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) =>
        setError(
          e instanceof Error ? e.message : "Failed to load match history",
        ),
      )
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to refresh"),
      )
      .finally(() => setRefreshing(false));
  }, [load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading ? (
        <Text style={styles.loadingText}>Loading matches…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{overview.total}</Text>
              <Text style={styles.overviewLabel}>Played</Text>
            </View>
            <View style={[styles.overviewCard, styles.overviewCardHighlight]}>
              <Text
                style={[styles.overviewValue, styles.overviewValueHighlight]}
              >
                {overview.wins}
              </Text>
              <Text style={styles.overviewLabel}>Won</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{overview.losses}</Text>
              <Text style={styles.overviewLabel}>Lost</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{overview.winRate}%</Text>
              <Text style={styles.overviewLabel}>Win rate</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Matches ({sortedMatches.length})
          </Text>

          {sortedMatches.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5
                name="history"
                size={28}
                color={DesignTokens.colors.text.tertiary}
              />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>
                Play some matches and they&apos;ll show up here.
              </Text>
            </View>
          ) : (
            <ProfileMatchesList
              matches={sortedMatches}
              userId={resolvedUserId}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  content: {
    padding: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[3],
    paddingBottom: DesignTokens.spacing[8],
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
    paddingVertical: DesignTokens.spacing[8],
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
    textAlign: "center",
    paddingVertical: DesignTokens.spacing[8],
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[2],
  },
  overviewCard: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[4],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    alignItems: "center",
  },
  overviewCardHighlight: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
  },
  overviewValue: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  overviewValueHighlight: {
    color: "#15803d",
  },
  overviewLabel: {
    marginTop: DesignTokens.spacing[1],
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[2],
  },
  emptyCard: {
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[8],
    paddingHorizontal: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
  },
});
