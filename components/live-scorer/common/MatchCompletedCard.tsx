import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { IndividualMatch } from "@/types/match.type";
import { getSetScores } from "@/lib/match/singlesClient";
import { formatDate, formatTimeDuration } from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MatchCompletedCardProps {
  match: IndividualMatch | null;
}

export default function MatchCompletedCard({
  match,
}: MatchCompletedCardProps) {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const didRedirectRef = useRef(false);

  if (!match) return null;

  useEffect(() => {
    if (didRedirectRef.current) return;

    let targetRoute = "/matches";
    if (typeof returnTo === "string" && returnTo.trim()) {
      targetRoute = decodeURIComponent(returnTo);
    } else if (match.tournament) {
      const tournamentId =
        typeof match.tournament === "string"
          ? match.tournament
          : String((match.tournament as any)?._id || (match.tournament as any)?.id || "");
      if (tournamentId) {
        targetRoute = `/tournaments/${tournamentId}?tab=schedule`;
      }
    }

    didRedirectRef.current = true;
    router.replace(targetRoute as any);
  }, [match.tournament, returnTo, router]);

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

  const [setsLeft, setsRight] = getSetScores(match);
  const matchScore = `${setsLeft} - ${setsRight}`;

  return (
    <LinearGradient
      colors={["#dcfce7", "#bbf7d0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.trophyContainer}>
          <FontAwesome5 name="trophy" size={32} color="#fbbf24" />
        </View>

        <Text style={styles.title}>MATCH COMPLETED</Text>

        <View style={styles.details}>
          <Text style={styles.winnerLabel}>
            Winner: <Text style={styles.winnerName}>{renderWinnerName()}</Text>
          </Text>

          <Text style={styles.scoreLabel}>
            Final Score: <Text style={styles.scoreValue}>{matchScore}</Text>
          </Text>

          {match.matchDuration && (
            <Text style={styles.duration}>
              Duration: {formatTimeDuration(match.matchDuration)}
            </Text>
          )}
        </View>

        <Text style={styles.completedAt}>
          Match completed at {formatDate(new Date())}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (typeof returnTo === "string" && returnTo.trim()) {
              router.replace(decodeURIComponent(returnTo) as any);
              return;
            }
            router.replace("/matches" as any);
          }}
        >
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.buttonText}>Return to Matches</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#16a34a",
    textAlign: "center",
  },
  details: {
    alignItems: "center",
    gap: 12,
  },
  winnerLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  winnerName: {
    color: "#16a34a",
  },
  scoreLabel: {
    fontSize: 16,
    color: "#374151",
  },
  scoreValue: {
    fontWeight: "700",
    color: "#1f2937",
  },
  duration: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  completedAt: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

