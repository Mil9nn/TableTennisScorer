import ProfileMatchesList from "@/components/ProfileMatchesList";
import { DesignTokens } from "@/constants/designTokens";
import { fetchProfileMatchHistory } from "@/lib/profile/api";
import type { ProfileMatchHistoryItem } from "@/lib/profile/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
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
    let individual = 0;
    let team = 0;

    for (const match of sortedMatches) {
      if (match.matchCategory === "team") team++;
      else individual++;
    }

    return {
      total: sortedMatches.length,
      individual,
      team,
    };
  }, [sortedMatches]);

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
          <View style={styles.overviewBar}>
            <Text style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{overview.total}</Text>
              {overview.total === 1 ? " match" : " matches"}
            </Text>
            {overview.individual > 0 || overview.team > 0 ? (
              <>
                <Text style={styles.overviewDivider}>·</Text>
                <Text style={styles.overviewStat}>
                  {overview.individual > 0
                    ? `${overview.individual} individual`
                    : null}
                  {overview.individual > 0 && overview.team > 0 ? " · " : null}
                  {overview.team > 0 ? `${overview.team} team` : null}
                </Text>
              </>
            ) : null}
          </View>

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
  overviewBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[1],
  },
  overviewStat: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  overviewStatValue: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  overviewDivider: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
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
