import { StyleSheet, Text, View } from "react-native";
import { IndividualGame, Participant } from "@/types/match.type";
import { gamePointsByTeamIndex } from "@/lib/match/singlesClient";
import { getFirstName } from "@/lib/utils";
import { DesignTokens } from "@/constants/designTokens";

interface GamesHistoryProps {
  games: IndividualGame[];
  currentGame?: number;
  participants?: Participant[];
  /** When provided (including null), overrides participant-derived scoring ids. */
  scoringIds?: [string, string] | null;
  /** Override column headers (doubles pairs, team names). */
  side1Label?: string;
  side2Label?: string;
  /** Show match winner footer on completed matches. */
  winnerSide?: "side1" | "side2" | "team1" | "team2";
  /** Highlight winning score per game row (stats overview). */
  emphasizeGameWinners?: boolean;
  /** Use 1-based row index instead of game.gameNumber (flattened multi-match lists). */
  sequentialGameNumbers?: boolean;
}

const tokens = DesignTokens;

function formatSideLabel(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Player";
  return trimmed
    .split("&")
    .map((part) => part.trim().split(/\s+/)[0] || "Player")
    .join(" & ");
}

function resolveColumnLabels(
  participants: Participant[] | undefined,
  side1Label?: string,
  side2Label?: string
): [string, string] {
  if (side1Label && side2Label) {
    return [formatSideLabel(side1Label), formatSideLabel(side2Label)];
  }

  const isDoubles = (participants?.length ?? 0) >= 4;
  const left = getFirstName(
    participants?.[0]?.fullName ?? participants?.[0]?.username,
    "Player 1"
  );
  const right = isDoubles
    ? getFirstName(
        participants?.[2]?.fullName ?? participants?.[2]?.username,
        "Player 2"
      )
    : getFirstName(
        participants?.[1]?.fullName ?? participants?.[1]?.username,
        "Player 2"
      );

  return [left, right];
}

function resolveScoringIds(
  participants: Participant[] | undefined,
  scoringIds?: [string, string] | null
): [string | null, string | null] {
  if (scoringIds !== undefined) {
    return [scoringIds?.[0] ?? null, scoringIds?.[1] ?? null];
  }

  const isDoubles = (participants?.length ?? 0) >= 4;
  return [
    participants?.[0]?._id?.toString() ?? null,
    isDoubles
      ? participants?.[2]?._id?.toString() ?? null
      : participants?.[1]?._id?.toString() ?? null,
  ];
}

export default function GamesHistory({
  games,
  currentGame,
  participants,
  scoringIds,
  side1Label,
  side2Label,
  winnerSide,
  emphasizeGameWinners = false,
  sequentialGameNumbers = false,
}: GamesHistoryProps) {
  if (!games || games.length === 0) return null;

  const [leftScoringId, rightScoringId] = resolveScoringIds(
    participants,
    scoringIds
  );
  const [leftPlayerName, rightPlayerName] = resolveColumnLabels(
    participants,
    side1Label,
    side2Label
  );

  const isTeamMatch = winnerSide === "team1" || winnerSide === "team2";
  const overallWinner = isTeamMatch
    ? winnerSide === "team1"
      ? "side1"
      : "side2"
    : winnerSide;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Games History</Text>

      {/* Header row with player names */}
      <View style={styles.headerRow}>
        <View style={styles.gameColumn}>
          <Text style={styles.headerText}>Game</Text>
        </View>
        <View style={styles.playerColumn}>
          <Text style={styles.headerText} numberOfLines={1}>
            {leftPlayerName}
          </Text>
        </View>
        <View style={styles.playerColumn}>
          <Text style={styles.headerText} numberOfLines={1}>
            {rightPlayerName}
          </Text>
        </View>
      </View>

      {/* Games rows */}
      <View style={styles.gamesContainer}>
        {games.map((game, idx) => {
          const isCurrentGame =
            currentGame != null &&
            game.gameNumber === currentGame &&
            !game.winnerSide;

          const [leftScore, rightScore] = gamePointsByTeamIndex(
            game,
            leftScoringId,
            rightScoringId
          );

          const side1Won = leftScore > rightScore;
          const side2Won = rightScore > leftScore;
          const displayGameNumber = sequentialGameNumbers
            ? idx + 1
            : game.gameNumber;

          return (
            <View
              key={`${displayGameNumber}-${idx}`}
              style={[
                styles.gameRow,
                isCurrentGame && styles.currentGameRow,
              ]}
            >
              <View style={styles.gameColumn}>
                <Text style={styles.gameNumber}>{displayGameNumber}</Text>
              </View>
              <View style={styles.playerColumn}>
                <Text
                  style={[
                    styles.score,
                    isCurrentGame && styles.currentGameScore,
                    emphasizeGameWinners &&
                      (side1Won
                        ? styles.winnerScore
                        : side2Won
                          ? styles.loserScore
                          : null),
                  ]}
                >
                  {leftScore}
                </Text>
              </View>
              <View style={styles.playerColumn}>
                <Text
                  style={[
                    styles.score,
                    isCurrentGame && styles.currentGameScore,
                    emphasizeGameWinners &&
                      (side2Won
                        ? styles.winnerScore
                        : side1Won
                          ? styles.loserScore
                          : null),
                  ]}
                >
                  {rightScore}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {overallWinner && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {overallWinner === "side1" ? leftPlayerName : rightPlayerName} won
            the match
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },
  headerRow: {
    flexDirection: "row",
  },
  gameColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  playerColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  headerText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },
  gamesContainer: {
    gap: tokens.spacing[4],
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },
  currentGameRow: {
    backgroundColor: tokens.colors.info + '30',
  },
  gameNumber: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },
  score: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },
  currentGameScore: {
    color: tokens.colors.text.primary,
  },
  winnerScore: {
    color: tokens.colors.info,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  loserScore: {
    color: tokens.colors.text.tertiary,
  },
  resultContainer: {
    marginTop: tokens.spacing[4],
    backgroundColor: tokens.colors.info + "10",
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    alignItems: "center",
  },
  resultText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.info,
  },
});

