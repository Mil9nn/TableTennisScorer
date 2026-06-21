import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GameByGameBreakdown } from "@/components/match-stats/GameByGameBreakdown";
import { PlayerShotAnalysis } from "@/components/match-stats/PlayerShotAnalysis";
import { MatchWeaknessesSection } from "@/components/weaknesses-analysis/MatchWeaknessesSection";
import type { MatchStatsData } from "@/hooks/useMatchStatsData";

interface DetailsTabProps {
  data: MatchStatsData;
}

export function DetailsTab({ data }: DetailsTabProps) {
  if (data.kind === "team" && data.subMatchDetails) {
    return (
      <View style={styles.container}>
        {data.subMatchDetails.map((subMatch) => (
          <View key={subMatch.index} style={styles.subMatchCard}>
            <View style={styles.subMatchHeader}>
              <Text style={styles.subMatchTitle}>
                Match {subMatch.matchNumber}: {subMatch.player1Label} vs{" "}
                {subMatch.player2Label}
              </Text>
              <Text style={styles.subMatchScore}>
                {subMatch.team1Sets} - {subMatch.team2Sets}
              </Text>
            </View>
            {subMatch.winnerSide && (
              <Text style={styles.subMatchWinner}>
                ({subMatch.winnerSide === "team1" ? data.side1Name : data.side2Name} won)
              </Text>
            )}
            <GameByGameBreakdown
              games={subMatch.games}
              side1Name={subMatch.player1Label}
              side2Name={subMatch.player2Label}
              participants={subMatch.participants}
              scoringIds={subMatch.scoringIds}
              finalScore={{
                setsByTeam: [subMatch.team1Sets, subMatch.team2Sets],
              }}
              serverConfig={subMatch.serverConfig}
              showShotFeed={false}
            />
          </View>
        ))}
        {data.playerPieData.length > 0 && (
          <PlayerShotAnalysis playerPieData={data.playerPieData} />
        )}
        <MatchWeaknessesSection
          matchId={data.matchId}
          category="team"
          hideWhenUnavailable
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameByGameBreakdown
        games={data.games}
        side1Name={data.side1Name}
        side2Name={data.side2Name}
        participants={data.participants}
        scoringIds={data.scoringIds}
        finalScore={{ setsByTeam: [data.side1Sets, data.side2Sets] }}
        serverConfig={data.serverConfig}
        showShotFeed={false}
      />
      {data.playerPieData.length > 0 && (
        <PlayerShotAnalysis playerPieData={data.playerPieData} />
      )}
      <MatchWeaknessesSection
        matchId={data.matchId}
        category={data.category}
        hideWhenUnavailable
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: "#f8fafc",
  },
  subMatchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  subMatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subMatchTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  subMatchScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  subMatchWinner: {
    fontSize: 13,
    color: "#2563eb",
    marginBottom: 8,
  },
});
