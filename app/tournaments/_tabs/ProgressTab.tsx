import React from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { HybridTournamentManager } from "@/components/tournaments/HybridTournamentManager";

const tokens = DesignTokens;

interface ProgressTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  totalMatches: number;
  completedMatches: number;
  inProgressMatches: number;
  scheduledMatches: number;
  tournamentId: string;
  isOrganizer: boolean;
  onUpdate: () => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  tournament,
  fadeAnim,
  scaleAnim,
  totalMatches,
  completedMatches,
  inProgressMatches,
  scheduledMatches,
  tournamentId,
  isOrganizer,
  onUpdate,
}) => {
  return (
    <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
      {tournament.status !== "draft" && totalMatches > 0 && (
        <Animated.View style={[styles.progressCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.progressHeader}>
            <Ionicons name="analytics-outline" size={24} color={tokens.colors.primary[600]} />
            <Text style={styles.progressTitle}>Tournament Progress</Text>
          </View>

          {/* Progress Stats */}
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatNumber}>{completedMatches}</Text>
              <Text style={styles.progressStatLabel}>Completed</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatNumber}>{totalMatches}</Text>
              <Text style={styles.progressStatLabel}>Total</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatNumber}>
                {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%
              </Text>
              <Text style={styles.progressStatLabel}>Progress</Text>
            </View>
          </View>

          {/* Modern Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${totalMatches > 0
                    ? (completedMatches / totalMatches) * 100
                    : 0
                    }%`,
                },
              ]}
            />
          </View>

          {/* Match Status Breakdown */}
          <View style={styles.matchStatusBreakdown}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: tokens.colors.success }]} />
              <Text style={styles.statusText}>Completed: {completedMatches}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: tokens.colors.primary[600] }]} />
              <Text style={styles.statusText}>In Progress: {inProgressMatches}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: tokens.colors.gray[400] }]} />
              <Text style={styles.statusText}>Scheduled: {scheduledMatches}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {tournament.format === "hybrid" && (
          <HybridTournamentManager
            tournamentId={tournamentId}
            isOrganizer={!!isOrganizer}
            onUpdate={onUpdate}
          />
      )}

      {tournament.status === "draft" && (
        <Animated.View style={[styles.draftStateCard, { opacity: fadeAnim }]}>
          <Ionicons name="create-outline" size={48} color={tokens.colors.gray[400]} />
          <Text style={styles.draftStateTitle}>Tournament in Draft</Text>
          <Text style={styles.draftStateSubtitle}>
            Generate matches to start the tournament and track progress here.
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = {
  progressContainer: {
    padding: tokens.spacing[4],
  },
  progressCard: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing[16],
  },
  progressHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: tokens.spacing[8],
    marginBottom: tokens.spacing[10],
  },
  progressTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  progressStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[10],
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing[4],
  },
  progressStatLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: tokens.colors.border.light,
  },
  progressTrack: {
    height: tokens.spacing[8],
    backgroundColor: tokens.colors.gray[200],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
    marginBottom: tokens.spacing[16],
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary[600],
    borderRadius: tokens.borderRadius.full,
  },
  matchStatusBreakdown: {
    gap: tokens.spacing[8],
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: tokens.spacing[8],
  },
  statusDot: {
    width: tokens.spacing[8],
    height: tokens.spacing[8],
    borderRadius: tokens.borderRadius.full,
  },
  statusText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  draftStateCard: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing[16],
    alignItems: 'center',
  },
  draftStateTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[10],
    marginBottom: tokens.spacing[4],
  },
  draftStateSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
};
