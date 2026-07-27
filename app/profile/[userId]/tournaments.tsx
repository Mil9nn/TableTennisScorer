import { DesignTokens } from "@/constants/designTokens";
import { fetchTournamentStatsForUser } from "@/lib/profile/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";

type TournamentInfo = {
  _id?: string;
  name?: string;
  format?: string;
  category?: string;
  matchType?: string;
  status?: string;
  startDate?: string;
  city?: string;
};

type TournamentEntry = {
  tournament?: TournamentInfo;
  stats?: {
    matchesPlayed?: number;
    wins?: number;
    losses?: number;
    position?: number | string | null;
  };
};

function getTournamentInfo(entry: TournamentEntry): TournamentInfo {
  return entry.tournament ?? {};
}

function formatLabel(value?: string) {
  if (!value) return null;
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPosition(position?: number | string | null) {
  if (position == null || position === "") return null;
  if (typeof position === "number") {
    if (position === 1) return "Champion";
    if (position === 2) return "Runner-up";
    if (position === 3) return "3rd place";
    return `${position}${position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"} place`;
  }
  return String(position);
}

function formatDate(dateString?: string) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfileTournamentsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const tournaments = useMemo(() => {
    const arr = stats?.tournaments;
    return Array.isArray(arr) ? (arr as TournamentEntry[]) : [];
  }, [stats]);

  const overview = useMemo(() => {
    const o = stats?.overview;
    return o && typeof o === "object" ? o : null;
  }, [stats]);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    const res = await fetchTournamentStatsForUser(resolvedUserId);
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load tournament stats");
    }
    setStats(res.stats ?? null);
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load tournaments")
      )
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to refresh")
      )
      .finally(() => setRefreshing(false));
  }, [load]);

  const tournamentsPlayed = Number(
    overview?.tournamentsPlayed ?? overview?.totalTournaments ?? 0
  );
  const tournamentsWon = Number(
    overview?.tournamentsWon ?? overview?.tournamentWins ?? 0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading ? (
        <Text style={styles.loadingText}>Loading tournaments…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !stats ? (
        <Text style={styles.emptyText}>No tournament stats available.</Text>
      ) : (
        <>
          <View style={styles.overviewBar}>
            <Text style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{tournamentsPlayed}</Text>
              {" played"}
            </Text>
            <Text style={styles.overviewDivider}>·</Text>
            <Text style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, styles.overviewStatWin]}>
                {tournamentsWon}
              </Text>
              {" won"}
            </Text>
            <Text style={styles.overviewDivider}>·</Text>
            <Text style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, styles.overviewStatPodium]}>
                {Number(overview?.podiumFinishes ?? 0)}
              </Text>
              {" podiums"}
            </Text>
            <Text style={styles.overviewDivider}>·</Text>
            <Text style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>
                {Number(overview?.totalMatches ?? 0)}
              </Text>
              {" matches"}
            </Text>
          </View>

          {tournaments.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5
                name="trophy"
                size={28}
                color={DesignTokens.colors.text.tertiary}
              />
              <Text style={styles.emptyTitle}>No tournaments yet</Text>
              <Text style={styles.emptyText}>
                Tournament appearances will show up here after you join and play.
              </Text>
            </View>
          ) : (
            tournaments.map((entry, idx) => {
              const tObj = getTournamentInfo(entry);
              const entryStats = entry?.stats;
              const tournamentId = String(tObj?._id ?? idx);
              const placement = formatPosition(entryStats?.position);
              const format = formatLabel(tObj?.format);
              const category = formatLabel(tObj?.category);
              const status = formatLabel(tObj?.status);
              const meta = [format, category, status].filter(Boolean).join(" • ");
              const record =
                entryStats?.matchesPlayed != null
                  ? `${entryStats.wins ?? 0}W – ${entryStats.losses ?? 0}L`
                  : null;

              return (
                <TouchableOpacity
                  key={tournamentId}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (tObj?._id) {
                      router.push(`/tournaments/${tObj._id}`);
                    }
                  }}
                >
                  <Card mode="contained" style={styles.tournamentCard}>
                    <Card.Content style={styles.tournamentCardContent}>
                      <View style={styles.tournamentHeader}>
                        <View style={styles.tournamentIcon}>
                          <FontAwesome5
                            name="trophy"
                            size={14}
                            color={
                              placement === "Champion"
                                ? "#d97706"
                                : DesignTokens.colors.primary[600]
                            }
                          />
                        </View>
                        <View style={styles.tournamentInfo}>
                          <Text style={styles.tournamentName} numberOfLines={2}>
                            {tObj?.name || "Tournament"}
                          </Text>
                          {meta ? (
                            <Text style={styles.tournamentMeta}>{meta}</Text>
                          ) : null}
                        </View>
                        {placement ? (
                          <View
                            style={[
                              styles.placementBadge,
                              placement === "Champion" && styles.placementBadgeGold,
                            ]}
                          >
                            <Text
                              style={[
                                styles.placementText,
                                placement === "Champion" && styles.placementTextGold,
                              ]}
                            >
                              {placement}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.tournamentFooter}>
                        {formatDate(tObj?.startDate) ? (
                          <Text style={styles.footerText}>
                            {formatDate(tObj?.startDate)}
                            {tObj?.city ? ` • ${tObj.city}` : ""}
                          </Text>
                        ) : tObj?.city ? (
                          <Text style={styles.footerText}>{tObj.city}</Text>
                        ) : null}
                        {record ? (
                          <Text style={styles.footerRecord}>{record}</Text>
                        ) : null}
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })
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
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
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
  overviewStatWin: {
    color: DesignTokens.colors.background.buttons.darkYellow,
  },
  overviewStatPodium: {
    color: DesignTokens.colors.status.ready,
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
  tournamentCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    marginBottom: DesignTokens.spacing[2],
  },
  tournamentCardContent: {
    gap: DesignTokens.spacing[3],
  },
  tournamentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignTokens.spacing[3],
  },
  tournamentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  tournamentInfo: {
    flex: 1,
    minWidth: 0,
  },
  tournamentName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  tournamentMeta: {
    marginTop: 2,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "capitalize",
  },
  placementBadge: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  placementBadgeGold: {
    backgroundColor: "#fef3c7",
  },
  placementText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  placementTextGold: {
    color: "#b45309",
  },
  tournamentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  footerText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  footerRecord: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
});
