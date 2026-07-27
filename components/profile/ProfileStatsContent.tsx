import { DesignTokens } from "@/constants/designTokens";
import { useThemeColors } from "@/hooks/useThemeColors";
import { fetchPlayerStats } from "@/lib/profile/api";
import { FontAwesome5 } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { LineChart } from "react-native-gifted-charts";

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  content: {
    paddingBottom: DesignTokens.spacing[10],
    gap: 0,
  },
  card: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[5],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    marginHorizontal: DesignTokens.spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[3],
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    flex: 1,
  },
  loadingContainer: {
    padding: DesignTokens.spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    textAlign: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
    fontStyle: "italic",
  },
  highlightCard: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[3],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    flexDirection: "row",
    alignItems: "center",
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DesignTokens.spacing[3],
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[1],
  },
  highlightValue: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  highlightSubtitle: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.text.tertiary,
    marginTop: DesignTokens.spacing[1],
  },
  trendIndicator: {
    padding: DesignTokens.spacing[2],
  },
  highlightSection: {
    marginBottom: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[4],
    paddingTop: DesignTokens.spacing[4],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },
  highlightGrid: {
    gap: DesignTokens.spacing[3],
  },
  trendsSection: {
    paddingTop: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[4],
  },
  trendsTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    paddingHorizontal: DesignTokens.spacing[4],
  },
  trendDescription: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[4],
    fontStyle: "italic",
  },
  chartContainer: {
    marginVertical: DesignTokens.spacing[4],
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignTokens.spacing[2],
  },
  legendText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
  },
});

type FormatStats = {
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
};

function HighlightCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  style,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: "up" | "down" | "neutral";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.highlightCard, style]}>
      <View style={styles.highlightIcon}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <View style={styles.highlightContent}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightValue}>{value}</Text>
        {subtitle ? (
          <Text style={styles.highlightSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {trend ? (
        <View style={styles.trendIndicator}>
          <FontAwesome5
            name={
              trend === "up"
                ? "arrow-up"
                : trend === "down"
                  ? "arrow-down"
                  : "minus"
            }
            size={12}
            color={
              trend === "up"
                ? DesignTokens.colors.success
                : trend === "down"
                  ? DesignTokens.colors.error
                  : DesignTokens.colors.text.tertiary
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function FormatStatsSection({
  title,
  stats,
}: {
  title: string;
  stats: FormatStats;
}) {
  const theme = useThemeColors();
  const totalMatches = stats.wins + stats.losses;
  const winRate =
    totalMatches > 0 ? `${Math.round((stats.wins / totalMatches) * 100)}%` : "—";

  const sectionStyles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          minHeight: 44,
        },
        headerTitle: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        cell: {
          width: "25%",
          minHeight: 72,
          backgroundColor: theme.colors.background.secondary,
          borderBottomWidth: 1,
          borderRightWidth: 1,
          borderColor: theme.colors.border.light,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[1],
          justifyContent: "center",
          alignItems: "center",
        },
        cellLastCol: {
          borderRightWidth: 0,
        },
        value: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
        },
        label: {
          marginTop: 2,
          fontSize: 9,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: "uppercase",
          letterSpacing: 0.3,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const cells: Array<{ label: string; value: string; color?: string }> = [
    {
      label: "Wins",
      value: String(stats.wins),
      color: theme.colors.success,
    },
    {
      label: "Losses",
      value: String(stats.losses),
      color: theme.colors.error,
    },
    {
      label: "Sets Won",
      value: String(stats.setsWon),
    },
    {
      label: "Sets Lost",
      value: String(stats.setsLost),
    },
    {
      label: "Pts Won",
      value: String(stats.pointsWon),
    },
    {
      label: "Pts Lost",
      value: String(stats.pointsLost),
    },
    {
      label: "Win Rate",
      value: winRate,
    },
    {
      label: "Matches",
      value: String(totalMatches),
    },
  ];

  return (
    <View style={sectionStyles.section}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.headerTitle}>{title}</Text>
      </View>
      <View style={sectionStyles.grid}>
        {cells.map((cell, index) => {
          const isLastCol = (index + 1) % 4 === 0;
          return (
            <View
              key={cell.label}
              style={[
                sectionStyles.cell,
                isLastCol && sectionStyles.cellLastCol,
              ]}
              accessibilityLabel={`${cell.label} ${cell.value}`}
            >
              <Text
                style={[
                  sectionStyles.value,
                  cell.color ? { color: cell.color } : null,
                ]}
              >
                {cell.value}
              </Text>
              <Text style={sectionStyles.label}>{cell.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StatCard({
  title,
  icon,
  iconColor,
  children,
  hasData = true,
}: {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
  hasData?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: iconColor + "20" }]}>
          <FontAwesome5 name={icon} size={14} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {hasData ? children : <Text style={styles.emptyText}>No data available.</Text>}
    </View>
  );
}

type Props = {
  userId: string;
  /** When false, wait until enabled before fetching (lazy tab). */
  enabled?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ProfileStatsContent({
  userId,
  enabled = true,
  contentContainerStyle,
}: Props) {
  const resolvedUserId = String(userId ?? "");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const summary = useMemo(() => {
    const singles = data?.singlesDoubles?.singles;
    const doubles = data?.singlesDoubles?.doubles;
    const highlights = data?.highlights;
    const metrics = data?.metrics;
    return {
      singles: singles
        ? {
            wins: Number(singles.wins ?? 0),
            losses: Number(singles.losses ?? 0),
            setsWon: Number(singles.setsWon ?? 0),
            setsLost: Number(singles.setsLost ?? 0),
            pointsWon: Number(singles.pointsWon ?? 0),
            pointsLost: Number(singles.pointsLost ?? 0),
          }
        : null,
      doubles: doubles
        ? {
            wins: Number(doubles.wins ?? 0),
            losses: Number(doubles.losses ?? 0),
            setsWon: Number(doubles.setsWon ?? 0),
            setsLost: Number(doubles.setsLost ?? 0),
            pointsWon: Number(doubles.pointsWon ?? 0),
            pointsLost: Number(doubles.pointsLost ?? 0),
          }
        : null,
      highlights: highlights || null,
      metrics: metrics || null,
      trends: data?.trends || null,
    };
  }, [data]);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    const res = await fetchPlayerStats(resolvedUserId);
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load stats");
    }
    setData(res.data ?? null);
    setHasLoadedOnce(true);
  }, [resolvedUserId]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load stats"),
      )
      .finally(() => setLoading(false));
  }, [enabled, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to refresh"),
      )
      .finally(() => setRefreshing(false));
  }, [load]);

  if (!enabled && !hasLoadedOnce) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Open Stats to load…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statistics…</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No statistics available.</Text>
        </View>
      ) : (
        <>
          {summary.singles || summary.doubles ? (
            <>
              {summary.singles ? (
                <FormatStatsSection title="Singles" stats={summary.singles} />
              ) : null}
              {summary.doubles ? (
                <FormatStatsSection title="Doubles" stats={summary.doubles} />
              ) : null}
            </>
          ) : null}

          {summary.trends ? (
            <View style={styles.trendsSection}>
              <Text style={styles.trendsTitle}>Trends</Text>
              <StatCard
                title="Match Points Trend"
                icon="chart-line"
                iconColor={DesignTokens.colors.info}
                hasData={!!summary.trends.matchPoints?.length}
              >
                <>
                  <Text style={styles.trendDescription}>
                    Points scored vs conceded over last 20 matches
                  </Text>
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={summary.trends.matchPoints
                        .slice(-10)
                        .map((match: any) => ({
                          value: match.scored,
                          label: match.match,
                        }))}
                      data2={summary.trends.matchPoints
                        .slice(-10)
                        .map((match: any) => ({
                          value: match.conceded,
                          label: match.match,
                        }))}
                      width={300}
                      height={200}
                      color1={DesignTokens.colors.success}
                      color2={DesignTokens.colors.error}
                      thickness={2}
                      isAnimated
                      animationDuration={800}
                      yAxisTextStyle={{
                        color: DesignTokens.colors.text.secondary,
                        fontSize: 10,
                      }}
                      xAxisLabelTextStyle={{
                        color: DesignTokens.colors.text.tertiary,
                        fontSize: 10,
                      }}
                      startFillColor={DesignTokens.colors.success + "20"}
                      endFillColor={DesignTokens.colors.success + "05"}
                      startOpacity={0.8}
                      endOpacity={0.3}
                      spacing={30}
                      backgroundColor={DesignTokens.colors.white}
                      noOfSections={4}
                      rulesColor={DesignTokens.colors.border.light}
                      rulesType="solid"
                      yAxisThickness={1}
                      xAxisThickness={1}
                    />
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: DesignTokens.colors.success },
                          ]}
                        />
                        <Text style={styles.legendText}>Points Scored</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: DesignTokens.colors.error },
                          ]}
                        />
                        <Text style={styles.legendText}>Points Conceded</Text>
                      </View>
                    </View>
                  </View>
                </>
              </StatCard>

              <StatCard
                title="Serve Accuracy Trend"
                icon="bullseye"
                iconColor={DesignTokens.colors.success}
                hasData={!!summary.trends.serveAccuracy?.length}
              >
                <>
                  <Text style={styles.trendDescription}>
                    Serve accuracy percentage over last 20 matches
                  </Text>
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={summary.trends.serveAccuracy
                        .slice(-10)
                        .map((match: any) => ({
                          value: parseFloat(Number(match.accuracy).toFixed(1)),
                          label: match.match,
                        }))}
                      width={300}
                      height={200}
                      color={DesignTokens.colors.info}
                      thickness={2}
                      isAnimated
                      animationDuration={800}
                      yAxisTextStyle={{
                        color: DesignTokens.colors.text.secondary,
                        fontSize: 10,
                      }}
                      xAxisLabelTextStyle={{
                        color: DesignTokens.colors.text.tertiary,
                        fontSize: 10,
                      }}
                      startFillColor={DesignTokens.colors.info + "20"}
                      endFillColor={DesignTokens.colors.info + "05"}
                      startOpacity={0.8}
                      endOpacity={0.3}
                      spacing={30}
                      backgroundColor={DesignTokens.colors.white}
                      noOfSections={4}
                      rulesColor={DesignTokens.colors.border.light}
                      rulesType="solid"
                      yAxisThickness={1}
                      xAxisThickness={1}
                      maxValue={100}
                    />
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: DesignTokens.colors.info },
                          ]}
                        />
                        <Text style={styles.legendText}>Serve Accuracy %</Text>
                      </View>
                    </View>
                  </View>
                </>
              </StatCard>
            </View>
          ) : null}

          {summary.highlights ? (
            <View style={styles.highlightSection}>
              <Text style={styles.sectionTitle}>Performance</Text>
              <View style={styles.highlightGrid}>
                <HighlightCard
                  title="Serve Accuracy"
                  value={`${summary.highlights.serveAccuracy}%`}
                  subtitle="Points won on serve"
                  icon="bullseye"
                  color={DesignTokens.colors.info}
                  trend={
                    parseFloat(summary.highlights.serveAccuracy) > 60
                      ? "up"
                      : parseFloat(summary.highlights.serveAccuracy) < 40
                        ? "down"
                        : "neutral"
                  }
                />
                <HighlightCard
                  title="Avg Points/Match"
                  value={summary.highlights.avgPointsPerMatch}
                  subtitle="Points scored"
                  icon="chart-bar"
                  color={DesignTokens.colors.success}
                />
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
