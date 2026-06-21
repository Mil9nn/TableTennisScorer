import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  RefreshControl,
  Alert,
  Animated,
  LayoutAnimation,
  Dimensions,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { axiosInstance } from "@/lib/axiosInstance";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/hooks/useAuthStore";
import { DesignTokens } from "@/constants/designTokens";
import Toast from "react-native-toast-message";
import { formatDateShort } from "@/lib/utils";
import { profilePath } from "@/lib/profile/navigation";
import {
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";
import { EnhancedStandingsTable } from "@/components/tournaments/EnhancedStandingsTable";
import { GroupsView } from "@/components/tournaments/GroupsView";
import TournamentSchedule from "@/components/tournaments/TournamentSchedule";
import { TournamentInviteDialog } from "@/components/tournaments/join-share";
import { ManageScorersDialog } from "@/components/tournaments/ManageScorersDialog";
import { ManageDoublesPairsDialog } from "@/components/tournaments/ManageDoublesPairsDialog";
import { SeedingManager } from "@/components/tournaments/SeedingManager";
import KnockoutBracketView from "@/components/tournaments/KnockoutBracketView";
import { HybridTournamentManager } from "@/components/tournaments/HybridTournamentManager";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { KnockoutStatistics } from "@/components/tournaments/statistics/KnockoutStatistics";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Tab components
import { InfoTab } from "./_tabs/InfoTab";
import { ScheduleTab } from "./_tabs/ScheduleTab";
import { ParticipantsTab } from "./_tabs/ParticipantsTab";
import { BracketTab } from "./_tabs/BracketTab";
import { ProgressTab } from "./_tabs/ProgressTab";
import { GroupsTab } from "./_tabs/GroupsTab";
import { StandingsTab } from "./_tabs/StandingsTab";
import { StatisticsTab } from "./_tabs/StatisticsTab";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import {
  buildTournamentReturnTo,
  navigateToTournamentMatch,
} from "@/lib/match/tournamentNavigation";
import {
  ActivityIndicator as PaperActivityIndicator,
  Button as PaperButton,
  Dialog as PaperDialog,
  Portal as PaperPortal,
  Text as PaperText,
} from "react-native-paper";

// Modern design utilities with responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const tokens = DesignTokens;

// Responsive breakpoints
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
const isLargeScreen = screenWidth >= 768;

// Mobile-first responsive spacing values
const containerHorizontal = isSmallScreen ? tokens.spacing[4] : tokens.spacing[4];
const containerVertical = isSmallScreen ? tokens.spacing[4] : tokens.spacing[4];

const responsiveSpacing = {
  container: {
    horizontal: containerHorizontal,
    vertical: containerVertical,
  },
  card: {
    padding: isSmallScreen ? tokens.spacing[4] : tokens.spacing[6],
    margin: isSmallScreen ? tokens.spacing[2] : tokens.spacing[4],
  },
  text: {
    header: isSmallScreen ? tokens.typography.fontSize.lg : tokens.typography.fontSize.xl,
    title: isSmallScreen ? tokens.typography.fontSize.base : tokens.typography.fontSize.lg,
    body: isSmallScreen ? tokens.typography.fontSize.sm : tokens.typography.fontSize.base,
  },
};

// Animation hooks
const useFadeIn = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: tokens.animation.duration.normal,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fadeIn();
  }, [fadeIn]);

  return { fadeAnim, fadeIn };
};

const useScaleIn = () => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scaleIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  useEffect(() => {
    scaleIn();
  }, [scaleIn]);

  return { scaleAnim, scaleIn };
};

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category: string;
  matchType?: string;
  startDate: string;
  endDate?: string;
  status: string;
  city: string;
  venue?: string;
  participants: any[];
  organizer?: any;
  drawGenerated?: boolean;
  rounds?: any[];
  groups?: any;
  bracket?: any;
  knockoutConfig?: any;
  hybridConfig?: any;
  joinCode?: string;
  allowJoinByCode?: boolean;
  scorers?: any[];
  seeding?: any[];
  seedingMethod?: string;
  useGroups?: boolean;
  numberOfGroups?: number;
  advancePerGroup?: number;
  currentPhase?: string;
  qualifiedParticipants?: any[];
  standings?: any[];
  rules?: {
    pointsForWin?: number;
    pointsForLoss?: number;
    setsPerMatch?: number;
    pointsPerSet?: number;
  };
  teamConfig?: {
    setsPerSubMatch?: number;
    matchFormat?: string;
  };
  doublesPairs?: any[];
  knockoutStatistics?: any;
}


