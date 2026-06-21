import { IndividualMatch } from "@/types/match.type";
import { StyleSheet, Text, View } from "react-native";
import { getScoringIds, gamePointsByTeamIndex } from "@/lib/match/singlesClient";

interface Props {
  match: IndividualMatch;
}

export default function GamesHistory({ match }: Props) {
  if (!match.games?.length) return null;
  const scoringIds = getScoringIds(match);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Scores</Text>
      <View style={styles.gamesContainer}>
        {match.games.map((g: any) => {
          const side1Won = g.winnerSide === "side1";
          const side2Won = g.winnerSide === "side2";

          return (
            <View key={g.gameNumber} style={styles.gameRow}>
              <Text style={styles.gameLabel}>Game {g.gameNumber}</Text>
              <View style={styles.scoreContainer}>
                <Text
                  style={[
                    styles.score,
                    side1Won && styles.winnerScore,
                    !side1Won && !side2Won && styles.defaultScore,
                  ]}
                >
                  {gamePointsByTeamIndex(
                    g,
                    scoringIds?.[0] ?? null,
                    scoringIds?.[1] ?? null
                  )[0]}
                </Text>
                <Text style={styles.scoreDivider}>-</Text>
                <Text
                  style={[
                    styles.score,
                    side2Won && styles.winnerScore,
                    !side1Won && !side2Won && styles.defaultScore,
                  ]}
                >
                  {gamePointsByTeamIndex(
                    g,
                    scoringIds?.[0] ?? null,
                    scoringIds?.[1] ?? null
                  )[1]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  gamesContainer: {
    gap: 8,
    padding: 8,
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  gameLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  score: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 24,
    textAlign: "center",
  },
  defaultScore: {
    color: "#374151",
  },
  winnerScore: {
    color: "#10b981",
  },
  scoreDivider: {
    fontSize: 14,
    color: "#9ca3af",
  },
});

