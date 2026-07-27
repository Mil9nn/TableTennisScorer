import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { axiosInstance } from "@/lib/axiosInstance";
import { PlayerLeaderboard } from "@/components/leaderboard/PlayerLeaderboard";
import { TeamLeaderboard } from "@/components/leaderboard/TeamLeaderboard";
import { LeaderboardQuickFilters } from "@/components/leaderboard/LeaderboardQuickFilters";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { UnifiedSearchBar } from "@/components/ui/UnifiedSearchBar";
import { useLeaderboardFilters } from "@/hooks/useFilters";
import { useThemeColors } from "@/hooks/useThemeColors";

type IndividualLeaderboardEntry = {
  rank: number;
  player: {
    _id: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  };
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    setsWon?: number;
    setsLost?: number;
    currentStreak?: number;
  };
};

type TeamLeaderboardEntry = {
  rank: number;
  team: {
    _id: string;
    name: string;
    logo?: string;
  };
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    subMatchesWon?: number;
    subMatchesLost?: number;
    currentStreak?: number;
  };
};

const PAGE_SIZE = 20;

const LEADERBOARD_TAB_ROUTES: TabRoute[] = [
  { key: "individual", title: "Individual" },
  { key: "team", title: "Team" },
];

export function LeaderboardView({ showBack = true }: { showBack?: boolean }) {
  const router = useRouter();
  const theme = useThemeColors();
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab = LEADERBOARD_TAB_ROUTES[tabIndex].key as "individual" | "team";

  const individualFilters = useLeaderboardFilters(300);

  const [individualLeaderboard, setIndividualLeaderboard] = useState<IndividualLeaderboardEntry[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [individualSkip, setIndividualSkip] = useState(0);
  const [teamSkip, setTeamSkip] = useState(0);

  const currentHasMore = activeTab === "individual" ? individualHasMore : teamHasMore;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        headerContainer: {
          padding: theme.spacing[4],
          backgroundColor: theme.colors.background.primary,
        },
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing[4],
        },
        backBtn: {
          marginRight: theme.spacing[3],
          padding: theme.spacing[2],
          marginLeft: -theme.spacing[2],
        },
        screenTitle: {
          fontSize: theme.typography.fontSize["2xl"],
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: theme.typography.letterSpacing.tight,
          color: theme.colors.text.primary,
        },
        searchRow: {
          marginBottom: theme.spacing[2],
        },
        tabViewWrapper: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
      }),
    [theme],
  );

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === "individual") {
          const params = individualFilters.buildQueryParams({
            limit: PAGE_SIZE,
            skip: 0,
          });
          const url = `/leaderboard/filtered?${params.toString()}`;
          const response = await axiosInstance.get(url);
          const leaderboard = Array.isArray(response.data?.leaderboard) ? response.data.leaderboard : [];
          const hasMore = Boolean(response.data?.pagination?.hasMore);
          const nextSkip = leaderboard.length;
          if (mounted) {
            setIndividualLeaderboard(leaderboard);
            setIndividualHasMore(hasMore);
            setIndividualSkip(nextSkip);
          }
        } else {
          const response = await axiosInstance.get(`/leaderboard/teams?limit=${PAGE_SIZE}&skip=0`);
          const leaderboard = Array.isArray(response.data?.leaderboard) ? response.data.leaderboard : [];
          const hasMore = Boolean(response.data?.pagination?.hasMore);
          const nextSkip = leaderboard.length;
          if (mounted) {
            setTeamLeaderboard(leaderboard);
            setTeamHasMore(hasMore);
            setTeamSkip(nextSkip);
          }
        }
      } catch (err: any) {
        const message = err?.response?.data?.error || err?.message || "Failed to load leaderboard";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      mounted = false;
    };
  }, [
    activeTab,
    individualFilters.filters.type,
    individualFilters.filters.matchFormat,
    individualFilters.filters.gender,
    individualFilters.filters.handedness,
    individualFilters.filters.dateFrom,
    individualFilters.filters.dateTo,
    individualFilters.buildQueryParams,
  ]);

  const fetchMore = useCallback(async () => {
    if (loading || loadingMore || !currentHasMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      if (activeTab === "individual") {
        const params = individualFilters.buildQueryParams({
          limit: PAGE_SIZE,
          skip: individualSkip,
        });
        const url = `/leaderboard/filtered?${params.toString()}`;
        const response = await axiosInstance.get(url);
        const nextRows = Array.isArray(response.data?.leaderboard) ? response.data.leaderboard : [];
        const hasMore = Boolean(response.data?.pagination?.hasMore);
        setIndividualLeaderboard((prev) => [...prev, ...nextRows]);
        setIndividualSkip((prev) => prev + nextRows.length);
        setIndividualHasMore(hasMore);
      } else {
        const response = await axiosInstance.get(
          `/leaderboard/teams?limit=${PAGE_SIZE}&skip=${teamSkip}`
        );
        const nextRows = Array.isArray(response.data?.leaderboard) ? response.data.leaderboard : [];
        const hasMore = Boolean(response.data?.pagination?.hasMore);
        setTeamLeaderboard((prev) => [...prev, ...nextRows]);
        setTeamSkip((prev) => prev + nextRows.length);
        setTeamHasMore(hasMore);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Failed to load more leaderboard entries";
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeTab,
    currentHasMore,
    individualFilters,
    individualSkip,
    loading,
    loadingMore,
    teamSkip,
  ]);

  const searchQuery = individualFilters.debouncedSearch;

  const visibleIndividualLeaderboard = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const source = individualLeaderboard;
    if (!normalized) return source;
    return source.filter((entry) => {
      const name = (entry.player.fullName || entry.player.username || "").toLowerCase();
      return name.includes(normalized);
    });
  }, [individualLeaderboard, searchQuery]);

  const visibleTeamLeaderboard = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const source = teamLeaderboard;
    if (!normalized) return source;
    return source.filter((entry) => entry.team.name.toLowerCase().includes(normalized));
  }, [teamLeaderboard, searchQuery]);

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, []);

  const quickFilterValues = useMemo(
    () => ({
      type: individualFilters.filters.type,
      matchFormat: individualFilters.filters.matchFormat,
      gender: individualFilters.filters.gender,
      handedness: individualFilters.filters.handedness,
      datePreset: individualFilters.filters.datePreset,
      dateFrom: individualFilters.filters.dateFrom,
      dateTo: individualFilters.filters.dateTo,
    }),
    [individualFilters.filters],
  );

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      const tabHasMore = route.key === "individual" ? individualHasMore : teamHasMore;
      const showLoadMoreFooter = loadingMore && route.key === activeTab;
      const listForRoute =
        route.key === "individual" ? visibleIndividualLeaderboard : visibleTeamLeaderboard;

      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background.tertiary }}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const distanceFromBottom =
                contentSize.height - (layoutMeasurement.height + contentOffset.y);
              if (distanceFromBottom < 220) {
                fetchMore();
              }
            }}
            scrollEventThrottle={200}
          >
            {loading ? (
              <View className="items-center px-6 py-10">
                <Text className="text-xs font-bold text-slate-400">Loading leaderboard...</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View className="items-center px-6 py-10">
                <Text className="text-xs font-bold text-rose-500">{error}</Text>
              </View>
            ) : null}

            {!loading && !error && listForRoute.length === 0 ? (
              <View className="items-center px-6 py-10">
                <Text className="text-xs font-bold text-slate-400">No leaderboard data found.</Text>
              </View>
            ) : null}

            {!loading && !error && listForRoute.length > 0 ? (
              <>
                {route.key === "individual" ? (
                  <PlayerLeaderboard
                    data={listForRoute
                      .filter((entry): entry is IndividualLeaderboardEntry => "player" in entry)
                      .map((entry) => ({
                        rank: entry.rank,
                        player: {
                          _id: entry.player._id,
                          username: entry.player.username || "",
                          fullName: entry.player.fullName,
                          profileImage: entry.player.profileImage,
                        },
                        stats: {
                          totalMatches: entry.stats.wins + entry.stats.losses,
                          wins: entry.stats.wins,
                          losses: entry.stats.losses,
                          winRate: entry.stats.winRate,
                          setsWon: (entry.stats as any).setsWon || 0,
                          setsLost: (entry.stats as any).setsLost || 0,
                          currentStreak: (entry.stats as any).currentStreak || 0,
                          bestStreak: 0,
                          totalPointsScored: (entry.stats as any).totalPointsScored || 0,
                          totalPointsConceded: (entry.stats as any).totalPointsConceded || 0,
                        },
                      }))}
                    loading={loading && route.key === activeTab}
                    emptyMessage="No players found"
                  />
                ) : (
                  <TeamLeaderboard
                    data={listForRoute
                      .filter((entry): entry is TeamLeaderboardEntry => "team" in entry)
                      .map((entry) => ({
                        rank: entry.rank,
                        team: entry.team,
                        playerStats: [],
                        stats: {
                          wins: entry.stats.wins,
                          losses: entry.stats.losses,
                          ties: 0,
                          winRate: entry.stats.winRate,
                          subMatchesWon: (entry.stats as any).subMatchesWon || 0,
                          subMatchesLost: (entry.stats as any).subMatchesLost || 0,
                          currentStreak: (entry.stats as any).currentStreak || 0,
                        },
                      }))}
                    loading={loading && route.key === activeTab}
                  />
                )}

                {showLoadMoreFooter ? (
                  <View className="items-center px-6 py-5">
                    <Text className="text-xs font-bold text-slate-400">Loading more...</Text>
                  </View>
                ) : null}
                {!showLoadMoreFooter && !tabHasMore ? (
                  <View className="items-center px-6 py-5">
                    <Text className="text-xs font-bold text-slate-300">End of leaderboard</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      );
    },
    [
      activeTab,
      error,
      fetchMore,
      individualHasMore,
      loading,
      loadingMore,
      teamHasMore,
      theme.colors.background.tertiary,
      visibleIndividualLeaderboard,
      visibleTeamLeaderboard,
    ]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={showBack ? ["top"] : []}>
      {showBack ? <StatusBar style="dark" /> : null}

      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.screenTitle}>Leaderboards</Text>
        </View>

        <View style={styles.searchRow}>
          <UnifiedSearchBar
            placeholder={activeTab === "individual" ? "Search players..." : "Search teams..."}
            value={individualFilters.filters.search}
            onChangeText={(text) => individualFilters.setFilter("search", text)}
          />
        </View>

        {activeTab === "individual" ? (
          <LeaderboardQuickFilters
            filters={quickFilterValues}
            onFiltersChange={(updates) => individualFilters.setFilters(updates)}
          />
        ) : null}
      </View>

      <View style={styles.tabViewWrapper}>
        <TournamentTabView
          routes={LEADERBOARD_TAB_ROUTES}
          index={tabIndex}
          onIndexChange={handleTabIndexChange}
          renderScene={renderScene}
          swipeEnabled
          lazy
        />
      </View>
    </SafeAreaView>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardView showBack />;
}
