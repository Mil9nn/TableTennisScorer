import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { IndividualMatch } from "@/types/match.type";
import { formatDate, formatTimeDuration } from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import { getSetScores } from "@/lib/match/singlesClient";

interface TournamentMatchCompletedCardProps {
  match: IndividualMatch;
  tournamentId: string;
  tournamentName?: string;
}

export default function TournamentMatchCompletedCard({
  match,
  tournamentId,
  tournamentName,
}: TournamentMatchCompletedCardProps) {
  const router = useRouter();

  const renderWinnerName = () => {
    if (!match.winnerSide) return "Draw";

    if (match.matchType === "singles") {
      const winnerIndex = match.winnerSide === "side1" ? 0 : 1;
      const participant = match.participants?.[winnerIndex];
      return (
        participant?.fullName ||
        participant?.username ||
        `Side ${match.winnerSide === "side1" ? "1" : "2"}`
      );
    }

    if (match.winnerSide === "side1") {
      const p1 = match.participants?.[0];
      const p2 = match.participants?.[1];
      return `${p1?.fullName || p1?.username || "Player 1"} & ${
        p2?.fullName || p2?.username || "Player 2"
      }`;
    } else {
      const p1 = match.participants?.[2];
      const p2 = match.participants?.[3];
      return `${p1?.fullName || p1?.username || "Player 3"} & ${
        p2?.fullName || p2?.username || "Player 4"
      }`;
    }
  };

  const [setsWonSide1, setsWonSide2] = getSetScores(match);
  const matchScore = `${setsWonSide1} - ${setsWonSide2}`;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {/* Tournament Badge */}
        <LinearGradient
          colors={["#3b82f6", "#9333ea"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tournamentBadge}
        >
          <Text style={styles.tournamentBadgeText}>
            {tournamentName || "Tournament Match"}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Trophy Icon */}
          <View style={styles.trophyContainer}>
            <FontAwesome5 name="trophy" size={48} color="#fbbf24" />
          </View>

          {/* Match Completed Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>MATCH COMPLETED</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* Winner Info */}
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>Winner</Text>
            <Text style={styles.winnerName}>{renderWinnerName()}</Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Final Score</Text>
              <Text style={styles.scoreValue}>{matchScore}</Text>
            </View>
          </View>

          {/* Action Button */}
          <Button
            onPress={() => router.push(`/tournaments/${tournamentId}` as any)}
            variant="primary"
            size="lg"
            style={styles.button}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.buttonText}>Back To Tournament</Text>
          </Button>

          {/* Subtle hint */}
          <Text style={styles.hint}>
            Standings will be updated automatically
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.base,
  },
  card: {
    width: "100%",
    maxWidth: 600,
    overflow: "hidden",
    borderRadius: BorderRadius.xl,
  },
  tournamentBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tournamentBadgeText: {
    ...Typography.sm,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    alignItems: "center",
  },
  trophyContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#16a34a",
    textAlign: "center",
  },
  titleUnderline: {
    width: 96,
    height: 4,
    backgroundColor: "#4ade80",
    borderRadius: 2,
  },
  winnerContainer: {
    width: "100%",
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: "#dcfce7",
    gap: Spacing.base,
    alignItems: "center",
  },
  winnerLabel: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  winnerName: {
    ...Typography.xl,
    fontWeight: Typography.weights.bold,
    color: "#16a34a",
    textAlign: "center",
  },
  scoreContainer: {
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    alignItems: "center",
    gap: Spacing.xs,
  },
  scoreLabel: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
    marginTop: Spacing.base,
  },
  buttonText: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
  hint: {
    ...Typography.xs,
    color: Colors.light.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
  },
});

