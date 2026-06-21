import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { TeamMatch } from "@/types/match.type";
import { formatDate } from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TeamMatchCompletedCardProps {
  match: TeamMatch | null;
}

export default function TeamMatchCompletedCard({
  match,
}: TeamMatchCompletedCardProps) {
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

  const winnerTeam = match.winnerTeam === "team1" ? match.team1 : match.team2;
  const finalScore = `${match.finalScore?.team1Matches || 0} - ${
    match.finalScore?.team2Matches || 0
  }`;

  return (
    <LinearGradient
      colors={["#dcfce7", "#bbf7d0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.trophyContainer}>
          <FontAwesome5 name="trophy" size={40} color="#fbbf24" />
        </View>

        <Text style={styles.title}>TEAM MATCH COMPLETED</Text>

        <View style={styles.details}>
          <Text style={styles.winnerLabel}>
            Winner: <Text style={styles.winnerName}>{winnerTeam?.name}</Text>
          </Text>

          <Text style={styles.scoreLabel}>
            Final Score: <Text style={styles.scoreValue}>{finalScore}</Text>
          </Text>

          <View style={styles.scoreBreakdown}>
            <View style={styles.teamScore}>
              <Text style={styles.teamName}>{match.team1?.name}</Text>
              <Text
                style={[
                  styles.teamScoreValue,
                  match.winnerTeam === "team1" && styles.winnerScore,
                ]}
              >
                {match.finalScore?.team1Matches || 0}
              </Text>
            </View>
            <Text style={styles.scoreDivider}>-</Text>
            <View style={styles.teamScore}>
              <Text style={styles.teamName}>{match.team2?.name}</Text>
              <Text
                style={[
                  styles.teamScoreValue,
                  match.winnerTeam === "team2" && styles.winnerScore,
                ]}
              >
                {match.finalScore?.team2Matches || 0}
              </Text>
            </View>
          </View>
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
    gap: 24,
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    gap: 16,
    width: "100%",
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
  scoreBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 8,
  },
  teamScore: {
    alignItems: "center",
    gap: 8,
  },
  teamName: {
    fontSize: 12,
    color: "#6b7280",
  },
  teamScoreValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#9ca3af",
  },
  winnerScore: {
    color: "#16a34a",
  },
  scoreDivider: {
    fontSize: 24,
    color: "#9ca3af",
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