// Modern Management Chip Component
const ModernManagementChip = ({
  onPress,
  icon,
  disabled = false,
  loading = false,
  label,
  color = tokens.colors.primary[600],
  variant = "outline",
}: {
  onPress: () => void;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  color?: string;
  variant?: "outline" | "primary";
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const isPrimary = variant === "primary";
  const backgroundColor = isPrimary ? color : tokens.colors.white;
  const borderColor = color;
  const textColor = isPrimary ? tokens.colors.white : color;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          modernStyles.managementChip,
          {
            backgroundColor: disabled ? tokens.colors.gray[100] : backgroundColor,
            borderColor: disabled ? tokens.colors.gray[300] : borderColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <PaperActivityIndicator size={16} color={textColor} />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={textColor}
          />
        )}
        <Text
          style={[
            modernStyles.managementChipLabel,
            { color: textColor },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default function TournamentDetailPage() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();

  // Modern state management with better organization
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generatingStats, setGeneratingStats] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [tabIndex, setTabIndex] = useState(0);

  // Dialog states
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [seedingManagerOpen, setSeedingManagerOpen] = useState(false);
  const [manageScorersOpen, setManageScorersOpen] = useState(false);
  const [manageDoublesPairsOpen, setManageDoublesPairsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // UI state
  const [managementActionsExpanded, setManagementActionsExpanded] = useState(false);
  const [groupRoundMatches, setGroupRoundMatches] = useState<any[]>([]);

  // Refs
  const latestFetchRequestIdRef = useRef(0);
  const hasInitialLoadCompletedRef = useRef(false);

  // Animation hooks
  const { fadeAnim } = useFadeIn();
  const { scaleAnim } = useScaleIn();

  
  const normalizeGroups = (rawGroups: any): any[] => {
    if (Array.isArray(rawGroups)) return rawGroups;
    if (rawGroups && Array.isArray(rawGroups.groups)) return rawGroups.groups;
    if (rawGroups && typeof rawGroups === "object") {
      return Object.values(rawGroups).filter(
        (group: any) =>
          group &&
          typeof group === "object" &&
          (group.groupId ||
            group.groupName ||
            Array.isArray(group.participants) ||
            Array.isArray(group.rounds) ||
            Array.isArray(group.standings)),
      );
    }
    return [];
  };

  const fetchRoundRobinMatches = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(
        `/tournaments/${id}/round-robin-matches`,
      );
      if (__DEV__) {
        const sample = Array.isArray(data?.matches) ? data.matches[0] : null;
        
      }
      setGroupRoundMatches(Array.isArray(data?.matches) ? data.matches : []);
    } catch (_error) {
      // Preserve previous hydrated matches on transient failures so schedule/groups
      // do not disappear when returning from scoring during server hiccups.
    }
  }, [id]);

  const fetchTournament = useCallback(
    async (skipLoading = false) => {
      const requestId = ++latestFetchRequestIdRef.current;
      if (!skipLoading) {
        setLoading(true);
      }
      try {
        const { data } = await axiosInstance.get(`/tournaments/${id}`);
        const tournamentData = data.tournament;


        const shouldHaveGroups =
          tournamentData?.format === "hybrid"
            ? tournamentData?.hybridConfig?.roundRobinUseGroups
            : tournamentData?.format === "round_robin"
              ? tournamentData?.useGroups
              : false;

        const normalizedGroupsFromTournament = normalizeGroups(
          tournamentData?.groups,
        );

        const mergeTransientSparseData = (incoming: any, fallbackGroups: any[]) => {
          return (prev: Tournament | null) => {
            if (!prev || prev._id !== incoming?._id) {
              return { ...incoming, groups: fallbackGroups };
            }

            const incomingGroups = Array.isArray(fallbackGroups) ? fallbackGroups : [];
            const prevGroups = normalizeGroups((prev as any).groups);
            const shouldPreserveGroups =
              (incoming?.format === "hybrid"
                ? incoming?.hybridConfig?.roundRobinUseGroups
                : incoming?.format === "round_robin"
                  ? incoming?.useGroups
                  : false) &&
              incoming?.drawGenerated &&
              incomingGroups.length === 0 &&
              prevGroups.length > 0;

            const incomingRounds = Array.isArray(incoming?.rounds) ? incoming.rounds : [];
            const prevRounds = Array.isArray((prev as any).rounds) ? (prev as any).rounds : [];
            const shouldPreserveRounds =
              incoming?.drawGenerated &&
              incoming?.format !== "knockout" &&
              incomingRounds.length === 0 &&
              prevRounds.length > 0;

            const incomingStandings = Array.isArray(incoming?.standings) ? incoming.standings : [];
            const prevStandings = Array.isArray((prev as any).standings) ? (prev as any).standings : [];
            const shouldPreserveStandings =
              incoming?.drawGenerated &&
              incomingStandings.length === 0 &&
              prevStandings.length > 0;

            return {
              ...incoming,
              groups: shouldPreserveGroups ? prevGroups : incomingGroups,
              rounds: shouldPreserveRounds ? prevRounds : incomingRounds,
              standings: shouldPreserveStandings ? prevStandings : incomingStandings,
            };
          };
        };


        if (shouldHaveGroups) {
          try {
            const groupsResponse = await axiosInstance.get(`/tournaments/${id}/groups`);

            const normalizedFallbackGroups = normalizeGroups(
              groupsResponse?.data?.groups ?? groupsResponse?.data,
            );


            // Prefer dedicated groups endpoint when it has usable data.
            // Fall back to tournament payload groups if endpoint returns empty.
            const resolvedGroups =
              normalizedFallbackGroups.length > 0
                ? normalizedFallbackGroups
                : normalizedGroupsFromTournament;


            if (requestId !== latestFetchRequestIdRef.current) return;
            setTournament(mergeTransientSparseData(tournamentData, resolvedGroups));
          } catch (groupsError) {
            console.error(
              "[TournamentDetail][fetchTournament] /tournaments/:id/groups failed",
              {
                tournamentId: id,
                error: groupsError,
              },
            );
            if (requestId !== latestFetchRequestIdRef.current) return;
            setTournament(
              mergeTransientSparseData(tournamentData, normalizedGroupsFromTournament),
            );
          }
        } else {
          if (requestId !== latestFetchRequestIdRef.current) return;
          setTournament(
            mergeTransientSparseData(tournamentData, normalizedGroupsFromTournament),
          );
        }
      } catch (err) {
        console.error("Error fetching tournament:", err);
        if (requestId !== latestFetchRequestIdRef.current) return;
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load tournament",
        });
      } finally {
        if (requestId !== latestFetchRequestIdRef.current) return;
        if (!skipLoading) {
          setLoading(false);
          hasInitialLoadCompletedRef.current = true;
        }
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    hasInitialLoadCompletedRef.current = false;
    fetchTournament();
    fetchRoundRobinMatches();
  }, [id, fetchTournament, fetchRoundRobinMatches]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      // Prevent refresh from racing initial load and leaving spinner stuck.
      if (!hasInitialLoadCompletedRef.current || loading) return;
      fetchTournament(true);
      fetchRoundRobinMatches();
    }, [id, fetchTournament, fetchRoundRobinMatches, loading]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchTournament(true), fetchRoundRobinMatches()]);
  }, [fetchTournament, fetchRoundRobinMatches]);

  const refreshTournamentAndMatches = useCallback(async () => {
    await Promise.all([fetchTournament(true), fetchRoundRobinMatches()]);
    // Some backends persist rounds immediately but hydrate round-robin matches shortly after.
    // Do a second pass to avoid empty schedule rows right after draw generation.
    setTimeout(() => {
      fetchRoundRobinMatches();
    }, 400);
  }, [fetchTournament, fetchRoundRobinMatches]);

  // Helper functions
  const isOrganizer = user && tournament?.organizer?._id === user._id;
  const isScorer =
    isOrganizer ||
    (user &&
      tournament?.scorers?.some(
        (scorer: any) =>
          scorer._id === user._id || scorer.toString() === user._id,
      ));
  const isInKnockoutPhase =
    tournament?.format === "knockout" ||
    (tournament?.format === "hybrid" &&
      tournament?.currentPhase === "knockout");
  const isCustomMatchingTournament =
    isInKnockoutPhase &&
    tournament?.knockoutConfig?.allowCustomMatching !== false;
  const isTeamTournament = tournament?.category === "team";

  const hasGroups = () => {
    if (tournament?.format === "round_robin") {
      return tournament.useGroups;
    }
    if (tournament?.format === "hybrid") {
      return tournament?.hybridConfig?.roundRobinUseGroups || false;
    }
    return false;
  };

  const tournamentGroups = normalizeGroups(tournament?.groups);
  const resolvedGroupParticipants =
    tournament?.matchType === "doubles" &&
      tournament?.doublesPairs &&
      tournament.doublesPairs.length > 0
      ? tournament.doublesPairs.map((pair: any) => {
        const player1Name =
          pair.player1?.fullName || pair.player1?.username || "Player 1";
        const player2Name =
          pair.player2?.fullName || pair.player2?.username || "Player 2";
        return {
          _id: pair._id?.toString?.() || String(pair._id),
          fullName: `${player1Name} / ${player2Name}`,
          username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
          profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
          isPair: true,
          player1: pair.player1,
          player2: pair.player2,
        };
      })
      : tournament?.participants || [];

  const getRoundRobinMatches = () => {
    const toId = (value: any): string => {
      if (value == null) return "";
      if (typeof value === "string" || typeof value === "number") {
        const id = String(value);
        return id !== "[object Object]" ? id : "";
      }
      if (typeof value === "object") {
        if (value.$oid) return String(value.$oid);
        if (typeof value.toHexString === "function") {
          try {
            const hex = value.toHexString();
            if (typeof hex === "string" && hex.length > 0) return hex;
          } catch {
            // continue
          }
        }
        if (value._id) return toId(value._id);
        if (value.id) return toId(value.id);
        const data = value?.buffer?.data;
        if (Array.isArray(data) && data.length === 12) {
          try {
            return data
              .map((b: number) => Number(b).toString(16).padStart(2, "0"))
              .join("");
          } catch {
            // continue
          }
        }
      }
      return "";
    };

    const extractMatchId = (value: any): string => {
      if (!value) return "";
      if (typeof value === "string" || typeof value === "number") return toId(value);
      if (typeof value === "object" && value.matchId) return toId(value.matchId);
      return toId(value);
    };

    const hydratedMatchById = new Map<string, any>(
      (groupRoundMatches || [])
        .map((match: any) => {
          const id = extractMatchId(match);
          return id ? [id, match] : null;
        })
        .filter(Boolean) as [string, any][],
    );

    if (hasGroups() && tournamentGroups.length > 0) {
      if (__DEV__) {
        const firstGroupMatch = tournamentGroups?.[0]?.rounds?.[0]?.matches?.[0];
        const firstGroupMatchId = extractMatchId(firstGroupMatch);
        const hydrated = firstGroupMatchId
          ? hydratedMatchById.get(firstGroupMatchId)
          : null;
        
      }
      return tournamentGroups.flatMap((g: any) =>
        (g.rounds && Array.isArray(g.rounds) ? g.rounds : []).flatMap(
          (r: any) =>
          (r.matches && Array.isArray(r.matches)
            ? r.matches.map((m: any) => {
              const matchId = extractMatchId(m);
              if (!matchId) return m;
              // Prefer hydrated full match objects (with score/status fields)
              // over shallow embedded refs from groups.rounds.
              return hydratedMatchById.get(matchId) || m;
            })
            : []),
        ),
      );
    }
    if (tournament?.rounds && Array.isArray(tournament.rounds)) {
      return tournament.rounds.flatMap((r: any) =>
        r.matches && Array.isArray(r.matches) ? r.matches : [],
      );
    }
    return [];
  };

  const getKnockoutMatches = () => {
    if (!tournament?.bracket) {
      return [];
    }
    const matches: any[] = [];
    if (tournament.bracket.rounds && Array.isArray(tournament.bracket.rounds)) {
      tournament.bracket.rounds.forEach((round: any) => {
        if (round.matches && Array.isArray(round.matches)) {
          round.matches.forEach((bracketMatch: any) => {
            if (
              bracketMatch.matchId &&
              typeof bracketMatch.matchId === "object"
            ) {
              matches.push(bracketMatch.matchId);
            }
          });
        }
      });
    }
    if (
      tournament.bracket.thirdPlaceMatch?.matchId &&
      typeof tournament.bracket.thirdPlaceMatch.matchId === "object"
    ) {
      matches.push(tournament.bracket.thirdPlaceMatch.matchId);
    }
    return matches;
  };

  const getAllMatches = () => {
    const roundRobinMatches = getRoundRobinMatches();
    const knockoutMatches = getKnockoutMatches();
    if (
      tournament?.format === "hybrid" &&
      tournament?.currentPhase === "knockout"
    ) {
      return [...roundRobinMatches, ...knockoutMatches];
    }
    if (isInKnockoutPhase && tournament?.bracket) {
      return knockoutMatches;
    }
    return roundRobinMatches;
  };

  const allMatchObjects = getAllMatches();
  const roundRobinMatches = getRoundRobinMatches();
  const knockoutMatches = getKnockoutMatches();
  const totalMatches = allMatchObjects.length;
  const completedMatches = allMatchObjects.filter(
    (m: any) => m?.status === "completed",
  ).length;
  const inProgressMatches = allMatchObjects.filter(
    (m: any) => m?.status === "in_progress",
  ).length;
  const scheduledMatches = allMatchObjects.filter(
    (m: any) => m?.status === "scheduled",
  ).length;

  const hasPlayedMatches = allMatchObjects.some(
    (m: any) => m?.status === "in_progress" || m?.status === "completed",
  );

  const canManageGroups = () => {
    if (!hasGroups()) return false;
    if (hasPlayedMatches) return false;
    if (tournament?.format === "hybrid") {
      if (tournamentGroups.length === 0) {
        return true;
      }
      const groupsHaveParticipants = tournamentGroups.some(
        (group: any) => group.participants && group.participants.length > 0,
      );
      return !groupsHaveParticipants || !tournament.drawGenerated;
    }
    return !tournament?.drawGenerated;
  };

  const getRoundsForSchedule = () => {
    const toId = (value: any): string => {
      if (value == null) return "";
      if (typeof value === "string" || typeof value === "number") {
        const id = String(value);
        return id !== "[object Object]" ? id : "";
      }
      if (typeof value === "object") {
        if (value.$oid) return String(value.$oid);
        if (typeof value.toHexString === "function") {
          try {
            const hex = value.toHexString();
            if (typeof hex === "string" && hex.length > 0) return hex;
          } catch {
            // continue
          }
        }
        if (value._id) return toId(value._id);
        if (value.id) return toId(value.id);
        const data = value?.buffer?.data;
        if (Array.isArray(data) && data.length === 12) {
          try {
            return data
              .map((b: number) => Number(b).toString(16).padStart(2, "0"))
              .join("");
          } catch {
            // continue
          }
        }
      }
      return "";
    };

    const extractMatchId = (value: any): string => {
      if (!value) return "";
      if (typeof value === "string" || typeof value === "number") return toId(value);
      if (typeof value === "object" && value.matchId) return toId(value.matchId);
      return toId(value);
    };

    if (hasGroups() && tournamentGroups.length > 0) {
      const roundsWithGroups: any[] = [];
      tournamentGroups.forEach((group: any) => {
        if (group.rounds && Array.isArray(group.rounds)) {
          group.rounds.forEach((round: any) => {
            const matchIds =
              (round.matches && Array.isArray(round.matches)
                ? round.matches
                  .map((m: any) => extractMatchId(m))
                  .filter((matchId: string) => !!matchId)
                : []) || [];
            roundsWithGroups.push({
              roundNumber: round.roundNumber || 0,
              matches: matchIds,
              completed: round.completed || false,
              scheduledDate: round.scheduledDate,
              groupName: group.groupName || "Unknown",
              groupId: group.groupId,
            });
          });
        }
      });
      return roundsWithGroups.sort((a, b) => {
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
        }
        return a.roundNumber - b.roundNumber;
      });
    }
    if (tournament?.rounds && Array.isArray(tournament.rounds)) {
      return tournament.rounds.map((round: any) => ({
        ...round,
        matches:
          (round.matches && Array.isArray(round.matches)
            ? round.matches
              .map((m: any) => extractMatchId(m))
              .filter((matchId: string) => !!matchId)
            : []) || [],
      }));
    }
    return [];
  };

  const roundsWithIds = getRoundsForSchedule();

  const canGenerateMatches =
    isOrganizer &&
    !tournament?.drawGenerated &&
    tournament?.status === "draft" &&
    (tournament?.participants?.length || 0) >= 2;

  // Action handlers
  const generateMatches = async () => {
    setGenerating(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${id}/generate-matches`,
      );
      await refreshTournamentAndMatches();

      if (data.stats.totalMatches === 0) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            "No matches were generated. Please check your tournament configuration.",
        });
      } else if (isCustomMatchingTournament) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2:
            "Bracket structure created! Use the Custom Matching interface to assign participants.",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Tournament draw generated! ${data.stats.totalMatches} matches created.`,
        });
      }
    } catch (err: any) {
      console.error("Error generating matches:", err);
      const apiError =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        "Failed to generate matches";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: apiError,
      });
      await refreshTournamentAndMatches();
    } finally {
      setGenerating(false);
    }
  };

  const confirmCancelTournament = async () => {
    setCancelling(true);
    try {
      await axiosInstance.post(`/tournaments/${id}/cancel`);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Tournament cancelled successfully",
      });
      setCancelDialogOpen(false);
      await fetchTournament();
    } catch (err: any) {
      console.error("Error cancelling tournament:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to cancel tournament",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleReset = async () => {
    Alert.alert(
      "Reset Tournament",
      "Are you sure you want to reset this tournament? All matches and standings will be removed. This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            try {
              await axiosInstance.post(`/tournaments/${id}/reset`);
              Toast.show({
                type: "success",
                text1: "Success",
                text2:
                  "Tournament reset successfully. You can now regenerate the draw.",
              });
              await fetchTournament();
            } catch (err: any) {
              console.error("Error resetting tournament:", err);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  err.response?.data?.error || "Failed to reset tournament",
              });
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  const handleGenerateStatistics = async () => {
    setGeneratingStats(true);
    try {
      await axiosInstance.post(`/tournaments/${id}/finalize`);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Statistics generated successfully!",
      });
      await fetchTournament(true);
    } catch (err: any) {
      console.error("Error generating statistics:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to generate statistics",
      });
    } finally {
      setGeneratingStats(false);
    }
  };

  const handleJoinCodeUpdate = (joinCode: string, allowJoinByCode: boolean) => {
    setTournament((prev) =>
      prev
        ? {
          ...prev,
          joinCode,
          allowJoinByCode,
        }
        : null,
    );
  };

  const handleScorersUpdate = async (scorers: any[]) => {
    setTournament((prev) =>
      prev
        ? {
          ...prev,
          scorers,
        }
        : null,
    );
    await fetchTournament(true);
  };

  const handleDoublesPairsUpdate = async (doublesPairs: any[]) => {
    setTournament((prev) =>
      prev
        ? {
          ...prev,
          doublesPairs,
        }
        : null,
    );
    await fetchTournament(true);
  };

  // Build tab items based on tournament state
  const getTabItems = useCallback(() => {
    const items: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { value: "info", label: "Info", icon: "information-circle-outline" },
    ];

    items.push({
      value: "participants",
      label: isTeamTournament ? "Teams" : "Players",
      icon: "people-outline",
    });

    items.push({ value: "progress", label: "Progress", icon: "analytics-outline" });

    if (tournament?.format !== "knockout") {
      items.push({ value: "schedule", label: "Schedule", icon: "calendar-outline" });
    }

    if (hasGroups()) {
      items.push({ value: "groups", label: "Groups", icon: "grid-outline" });
    }

    if (isInKnockoutPhase && tournament?.bracket) {
      items.push({ value: "bracket", label: "Bracket", icon: "trophy-outline" });
    }

    if (isInKnockoutPhase && tournament?.knockoutStatistics) {
      items.push({ value: "statistics", label: "Statistics", icon: "bar-chart-outline" });
    }

    if (!hasGroups() && tournament?.format !== "knockout") {
      items.push({ value: "standings", label: "Standings", icon: "podium-outline" });
    }

    return items;
  }, [isInKnockoutPhase, isTeamTournament, tournament?.bracket, tournament?.format, tournament?.knockoutStatistics]);

  const tabItems = useMemo(() => getTabItems(), [getTabItems]);

  // Persist selected tab in URL query params so reload keeps context.
  useEffect(() => {
    const requestedTab = typeof tab === "string" ? tab : "info";
    const validTabValues = new Set(tabItems.map((item) => item.value));

    if (validTabValues.has(requestedTab)) {
      if (activeTab !== requestedTab) {
        setActiveTab(requestedTab);
      }
      return;
    }

    // If tab from URL is invalid for current tournament state, reset to info.
    if (activeTab !== "info") {
      setActiveTab("info");
    }
    router.setParams({ tab: "info" });
  }, [tab, tabItems, activeTab, router]);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      if (nextTab !== activeTab) {
        setActiveTab(nextTab);
        const newIndex = tabItems.findIndex(item => item.value === nextTab);
        if (newIndex !== -1) {
          setTabIndex(newIndex);
        }
        router.setParams({ tab: nextTab });
      }
    },
    [router, activeTab, tabItems],
  );

  const handleTabIndexChange = useCallback(
    (index: number) => {
      if (index !== tabIndex && index >= 0 && index < tabItems.length) {
        setTabIndex(index);
        const nextTab = tabItems[index].value;
        if (nextTab !== activeTab) {
          setActiveTab(nextTab);
          router.setParams({ tab: nextTab });
        }
      }
    },
    [tabIndex, tabItems, activeTab, router],
  );

  // Convert tab items to TabRoute format for TournamentTabView
  const tabRoutes: TabRoute[] = useMemo(() => {
    return tabItems.map(item => ({
      key: item.value,
      title: item.label,
      icon: item.icon,
    }));
  }, [tabItems]);

  // Update tabIndex when activeTab changes from URL params
  useEffect(() => {
    const currentIndex = tabItems.findIndex(item => item.value === activeTab);
    if (currentIndex !== -1 && currentIndex !== tabIndex) {
      setTabIndex(currentIndex);
    }
  }, [activeTab, tabItems, tabIndex]);

  const buildTournamentMatchRoute = useCallback(
    (matchId: string) => {
      const category = isTeamTournament ? "team" : "individual";
      const returnTab = activeTab || "info";
      const returnTo = encodeURIComponent(buildTournamentReturnTo(id, returnTab));
      return `/match/${matchId}?category=${category}&returnTab=${returnTab}&returnTo=${returnTo}`;
    },
    [activeTab, id, isTeamTournament],
  );

  const resolveParticipantUserId = useCallback((participant: any): string | undefined => {
    if (!participant || typeof participant !== "object") return undefined;
    const toValidId = (value: any): string | undefined => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    // Prefer explicit user references first. Some tournament payloads contain
    // participant document ids in `_id`, which are not valid profile user ids.
    const candidates = [
      participant?.user?._id,
      participant?.userId,
      participant?.player?._id,
      participant?.playerId,
      participant?.member?._id,
      participant?.account?._id,
      participant?.profile?._id,
      participant?.id,
    ];
    for (const value of candidates) {
      const id = toValidId(value);
      if (id) return id;
    }

    // Only trust `_id` when the participant itself looks like a populated user object.
    const looksLikeUser =
      typeof participant?.username === "string" ||
      typeof participant?.fullName === "string" ||
      typeof participant?.profileImage === "string";

    if (looksLikeUser) {
      const id = toValidId(participant?._id);
      if (id) return id;
    }
    return undefined;
  }, []);

  // Modern loading state
  if (loading) {
    return (
      <SafeAreaView style={modernStyles.container} edges={["top"]}>
        <Animated.View style={[modernStyles.loaderContainer, { opacity: fadeAnim }]}>
          <View style={modernStyles.loadingIndicator}>
            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
            <PaperText style={modernStyles.loaderLabel}>Loading tournament details...</PaperText>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Modern empty state
  if (!tournament) {
    return (
      <SafeAreaView style={modernStyles.container} edges={["top"]}>
        <Animated.View style={[modernStyles.emptyContainer, { opacity: fadeAnim }]}>
          <View style={modernStyles.emptyIcon}>
            <Ionicons name="trophy-outline" size={44} color={tokens.colors.gray[400]} />
          </View>
          <Text style={modernStyles.emptyTitle}>Tournament Not Found</Text>
          <Text style={modernStyles.emptySubtitle}>
            The tournament you're looking for doesn't exist or has been removed.
          </Text>
          <Pressable
            style={modernStyles.emptyAction}
            onPress={() => router.back()}
          >
            <Text style={modernStyles.emptyActionText}>Go Back</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <TournamentErrorBoundary>
      <SafeAreaView style={modernStyles.container} edges={["top"]}>
        <View style={modernStyles.mainContent}>
          <View
            style={modernStyles.contentContainer}
          >
            {/* Header */}
            <View className="border-b border-gray-100 bg-white/90 shadow-sm">
              <View className="flex-row items-center gap-3 px-4 h-14">
                <Pressable
                  onPress={() => router.back()}
                  className="p-1.5 rounded-md active:bg-gray-100"
                >
                  <Ionicons name="chevron-back" size={20} color="#0f172a" />
                </Pressable>
                <View className="flex-1 min-w-0">
                  <Text className="text-lg font-semibold text-slate-900" numberOfLines={1}>
                    {tournament.name}
                  </Text>
                </View>
                <Text style={modernStyles.statusText}>
                  {tournament.status?.replace("_", " ") || "Draft"}
                </Text>
              </View>
            </View>

            {/* Scorer Banner */}
            {isScorer && !isOrganizer && (
              <Animated.View style={[modernStyles.scorerBanner, { opacity: fadeAnim }]}>
                <View style={modernStyles.scorerBannerContent}>
                  <View style={modernStyles.scorerIcon}>
                    <Ionicons name="clipboard-outline" size={20} color={tokens.colors.primary[600]} />
                  </View>
                  <View style={modernStyles.scorerText}>
                    <Text style={modernStyles.scorerTitle}>Scorer Access</Text>
                    <Text style={modernStyles.scorerSubtitle}>
                      You can score matches in this tournament. Navigate to Schedule or Bracket tab to get started.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Management Section */}
            {isOrganizer && (
              <Animated.View style={[modernStyles.managementSection, { opacity: fadeAnim }]}>
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.create(
                        tokens.animation.duration.normal,
                        LayoutAnimation.Types.easeInEaseOut,
                        LayoutAnimation.Properties.opacity,
                      ),
                    );
                    setManagementActionsExpanded(!managementActionsExpanded);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={modernStyles.managementHeader}
                >
                  <View style={modernStyles.managementHeaderLeft}>
                    <View style={modernStyles.managementIcon}>
                      <Ionicons name="settings-outline" size={20} color={tokens.colors.primary[600]} />
                    </View>
                    <Text style={modernStyles.managementTitle}>Management & Actions</Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: managementActionsExpanded ? '180deg' : '0deg'
                      }]
                    }}
                  >
                    <Ionicons name="chevron-down" size={20} color={tokens.colors.primary[600]} />
                  </Animated.View>
                </Pressable>

                {managementActionsExpanded && (
                  <Animated.View style={[modernStyles.managementContent, { opacity: fadeAnim }]}>
                    {/* Management Group */}
                    <View style={modernStyles.managementGroup}>
                      <Text style={modernStyles.managementGroupTitle}>Management</Text>
                      <View style={modernStyles.managementGrid}>
                        <ModernManagementChip
                          onPress={() => router.push(`/tournaments/${tournament._id}/manage-participants`)}
                          icon={isTeamTournament ? "account-group-outline" : "account-multiple-outline"}
                          disabled={tournament.status === "completed" || tournament.drawGenerated}
                          label={isTeamTournament ? "Teams" : "Participants"}
                          color={tokens.colors.primary[600]}
                        />

                        {tournament.category === "individual" && tournament.matchType === "doubles" && (
                          <ModernManagementChip
                            onPress={() => setManageDoublesPairsOpen(true)}
                            icon="account-switch-outline"
                            disabled={tournament.status === "completed" || tournament.drawGenerated}
                            label={`Pairs (${tournament.doublesPairs?.length || 0} / ${Math.floor(tournament.participants.length / 2)})`}
                            color={tokens.colors.info}
                          />
                        )}

                        {hasGroups() && (
                          <ModernManagementChip
                            onPress={() => {
                              const groupsData = JSON.stringify(tournamentGroups);
                              const participantsData = JSON.stringify(resolvedGroupParticipants);
                              const url = `/tournaments/${tournament._id}/manage-groups?groups=${encodeURIComponent(groupsData)}&participants=${encodeURIComponent(participantsData)}&tournamentId=${tournament._id}`;
                              router.push(url as any);
                            }}
                            icon="view-grid-outline"
                            disabled={tournament.status === "completed" || tournament.drawGenerated || hasPlayedMatches}
                            label="Groups"
                            color={tokens.colors.warning}
                          />
                        )}

                        <ModernManagementChip
                          onPress={() => setManageScorersOpen(true)}
                          icon="account-check-outline"
                          disabled={tournament.status === "completed"}
                          label="Scorers"
                          color={tokens.colors.success}
                        />

                        <ModernManagementChip
                          onPress={() => setJoinCodeDialogOpen(true)}
                          icon="share-variant"
                          disabled={tournament.status === "completed" || tournament.drawGenerated}
                          label="Invite"
                          color={tokens.colors.gray[600]}
                        />
                      </View>
                    </View>

                    {/* Actions Group */}
                    <View style={modernStyles.managementGroup}>
                      <Text style={modernStyles.managementGroupTitle}>Actions</Text>
                      <View style={modernStyles.managementGrid}>
                        {canGenerateMatches && (
                          <ModernManagementChip
                            onPress={generateMatches}
                            disabled={generating || tournament.status === "completed" || tournament.drawGenerated}
                            loading={generating}
                            icon={isCustomMatchingTournament ? "source-branch" : "shuffle-variant"}
                            label={generating ? (isCustomMatchingTournament ? "Generating Bracket..." : "Generating...") : (isCustomMatchingTournament ? "Generate Bracket" : "Generate Draw")}
                            color={tokens.colors.primary[600]}
                            
                          />
                        )}

                        {isCustomMatchingTournament && tournament.drawGenerated && (
                          <ModernManagementChip
                            onPress={() => router.push(`/tournaments/${id}/custom-matching`)}
                            disabled={tournament.status === "completed"}
                            icon="tune-variant"
                            label="Configure Matchups"
                            color={tokens.colors.info}
                          />
                        )}

                        <ModernManagementChip
                          onPress={() => setSeedingManagerOpen(true)}
                          disabled={tournament.status === "completed" || hasPlayedMatches || !tournament.drawGenerated}
                          icon="seed-outline"
                          label="Seeding"
                          color={tokens.colors.warning}
                        />

                        <ModernManagementChip
                          onPress={handleReset}
                          disabled={resetting || tournament.status === "completed" || !tournament.drawGenerated}
                          loading={resetting}
                          icon="restore"
                          label={resetting ? "Resetting..." : "Reset"}
                          color={tokens.colors.error}
                        />

                        {tournament.status !== "cancelled" && tournament.status !== "completed" && (
                          <ModernManagementChip
                            onPress={handleCancel}
                            disabled={cancelling}
                            loading={cancelling}
                            icon="close-circle-outline"
                            label={cancelling ? "Cancelling..." : "Cancel"}
                            color={tokens.colors.error}
                          />
                        )}

                        {isInKnockoutPhase && tournament.bracket?.completed && (
                          <ModernManagementChip
                            onPress={handleGenerateStatistics}
                            disabled={generatingStats}
                            loading={generatingStats}
                            icon="chart-line"
                            label={generatingStats ? "Generating..." : (tournament.knockoutStatistics ? "Regenerate Statistics" : "Generate Statistics")}
                            color={tokens.colors.success}
                          />
                        )}
                      </View>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* Tab Content */}
            <TournamentTabView
              routes={tabRoutes}
              index={tabIndex}
              onIndexChange={handleTabIndexChange}
              renderScene={({ route }) => {
                // Debug logs to understand the data flow
                
                switch (route.key) {
                  case "info":
                    
                    return (
                      <ScrollView 
                        style={{ flex: 1 }} 
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                          <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={tokens.colors.primary[600]}
                            colors={[tokens.colors.primary[600]]}
                          />
                        }
                      >
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <InfoTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          scaleAnim={scaleAnim}
                          isTeamTournament={isTeamTournament}
                        />
                      </ScrollView>
                    );
                  
                  case "progress":
                    return (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <ProgressTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          scaleAnim={scaleAnim}
                          totalMatches={totalMatches}
                          completedMatches={completedMatches}
                          inProgressMatches={inProgressMatches}
                          scheduledMatches={scheduledMatches}
                          tournamentId={id}
                          isOrganizer={!!isOrganizer}
                          onUpdate={() => fetchTournament(true)}
                        />
                      </ScrollView>
                    );
                  
                  case "groups":
                    return hasGroups() ? (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <GroupsTab
                          tournament={tournament}
                          tournamentGroups={tournamentGroups}
                          resolvedGroupParticipants={resolvedGroupParticipants}
                          fadeAnim={fadeAnim}
                        />
                      </ScrollView>
                    ) : null;
                  
                  case "standings":
                    return !hasGroups() && tournament.format !== "knockout" ? (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <StandingsTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          tournamentId={id}
                        />
                      </ScrollView>
                    ) : null;
                  
                  case "schedule":
                    return tournament.format !== "knockout" ? (
                      <View style={{ flex: 1 }}>
                        <ScheduleTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          roundsWithIds={roundsWithIds}
                          roundRobinMatches={roundRobinMatches}
                          refreshing={refreshing}
                          isCustomMatchingTournament={isCustomMatchingTournament}
                          buildTournamentMatchRoute={buildTournamentMatchRoute}
                          onRefresh={onRefresh}
                          onMatchClick={(matchId) => {
                            navigateToTournamentMatch(router, {
                              matchId,
                              category: isTeamTournament ? "team" : "individual",
                              tournamentId: id,
                              returnTab: activeTab || "schedule",
                            });
                          }}
                        />
                      </View>
                    ) : null;
                  
                  case "participants":
                    return (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <ParticipantsTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          scaleAnim={scaleAnim}
                          isTeamTournament={isTeamTournament}
                          onParticipantPress={(p) => {
                            if (isTeamTournament) {
                              router.push(`/teams/${p._id}`);
                            } else {
                              const targetUserId = resolveParticipantUserId(p);
                              if (!targetUserId) {
                                Toast.show({
                                  type: "error",
                                  text1: "Unable to open profile",
                                  text2: "Player ID is missing for this participant.",
                                });
                                return;
                              }
                              router.push(profilePath(targetUserId));
                            }
                          }}
                        />
                      </ScrollView>
                    );
                  
                  case "bracket":
                    return isInKnockoutPhase && tournament.bracket ? (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <BracketTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                          knockoutMatches={knockoutMatches}
                          buildTournamentMatchRoute={buildTournamentMatchRoute}
                        />
                      </ScrollView>
                    ) : null;
                  
                  case "statistics":
                    return isInKnockoutPhase && tournament.knockoutStatistics ? (
                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {refreshing && (
                          <Animated.View style={[modernStyles.refreshIndicator, { opacity: fadeAnim }]}>
                            <PaperActivityIndicator size="small" color={tokens.colors.primary[600]} />
                            <Text style={modernStyles.refreshText}>Refreshing tournament data...</Text>
                          </Animated.View>
                        )}
                        <StatisticsTab
                          tournament={tournament}
                          fadeAnim={fadeAnim}
                        />
                      </ScrollView>
                    ) : null;
                  
                  default:
                    return null;
                }
              }}
              swipeEnabled={true}
              animationEnabled={true}
              lazy={true}
            />
          </View>

        </View>

        {/* Dialogs */}
        {tournament && (
          <>
            <PaperPortal>
              <PaperDialog
                visible={cancelDialogOpen}
                onDismiss={() => !cancelling && setCancelDialogOpen(false)}
                style={modernStyles.confirmDialog}
              >
                <PaperDialog.Title>Cancel Tournament</PaperDialog.Title>
                <PaperDialog.Content>
                  <PaperText variant="bodyMedium" style={modernStyles.confirmDialogText}>
                    Are you sure you want to cancel this tournament? This action cannot be undone.
                  </PaperText>
                </PaperDialog.Content>
                <PaperDialog.Actions>
                  <PaperButton
                    onPress={() => setCancelDialogOpen(false)}
                    disabled={cancelling}
                  >
                    No
                  </PaperButton>
                  <PaperButton
                    mode="contained"
                    buttonColor="#dc2626"
                    textColor="#ffffff"
                    onPress={confirmCancelTournament}
                    loading={cancelling}
                    disabled={cancelling}
                    style={modernStyles.cancelButton}
                  >
                    Yes Cancel
                  </PaperButton>
                </PaperDialog.Actions>
              </PaperDialog>
            </PaperPortal>

            <TournamentInviteDialog
              visible={joinCodeDialogOpen}
              onClose={() => setJoinCodeDialogOpen(false)}
              tournamentId={tournament._id}
              tournamentName={tournament.name}
              joinCode={tournament.joinCode}
              allowJoinByCode={tournament.allowJoinByCode || false}
              onUpdate={handleJoinCodeUpdate}
            />

            <SeedingManager
              visible={seedingManagerOpen}
              onClose={() => setSeedingManagerOpen(false)}
              tournamentId={tournament._id}
              participants={tournament.participants}
              currentSeeding={tournament.seeding || []}
              onUpdate={() => fetchTournament(true)}
              category={tournament.category as "individual" | "team"}
            />

            <ManageScorersDialog
              visible={manageScorersOpen}
              onClose={() => setManageScorersOpen(false)}
              tournamentId={tournament._id}
              organizer={tournament.organizer}
              scorers={tournament.scorers || []}
              onUpdate={handleScorersUpdate}
            />

            {tournament.category === "individual" &&
              tournament.matchType === "doubles" && (
                <ManageDoublesPairsDialog
                  visible={manageDoublesPairsOpen}
                  onClose={() => setManageDoublesPairsOpen(false)}
                  tournamentId={tournament._id}
                  participants={tournament.participants || []}
                  existingPairs={tournament.doublesPairs || []}
                  onUpdate={handleDoublesPairsUpdate}
                  disabled={!!tournament.drawGenerated}
                />
              )}
          </>
        )}
      </SafeAreaView>
    </TournamentErrorBoundary>
  );
}

