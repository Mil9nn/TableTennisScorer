import { useAuthStore } from "@/hooks/useAuthStore";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DesignTokens } from "@/constants/designTokens";
import MatchDetailsContent from "@/components/match-details/MatchDetailsContent";
import MatchActions from "@/components/match-details/MatchActions";
import * as Haptics from 'expo-haptics';

export default function MatchDetailsPage() {
  const router = useRouter();
  const { id: matchIdParam, category: categoryParam } = useLocalSearchParams();
  const resolvedMatchId = normalizeMatchIdParam(matchIdParam);

  const fetchMatch = useMatchStore((state) => state.fetchMatch);
  const fetchingMatch = useMatchStore((state) => state.fetchingMatch);
  const match = useMatchStore((state) => state.match);
  const user = useAuthStore((state) => state.user);
  const [isTournamentScorer, setIsTournamentScorer] = useState(false);

  useEffect(() => {
    if (!resolvedMatchId) return;
    fetchMatch(
      resolvedMatchId,
      categoryParam === "team" ? "team" : "individual"
    );
  }, [resolvedMatchId, categoryParam, fetchMatch]);

  const normalizeId = (value: any): string | null => {
    if (value == null) return null;
    if (typeof value === "string" || typeof value === "number") {
      const id = String(value);
      if (!id || id === "[object Object]") return null;
      return id.length > 0 ? id : null;
    }
    if (typeof value === "object") {
      const fromUnderscore = value._id != null ? normalizeId(value._id) : null;
      if (fromUnderscore) return fromUnderscore;
      const fromId = value.id != null ? normalizeId(value.id) : null;
      if (fromId) return fromId;
      if (typeof value.toString === "function") {
        const id = value.toString();
        return id && id !== "[object Object]" ? id : null;
      }
    }
    return null;
  };

  const canScoreWithTournamentData = (
    tournament: any,
    userId: string
  ): boolean | null => {
    if (!tournament || !userId) return null;

    const organizerId = normalizeId(tournament.organizer);
    const scorerIds = Array.isArray(tournament.scorers)
      ? tournament.scorers
          .map((scorer: any) => normalizeId(scorer))
          .filter(Boolean) as string[]
      : null;

    const hasUsableLocalData = Boolean(organizerId) || scorerIds !== null;
    if (!hasUsableLocalData) return null;

    if (organizerId === userId) return true;
    return scorerIds?.includes(userId) ?? false;
  };

  useEffect(() => {
    const checkTournamentScorer = async () => {
      if (!match?.tournament || !user?._id) {
        setIsTournamentScorer(false);
        return;
      }

      const userId = normalizeId(user._id);
      if (!userId) {
        setIsTournamentScorer(false);
        return;
      }

      const tournament = match.tournament as any;
      const fromLocal = canScoreWithTournamentData(tournament, userId);
      if (fromLocal !== null) {
        setIsTournamentScorer(fromLocal);
        return;
      }

      const tournamentId = normalizeId(tournament);
      if (!tournamentId) {
        setIsTournamentScorer(false);
        return;
      }

      try {
        const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
        const canScore = canScoreWithTournamentData(data?.tournament, userId);
        setIsTournamentScorer(canScore ?? false);
      } catch (error) {
        console.error("Error checking tournament scorer:", error);
        setIsTournamentScorer(false);
      }
    };

    checkTournamentScorer();
  }, [match?.tournament, user?._id]);

  if (!resolvedMatchId) {
    return (
      <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
        <View style={modernStyles.errorContainer}>
          <View style={modernStyles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={48} color={tokens.colors.error} />
          </View>
          <Text style={modernStyles.errorTitle}>Invalid match link</Text>
          <Text style={modernStyles.errorSubtitle}>The match ID is not valid or has been corrupted</Text>
        </View>
      </SafeAreaView>
    );
  }

  const loadedMatchId = match?._id ? normalizeMatchIdParam(match._id) : null;
  const isStaleMatch =
    !!loadedMatchId && !!resolvedMatchId && loadedMatchId !== resolvedMatchId;

  if (fetchingMatch || isStaleMatch) {
    return (
      <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
        <View style={modernStyles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
          <Text style={modernStyles.loadingText}>Loading match details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
        <View style={modernStyles.errorContainer}>
          <View style={modernStyles.errorIcon}>
            <Ionicons name="search-outline" size={48} color={tokens.colors.text.tertiary} />
          </View>
          <Text style={modernStyles.errorTitle}>Match not found</Text>
          <Text style={modernStyles.errorSubtitle}>The match you're looking for doesn't exist or has been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getScorerId = (scorer: any): string | null => {
    return normalizeId(scorer);
  };

  const scorerId = getScorerId(match.scorer);
  const userId = user?._id ? String(user._id) : null;
  const isAssignedMatchScorer = !!(scorerId && userId && scorerId === userId);
  const isScorer = isAssignedMatchScorer || isTournamentScorer;

  return (
    <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
      {/* Modern Header */}
      <View style={modernStyles.header}>
        <TouchableOpacity 
          style={modernStyles.backButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <Text style={modernStyles.headerTitle}>Match details</Text>
        <View style={modernStyles.headerRight}>
          <View style={[
            modernStyles.statusIndicator,
            { backgroundColor: getStatusColor(match.status) }
          ]} />
        </View>
      </View>

      <ScrollView
        style={modernStyles.scrollView}
        contentContainerStyle={modernStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MatchDetailsContent match={match} />

        <MatchActions match={match} matchId={resolvedMatchId} isScorer={isScorer} />
      </ScrollView>
    </SafeAreaView>
  );

  function getStatusColor(status: string): string {
    switch (status) {
      case "in_progress": return tokens.colors.status.live;
      case "completed": return tokens.colors.status.completed;
      case "scheduled": return tokens.colors.status.scheduled;
      case "cancelled": return tokens.colors.text.tertiary;
      default: return tokens.colors.text.tertiary;
    }
  }
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = {
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  safeArea: {
    backgroundColor: tokens.colors.background.primary,
  },
  
  // Header
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  backButton: {
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.base,
    backgroundColor: tokens.colors.background.secondary,
  },
  headerTitle: {
    flex: 1,
    marginLeft: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: tokens.borderRadius.full,
  },
  
  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: tokens.spacing[8],
    flexGrow: 1,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: tokens.spacing[3],
    backgroundColor: tokens.colors.background.primary,
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: tokens.spacing[6],
    backgroundColor: tokens.colors.background.primary,
  },
  errorIcon: {
    marginBottom: tokens.spacing[4],
  },
  errorTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: tokens.spacing[2],
  },
  errorSubtitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.secondary,
    textAlign: 'center' as const,
  },
};
