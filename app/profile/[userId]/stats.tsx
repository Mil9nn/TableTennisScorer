import { fetchPlayerStats } from "@/lib/profile/api";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SceneRendererProps } from 'react-native-tab-view';
import { DesignTokens } from "@/constants/designTokens";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { LineChart } from "react-native-gifted-charts";
import { FontAwesome5 } from "@expo/vector-icons";

// Define styles outside the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
    ...DesignTokens.shadows.sm,
  },
  backButton: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing[4],
  },
  headerTitle: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    flex: 1,
  },
  tabContent: {
    padding: DesignTokens.spacing[6],
  },
  card: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[5],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[3],
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    flex: 1,
  },
  statsGrid: {
    gap: DesignTokens.spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing[8],
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    color: DesignTokens.colors.error,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userIdText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginBottom: DesignTokens.spacing[4],
    textAlign: 'center',
  },
  // Highlight cards styles
  highlightCard: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[3],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatStatsRow: {
    gap: DesignTokens.spacing[3],
  },
  formatCard: {
    backgroundColor: DesignTokens.colors.white,
    borderRadius: DesignTokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[3],
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    marginBottom: DesignTokens.spacing[3],
  },
  formatTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  formatStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatStat: {
    alignItems: 'center',
    flex: 1,
  },
  formatStatValue: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  formatStatLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.text.tertiary,
    marginTop: 2,
  },
  formatWinRate: {
    marginTop: DesignTokens.spacing[3],
    paddingTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border.light,
  },
  formatWinRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[2],
  },
  formatWinRateLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.text.tertiary,
  },
  formatWinRateValue: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  formatProgressBar: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
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
  progressBarFilled: {
    height: '100%',
    backgroundColor: DesignTokens.colors.success,
    borderRadius: 3,
  },
  progressBarRemaining: {
    height: '100%',
    backgroundColor: DesignTokens.colors.error,
    borderRadius: 3,
  },
  // Highlight section styles
  highlightSection: {
    marginBottom: DesignTokens.spacing[6],
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
  // Trends tab styles
  trendDescription: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[4],
    fontStyle: 'italic',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: DesignTokens.spacing[3],
  },
  accuracyValue: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    minWidth: 50,
    textAlign: 'right',
  },
  // Chart styles
  chartContainer: {
    marginVertical: DesignTokens.spacing[4],
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default function ProfileStatsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(0);

  const summary = useMemo(() => {
    const singles = data?.singlesDoubles?.singles;
    const doubles = data?.singlesDoubles?.doubles;
    const server = data?.server;
    const highlights = data?.highlights;
    const metrics = data?.metrics;
    return {
      singles: singles
        ? {
            wins: Number(singles.wins ?? 0),
            losses: Number(singles.losses ?? 0),
            setsWon: Number(singles.setsWon ?? 0),
            setsLost: Number(singles.setsLost ?? 0),
          }
        : null,
      doubles: doubles
        ? {
            wins: Number(doubles.wins ?? 0),
            losses: Number(doubles.losses ?? 0),
            setsWon: Number(doubles.setsWon ?? 0),
            setsLost: Number(doubles.setsLost ?? 0),
          }
        : null,
      server: server
        ? {
            totalServes: Number(server.totalServes ?? 0),
            pointsWonOnServe: Number(server.pointsWonOnServe ?? 0),
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
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to refresh"))
      .finally(() => setRefreshing(false));
  }, [load]);

  // Tab configuration
  const tabRoutes: TabRoute[] = [
    {
      key: 'overall',
      title: 'Overall',
      icon: 'chart-pie',
    },
    {
      key: 'trends',
      title: 'Trends',
      icon: 'chart-line',
    },
  ];

  const StatCard = ({ 
    title, 
    icon, 
    iconColor, 
    children, 
    hasData = true 
  }: { 
    title: string; 
    icon: string; 
    iconColor: string; 
    children: React.ReactNode; 
    hasData?: boolean;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: iconColor + '20' }]}>
          <FontAwesome5 name={icon} size={14} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {hasData ? children : (
        <Text style={styles.emptyText}>No data available.</Text>
      )}
    </View>
  );

  const HighlightCard = ({ title, value, subtitle, icon, color, trend }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <View style={styles.highlightCard}>
      <View style={styles.highlightIcon}>
        <FontAwesome5 name={icon} size={16} color={color} />
      </View>
      <View style={styles.highlightContent}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightValue}>{value}</Text>
        {subtitle && <Text style={styles.highlightSubtitle}>{subtitle}</Text>}
      </View>
      {trend && (
        <View style={styles.trendIndicator}>
          <FontAwesome5 
            name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus'} 
            size={12} 
            color={trend === 'up' ? DesignTokens.colors.success : trend === 'down' ? DesignTokens.colors.error : DesignTokens.colors.text.tertiary}
          />
        </View>
      )}
    </View>
  );

  const FormatStatsCard = ({
    title,
    icon,
    iconColor,
    stats,
  }: {
    title: string;
    icon: string;
    iconColor: string;
    stats: { wins: number; losses: number; setsWon: number; setsLost: number };
  }) => {
    const totalMatches = stats.wins + stats.losses;
    const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 100) : 0;

    return (
      <View style={styles.formatCard}>
        <View style={styles.formatHeader}>
          <FontAwesome5 name={icon} size={11} color={iconColor} />
          <Text style={styles.formatTitle}>{title}</Text>
        </View>
        <View style={styles.formatStatsGrid}>
          <View style={styles.formatStat}>
            <Text style={styles.formatStatValue}>{stats.wins}</Text>
            <Text style={styles.formatStatLabel}>Wins</Text>
          </View>
          <View style={styles.formatStat}>
            <Text style={styles.formatStatValue}>{stats.losses}</Text>
            <Text style={styles.formatStatLabel}>Losses</Text>
          </View>
          <View style={styles.formatStat}>
            <Text style={styles.formatStatValue}>{stats.setsWon}</Text>
            <Text style={styles.formatStatLabel}>Sets W</Text>
          </View>
          <View style={styles.formatStat}>
            <Text style={styles.formatStatValue}>{stats.setsLost}</Text>
            <Text style={styles.formatStatLabel}>Sets L</Text>
          </View>
        </View>
        <View style={styles.formatWinRate}>
          <View style={styles.formatWinRateHeader}>
            <Text style={styles.formatWinRateLabel}>Win rate</Text>
            <Text style={styles.formatWinRateValue}>{winRate}%</Text>
          </View>
          <View style={styles.formatProgressBar}>
            <View style={[styles.progressBarFilled, { width: `${winRate}%` }]} />
            <View style={[styles.progressBarRemaining, { width: `${100 - winRate}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  // Overall Tab Content
  const OverallTab = ({ route }: SceneRendererProps & { route: TabRoute }) => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.userIdText}>UserId: {resolvedUserId}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statistics…</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No statistics available.</Text>
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {/* Highlights Section */}
          {summary.highlights && (
            <View style={styles.highlightSection}>
              <Text style={styles.sectionTitle}>Performance Highlights</Text>
              <View style={styles.highlightGrid}>
                <HighlightCard
                  title="Overall Win Rate"
                  value={`${summary.highlights.overallWinRate}%`}
                  subtitle={`${summary.metrics?.totalWins || 0}W / ${summary.metrics?.totalLosses || 0}L`}
                  icon="trophy"
                  color={DesignTokens.colors.primary[600]}
                  trend={parseFloat(summary.highlights.overallWinRate) > 50 ? 'up' : parseFloat(summary.highlights.overallWinRate) < 50 ? 'down' : 'neutral'}
                />
                <HighlightCard
                  title="Current Win Streak"
                  value={String(summary.highlights.currentWinStreak)}
                  subtitle="Matches"
                  icon="fire"
                  color={summary.highlights.currentWinStreak > 0 ? DesignTokens.colors.success : DesignTokens.colors.text.tertiary}
                  trend={summary.highlights.currentWinStreak > 2 ? 'up' : 'neutral'}
                />
                <HighlightCard
                  title="Best Win Streak"
                  value={String(summary.highlights.bestWinStreak)}
                  subtitle="All time"
                  icon="star"
                  color={DesignTokens.colors.warning}
                />
                <HighlightCard
                  title="Serve Accuracy"
                  value={`${summary.highlights.serveAccuracy}%`}
                  subtitle="Points won on serve"
                  icon="bullseye"
                  color={DesignTokens.colors.info}
                  trend={parseFloat(summary.highlights.serveAccuracy) > 60 ? 'up' : parseFloat(summary.highlights.serveAccuracy) < 40 ? 'down' : 'neutral'}
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
          )}

          {(summary.singles || summary.doubles) ? (
            <View style={styles.formatStatsRow}>
              {summary.singles ? (
                <FormatStatsCard
                  title="Singles"
                  icon="user"
                  iconColor={DesignTokens.colors.info}
                  stats={summary.singles}
                />
              ) : null}
              {summary.doubles ? (
                <FormatStatsCard
                  title="Doubles"
                  icon="users"
                  iconColor={DesignTokens.colors.success}
                  stats={summary.doubles}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );

  // Trends Tab Content
  const TrendsTab = ({ route }: SceneRendererProps & { route: TabRoute }) => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trends…</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No trend data available.</Text>
        </View>
      ) : summary.trends ? (
        <View style={styles.statsGrid}>
          {/* Match Points Trend */}
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
                  data={summary.trends.matchPoints.slice(-10).map((match: any, index: number) => ({
                    value: match.scored,
                    label: match.match,
                  }))}
                  data2={summary.trends.matchPoints.slice(-10).map((match: any, index: number) => ({
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
                  yAxisTextStyle={{ color: DesignTokens.colors.text.secondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: DesignTokens.colors.text.tertiary, fontSize: 10 }}
                  startFillColor={DesignTokens.colors.success + '20'}
                  endFillColor={DesignTokens.colors.success + '05'}
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
                    <View style={[styles.legendDot, { backgroundColor: DesignTokens.colors.success }]} />
                    <Text style={styles.legendText}>Points Scored</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: DesignTokens.colors.error }]} />
                    <Text style={styles.legendText}>Points Conceded</Text>
                  </View>
                </View>
              </View>
            </>
          </StatCard>

          {/* Serve Accuracy Trend */}
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
                  data={summary.trends.serveAccuracy.slice(-10).map((match: any, index: number) => ({
                    value: parseFloat(match.accuracy.toFixed(1)),
                    label: match.match,
                  }))}
                  width={300}
                  height={200}
                  color={DesignTokens.colors.info}
                  thickness={2}
                  isAnimated
                  animationDuration={800}
                  yAxisTextStyle={{ color: DesignTokens.colors.text.secondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: DesignTokens.colors.text.tertiary, fontSize: 10 }}
                  startFillColor={DesignTokens.colors.info + '20'}
                  endFillColor={DesignTokens.colors.info + '05'}
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
                    <View style={[styles.legendDot, { backgroundColor: DesignTokens.colors.info }]} />
                    <Text style={styles.legendText}>Serve Accuracy %</Text>
                  </View>
                </View>
              </View>
            </>
          </StatCard>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No trend data available.</Text>
        </View>
      )}
    </ScrollView>
  );

  // Render scene based on route
  const renderScene = (props: SceneRendererProps & { route: TabRoute }) => {
    switch (props.route.key) {
      case 'overall':
        return <OverallTab {...props} />;
      case 'trends':
        return <TrendsTab {...props} />;
      default:
        return <OverallTab {...props} />;
    }
  };
  return (
    <View style={styles.container}>
      <TournamentTabView
        routes={tabRoutes}
        index={tabIndex}
        onIndexChange={setTabIndex}
        renderScene={renderScene}
        swipeEnabled={true}
        animationEnabled={true}
        lazy={false}
      />
    </View>
  );
}
