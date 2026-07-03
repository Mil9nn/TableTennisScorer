import MatchesList from "@/components/MatchesList";
import { MatchQuickFilters } from "@/components/matches/MatchQuickFilters";
import TeamMatchesList from "@/components/TeamMatchesList";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import TeamMatchesListSkeleton from "@/components/skeletons/TeamMatchesListSkeleton";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { TextInput } from "react-native";
import { axiosInstance } from "@/lib/axiosInstance";
import { TeamMatch } from "@/types/match.type";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIndividualMatchFilters, useTeamMatchFilters } from "@/hooks/useFilters";
import { DesignTokens } from "@/constants/designTokens";

const ITEMS_PER_PAGE = 15;
const SEARCH_ICON_COLOR = DesignTokens.colors.info;

const MATCH_TAB_ROUTES: TabRoute[] = [
  { key: "individual", title: "Individual" },
  { key: "team", title: "Team" },
];

interface IndividualMatch {
  _id: string;
  participants?: { fullName?: string; profileImage?: string }[];
  matchType?: string;
  status: string;
  finalScore?: { setsByTeam?: number[]; setsById?: Record<string, number> };
  winnerSide?: string;
  city?: string;
  createdAt?: string;
}

export default function MatchesPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab = MATCH_TAB_ROUTES[tabIndex].key as "individual" | "team";

  // Individual matches state
  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>([]);
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualLoadingMore, setIndividualLoadingMore] = useState(false);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [individualPage, setIndividualPage] = useState(0);

  // Team matches state
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([] as TeamMatch[]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamLoadingMore, setTeamLoadingMore] = useState(false);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [teamPage, setTeamPage] = useState(0);

  // Production-grade filter hooks with debounced search
  const individualFilters = useIndividualMatchFilters(300);
  const teamFilters = useTeamMatchFilters(300);

  const [searchFocused, setSearchFocused] = useState(false);
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const contentTranslateY = React.useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: DesignTokens.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  // Fetch individual matches with server-side filtering
  const fetchIndividualMatches = useCallback(async (page: number, append = false) => {
    try {
      if (append) {
        setIndividualLoadingMore(true);
      } else {
        setIndividualLoading(true);
      }

      const skip = page * ITEMS_PER_PAGE;
      const params = individualFilters.buildQueryParams({ limit: ITEMS_PER_PAGE, skip });
      
      const { data } = await axiosInstance.get(`/matches/individual?${params.toString()}`);

      if (append) {
        setIndividualMatches((prev) => [...prev, ...(data.matches || [])]);
      } else {
        setIndividualMatches(data.matches || []);
      }

      setIndividualHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      console.error("Error fetching individual matches:", err);
    } finally {
      setIndividualLoading(false);
      setIndividualLoadingMore(false);
    }
  }, [individualFilters]);

  // Fetch team matches with server-side filtering
  const fetchTeamMatches = useCallback(async (page: number, append = false) => {
    try {
      if (append) {
        setTeamLoadingMore(true);
      } else {
        setTeamLoading(true);
      }

      const skip = page * ITEMS_PER_PAGE;
      const params = teamFilters.buildQueryParams({ limit: ITEMS_PER_PAGE, skip });

      const { data } = await axiosInstance.get(`/matches/team?${params.toString()}`);

      if (append) {
        setTeamMatches((prev) => [...prev, ...(data.matches || [])]);
      } else {
        setTeamMatches(data.matches || []);
      }

      setTeamHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      console.error("Error fetching team matches:", err);
    } finally {
      setTeamLoading(false);
      setTeamLoadingMore(false);
    }
  }, [teamFilters]);

  // Fetch individual matches on mount and when filters change
  useEffect(() => {
    if (activeTab === "individual") {
      setIndividualPage(0);
      fetchIndividualMatches(0, false);
    }
  }, [activeTab, individualFilters.debouncedSearch, individualFilters.filters.type, individualFilters.filters.status, individualFilters.filters.dateFrom, individualFilters.filters.dateTo, fetchIndividualMatches]);

  // Fetch team matches on mount and when filters change
  useEffect(() => {
    if (activeTab === "team") {
      setTeamPage(0);
      fetchTeamMatches(0, false);
    }
  }, [activeTab, teamFilters.debouncedSearch, teamFilters.filters.format, teamFilters.filters.status, teamFilters.filters.dateFrom, teamFilters.filters.dateTo, fetchTeamMatches]);

  // Load more individual matches
  const loadMoreIndividual = useCallback(() => {
    if (!individualLoadingMore && !individualLoading && individualHasMore && activeTab === "individual") {
      const nextPage = individualPage + 1;
      setIndividualPage(nextPage);
      fetchIndividualMatches(nextPage, true);
    }
  }, [individualLoadingMore, individualLoading, individualHasMore, individualPage, activeTab, fetchIndividualMatches]);

  // Load more team matches
  const loadMoreTeam = useCallback(() => {
    if (!teamLoadingMore && !teamLoading && teamHasMore && activeTab === "team") {
      const nextPage = teamPage + 1;
      setTeamPage(nextPage);
      fetchTeamMatches(nextPage, true);
    }
  }, [teamLoadingMore, teamLoading, teamHasMore, teamPage, activeTab, fetchTeamMatches]);

  // No more client-side filtering - data is already filtered from server
  const filteredIndividualMatches = individualMatches;
  const filteredTeamMatches = teamMatches;

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, []);

  const quickFilterValues = useMemo(
    () =>
      activeTab === "individual"
        ? {
            type: individualFilters.filters.type,
            format: "",
            status: individualFilters.filters.status,
            datePreset: individualFilters.filters.datePreset,
            dateFrom: individualFilters.filters.dateFrom,
            dateTo: individualFilters.filters.dateTo,
          }
        : {
            type: "",
            format: teamFilters.filters.format,
            status: teamFilters.filters.status,
            datePreset: teamFilters.filters.datePreset,
            dateFrom: teamFilters.filters.dateFrom,
            dateTo: teamFilters.filters.dateTo,
          },
    [activeTab, individualFilters.filters, teamFilters.filters]
  );

  const handleQuickFiltersChange = useCallback(
    (updates: Partial<typeof quickFilterValues>) => {
      if (activeTab === "individual") {
        individualFilters.setFilters(updates);
      } else {
        teamFilters.setFilters(updates);
      }
    },
    [activeTab, individualFilters, teamFilters]
  );

  const renderFooter = useCallback(() => {
    const isLoadingMore = activeTab === "individual" ? individualLoadingMore : teamLoadingMore;
    const hasMore = activeTab === "individual" ? individualHasMore : teamHasMore;
    const matchesLength = activeTab === "individual" ? individualMatches.length : teamMatches.length;

    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={DesignTokens.colors.primary[600]} />
          <Text style={styles.loadingText}>
            Loading more matches...
          </Text>
        </View>
      );
    }
    if (!hasMore && matchesLength > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>
            You've reached the end
          </Text>
        </View>
      );
    }
    return null;
  }, [
    activeTab,
    individualLoadingMore,
    teamLoadingMore,
    individualHasMore,
    teamHasMore,
    individualMatches.length,
    teamMatches.length,
  ]);

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      switch (route.key) {
        case "individual":
          return (
            <View style={styles.scene}>
              <MatchesList
                matches={filteredIndividualMatches}
                listHeader={undefined}
                ListEmptyComponent={
                  individualLoading && individualMatches.length === 0 ? (
                    <View style={styles.listEmptyFill}>
                      <MatchesListSkeleton />
                    </View>
                  ) : (
                    <View style={styles.listEmptyFill}>
                      <View style={styles.emptyCard}>
                        <Ionicons
                          name="tennisball-outline"
                          size={48}
                          color={DesignTokens.colors.text.tertiary}
                        />
                        <Text style={styles.emptyTitle}>No matches found</Text>
                        <Text style={styles.emptySubtitle}>
                          {individualMatches.length === 0
                            ? "Get started by creating your first match."
                            : "No matches match your current filters."}
                        </Text>
                      </View>
                    </View>
                  )
                }
                onEndReached={loadMoreIndividual}
                ListFooterComponent={renderFooter}
              />
            </View>
          );
        case "team":
          return (
            <View style={styles.scene}>
              <TeamMatchesList
                matches={filteredTeamMatches as TeamMatch[]}
                onMatchPress={(matchId) =>
                  router.push({
                    pathname: "/match/[id]",
                    params: { id: matchId, category: "team" },
                  })
                }
                listHeader={undefined}
                ListEmptyComponent={
                  teamLoading && teamMatches.length === 0 ? (
                    <TeamMatchesListSkeleton />
                  ) : (
                    <View style={styles.listEmptyFill}>
                      <View style={styles.emptyCard}>
                        <Ionicons
                          name="people-outline"
                          size={48}
                          color={DesignTokens.colors.text.tertiary}
                        />
                        <Text style={styles.emptyTitle}>No team matches found</Text>
                        <Text style={styles.emptySubtitle}>
                          {teamMatches.length === 0
                            ? "Get started by creating your first team match."
                            : "No matches match your current filters."}
                        </Text>
                      </View>
                    </View>
                  )
                }
                onEndReached={loadMoreTeam}
                ListFooterComponent={renderFooter}
              />
            </View>
          );
        default:
          return null;
      }
    },
    [
      filteredIndividualMatches,
      filteredTeamMatches,
      individualLoading,
      individualMatches.length,
      teamLoading,
      teamMatches.length,
      loadMoreIndividual,
      loadMoreTeam,
      renderFooter,
    ],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header - matching Next.js design */}
      <Animated.View>
        <View style={styles.headerContainer}>
          {/* Search Row */}
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
                  placeholder={
                    activeTab === "individual"
                      ? "Search by name or match id"
                      : "Search by team or match ID"
                  }
                  placeholderTextColor={DesignTokens.colors.text.tertiary}
                  value={
                    activeTab === "individual"
                      ? individualFilters.filters.search
                      : teamFilters.filters.search
                  }
                  onChangeText={(text) =>
                    activeTab === "individual"
                      ? individualFilters.setFilter("search", text)
                      : teamFilters.setFilter("search", text)
                  }
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={styles.searchBarInput}
                  selectionColor={DesignTokens.colors.primary[600]}
                />
              </View>
            </View>
          </View>
          
          <MatchQuickFilters
            tab={activeTab}
            filters={quickFilterValues}
            onFiltersChange={handleQuickFiltersChange}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.tabViewWrapper,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <TournamentTabView
          routes={MATCH_TAB_ROUTES}
          index={tabIndex}
          onIndexChange={handleTabIndexChange}
          renderScene={renderScene}
          swipeEnabled
          lazy
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Modern header styles
  headerContainer: {
    padding: DesignTokens.spacing[4],
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.normal,
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
  },
  scene: {
    flex: 1,
  },

  // Modern empty state design
  emptyCard: {
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
    maxWidth: 280,
  },
  listEmptyFill: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modern loading footer
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  noMoreContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing[4],
  },
  noMoreText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
});
