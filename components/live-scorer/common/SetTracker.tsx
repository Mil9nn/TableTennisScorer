import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SetTrackerProps {
  bestOf: number;
  side1Sets: number;
  side2Sets: number;
  status: string;
}

export default function SetTracker({
  bestOf,
  side1Sets,
  side2Sets,
  status,
}: SetTrackerProps) {
  const setsToWin = Math.ceil(bestOf / 2);
  const side1Winning = side1Sets > side2Sets;
  const side2Winning = side2Sets > side1Sets;

  return (
    <View style={styles.container}>
      <View style={styles.setsRow}>
        {/* Side 1 Sets */}
        <View style={styles.setsContainer}>
          {Array.from({ length: setsToWin }).map((_, i) => (
            <View
              key={`s1-${i}`}
              style={[
                styles.setBadge,
                i < side1Sets ? styles.setWon : styles.setEmpty,
              ]}
            >
              {i < side1Sets && (
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.setGradient}
                >
                  <Text style={styles.checkmark}>✓</Text>
                </LinearGradient>
              )}
            </View>
          ))}
        </View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.scoreText,
              side1Winning ? styles.scoreWinning : styles.scoreDefault,
            ]}
          >
            {side1Sets}
          </Text>
          <Text style={styles.scoreDivider}>:</Text>
          <Text
            style={[
              styles.scoreText,
              side2Winning ? styles.scoreWinning2 : styles.scoreDefault,
            ]}
          >
            {side2Sets}
          </Text>
        </View>

        {/* Side 2 Sets */}
        <View style={styles.setsContainer}>
          {Array.from({ length: setsToWin }).map((_, i) => (
            <View
              key={`s2-${i}`}
              style={[
                styles.setBadge,
                i < side2Sets ? styles.setWon : styles.setEmpty,
              ]}
            >
              {i < side2Sets && (
                <LinearGradient
                  colors={["#f43f5e", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.setGradient}
                >
                  <Text style={styles.checkmark}>✓</Text>
                </LinearGradient>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Sets to Win Indicator */}
      {status !== "completed" && (
        <Text style={styles.indicator}>
          First to {setsToWin} sets wins
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  setsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  setsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  setBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
  },
  setGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  setEmpty: {
    backgroundColor: "#f3f4f6",
  },
  setWon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "900",
  },
  scoreDefault: {
    color: "#6b7280",
  },
  scoreWinning: {
    color: "#10b981",
  },
  scoreWinning2: {
    color: "#f43f5e",
  },
  scoreDivider: {
    marginHorizontal: 12,
    fontSize: 18,
    color: "#9ca3af",
    fontWeight: "600",
  },
  indicator: {
    fontSize: 12,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
});

