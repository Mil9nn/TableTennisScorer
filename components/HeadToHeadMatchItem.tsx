import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { HeadToHeadOpponentMatch } from "@/lib/profile/types";
import { DesignTokens } from "@/constants/designTokens";

interface HeadToHeadMatchItemProps {
  match: HeadToHeadOpponentMatch;
}

export default function HeadToHeadMatchItem({ match }: HeadToHeadMatchItemProps) {
  const isWin = match.result === "win";
  const title = match?.tournament?.name
    ? `${match.tournament.name}${match.tournament.format ? ` • ${match.tournament.format}` : ""}`
    : "Match";
  const date = match?.date ? new Date(match.date).toLocaleDateString() : "—";

  return (
    <Card style={styles.matchCard}>
      <Card.Content style={styles.cardContent}>
        {/* Match Title */}
        <Text style={styles.matchTitle}>{title}</Text>
        
        {/* Match Info Row */}
        <View style={styles.matchInfoRow}>
          <Text style={styles.matchDate}>{date}</Text>
          <View style={[
            styles.resultBadge,
            { backgroundColor: isWin ? "#d1fae5" : "#fee2e2" }
          ]}>
            <Text style={[
              styles.resultText,
              { color: isWin ? "#065f46" : "#991b1b" }
            ]}>
              {match.result?.toUpperCase() || "—"}
            </Text>
          </View>
        </View>
        
        {/* Score */}
        {match.score != null && match.score !== "" ? (
          <Text style={styles.scoreText}>{String(match.score)}</Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  matchCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  cardContent: {
    padding: DesignTokens.spacing[4],
  },
  matchTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
  },
  matchInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  matchDate: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  resultBadge: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.sm,
  },
  resultText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  scoreText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    textAlign: "center",
  },
});
