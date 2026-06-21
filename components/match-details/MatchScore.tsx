import { FontAwesome5 } from "@expo/vector-icons";
import { isIndividualMatch, Match } from "@/types/match.type";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { getSetScores } from "@/lib/match/singlesClient";

interface Props {
  match: Match;
}

export default function MatchScore({ match }: Props) {
  if (isIndividualMatch(match)) {
    return <IndividualMatchScore match={match} />;
  }
  return <TeamMatchScore match={match} />;
}

function IndividualMatchScore({ match }: { match: any }) {
  if (!match.finalScore) return null;
  const [leftSets, rightSets] = getSetScores(match);

  const isDoubles = match.matchType === "doubles" || match.matchType === "mixed_doubles";
  const side1Won = match.winnerSide === "side1";
  const side2Won = match.winnerSide === "side2";

  const side1Players = isDoubles
    ? [
        match.participants?.[0]?.fullName || "Player 1",
        match.participants?.[1]?.fullName || "Player 2",
      ]
    : [match.participants?.[0]?.fullName || "Player 1"];

  const side2Players = isDoubles
    ? [
        match.participants?.[2]?.fullName || "Player 3",
        match.participants?.[3]?.fullName || "Player 4",
      ]
    : [match.participants?.[1]?.fullName || "Player 2"];

  return (
    <LinearGradient
      colors={["#1f2937", "#374151"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.scoreRow}>
        <View style={styles.sideContainer}>
          <View style={styles.playerNames}>
            {side1Players.map((name, idx) => (
              <Text
                key={idx}
                style={[styles.playerName, side1Won && styles.winnerName]}
                numberOfLines={1}
              >
                {name}
              </Text>
            ))}
          </View>
          <Text style={[styles.score, side1Won && styles.winnerScore]}>
            {leftSets}
          </Text>
        </View>

        <Text style={styles.divider}>:</Text>

        <View style={styles.sideContainer}>
          <View style={styles.playerNames}>
            {side2Players.map((name, idx) => (
              <Text
                key={idx}
                style={[styles.playerName, side2Won && styles.winnerName]}
                numberOfLines={1}
              >
                {name}
              </Text>
            ))}
          </View>
          <Text style={[styles.score, side2Won && styles.winnerScore]}>
            {rightSets}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function TeamMatchScore({ match }: { match: any }) {
  const team1Won = match.winnerTeam === "team1";
  const team2Won = match.winnerTeam === "team2";
  const isCompleted = match.status === "completed";

  return (
    <LinearGradient
      colors={["#1f2937", "#374151"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.scoreRow}>
        <View style={styles.sideContainer}>
          <Text
            style={[styles.teamName, team1Won && styles.winnerName]}
            numberOfLines={1}
          >
            {match.team1?.name || "Team 1"}
          </Text>
          <Text style={[styles.score, team1Won && styles.winnerScore]}>
            {match.finalScore?.team1Matches || 0}
          </Text>
        </View>

        <Text style={styles.divider}>:</Text>

        <View style={styles.sideContainer}>
          <Text
            style={[styles.teamName, team2Won && styles.winnerName]}
            numberOfLines={1}
          >
            {match.team2?.name || "Team 2"}
          </Text>
          <Text style={[styles.score, team2Won && styles.winnerScore]}>
            {match.finalScore?.team2Matches || 0}
          </Text>
        </View>
      </View>

      {isCompleted && match.winnerTeam && (
        <View style={styles.winnerContainer}>
          <View style={styles.winnerBadge}>
            <FontAwesome5 name="trophy" size={16} color="#fbbf24" />
            <Text style={styles.winnerText}>
              {match.winnerTeam === "team1"
                ? match.team1?.name
                : match.team2?.name}{" "}
              wins
            </Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  sideContainer: {
    flex: 1,
    alignItems: "center",
  },
  playerNames: {
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
    textAlign: "center",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 8,
  },
  winnerName: {
    color: "#34d399",
  },
  score: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  winnerScore: {
    color: "#34d399",
  },
  divider: {
    fontSize: 24,
    color: "#6b7280",
    fontWeight: "300",
  },
  winnerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#4b5563",
    alignItems: "center",
  },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fbbf24",
  },
});

