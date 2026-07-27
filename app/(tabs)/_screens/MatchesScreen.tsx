import MatchesList from "@/components/MatchesList";
import {
  MatchQuickFilters,
  type MatchFeedTab,
} from "@/components/matches/MatchQuickFilters";
import TeamMatchesList from "@/components/TeamMatchesList";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import DoublesMatchesListSkeleton from "@/components/skeletons/DoublesMatchesListSkeleton";
import TeamMatchesListSkeleton from "@/components/skeletons/TeamMatchesListSkeleton";
import { ListEmptyState } from "@/components/ui/ListEmptyState";
import { ListFetchError } from "@/components/ui/ListFetchError";
import { RefreshableListShell } from "@/components/ui/RefreshableListShell";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { UnifiedSearchBar } from "@/components/ui/UnifiedSearchBar";
import { axiosInstance } from "@/lib/axiosInstance";
import { getMatchOpenHref } from "@/lib/matchNavigation";
import { TeamMatch } from "@/types/match.type";
import {
  DEFAULT_INDIVIDUAL_MATCH_FILTERS,
  DEFAULT_TEAM_MATCH_FILTERS,
  useIndividualMatchFilters,
  useTeamMatchFilters,
  type IndividualMatchFilters,
  type TeamMatchFilters,
} from "@/hooks/useFilters";
import { useThemeColors } from "@/hooks/useThemeColors";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 15;
const FILTERS_STORAGE_KEY = "matches.feed.filters.v2";

/** Toggle on to preview skeleton UI while editing. Set back to false before shipping. */
const PREVIEW_MATCHES_SKELETON = false;

const TAB_KEYS: MatchFeedTab[] = ["singles", "doubles", "team"];

const MATCH_TAB_ROUTES: TabRoute[] = [
  { key: "singles", title: "Singles" },
  { key: "doubles", title: "Doubles" },
  { key: "team", title: "Teams" },
];

interface IndividualMatch {
  _id: string;
  participants?: { fullName?: string; profileImage?: string; username?: string }[];
  matchType?: string;
  status: string;
  finalScore?: { setsByTeam?: number[]; setsById?: Record<string, number> };
  winnerSide?: string;
  city?: string;
  venue?: string;
  tournament?: { name?: string } | null;
  courtNumber?: number;
  startedAt?: string;
  createdAt?: string;
  matchDuration?: number;
  numberOfSets?: number;
}

