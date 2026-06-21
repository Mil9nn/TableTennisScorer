import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { axiosInstance } from "@/lib/axiosInstance";
import { PlayerLeaderboard } from "@/components/leaderboard/PlayerLeaderboard";
import { TeamLeaderboard } from "@/components/leaderboard/TeamLeaderboard";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { DesignTokens } from "@/constants/designTokens";

const SEARCH_ICON_COLOR = DesignTokens.colors.info;

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

type MatchTypeFilter = "all" | "singles" | "doubles";
type GenderFilter = "" | "male" | "female";
type HandFilter = "" | "right" | "left";
type FormatFilter = "" | "friendly" | "tournament";

interface LeaderboardFilters {
  matchType: MatchTypeFilter;
  gender: GenderFilter;
  hand: HandFilter;
  format: FormatFilter;
}
const PAGE_SIZE = 20;

const LEADERBOARD_TAB_ROUTES: TabRoute[] = [
  { key: "individual", title: "Individual" },
  { key: "team", title: "Team" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab = LEADERBOARD_TAB_ROUTES[tabIndex].key as "individual" | "team";
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<LeaderboardFilters>({
    matchType: "all",
    gender: "",
    hand: "",
    format: "",
  });
  const [individualLeaderboard, setIndividualLeaderboard] = useState<IndividualLeaderboardEntry[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [individualSkip, setIndividualSkip] = useState(0);
  const [teamSkip, setTeamSkip] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const currentHasMore = activeTab === "individual" ? individualHasMore : teamHasMore;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === "individual") {
          const params = new URLSearchParams();
          params.set("limit", String(PAGE_SIZE));
          params.set("skip", "0");
          if (filters.matchType !== "all") params.set("type", filters.matchType);
          if (filters.format) params.set("matchFormat", filters.format);
          if (filters.gender) params.set("gender", filters.gender);
          if (filters.hand) params.set("handedness", filters.hand);
          const url = `/leaderboard/filtered${params.toString() ? `?${params.toString()}` : ""}`;
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
  }, [activeTab, filters]);

  const fetchMore = useCallback(async () => {
    if (loading || loadingMore || !currentHasMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      if (activeTab === "individual") {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("skip", String(individualSkip));
        if (filters.matchType !== "all") params.set("type", filters.matchType);
        if (filters.format) params.set("matchFormat", filters.format);
        if (filters.gender) params.set("gender", filters.gender);
        if (filters.hand) params.set("handedness", filters.hand);
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
    filters.format,
    filters.gender,
    filters.hand,
    filters.matchType,
    individualSkip,
    loading,
    loadingMore,
    teamSkip,
  ]);

  const visibleIndividualLeaderboard = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = individualLeaderboard;
    if (!normalized) return source;
    return source.filter((entry) => {
      const name = (entry.player.fullName || entry.player.username || "").toLowerCase();
      return name.includes(normalized);
    });
  }, [individualLeaderboard, query]);

  const visibleTeamLeaderboard = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = teamLeaderboard;
    if (!normalized) return source;
    return source.filter((entry) => entry.team.name.toLowerCase().includes(normalized));
  }, [teamLeaderboard, query]);

  const setFilter = <K extends keyof LeaderboardFilters>(
    key: K,
    value: LeaderboardFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFilterChipsSection = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: DesignTokens.animation.duration.normal,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setFiltersExpanded((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const hasQuickFiltersActive = useMemo(
    () =>
      filters.matchType !== "all" ||
      Boolean(filters.format) ||
      Boolean(filters.gender) ||
      Boolean(filters.hand),
    [filters.matchType, filters.format, filters.gender, filters.hand]
  );

  const clearQuickFilters = useCallback(() => {
    setFilters({
      matchType: "all",
      gender: "",
      hand: "",
      format: "",
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, []);

  useEffect(() => {
    if (activeTab === "team") {
      setFiltersExpanded(false);
    }
  }, [activeTab]);

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      const tabHasMore = route.key === "individual" ? individualHasMore : teamHasMore;
      const showLoadMoreFooter = loadingMore && route.key === activeTab;
      const listForRoute =
        route.key === "individual" ? visibleIndividualLeaderboard : visibleTeamLeaderboard;

      return (
        <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
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
      visibleIndividualLeaderboard,
      visibleTeamLeaderboard,
    ]
  );

  const renderIndividualFilters = () => (
    <View
      style={[styles.filterChipsSection, !filtersExpanded && styles.filterChipsSectionCollapsed]}
    >
      <View style={[styles.filterChipsBar, filtersExpanded && styles.filterChipsBarExpanded]}>
        <Pressable
          style={styles.filterChipsBarLeftPress}
          onPress={toggleFilterChipsSection}
          accessibilityRole="button"
          accessibilityLabel={filtersExpanded ? "Hide filters" : "Show filters"}
        >
          <View style={styles.filterChipsBarLeft}>
            <Text style={styles.filterChipsBarTitle}>Filters</Text>
            {hasQuickFiltersActive ? <View style={styles.filterActivePill} /> : null}
          </View>
        </Pressable>
        <View style={styles.filterChipsBarActions}>
          {hasQuickFiltersActive ? (
            <TouchableOpacity
              onPress={clearQuickFilters}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              style={styles.filterClearBtn}
            >
              <Text style={styles.filterClearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
          <Pressable
            onPress={toggleFilterChipsSection}
            style={styles.filterChipsChevronHit}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 4 }}
          >
            <Ionicons
              name={filtersExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={DesignTokens.colors.text.secondary}
            />
          </Pressable>
        </View>
      </View>

      {filtersExpanded ? (
        <>
          <View style={styles.filterLabeledRow}>
            <Text style={styles.filterRowLabel} numberOfLines={2}>
              Match type
            </Text>
            <View style={styles.filterRowChipsWrap}>
              {(
                [
                  { label: "All", value: "all" as const },
                  { label: "Singles", value: "singles" as const },
                  { label: "Doubles", value: "doubles" as const },
                ] as const
              ).map((chip) => {
                const isSelected = filters.matchType === chip.value;
                return (
                  <ChoiceChip
                    key={`lb-match-${chip.label}`}
                    selected={isSelected}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (chip.value === "all") {
                        setFilter("matchType", "all");
                      } else {
                        setFilter("matchType", isSelected ? "all" : chip.value);
                      }
                    }}
                  >
                    {chip.label}
                  </ChoiceChip>
                );
              })}
            </View>
          </View>

          <View style={styles.filterLabeledRow}>
            <Text style={styles.filterRowLabel} numberOfLines={2}>
              Format
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRowScroll}
              contentContainerStyle={styles.filterRowScrollContent}
            >
              {(
                [
                  { label: "All", value: "" as const },
                  { label: "Friendly", value: "friendly" as const },
                  { label: "Tournament", value: "tournament" as const },
                ] as const
              ).map((chip) => {
                const isSelected = filters.format === chip.value;
                return (
                  <ChoiceChip
                    key={`lb-format-${chip.label}`}
                    selected={isSelected}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (chip.value === "") {
                        setFilter("format", "");
                      } else {
                        setFilter("format", isSelected ? "" : chip.value);
                      }
                    }}
                  >
                    {chip.label}
                  </ChoiceChip>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterLabeledRow}>
            <Text style={styles.filterRowLabel} numberOfLines={2}>
              Gender
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRowScroll}
              contentContainerStyle={styles.filterRowScrollContent}
            >
              {(
                [
                  { label: "All", value: "" as const },
                  { label: "Male", value: "male" as const },
                  { label: "Female", value: "female" as const },
                ] as const
              ).map((chip) => {
                const isSelected = filters.gender === chip.value;
                return (
                  <ChoiceChip
                    key={`lb-gender-${chip.label}`}
                    selected={isSelected}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (chip.value === "") {
                        setFilter("gender", "");
                      } else {
                        setFilter("gender", isSelected ? "" : chip.value);
                      }
                    }}
                  >
                    {chip.label}
                  </ChoiceChip>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterLabeledRow}>
            <Text style={styles.filterRowLabel} numberOfLines={2}>
              Hand
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRowScroll}
              contentContainerStyle={styles.filterRowScrollContent}
            >
              {(
                [
                  { label: "All", value: "" as const },
                  { label: "Right", value: "right" as const },
                  { label: "Left", value: "left" as const },
                ] as const
              ).map((chip) => {
                const isSelected = filters.hand === chip.value;
                return (
                  <ChoiceChip
                    key={`lb-hand-${chip.label}`}
                    selected={isSelected}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (chip.value === "") {
                        setFilter("hand", "");
                      } else {
                        setFilter("hand", isSelected ? "" : chip.value);
                      }
                    }}
                  >
                    {chip.label}
                  </ChoiceChip>
                );
              })}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={20} color={DesignTokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Leaderboards</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
              <Ionicons
                name="search-outline"
                size={20}
                color={SEARCH_ICON_COLOR}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder={activeTab === "individual" ? "Search players..." : "Search teams..."}
                placeholderTextColor={DesignTokens.colors.text.tertiary}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={styles.searchBarInput}
                selectionColor={DesignTokens.colors.primary[600]}
              />
            </View>
          </View>
        </View>

        {activeTab === "individual" ? renderIndividualFilters() : null}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  headerContainer: {
    padding: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.background.primary,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  backBtn: {
    marginRight: DesignTokens.spacing[3],
    padding: DesignTokens.spacing[2],
    marginLeft: -DesignTokens.spacing[2],
  },
  screenTitle: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    letterSpacing: DesignTokens.typography.letterSpacing.tight,
    color: DesignTokens.colors.text.primary,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  searchInputContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DesignTokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
    padding: DesignTokens.spacing[4],
  },
  searchBarFocused: {
    borderBottomWidth: 2,
    borderBottomColor: SEARCH_ICON_COLOR,
  },
  searchIcon: {
    marginRight: DesignTokens.spacing[4],
    color: SEARCH_ICON_COLOR,
    ...DesignTokens.shadows.sm,
  },
  searchBarInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.primary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  tabViewWrapper: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  filterChipsSection: {
    paddingHorizontal: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.background.tertiary,
    borderRadius: DesignTokens.borderRadius.sm,
    marginTop: DesignTokens.spacing[2],
  },
  filterChipsSectionCollapsed: {
    gap: 0,
  },
  filterChipsBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipsBarLeftPress: {
    flex: 1,
    minWidth: 0,
    paddingRight: DesignTokens.spacing[2],
    height: 40,
  },
  filterChipsBarActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: DesignTokens.spacing[1],
  },
  filterChipsBarExpanded: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.colors.border.light,
    paddingBottom: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[1],
  },
  filterChipsBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  filterChipsBarTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
    letterSpacing: DesignTokens.typography.letterSpacing.tight,
    marginTop: DesignTokens.spacing[4],
  },
  filterActivePill: {
    width: DesignTokens.spacing[2],
    height: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.primary[600],
    ...DesignTokens.shadows.sm,
  },
  filterClearBtn: {
    paddingVertical: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: DesignTokens.colors.primary[50],
  },
  filterClearBtnText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.primary[700],
  },
  filterChipsChevronHit: {
    padding: DesignTokens.spacing[1],
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabeledRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DesignTokens.spacing[2],
    gap: DesignTokens.spacing[3],
  },
  filterRowLabel: {
    width: 90,
    flexShrink: 0,
    paddingTop: DesignTokens.spacing[1],
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    lineHeight: DesignTokens.typography.fontSize.sm * 1.35,
  },
  filterRowChipsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    minWidth: 0,
  },
  filterRowScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  filterRowScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    paddingVertical: 0,
  },
});
