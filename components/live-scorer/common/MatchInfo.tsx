import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface MatchInfoProps {
  currentGame: number;
  totalGames: number;
  matchStartTime?: Date;
  rallyCount?: number;
}

export default function MatchInfo({
  currentGame,
  totalGames,
  matchStartTime,
  rallyCount = 0,
}: MatchInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Game Progress */}
        <View style={styles.gameProgress}>
          <View style={styles.gameBadge}>
            <Text style={styles.gameNumber}>{currentGame}</Text>
          </View>
          <View>
            <Text style={styles.gameLabel}>Game {currentGame}</Text>
            <Text style={styles.gameSubtext}>of {totalGames}</Text>
          </View>
        </View>

        {/* Rally Counter */}
        {rallyCount > 0 && (
          <View style={styles.rallyContainer}>
            <Ionicons name="time-outline" size={16} color="#8b5cf6" />
            <Text style={styles.rallyText}>
              <Text style={styles.rallyCount}>{rallyCount}</Text> rallies
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  gameProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gameBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  gameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  gameSubtext: {
    fontSize: 12,
    color: "#6b7280",
  },
  rallyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rallyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  rallyCount: {
    fontWeight: "600",
  },
});

