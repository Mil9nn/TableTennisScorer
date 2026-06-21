import React from "react";
import { View } from "react-native";
import type { IndividualGame, InitialServerConfig, Participant } from "@/types/match.type";
import ShotFeed from "@/components/live-scorer/common/ShotFeed";
import { DesignTokens } from "@/constants/designTokens";

interface GameByGameBreakdownProps {
  games: IndividualGame[];
  side1Name: string;
  side2Name: string;
  participants?: Participant[];
  /** Resolves scoresById to left/right when scoresByTeam is absent. */
  scoringIds: [string, string] | null;
  finalScore?: { setsByTeam?: number[]; setsById?: Record<string, number> };
  serverConfig?: InitialServerConfig | null;
  /** When false, shot feed is omitted (e.g. shown on Overview tab). */
  showShotFeed?: boolean;
}

export function GameByGameBreakdown({
  games,
  participants,
  finalScore,
  serverConfig,
  showShotFeed = true,
}: GameByGameBreakdownProps) {
  const totalSetsByTeam = finalScore?.setsByTeam || [0, 0];
  const shotFeedFinalScore = {
    side1Sets: totalSetsByTeam[0] ?? 0,
    side2Sets: totalSetsByTeam[1] ?? 0,
  };
  const hasShots = games.some((g) => (g.shots?.length ?? 0) > 0);
  const lastGameNumber = games[games.length - 1]?.gameNumber ?? 1;

  if (!showShotFeed || !hasShots) {
    return null;
  }

  return (
    <View>
        <ShotFeed
              games={games}
              currentGame={lastGameNumber}
              participants={participants ?? []}
              finalScore={shotFeedFinalScore}
              serverConfig={serverConfig}
              defaultExpandedGames={[]}
              showInProgressIndicator={false}
              embedded
            />
    </View>
  );
}

