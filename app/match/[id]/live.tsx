import LiveMatchDetails from "@/components/live-match/LiveMatchDetails";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function MatchLivePage() {
  const { id: matchIdParam, category } = useLocalSearchParams();
  const matchId = normalizeMatchIdParam(matchIdParam);

  return (
    <View style={styles.container}>
      <LiveMatchDetails
        matchId={matchId}
        category={(category as "individual" | "team") || "individual"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071018",
  },
});

