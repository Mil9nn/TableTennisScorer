import { Ionicons } from "@expo/vector-icons";
import { Match, TeamMatch } from "@/types/match.type";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { DesignTokens } from "@/constants/designTokens";
import * as Haptics from 'expo-haptics';

interface Props {
  match: Match;
  matchId: string;
  isScorer: boolean;
}

export default function MatchActions({ match, matchId, isScorer }: Props) {
  const { returnTab, returnTo } = useLocalSearchParams<{
    returnTab?: string | string[];
    returnTo?: string | string[];
  }>();
  const status = match.status;

  const buildScoreRoute = () => {
    const params = new URLSearchParams({ category: match.matchCategory });
    const tab = Array.isArray(returnTab) ? returnTab[0] : returnTab;
    const back = Array.isArray(returnTo) ? returnTo[0] : returnTo;
    if (tab) params.set("returnTab", tab);
    if (back) params.set("returnTo", back);
    return `/match/${matchId}/score?${params.toString()}`;
  };

  const isScheduled = status === "scheduled";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  const isCustomTeam =
    match.matchCategory === "team" &&
    (match as TeamMatch).matchFormat === "custom";
  const subMatchCount =
    match.matchCategory === "team"
      ? (match as TeamMatch).subMatches?.length ?? 0
      : 0;
  const needsRubberSetup = isCustomTeam && subMatchCount === 0;

  const showConfigureRubbers =
    isScorer && isCustomTeam && needsRubberSetup && !isCompleted;
  const showScorerAction =
    isScorer && (isScheduled || isInProgress) && !needsRubberSetup;
  const showViewLive = isInProgress; // Show live button for everyone when match is live
  const showInsights = isCompleted; // Show insights button for all completed matches

  const hasAnyAction =
    showConfigureRubbers || showScorerAction || showViewLive || showInsights;

  if (!hasAnyAction) return null;

  return (
    <View style={modernStyles.container}>
      <View style={modernStyles.header}>
        <View style={modernStyles.headerIcon}>
          <Ionicons name="flashlight-outline" size={16} color={tokens.colors.primary[600]} />
        </View>
        <Text style={modernStyles.title}>Quick Actions</Text>
      </View>
      <View style={modernStyles.actionsContainer}>
        {showConfigureRubbers && (
          <Animated.View>
            <TouchableOpacity
              style={modernStyles.primaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(
                  `/match/${matchId}/setup?category=${match.matchCategory}` as any
                );
              }}
              activeOpacity={0.8}
            >
              <View style={modernStyles.buttonContent}>
                <Ionicons
                  name="list"
                  size={20}
                  color={tokens.colors.background.primary}
                />
                <Text style={modernStyles.primaryButtonText}>
                  Configure rubbers
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {showScorerAction && (
          <Animated.View>
            <TouchableOpacity
              style={modernStyles.primaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(buildScoreRoute() as any);
              }}
              activeOpacity={0.8}
            >
              <View style={modernStyles.buttonContent}>
                <Ionicons name="play" size={20} color={tokens.colors.background.primary} />
                <Text style={modernStyles.primaryButtonText}>
                  {isScheduled ? "Start Match" : "Continue Match"}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {showViewLive && (
          <Animated.View>
            <TouchableOpacity
              style={[modernStyles.primaryButton, modernStyles.liveButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(
                  `/match/${matchId}/live?category=${match.matchCategory}` as any
                );
              }}
              activeOpacity={0.8}
            >
              <View style={modernStyles.buttonContent}>
                <Ionicons name="radio" size={16} color={tokens.colors.background.primary} />
                <Text style={modernStyles.primaryButtonText}>View Live</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {showInsights && (
          <Animated.View>
            <TouchableOpacity
              style={modernStyles.primaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(
                  `/match/${matchId}/stats?category=${match.matchCategory}` as any
                );
              }}
              activeOpacity={0.8}
            >
              <View style={modernStyles.buttonContent}>
                <Ionicons name="bar-chart-outline" size={16} color={tokens.colors.text.inverse} />
                <Text style={modernStyles.primaryButtonText}>Match Insights</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing[6],
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.base,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    gap: tokens.spacing[3],
  },
  primaryButton: {
    backgroundColor: tokens.colors.primary[600],
    borderRadius: tokens.borderRadius.sm,
    paddingVertical: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[5],
    ...tokens.shadows.sm,
  },
  liveButton: {
    backgroundColor: tokens.colors.status.live,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
  },
  primaryButtonText: {
    color: tokens.colors.background.primary,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.borderRadius.sm,
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[5],
  },
  secondaryButtonText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});

