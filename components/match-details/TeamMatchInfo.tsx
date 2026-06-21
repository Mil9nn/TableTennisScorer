import { Ionicons } from "@expo/vector-icons";
import { TeamMatch } from "@/types/match.type";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  match: TeamMatch;
}

export function TeamMatchFormat({ match }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teams</Text>

      <View style={styles.teamsRow}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team1?.name || "Team 1"}
          </Text>
          <Text style={styles.teamPlayers}>
            {match.team1?.players?.length || 0} players
          </Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={[styles.teamInfo, styles.teamInfoRight]}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team2?.name || "Team 2"}
          </Text>
          <Text style={styles.teamPlayers}>
            {match.team2?.players?.length || 0} players
          </Text>
        </View>
      </View>

      <View style={styles.formatInfo}>
        <View style={styles.formatItem}>
          <Ionicons name="layers-outline" size={14} color="#6b7280" />
          <Text style={styles.formatText}>
            {match.subMatches?.length || 0} matches
          </Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="list-outline" size={14} color="#6b7280" />
          <Text style={styles.formatText}>
            Best of {match.numberOfSetsPerSubMatch}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamInfoRight: {
    alignItems: "flex-end",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  teamPlayers: {
    fontSize: 12,
    color: "#6b7280",
  },
  vsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  vsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  formatInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  formatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  formatText: {
    fontSize: 12,
    color: "#6b7280",
  },
});

