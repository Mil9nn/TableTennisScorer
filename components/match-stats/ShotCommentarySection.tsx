import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ShotFeed from "@/components/live-scorer/common/ShotFeed";
import type { IndividualGame, InitialServerConfig, Participant } from "@/types/match.type";

interface ShotCommentarySectionProps {
  games: IndividualGame[];
  participants: Participant[];
  finalScore: { side1Sets: number; side2Sets: number };
  serverConfig?: InitialServerConfig | null;
}

export function ShotCommentarySection({
  games,
  participants,
  finalScore,
  serverConfig,
}: ShotCommentarySectionProps) {
  const hasShots = games.some((g) => (g.shots?.length ?? 0) > 0);
  const lastGameNumber = games[games.length - 1]?.gameNumber ?? 1;

  if (!hasShots) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#94a3b8" />
        <Text style={styles.emptyTitle}>No shot commentary</Text>
        <Text style={styles.emptyText}>
          Point-by-point commentary appears when shots are tracked for this match.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3c6e71" />
        <Text style={styles.title}>Shot Commentary</Text>
      </View>
      <ShotFeed
        games={games}
        currentGame={lastGameNumber}
        participants={participants}
        finalScore={finalScore}
        serverConfig={serverConfig}
        defaultExpandedGames={[]}
        showInProgressIndicator={false}
        embedded
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  emptyText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});
