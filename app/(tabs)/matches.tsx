import MatchesList from "@/components/MatchesList";
import TeamMatchesList from "@/components/TeamMatchesList";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import TeamMatchesListSkeleton from "@/components/skeletons/TeamMatchesListSkeleton";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { TextInput } from "react-native";
import { axiosInstance } from "@/lib/axiosInstance";
import { TeamMatch } from "@/types/match.type";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIndividualMatchFilters, useTeamMatchFilters } from "@/hooks/useFilters";
import {
  buildDateFilterFromPreset,
  DATE_RANGE_QUICK_PRESETS,
  type DateRangePresetId,
} from "@/lib/dateRangePresets";
import { DesignTokens } from "@/constants/designTokens";

const ITEMS_PER_PAGE = 15;
const SEARCH_ICON_COLOR = DesignTokens.colors.info;

const MATCH_TAB_ROUTES: TabRoute[] = [
  { key: "individual", title: "Individual" },
  { key: "team", title: "Team" },
];

const INDIVIDUAL_TYPE_CHIPS = [
  { label: "All", value: "" },
  { label: "Singles", value: "singles" },
  { label: "Doubles", value: "doubles" },
];

const TEAM_FORMAT_CHIPS = [
  { label: "All", value: "" },
  { label: "Swaythling", value: "five_singles" },
  { label: "S-D-S", value: "single_double_single" },
];

const STATUS_CHIPS = [
  { label: "All", value: "" },
  { label: "Live", value: "in_progress" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
];

/** Scrollable quick date filters — order matters for UX. */
const FEED_DATE_RANGE_CHIPS: { label: string; value: DateRangePresetId | "all" }[] = [
  { label: "Any time", value: "all" },
  ...DATE_RANGE_QUICK_PRESETS.map((p) => ({ label: p.label, value: p.id })),
];

function isFeedDateChipSelected(
  value: DateRangePresetId | "all",
  f: { datePreset: string; dateFrom: string; dateTo: string }
): boolean {
  if (value === "all") {
    return !f.dateFrom?.trim() && !f.dateTo?.trim();
  }
  return f.datePreset === value;
}

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

  /** Quick filters (type / status / date chips) in the list header — start collapsed for more list space */
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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

  const clearQuickFiltersForActiveTab = useCallback(() => {
    if (activeTab === "individual") {
      individualFilters.setFilters({
        type: "",
        status: "",
        datePreset: "",
        dateFrom: "",
        dateTo: "",
      });
    } else {
      teamFilters.setFilters({
        format: "",
        status: "",
        datePreset: "",
        dateFrom: "",
        dateTo: "",
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeTab, individualFilters, teamFilters]);

  const handleNewMatch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/match/create");
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

  const renderFilterChips = (tab: "individual" | "team") => {
    const f = tab === "individual" ? individualFilters.filters : teamFilters.filters;
    const hasDate = Boolean(f.dateFrom?.trim() || f.dateTo?.trim());
    const hasQuickFiltersActive =
      tab === "individual"
        ? Boolean(f.type || f.status || hasDate)
        : Boolean(f.format || f.status || hasDate);

    return (
      <View style={[styles.filterChipsSection, !filtersExpanded && styles.filterChipsSectionCollapsed]}>
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
                onPress={clearQuickFiltersForActiveTab}
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

        {filtersExpanded && (
          <>
            <View style={styles.filterLabeledRow}>
              <Text style={styles.filterRowLabel} numberOfLines={2}>
                {tab === "individual" ? "Match Type" : "Format"}
              </Text>
              <View style={styles.filterRowChipsWrap}>
                {(tab === "individual" ? INDIVIDUAL_TYPE_CHIPS : TEAM_FORMAT_CHIPS).map((chip) => {
                  const isSelected =
                    tab === "individual"
                      ? individualFilters.filters.type === chip.value
                      : teamFilters.filters.format === chip.value;

                  return (
                    <ChoiceChip
                      key={`${tab}-type-${chip.label}`}
                      selected={isSelected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (tab === "individual") {
                          if (chip.value === "") {
                            individualFilters.setFilter("type", "");
                          } else {
                            individualFilters.setFilter("type", isSelected ? "" : chip.value);
                          }
                        } else if (chip.value === "") {
                          teamFilters.setFilter("format", "");
                        } else {
                          teamFilters.setFilter("format", isSelected ? "" : chip.value);
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
                Match Status
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRowScroll}
                contentContainerStyle={styles.filterRowScrollContent}
              >
                {STATUS_CHIPS.map((chip) => {
                  const isSelected =
                    tab === "individual"
                      ? individualFilters.filters.status === chip.value
                      : teamFilters.filters.status === chip.value;
                  const isLiveChip = chip.value === "in_progress";

                  return (
                    <ChoiceChip
                      key={`${tab}-status-${chip.label}`}
                      selected={isSelected}
                      selectionTone={isLiveChip ? "live" : "default"}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (chip.value === "") {
                          if (tab === "individual") {
                            individualFilters.setFilter("status", "");
                          } else {
                            teamFilters.setFilter("status", "");
                          }
                        } else if (tab === "individual") {
                          individualFilters.setFilter("status", isSelected ? "" : chip.value);
                        } else {
                          teamFilters.setFilter("status", isSelected ? "" : chip.value);
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
                Date
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRowScroll}
                contentContainerStyle={styles.filterRowScrollContent}
              >
                {FEED_DATE_RANGE_CHIPS.map((chip) => {
                  const rowFilters =
                    tab === "individual" ? individualFilters.filters : teamFilters.filters;
                  const selected = isFeedDateChipSelected(chip.value, {
                    datePreset: rowFilters.datePreset,
                    dateFrom: rowFilters.dateFrom,
                    dateTo: rowFilters.dateTo,
                  });
                  return (
                    <ChoiceChip
                      key={`${tab}-date-${chip.value}`}
                      selected={selected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const built = buildDateFilterFromPreset(chip.value);
                        if (tab === "individual") {
                          individualFilters.setFilters(built);
                        } else {
                          teamFilters.setFilters(built);
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
        )}
      </View>
    );
  };

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
          
          {/* Filter Chips Section */}
          {renderFilterChips(activeTab)}
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
    backgroundColor: "#f1f5f9",
  },
  scene: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  // Modern filter chips section
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
  // Labeled filter rows: label column + chips (aligned across rows)
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
