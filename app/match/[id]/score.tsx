import LiveScorer from "@/components/live-scorer/LiveScorer";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function MatchScorePage() {
  const { id: matchIdParam, category } = useLocalSearchParams();
  const matchId = normalizeMatchIdParam(matchIdParam);

  return (
    <View style={styles.container}>
      <LiveScorer
        matchId={matchId}
        category={category as "individual" | "team" | undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
});

