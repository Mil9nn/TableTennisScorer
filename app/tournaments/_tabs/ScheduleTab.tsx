import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import TournamentSchedule from "@/components/tournaments/TournamentSchedule";

const tokens = DesignTokens;

interface ScheduleTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  roundsWithIds: any[];
  roundRobinMatches: any[];
  refreshing: boolean;
  isCustomMatchingTournament: boolean;
  buildTournamentMatchRoute: (matchId: string) => string;
  onRefresh?: () => void;
  onMatchClick?: (matchId: string) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  tournament,
  fadeAnim,
  roundsWithIds,
  roundRobinMatches,
  refreshing,
  isCustomMatchingTournament,
  buildTournamentMatchRoute,
  onRefresh,
  onMatchClick,
}) => {
  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="calendar-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>Tournament Schedule</Text>
        </View>
      </View>
      {roundsWithIds && roundsWithIds.length > 0 ? (
        <View style={styles.contentCardBody} collapsable={false}>
          <TournamentSchedule
            rounds={roundsWithIds as any}
            matches={roundRobinMatches as any}
            isLoading={refreshing}
            onMatchClick={onMatchClick}
            showDate={false}
            showTime={false}
            venue={tournament.venue}
            tournamentMatchType={tournament.matchType}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        </View>
      ) : isCustomMatchingTournament && tournament.drawGenerated ? (
        <View style={styles.emptyState}>
          <Ionicons name="settings-outline" size={48} color={tokens.colors.gray[400]} />
          <Text style={styles.emptyStateTitle}>Bracket Structure Created</Text>
          <Text style={styles.emptyStateSubtitle}>
            Use the Actions section above to configure matchups and create matches.
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={tokens.colors.gray[400]} />
          <Text style={styles.emptyStateTitle}>No Schedule Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            {isCustomMatchingTournament
              ? "Generate bracket to get started"
              : "Schedules will appear here once the tournament draw is generated"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    flex: 1,
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
  contentCardBody: {
    flex: 1,
    minHeight: 0,
    padding: tokens.spacing[4],
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
