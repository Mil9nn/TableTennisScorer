import React from "react";
import { View, StyleSheet } from "react-native";
import { MatchSummary } from "@/components/match-stats/MatchSummary";
import { ShotCommentarySection } from "@/components/match-stats/ShotCommentarySection";
import GamesHistory from "@/components/live-scorer/common/GamesHistory";
import type { MatchStatsData } from "@/hooks/useMatchStatsData";

interface OverviewTabProps {
  data: MatchStatsData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const sequentialGameNumbers = data.kind === "team";

  return (
    <View style={styles.container}>
      <MatchSummary
        side1Name={data.side1Name}
        side2Name={data.side2Name}
        side1Sets={data.side1Sets}
        side2Sets={data.side2Sets}
        side1AvatarUri={data.side1AvatarUri}
        side2AvatarUri={data.side2AvatarUri}
      />

      <GamesHistory
        games={data.games}
        participants={data.participants}
        scoringIds={data.scoringIds}
        side1Label={data.side1Name}
        side2Label={data.side2Name}
        winnerSide={
          data.winnerSide === "side1" ||
          data.winnerSide === "side2" ||
          data.winnerSide === "team1" ||
          data.winnerSide === "team2"
            ? data.winnerSide
            : undefined
        }
        emphasizeGameWinners
        sequentialGameNumbers={sequentialGameNumbers}
      />

      <ShotCommentarySection
        games={data.games}
        participants={data.participants}
        finalScore={data.finalScoreForShotFeed}
        serverConfig={data.serverConfig}
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
});