export default function MatchesPage() {
  const theme = useThemeColors();
  const [tabIndex, setTabIndex] = useState(0);

  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const individualFilters = useIndividualMatchFilters(300);
  const teamFilters = useTeamMatchFilters(300);

  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>([]);
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualLoadingMore, setIndividualLoadingMore] = useState(false);
  const [individualHasMore, setIndividualHasMore] = useState(true);
  const [individualPage, setIndividualPage] = useState(0);
  const [individualFetchError, setIndividualFetchError] = useState<string | null>(null);

  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([] as TeamMatch[]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamLoadingMore, setTeamLoadingMore] = useState(false);
  const [teamHasMore, setTeamHasMore] = useState(true);
  const [teamPage, setTeamPage] = useState(0);
  const [teamFetchError, setTeamFetchError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const goToCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/match/create");
  }, []);

  const activeTab: MatchFeedTab = TAB_KEYS[tabIndex] ?? "singles";
  const isIndividualTab = activeTab === "singles" || activeTab === "doubles";
  const activeMatchType = activeTab === "doubles" ? "doubles" : "singles";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        hostCta: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing[3],
          marginBottom: theme.spacing[2],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          backgroundColor: theme.colors.white,
          ...theme.shadows.base,
        },
        hostCtaText: {
          flexShrink: 1,
          flexGrow: 1,
          minWidth: 0,
          marginRight: theme.spacing[2],
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        startBtn: {
          flexGrow: 0,
          flexShrink: 0,
          height: 32,
          paddingHorizontal: 14,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[600],
          alignItems: "center",
          justifyContent: "center",
        },
        startBtnText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.white,
          includeFontPadding: false,
        },
        toolbar: {
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[2],
          gap: theme.spacing[2],
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        tabViewWrapper: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        tabViewInner: { flex: 1 },
        scene: { flex: 1 },
        listEmptyFill: {
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        loadingFooter: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing[4],
          gap: theme.spacing[2],
        },
        loadingText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.medium,
        },
        noMoreContainer: {
          alignItems: "center",
          paddingVertical: theme.spacing[4],
        },
        noMoreText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }),
    [theme],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as {
            individual?: Partial<IndividualMatchFilters>;
            team?: Partial<TeamMatchFilters>;
            tabIndex?: number;
            feedTab?: string;
          };
          if (parsed.individual) {
            individualFilters.setFilters({
              ...DEFAULT_INDIVIDUAL_MATCH_FILTERS,
              ...parsed.individual,
              type: "",
            });
          }
          if (parsed.team) {
            teamFilters.setFilters({
              ...DEFAULT_TEAM_MATCH_FILTERS,
              ...parsed.team,
            });
          }
          if (
            typeof parsed.feedTab === "string" &&
            TAB_KEYS.includes(parsed.feedTab as MatchFeedTab)
          ) {
            setTabIndex(TAB_KEYS.indexOf(parsed.feedTab as MatchFeedTab));
          } else if (
            typeof parsed.tabIndex === "number" &&
            parsed.tabIndex >= 0 &&
            parsed.tabIndex <= 2
          ) {
            setTabIndex(parsed.tabIndex);
          }
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setFiltersHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    AsyncStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        individual: { ...individualFilters.filters, type: "" },
        team: teamFilters.filters,
        feedTab: activeTab,
        tabIndex,
      }),
    ).catch(() => undefined);
  }, [filtersHydrated, individualFilters.filters, teamFilters.filters, activeTab, tabIndex]);

  const fetchIndividualMatches = useCallback(
    async (page: number, matchType: "singles" | "doubles", append = false) => {
      try {
        if (append) {
          setIndividualLoadingMore(true);
        } else {
          setIndividualLoading(true);
          setIndividualFetchError(null);
        }

        const skip = page * ITEMS_PER_PAGE;
        const params = individualFilters.buildQueryParams({
          limit: ITEMS_PER_PAGE,
          skip,
        });
        params.set("type", matchType);

        const { data } = await axiosInstance.get(
          `/matches/individual?${params.toString()}`,
        );

        if (append) {
          setIndividualMatches((prev) => [...prev, ...(data.matches || [])]);
        } else {
          setIndividualMatches(data.matches || []);
        }

        setIndividualHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching individual matches:", err);
        if (!append) {
          setIndividualFetchError(
            "We couldn't load matches. Check your connection and try again.",
          );
        }
      } finally {
        setIndividualLoading(false);
        setIndividualLoadingMore(false);
      }
    },
    [individualFilters],
  );

  const fetchTeamMatches = useCallback(
    async (page: number, append = false) => {
      try {
        if (append) {
          setTeamLoadingMore(true);
        } else {
          setTeamLoading(true);
          setTeamFetchError(null);
        }

        const skip = page * ITEMS_PER_PAGE;
        const params = teamFilters.buildQueryParams({
          limit: ITEMS_PER_PAGE,
          skip,
        });

        const { data } = await axiosInstance.get(`/matches/team?${params.toString()}`);

        if (append) {
          setTeamMatches((prev) => [...prev, ...(data.matches || [])]);
        } else {
          setTeamMatches(data.matches || []);
        }

        setTeamHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching team matches:", err);
        if (!append) {
          setTeamFetchError(
            "We couldn't load team matches. Check your connection and try again.",
          );
        }
      } finally {
        setTeamLoading(false);
        setTeamLoadingMore(false);
      }
    },
    [teamFilters],
  );

  useEffect(() => {
    if (!filtersHydrated) return;
    if (!isIndividualTab) return;
    setIndividualPage(0);
    setIndividualMatches([]);
    fetchIndividualMatches(0, activeMatchType, false);
  }, [
    filtersHydrated,
    isIndividualTab,
    activeMatchType,
    individualFilters.debouncedSearch,
    individualFilters.filters.status,
    individualFilters.filters.sort,
    individualFilters.filters.dateFrom,
    individualFilters.filters.dateTo,
    fetchIndividualMatches,
  ]);

  useEffect(() => {
    if (!filtersHydrated) return;
    if (activeTab !== "team") return;
    setTeamPage(0);
    fetchTeamMatches(0, false);
  }, [
    filtersHydrated,
    activeTab,
    teamFilters.debouncedSearch,
    teamFilters.filters.format,
    teamFilters.filters.status,
    teamFilters.filters.sort,
    teamFilters.filters.dateFrom,
    teamFilters.filters.dateTo,
    fetchTeamMatches,
  ]);

  const loadMoreIndividual = useCallback(() => {
    if (
      !individualLoadingMore &&
      !individualLoading &&
      individualHasMore &&
      isIndividualTab
    ) {
      const nextPage = individualPage + 1;
      setIndividualPage(nextPage);
      fetchIndividualMatches(nextPage, activeMatchType, true);
    }
  }, [
    individualLoadingMore,
    individualLoading,
    individualHasMore,
    individualPage,
    isIndividualTab,
    activeMatchType,
    fetchIndividualMatches,
  ]);

  const loadMoreTeam = useCallback(() => {
    if (!teamLoadingMore && !teamLoading && teamHasMore && activeTab === "team") {
      const nextPage = teamPage + 1;
      setTeamPage(nextPage);
      fetchTeamMatches(nextPage, true);
    }
  }, [teamLoadingMore, teamLoading, teamHasMore, teamPage, activeTab, fetchTeamMatches]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isIndividualTab) {
        setIndividualPage(0);
        await fetchIndividualMatches(0, activeMatchType, false);
      } else {
        setTeamPage(0);
        await fetchTeamMatches(0, false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [isIndividualTab, activeMatchType, fetchIndividualMatches, fetchTeamMatches]);

  const handleTabIndexChange = useCallback((index: number) => {
    if (index === tabIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, [tabIndex]);

  const quickFilterValues = useMemo(
    () =>
      isIndividualTab
        ? {
            type: "",
            format: "",
            status: individualFilters.filters.status,
            sort: individualFilters.filters.sort,
            datePreset: individualFilters.filters.datePreset,
            dateFrom: individualFilters.filters.dateFrom,
            dateTo: individualFilters.filters.dateTo,
          }
        : {
            type: "",
            format: teamFilters.filters.format,
            status: teamFilters.filters.status,
            sort: teamFilters.filters.sort,
            datePreset: teamFilters.filters.datePreset,
            dateFrom: teamFilters.filters.dateFrom,
            dateTo: teamFilters.filters.dateTo,
          },
    [isIndividualTab, individualFilters.filters, teamFilters.filters],
  );

  const handleQuickFiltersChange = useCallback(
    (updates: Partial<typeof quickFilterValues>) => {
      if (isIndividualTab) {
        individualFilters.setFilters(updates);
      } else {
        teamFilters.setFilters(updates);
      }
    },
    [isIndividualTab, individualFilters, teamFilters],
  );

  const activeFilters = isIndividualTab ? individualFilters : teamFilters;

  const renderIndividualEmpty = (tab: "singles" | "doubles") => {
    if (
      PREVIEW_MATCHES_SKELETON ||
      (individualLoading && individualMatches.length === 0 && !individualFetchError)
    ) {
      return (
        <View style={styles.listEmptyFill}>
          {tab === "doubles" ? <DoublesMatchesListSkeleton /> : <MatchesListSkeleton />}
        </View>
      );
    }
    if (individualFetchError && individualMatches.length === 0) {
      return (
        <ListFetchError
          message={individualFetchError}
          onRetry={() => {
            setIndividualPage(0);
            fetchIndividualMatches(0, tab, false);
          }}
          retrying={individualLoading}
        />
      );
    }
    const hasFilters = individualFilters.hasActiveFilters;
    const title =
      tab === "doubles" ? "No doubles matches yet." : "No singles matches yet.";
    return (
      <ListEmptyState
        icon={
          <FontAwesome5
            name="table-tennis"
            size={48}
            color={theme.colors.text.tertiary}
          />
        }
        title={title}
        subtitle={
          hasFilters
            ? "No matches match your current filters."
            : "Create a match to get the feed moving."
        }
        primaryAction={
          !hasFilters
            ? {
                label: "Start",
                onPress: goToCreate,
              }
            : undefined
        }
        clearFiltersAction={
          hasFilters
            ? { label: "Clear filters", onPress: () => individualFilters.clearAll() }
            : undefined
        }
      />
    );
  };

  const renderTeamEmpty = () => {
    if (
      PREVIEW_MATCHES_SKELETON ||
      (teamLoading && teamMatches.length === 0 && !teamFetchError)
    ) {
      return (
        <View style={styles.listEmptyFill}>
          <TeamMatchesListSkeleton />
        </View>
      );
    }
    if (teamFetchError && teamMatches.length === 0) {
      return (
        <ListFetchError
          message={teamFetchError}
          onRetry={() => {
            setTeamPage(0);
            fetchTeamMatches(0, false);
          }}
          retrying={teamLoading}
        />
      );
    }
    const hasFilters = teamFilters.hasActiveFilters;
    return (
      <ListEmptyState
        icon={
          <Ionicons name="people-outline" size={48} color={theme.colors.text.tertiary} />
        }
        title="No team matches yet."
        subtitle={
          hasFilters
            ? "No matches match your current filters."
            : "Create a team match to get started."
        }
        primaryAction={
          !hasFilters
            ? {
                label: "Start",
                onPress: goToCreate,
              }
            : undefined
        }
        clearFiltersAction={
          hasFilters
            ? { label: "Clear filters", onPress: () => teamFilters.clearAll() }
            : undefined
        }
      />
    );
  };

  const renderFooter = useCallback(() => {
    const isLoadingMore = isIndividualTab ? individualLoadingMore : teamLoadingMore;
    const hasMore = isIndividualTab ? individualHasMore : teamHasMore;
    const matchesLength = isIndividualTab
      ? individualMatches.length
      : teamMatches.length;

    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && matchesLength > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>You&apos;ve reached the end</Text>
        </View>
      );
    }
    return null;
  }, [
    isIndividualTab,
    individualLoadingMore,
    teamLoadingMore,
    individualHasMore,
    teamHasMore,
    individualMatches.length,
    teamMatches.length,
    styles,
    theme.colors.primary,
  ]);

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => (
      <RefreshableListShell refreshing={refreshing} onRefresh={handleRefresh}>
        {(refreshControl) => {
          if (route.key === "singles" || route.key === "doubles") {
            const tab = route.key as "singles" | "doubles";
            return (
              <View style={styles.scene}>
                <MatchesList
                  matches={PREVIEW_MATCHES_SKELETON ? [] : individualMatches}
                  ListEmptyComponent={renderIndividualEmpty(tab)}
                  onEndReached={loadMoreIndividual}
                  ListFooterComponent={renderFooter}
                  refreshControl={refreshControl}
                />
              </View>
            );
          }
          if (route.key === "team") {
            return (
              <View style={styles.scene}>
                <TeamMatchesList
                  matches={PREVIEW_MATCHES_SKELETON ? [] : teamMatches}
                  onMatchPress={(matchId, status) =>
                    router.push(getMatchOpenHref(matchId, status, "team"))
                  }
                  ListEmptyComponent={renderTeamEmpty()}
                  onEndReached={loadMoreTeam}
                  ListFooterComponent={renderFooter}
                  refreshControl={refreshControl}
                />
              </View>
            );
          }
          return null;
        }}
      </RefreshableListShell>
    ),
    [
      refreshing,
      handleRefresh,
      styles.scene,
      individualMatches,
      teamMatches,
      loadMoreIndividual,
      loadMoreTeam,
      renderFooter,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.hostCta}>
        <Text style={styles.hostCtaText} numberOfLines={1}>
          Want to start a match?
        </Text>
        <TouchableOpacity
          onPress={goToCreate}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Start a match"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.startBtn}
        >
          <Text style={styles.startBtnText}>Start</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <UnifiedSearchBar
          placeholder={
            isIndividualTab
              ? "Search players, tournaments or match ID"
              : "Search teams, tournaments or match ID"
          }
          value={
            isIndividualTab
              ? individualFilters.filters.search
              : teamFilters.filters.search
          }
          onChangeText={(text) => activeFilters.setFilter("search", text)}
        />
        <MatchQuickFilters
          tab={activeTab}
          filters={quickFilterValues}
          onFiltersChange={handleQuickFiltersChange}
        />
      </View>

      <View style={styles.tabViewWrapper}>
        <View style={styles.tabViewInner}>
          <TournamentTabView
            routes={MATCH_TAB_ROUTES}
            index={tabIndex}
            onIndexChange={handleTabIndexChange}
            renderScene={renderScene}
            swipeEnabled
            animationEnabled={false}
            lazy
            distributeTabs
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
