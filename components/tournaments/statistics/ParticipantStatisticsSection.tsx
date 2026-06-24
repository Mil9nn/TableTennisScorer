import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import * as Haptics from 'expo-haptics';
import {
  ParticipantProgression,
  ParticipantStats,
  PerformanceMetrics,
} from "@/types/knockoutStatistics.type";
import { cn } from "@/lib/utils";

interface ParticipantStatisticsSectionProps {
  progression: ParticipantProgression[];
  stats: ParticipantStats[];
  metrics: PerformanceMetrics[];
}

interface CombinedParticipantData {
  participantId: string;
  participantName: string;
  seedNumber?: number;
  matchesPlayed: number;
  roundReached: string;
  eliminatedBy?: { participantId: string; participantName: string };
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  avgPointsPerSet: number;
  avgPointsConcededPerSet: number;
  biggestWinOpponent: string;
  biggestWinScore: string;
  biggestWinMargin?: number;
  biggestWinRound: string;
}

export function ParticipantStatisticsSection({
  progression,
  stats,
  metrics,
}: ParticipantStatisticsSectionProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Combine all data by participantId
  const combinedData: CombinedParticipantData[] = progression.map((prog) => {
    const stat = stats.find((s) => s.participantId === prog.participantId);
    const metric = metrics.find((m) => m.participantId === prog.participantId);

    return {
      participantId: prog.participantId,
      participantName: prog.participantName,
      seedNumber: prog.seedNumber,
      matchesPlayed: prog.matchesPlayed,
      roundReached: prog.roundReached,
      eliminatedBy: prog.eliminatedBy,
      matchesWon: stat?.matchesWon || 0,
      matchesLost: stat?.matchesLost || 0,
      setsWon: stat?.setsWon || 0,
      setsLost: stat?.setsLost || 0,
      setsDiff: stat?.setsDiff || 0,
      pointsScored: stat?.pointsScored || 0,
      pointsConceded: stat?.pointsConceded || 0,
      pointsDiff: stat?.pointsDiff || 0,
      avgPointsPerSet: metric?.avgPointsPerSet || 0,
      avgPointsConcededPerSet: metric?.avgPointsConcededPerSet || 0,
      biggestWinOpponent: metric?.biggestWin.opponentName || "N/A",
      biggestWinScore: metric?.biggestWin.setScore || "N/A",
      biggestWinMargin: metric?.biggestWin.pointMargin,
      biggestWinRound: metric?.biggestWin.roundName || "N/A",
    };
  });

  // Get weight for round reached (for sorting)
  const getRoundWeight = (round: string): number => {
    const weights: Record<string, number> = {
      Champion: 7,
      "Runner-up": 6,
      "Third Place": 5.5,
      "Semi-finalist": 5,
      "Quarter-finalist": 4,
      "Round of 16": 3,
      "Round of 32": 2,
    };
    return weights[round] || 1;
  };

  // Sort by round reached (descending)
  const sortedData = [...combinedData].sort((a, b) => {
    return getRoundWeight(b.roundReached) - getRoundWeight(a.roundReached);
  });

  const toggleRow = (participantId: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedRows(newExpanded);
  };

  const getPositionDisplayText = (position: string) => {
    switch (position) {
      case "Champion":
        return "Gold";
      case "Runner-up":
        return "Silver";
      case "Third Place":
        return "Bronze";
      default:
        return position;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "Champion":
        return tokens.colors.warning;
      case "Runner-up":
        return tokens.colors.gray[500];
      case "Third Place":
        return tokens.colors.info;
      case "Semi-finalist":
        return tokens.colors.primary[600];
      case "Quarter-finalist":
        return tokens.colors.primary[500];
      default:
        return tokens.colors.text.tertiary;
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case "Champion":
        return "trophy";
      case "Runner-up":
        return "medal";
      case "Third Place":
        return "medal-outline";
      default:
        return "flag";
    }
  };

  return (
    <View style={modernStyles.container}>
      {/* Modern Header */}
      <View style={modernStyles.header}>

        <Text style={modernStyles.headerTitle}>Knockout Stage Statistics</Text>

        <Text style={modernStyles.headerCount}>{sortedData.length} Participants</Text>
      </View>

      {/* Participants List */}
      <ScrollView style={modernStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={modernStyles.participantsList}>
          {sortedData.map((participant, index) => {
            const isExpanded = expandedRows.has(participant.participantId);
            const positionColor = getPositionColor(participant.roundReached);
            const positionIcon = getPositionIcon(participant.roundReached);

            return (
              <Animated.View key={participant.participantId}>
                <TouchableOpacity
                  onPress={() => toggleRow(participant.participantId)}
                  style={modernStyles.participantRow}
                >
                  <View style={modernStyles.participantRowContent}>
                    {/* Expand/Collapse Icon */}
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: isExpanded ? '90deg' : '0deg'
                        }]
                      }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={tokens.colors.text.tertiary}
                      />
                    </Animated.View>

                    {/* Participant Name */}
                    <Text style={modernStyles.participantName}>
                      {participant.participantName}
                    </Text>
                  </View>

                  {/* Position Badge */}
                  <View style={modernStyles.positionContainer}>
                    <Ionicons
                      name={positionIcon}
                      size={14}
                      color={positionColor}
                    />
                    <Text style={[
                      modernStyles.positionText,
                      { color: positionColor }
                    ]}>
                      {getPositionDisplayText(participant.roundReached)}
                    </Text>
                  </View>

                  {/* Win/Loss Record */}
                  <View style={modernStyles.recordContainer}>
                    <Text style={modernStyles.recordWin}>{participant.matchesWon}</Text>
                    <Text style={modernStyles.recordSeparator}>-</Text>
                    <Text style={modernStyles.recordLoss}>{participant.matchesLost}</Text>
                  </View>

                  {/* Eliminated By */}
                  <Text style={modernStyles.eliminatedBy}>
                    {participant.eliminatedBy?.participantName || "—"}
                  </Text>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={modernStyles.expandedContent}>
                    {/* Match Statistics */}
                    <View style={modernStyles.statsSection}>
                      <Text style={modernStyles.sectionTitle}>Match Performance</Text>
                      <View style={modernStyles.statsGrid}>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Matches Played</Text>
                          <Text style={modernStyles.statValue}>{participant.matchesPlayed}</Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Win Rate</Text>
                          <Text style={modernStyles.statValue}>
                            {participant.matchesPlayed > 0
                              ? `${Math.round((participant.matchesWon / participant.matchesPlayed) * 100)}%`
                              : '0%'
                            }
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Sets Statistics */}
                    <View style={modernStyles.statsSection}>
                      <Text style={modernStyles.sectionTitle}>Sets Performance</Text>
                      <View style={modernStyles.statsGrid}>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Sets Record</Text>
                          <Text style={modernStyles.statValue}>
                            {participant.setsWon} - {participant.setsLost}
                          </Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Set Difference</Text>
                          <Text style={[
                            modernStyles.statValue,
                            participant.setsDiff > 0 ? modernStyles.positiveValue :
                              participant.setsDiff < 0 ? modernStyles.negativeValue : null
                          ]}>
                            {participant.setsDiff > 0 ? `+${participant.setsDiff}` : participant.setsDiff}
                          </Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Points Scored</Text>
                          <Text style={modernStyles.statValue}>{participant.pointsScored}</Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Points Conceded</Text>
                          <Text style={modernStyles.statValue}>{participant.pointsConceded}</Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Points Difference</Text>
                          <Text style={[
                            modernStyles.statValue,
                            participant.pointsDiff > 0 ? modernStyles.positiveValue :
                              participant.pointsDiff < 0 ? modernStyles.negativeValue : null
                          ]}>
                            {participant.pointsDiff > 0 ? `+${participant.pointsDiff}` : participant.pointsDiff}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Performance Metrics */}
                    <View style={modernStyles.statsSection}>
                      <Text style={modernStyles.sectionTitle}>Performance Metrics</Text>
                      <View style={modernStyles.statsGrid}>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Avg Points/Set</Text>
                          <Text style={[modernStyles.statValue, modernStyles.highlightValue]}>
                            {participant.avgPointsPerSet.toFixed(1)}
                          </Text>
                        </View>
                        <View style={modernStyles.statItem}>
                          <Text style={modernStyles.statLabel}>Avg Conceded/Set</Text>
                          <Text style={modernStyles.statValue}>
                            {participant.avgPointsConcededPerSet.toFixed(1)}
                          </Text>
                        </View>
                        {participant.biggestWinOpponent !== "N/A" && participant.biggestWinOpponent && (
                          <>
                            <View style={modernStyles.statItem}>
                              <Text style={modernStyles.statLabel}>Biggest Win</Text>
                              <Text style={modernStyles.statValue}>{participant.biggestWinOpponent}</Text>
                              {participant.biggestWinScore && participant.biggestWinScore !== "N/A" && (
                                <Text style={modernStyles.statSubValue}>{participant.biggestWinScore}</Text>
                              )}
                            </View>
                            <View style={modernStyles.statItem}>
                              <Text style={modernStyles.statLabel}>Peak Round</Text>
                              <Text style={modernStyles.statValue}>
                                {participant.biggestWinRound !== "N/A" ? participant.biggestWinRound : "—"}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.base,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerCount: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },

  participantsList: {
    gap: tokens.spacing[1],
  },

  // Participant row
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.borderRadius.sm,
    gap: tokens.spacing[3],
  },
  participantRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    flex: 1,
  },
  participantName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    flex: 1,
  },

  // Position badge
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  positionText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },

  // Record
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  recordWin: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.success,
  },
  recordSeparator: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  recordLoss: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.error,
  },

  // Eliminated by
  eliminatedBy: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.tertiary,
    textAlign: 'right',
  },

  // Expanded content
  expandedContent: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.sm,
    marginTop: tokens.spacing[1],
    gap: tokens.spacing[4],
  },

  // Stats sections
  statsSection: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    gap: tokens.spacing[1],
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  statSubValue: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.tertiary,
  },
  highlightValue: {
    color: tokens.colors.primary[600],
  },
  positiveValue: {
    color: tokens.colors.success,
  },
  negativeValue: {
    color: tokens.colors.error,
  },
});