// Styles — only those actively referenced in JSX above
const modernStyles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },

  // Loading States
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[24],
  },
  loadingIndicator: {
    alignItems: 'center',
    gap: tokens.spacing[12],
    marginTop: tokens.spacing[20],
  },
  loaderLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  // Status Text (header badge)
  statusText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
    textTransform: 'uppercase',
  },

  // Scorer Banner
  scorerBanner: {
    marginHorizontal: tokens.spacing[16],
    marginBottom: tokens.spacing[16],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[16],
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.primary[600],
    ...tokens.shadows.sm,
  },
  scorerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[12],
  },
  scorerIcon: {
    backgroundColor: tokens.colors.primary[100],
    padding: tokens.spacing[8],
    borderRadius: tokens.borderRadius.base,
  },
  scorerText: {
    flex: 1,
  },
  scorerTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[800],
    marginBottom: tokens.spacing[4],
  },
  scorerSubtitle: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary[600],
  },

  // Management Section
  managementSection: {
    margin: tokens.spacing[4],
    backgroundColor: tokens.colors.white,
    ...tokens.shadows.sm,
  },
  managementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
  },
  managementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  managementContent: {
    padding: tokens.spacing[4],
    paddingTop: 0,
  },
  managementGroup: {
    marginBottom: tokens.spacing[6],
  },
  managementGroupTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[3],
    textTransform: 'uppercase',
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[6],
  },
  managementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
  },
  managementChipLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  // Refresh Indicator
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.white,
    marginHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[2],
    borderRadius: tokens.borderRadius.lg,
    ...tokens.shadows.sm,
  },
  refreshText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[24],
  },
  emptyIcon: {
    marginBottom: tokens.spacing[16],
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[8],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing[20],
  },
  emptyAction: {
    backgroundColor: tokens.colors.primary[600],
    paddingHorizontal: tokens.spacing[20],
    paddingVertical: tokens.spacing[12],
    borderRadius: tokens.borderRadius.base,
    ...tokens.shadows.md,
  },
  emptyActionText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  // Dialog
  confirmDialog: {
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.white,
  },
  confirmDialogText: {
    color: tokens.colors.text.secondary,
  },
  cancelButton: {
    borderRadius: tokens.borderRadius.sm,
  },

  // Main Content Layout
  mainContent: {
    flex: 1,
  },

  // Bottom Tabs
  bottomTabsContainer: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    ...tokens.shadows.md,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.base,
    minHeight: 60,
  },
  bottomTabActive: {
    backgroundColor: tokens.colors.primary[50],
  },
  bottomTabInactive: {
    backgroundColor: 'transparent',
  },
  bottomTabLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    marginTop: tokens.spacing[1],
    textAlign: 'center',
  },
  bottomTabLabelActive: {
    color: tokens.colors.primary[600],
  },
  bottomTabLabelInactive: {
    color: tokens.colors.gray[500],
  },
});
