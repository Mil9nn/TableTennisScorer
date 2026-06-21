import { Ionicons } from "@expo/vector-icons";
import MatchTypeBadge from "@/components/MatchTypeBadge";
import { SubMatch, TeamMatch } from "@/types/match.type";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  match: TeamMatch;
}

export default function TeamMatchLineup({ match }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match Lineup</Text>
      <View style={styles.lineupContainer}>
        {match.subMatches?.map((subMatch: SubMatch, idx: number) => (
          <SubMatchCard key={idx} subMatch={subMatch} index={idx} />
        ))}
      </View>
    </View>
  );
}

function SubMatchCard({
  subMatch,
  index,
}: {
  subMatch: SubMatch;
  index: number;
}) {
  const isCompleted = subMatch.status === "completed";
  const isInProgress = subMatch.status === "in_progress";

  const team1Players = Array.isArray(subMatch.playerTeam1)
    ? subMatch.playerTeam1
    : [subMatch.playerTeam1];
  const team2Players = Array.isArray(subMatch.playerTeam2)
    ? subMatch.playerTeam2
    : [subMatch.playerTeam2];

  const team1Names = team1Players
    .map((p: any) => p?.fullName || p?.username || "TBD")
    .join(" & ");
  const team2Names = team2Players
    .map((p: any) => p?.fullName || p?.username || "TBD")
    .join(" & ");

  const team1Won = subMatch.winnerSide === "team1";
  const team2Won = subMatch.winnerSide === "team2";

  return (
    <View
      style={[
        styles.subMatchCard,
        isInProgress && styles.subMatchInProgress,
        isCompleted && styles.subMatchCompleted,
      ]}
    >
      <View style={styles.subMatchHeader}>
        <View style={styles.subMatchTitle}>
          <Text style={styles.subMatchNumber}>M{index + 1}</Text>
          <Text style={styles.matchTypeText}> • {subMatch.matchType}</Text>
        </View>
        <StatusBadge status={subMatch.status} />
      </View>

      <View style={styles.playersRow}>
        <Text
          style={[
            styles.playerName,
            team1Won && styles.winnerName,
          ]}
          numberOfLines={1}
        >
          {team1Names}
        </Text>

        {isCompleted && subMatch.finalScore ? (
          <View style={styles.scoreBadge}>
            <Text
              style={[
                styles.scoreText,
                team1Won && styles.winnerScore,
              ]}
            >
              {subMatch.finalScore.team1Sets}
            </Text>
            <Text style={styles.scoreDivider}>:</Text>
            <Text
              style={[
                styles.scoreText,
                team2Won && styles.winnerScore,
              ]}
            >
              {subMatch.finalScore.team2Sets}
            </Text>
          </View>
        ) : (
          <Text style={styles.vsText}>vs</Text>
        )}

        <Text
          style={[
            styles.playerName,
            styles.playerNameRight,
            team2Won && styles.winnerName,
          ]}
          numberOfLines={1}
        >
          {team2Names}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <View style={styles.statusBadgeLive}>
        <Ionicons name="radio" size={12} color="#2563eb" />
        <Text style={styles.statusBadgeTextLive}>Live</Text>
      </View>
    );
  }

  if (status === "completed") {
    return (
      <View style={styles.statusBadgeCompleted}>
        <Text style={styles.statusBadgeTextCompleted}>Done</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusBadgePending}>
      <Text style={styles.statusBadgeTextPending}>Pending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  lineupContainer: {
    gap: 8,
  },
  subMatchCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  subMatchInProgress: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  subMatchCompleted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  subMatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subMatchTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  subMatchNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  matchTypeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  playerNameRight: {
    textAlign: "right",
  },
  winnerName: {
    color: "#10b981",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    color: "#6b7280",
  },
  winnerScore: {
    color: "#10b981",
  },
  scoreDivider: {
    fontSize: 12,
    color: "#9ca3af",
  },
  vsText: {
    fontSize: 12,
    color: "#9ca3af",
    paddingHorizontal: 8,
  },
  statusBadgeLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
  },
  statusBadgeTextLive: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
  statusBadgeCompleted: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  statusBadgeTextCompleted: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  statusBadgePending: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  statusBadgeTextPending: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
});

