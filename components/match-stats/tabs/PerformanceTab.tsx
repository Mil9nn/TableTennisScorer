import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { InsightCard } from "@/components/match-stats/InsightCard";
import { ServeReceiveChart } from "@/components/match-stats/ServeReceiveChart";
import { ShotTypeChart } from "@/components/match-stats/ShotTypeChart";
import { GameProgressionChart } from "@/components/match-stats/GameProgressionChart";
import { HighlightedNarrativeLine } from "@/components/match-stats/HighlightedNarrativeLine";
import type { MatchStatsData } from "@/hooks/useMatchStatsData";
import { DesignTokens } from "@/constants/designTokens";

interface PerformanceTabProps {
  data: MatchStatsData;
}

const tokens = DesignTokens;

export function PerformanceTab({ data }: PerformanceTabProps) {
  const showProgression =
    data.kind === "team"
      ? (data.subMatchDetails?.length ?? 0) > 1
      : data.games.length > 1;

  const playerNames = useMemo(
    () => [data.side1Name, data.side2Name].filter(Boolean),
    [data.side1Name, data.side2Name]
  );

  return (
    <View style={styles.container}>
      <View style={styles.narrativeCard}>
        <Text style={styles.narrativeTitle}>Match Summary</Text>
        {data.analytics.summary.map((line, idx) => (
          <HighlightedNarrativeLine
            key={idx}
            line={line}
            playerNames={playerNames}
          />
        ))}
      </View>

      {data.insights.length > 0 && (
        <View style={styles.insightsGrid}>
          {data.insights.map((insight, i) => (
            <InsightCard
              key={i}
              type={insight.type}
              headline={insight.headline}
              description={insight.description}
              metric={insight.metric}
              delay={i * 0.05}
            />
          ))}
        </View>
      )}

      <View style={styles.serveEfficiencyCard}>
        <Text style={styles.serveEfficiencyTitle}>Serve Turn Efficiency</Text>
        <View style={styles.serveEfficiencyRow}>
          <View style={styles.serveEfficiencyCol}>
            <Text style={styles.serveEfficiencyName}>{data.side1Name}</Text>
            <Text style={styles.serveEfficiencyValue}>
              {data.analytics.serveTurn.turnEfficiencyPct.side1}%
            </Text>
            <Text style={styles.serveEfficiencySub}>
              {data.analytics.serveTurn.avgPointsPerTurn.side1} pts/turn
            </Text>
          </View>
          <View style={styles.serveEfficiencyDivider} />
          <View style={styles.serveEfficiencyCol}>
            <Text style={styles.serveEfficiencyName}>{data.side2Name}</Text>
            <Text style={styles.serveEfficiencyValue}>
              {data.analytics.serveTurn.turnEfficiencyPct.side2}%
            </Text>
            <Text style={styles.serveEfficiencySub}>
              {data.analytics.serveTurn.avgPointsPerTurn.side2} pts/turn
            </Text>
          </View>
        </View>
      </View>

      {data.shots.length > 0 && <ServeReceiveChart data={data.serveData} />}
      {data.strokeData.length > 0 && <ShotTypeChart data={data.strokeData} />}
      {showProgression && (
        <GameProgressionChart
          data={data.gameProgressionData}
          side1Name={data.side1Name}
          side2Name={data.side2Name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.secondary,
    gap: tokens.spacing[6],
  },
  narrativeCard: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  narrativeTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  insightsGrid: {
    gap: 10,
  },
  serveEfficiencyCard: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  serveEfficiencyTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  serveEfficiencyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: tokens.colors.background.primary,
  },
  serveEfficiencyCol: {
    flex: 1,
    gap: 2,
  },
  serveEfficiencyDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#e5e7eb",
    marginHorizontal: 10,
  },
  serveEfficiencyName: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  serveEfficiencyValue: {
    fontSize: tokens.typography.fontSize["xl"],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  serveEfficiencySub: {
    fontSize: 11,
    color: "#6b7280",
  },
});
