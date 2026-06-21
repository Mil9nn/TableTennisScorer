import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import * as Haptics from 'expo-haptics';
import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import SwaythlingScorer from "./team/SwaythlingScorer";
import SingleDoubleSingleScorer from "./team/SingleDoubleSingleScorer";
import CustomFormatScorer from "./team/CustomFormatScorer";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { TeamMatch } from "@/types/match.type";

// Design tokens (defined at module level so it's available everywhere)
const tokens = DesignTokens;

export default function LiveScorer({
  matchId,
  category,
}: {
  matchId: string;
  category?: "individual" | "team";
}) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const fetchingMatch = useMatchStore((s) => s.fetchingMatch);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const router = useRouter();

  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    setHasInitiallyLoaded(false);
    if (matchId && category) fetchMatch(matchId, category);
  }, [matchId, fetchMatch, category]);

  const loadedMatchId = match?._id ? normalizeMatchIdParam(match._id) : null;
  const isCurrentMatchLoaded =
    !!matchId && !!loadedMatchId && loadedMatchId === matchId;

  useEffect(() => {
    if (isCurrentMatchLoaded && !fetchingMatch && !authLoading) {
      setHasInitiallyLoaded(true);
    }
  }, [isCurrentMatchLoaded, match, fetchingMatch, authLoading]);

  const { isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory: category || "individual",
    role: "scorer",
    enabled: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      fetchUser().catch(() => {});
    }
  }, [authLoading, user, fetchUser]);

  useEffect(() => {
    if (authLoading || fetchingMatch) return;
    if (!match) return;

    const scorerId =
      typeof match.scorer === "string"
        ? match.scorer
        : match.scorer?._id ?? match.scorer?.toString();

    if (!user) {
      router.replace(`/match/${match._id}/live?category=${match.matchCategory}` as any);
      return;
    }

    if (scorerId && String(user._id) !== String(scorerId)) {
      router.replace(`/match/${match._id}/live?category=${match.matchCategory}` as any);
    }
  }, [authLoading, fetchingMatch, match, user, router]);

  // Only show loader on initial load, not during scoring operations
  if (!hasInitiallyLoaded && (fetchingMatch || authLoading)) {
    return (
      <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
        <View style={modernStyles.loadingContainer}>
          <View style={modernStyles.loadingIcon}>
            <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
          </View>
          <Text style={modernStyles.loadingText}>Loading match...</Text>
          <Text style={modernStyles.loadingSubtext}>Preparing live scoring interface</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match || !isCurrentMatchLoaded) {
    return (
      <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
        <View style={modernStyles.errorContainer}>
          <View style={modernStyles.errorIcon}>
            <Ionicons name="search-outline" size={48} color={tokens.colors.text.tertiary} />
          </View>
          <Text style={modernStyles.errorTitle}>Match not found</Text>
          <Text style={modernStyles.errorSubtitle}>
            The match you're looking for doesn't exist or has been removed
          </Text>
          <TouchableOpacity
            style={modernStyles.errorButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={16} color={tokens.colors.primary[600]} />
            <Text style={modernStyles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Individual matches
  if (match.matchCategory === "individual") {
    if (match.matchType === "singles") {
      return <SinglesScorer match={match} />;
    }
    if (match.matchType === "doubles" || match.matchType === "mixed_doubles") {
      return <DoublesScorer match={match} />;
    }
  }

  // Team matches (format is stored on matchFormat, not matchType)
  if (match.matchCategory === "team") {
    const teamMatch = match as TeamMatch;
    const format = teamMatch.matchFormat;
    if (format === "five_singles") {
      return <SwaythlingScorer match={teamMatch} />;
    }
    if (format === "single_double_single") {
      return <SingleDoubleSingleScorer match={teamMatch} />;
    }
    if (format === "custom") {
      if (!teamMatch.subMatches?.length) {
        return (
          <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
            <View style={modernStyles.errorContainer}>
              <View style={modernStyles.errorIcon}>
                <Ionicons name="list-outline" size={48} color={tokens.colors.text.tertiary} />
              </View>
              <Text style={modernStyles.errorTitle}>Rubbers not configured</Text>
              <Text style={modernStyles.errorSubtitle}>
                Add sub-matches (e.g. A vs X) before you can score this tie
              </Text>
              <TouchableOpacity
                style={modernStyles.errorButton}
                onPress={() =>
                  router.replace(
                    `/match/${teamMatch._id}/setup?category=team` as any
                  )
                }
              >
                <Ionicons name="settings-outline" size={16} color={tokens.colors.primary[600]} />
                <Text style={modernStyles.errorButtonText}>Configure rubbers</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }
      return <CustomFormatScorer match={teamMatch} />;
    }
  }

  // Fallback for unsupported match types
  return (
    <SafeAreaView style={[modernStyles.container, modernStyles.safeArea]} edges={["top"]}>
      <View style={modernStyles.errorContainer}>
        <View style={modernStyles.errorIcon}>
          <Ionicons name="help-circle-outline" size={48} color={tokens.colors.text.tertiary} />
        </View>
        <Text style={modernStyles.errorTitle}>Unsupported Match Type</Text>
        <Text style={modernStyles.errorSubtitle}>
          This match type cannot be scored in the live interface
        </Text>
        <TouchableOpacity
          style={modernStyles.errorButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={16} color={tokens.colors.primary[600]} />
          <Text style={modernStyles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  safeArea: {
    backgroundColor: tokens.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  loadingIcon: {
    marginBottom: tokens.spacing[2],
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  errorIcon: {
    marginBottom: tokens.spacing[4],
  },
  errorTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  errorSubtitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.md,
    marginTop: tokens.spacing[4],
  },
  errorButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
});