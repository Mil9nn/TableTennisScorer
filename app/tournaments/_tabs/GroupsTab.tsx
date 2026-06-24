import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { GroupsView } from "@/components/tournaments/GroupsView";

const tokens = DesignTokens;

interface GroupsTabProps {
  tournament: any;
  tournamentGroups: any[];
  resolvedGroupParticipants: any[];
  fadeAnim: Animated.Value;
  drawGenerated?: boolean;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
  tournament,
  tournamentGroups,
  resolvedGroupParticipants,
  fadeAnim,
}) => {
  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="grid-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>Tournament Groups</Text>
        </View>
        <View style={styles.contentCardBadge}>
          <Text style={styles.contentCardBadgeText}>
            {tournamentGroups.length || 0} groups • {tournament.participants?.length || 0} participants
          </Text>
        </View>
      </View>
      {tournamentGroups.length > 0 ? (
          <GroupsView
            groups={tournamentGroups}
            participants={resolvedGroupParticipants}
            advancePerGroup={
              tournament.format === "hybrid"
                ? tournament.hybridConfig?.qualifyingPerGroup
                : tournament.advancePerGroup
            }
            showDetailedStats={true}
            category={tournament.category as "individual" | "team"}
            matchType={tournament.matchType}
            drawGenerated={!!tournament.drawGenerated}
          />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={48} color={tokens.colors.gray[400]} />
          <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Groups will appear here once the tournament draw is generated.
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    backgroundColor: tokens.colors.white,
  },
  contentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: tokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  contentCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[8],
  },
  contentCardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  contentCardBadge: {
    backgroundColor: tokens.colors.primary[50],
    paddingHorizontal: tokens.spacing[8],
    paddingVertical: tokens.spacing[4],
    borderRadius: tokens.borderRadius.base,
  },
  contentCardBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  emptyState: {
    alignItems: "center",
    padding: tokens.spacing[16],
  },
  emptyStateTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[10],
    marginBottom: tokens.spacing[4],
  },
  emptyStateSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textAlign: "center",
  },
});
