import { axiosInstance } from "@/lib/axiosInstance";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TournamentList from "@/components/TournamentList";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTournamentsFilters } from "@/hooks/useFilters";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { DesignTokens } from "@/constants/designTokens";
import {
  buildDateFilterFromPreset,
  DATE_RANGE_QUICK_PRESETS,
  type DateRangePresetId,
} from "@/lib/dateRangePresets";

const ITEMS_PER_PAGE = 10;
const SEARCH_ICON_COLOR = DesignTokens.colors.info;

const TOURNAMENT_STATUS_CHIPS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const TOURNAMENT_FORMAT_CHIPS = [
  { label: "All", value: "" },
  { label: "Round Robin", value: "round_robin" },
  { label: "Knockout", value: "knockout" },
  { label: "Hybrid", value: "hybrid" },
];

const TOURNAMENT_SORT_CHIPS = [
  { label: "Most Recent", value: "recent" },
  { label: "Upcoming", value: "upcoming" },
  { label: "A-Z", value: "name" },
];

/** Scrollable quick date filters — order matters for UX. */
const TOURNAMENT_DATE_RANGE_CHIPS: { label: string; value: DateRangePresetId | "all" }[] = [
  { label: "Any time", value: "all" },
  ...DATE_RANGE_QUICK_PRESETS.map((p) => ({ label: p.label, value: p.id })),
];

function isTournamentDateChipSelected(
  value: DateRangePresetId | "all",
  f: { datePreset: string; dateFrom: string; dateTo: string }
): boolean {
  if (value === "all") {
    return !f.dateFrom?.trim() && !f.dateTo?.trim();
  }
  return f.datePreset === value;
}

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category?: string;
  matchType?: string;
  startDate: string;
  endDate?: string;
  status: string;
  city: string;
  venue?: string;
  participants: any[];
  organizer?: any;
  maxParticipants?: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Production-grade filter hook with debounced search
  const filters = useTournamentsFilters(300);
  /** Quick filters in list header — start collapsed like matches */
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchTournaments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = filters.buildQueryParams({ limit: ITEMS_PER_PAGE, skip: pageNum * ITEMS_PER_PAGE });

        const { data } = await axiosInstance.get(
          `/tournaments?${params.toString()}`
        );

        if (append) {
          setTournaments((prev) => [...prev, ...(data.tournaments || [])]);
        } else {
          setTournaments(data.tournaments || []);
        }

        setHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );


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

  /** Clears quick chips only (matches page behavior — keeps search). */
  const clearQuickFilters = useCallback(() => {
    filters.setFilters({
      search: filters.filters.search,
      status: "",
      format: "",
      sort: "recent",
      datePreset: "",
      dateFrom: "",
      dateTo: "",
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [filters]);

  const hasQuickFiltersActive = useMemo(() => {
    const f = filters.filters;
    const hasDate = Boolean(f.dateFrom?.trim() || f.dateTo?.trim());
    return Boolean(f.status || f.format || (f.sort && f.sort !== "recent") || f.datePreset || hasDate);
  }, [
    filters.filters.status,
    filters.filters.format,
    filters.filters.sort,
    filters.filters.datePreset,
    filters.filters.dateFrom,
    filters.filters.dateTo,
  ]);

  useEffect(() => {
    setPage(0);
    fetchTournaments(0, false);
  }, [filters.debouncedSearch, filters.filters.status, filters.filters.format, filters.filters.sort, filters.filters.datePreset, filters.filters.dateFrom, filters.filters.dateTo, fetchTournaments]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTournaments(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchTournaments]);

  const filtered = useMemo(() => {
    // No more client-side filtering - data is already filtered from server
    return tournaments;
  }, [tournaments]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-4 items-center gap-2">
          <ActivityIndicator size="small" color={DesignTokens.colors.primary[500]} />
          <Text className="text-sm text-gray-600">
            Loading more tournaments...
          </Text>
        </View>
      );
    }
    if (!hasMore && tournaments.length > 0) {
      return (
        <View className="items-center mt-4">
          <Text className="text-sm text-gray-600">
            No more tournaments to load
          </Text>
        </View>
      );
    }
    return null;
  };

  const hasFilters = !!(
    filters.filters.search?.trim() ||
    filters.filters.status ||
    filters.filters.format ||
    (filters.filters.sort && filters.filters.sort !== "recent") ||
    Boolean(filters.filters.dateFrom?.trim() || filters.filters.dateTo?.trim())
  );

  const tournamentListHeader = useMemo(
    () => (
      <View
        style={[
          styles.filterChipsSection,
          !filtersExpanded && styles.filterChipsSectionCollapsed,
        ]}
      >
        <View
          style={[styles.filterChipsBar, filtersExpanded && styles.filterChipsBarExpanded]}
        >
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

        {filtersExpanded && (
          <>
            <View style={styles.filterLabeledRow}>
              <Text style={styles.filterRowLabel} numberOfLines={2}>
                Status
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRowScroll}
                contentContainerStyle={styles.filterRowScrollContent}
              >
                {TOURNAMENT_STATUS_CHIPS.map((chip) => {
                  const isSelected = filters.filters.status === chip.value;
                  return (
                    <ChoiceChip
                      key={chip.label}
                      selected={isSelected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (chip.value === "") {
                          filters.setFilter("status", "");
                        } else {
                          filters.setFilter("status", isSelected ? "" : chip.value);
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
                Format
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRowScroll}
                contentContainerStyle={styles.filterRowScrollContent}
              >
                {TOURNAMENT_FORMAT_CHIPS.map((chip) => {
                  const isSelected = filters.filters.format === chip.value;
                  return (
                    <ChoiceChip
                      key={chip.label}
                      selected={isSelected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (chip.value === "") {
                          filters.setFilter("format", "");
                        } else {
                          filters.setFilter("format", isSelected ? "" : chip.value);
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
                Sort
              </Text>
              <View style={styles.filterRowChipsWrap}>
                {TOURNAMENT_SORT_CHIPS.map((chip) => {
                  const isSelected = filters.filters.sort === chip.value;
                  return (
                    <ChoiceChip
                      key={chip.value}
                      selected={isSelected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        filters.setFilter("sort", chip.value);
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
                Date
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRowScroll}
                contentContainerStyle={styles.filterRowScrollContent}
              >
                {TOURNAMENT_DATE_RANGE_CHIPS.map((chip) => {
                  const selected = isTournamentDateChipSelected(chip.value, {
                    datePreset: filters.filters.datePreset,
                    dateFrom: filters.filters.dateFrom,
                    dateTo: filters.filters.dateTo,
                  });
                  return (
                    <ChoiceChip
                      key={`tournament-date-${chip.value}`}
                      selected={selected}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const built = buildDateFilterFromPreset(chip.value);
                        filters.setFilters(built);
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
    ),
    [
      filtersExpanded,
      hasQuickFiltersActive,
      filters.filters.status,
      filters.filters.format,
      filters.filters.sort,
      filters.filters.datePreset,
      filters.filters.dateFrom,
      filters.filters.dateTo,
      filters.setFilter,
      filters.setFilters,
      toggleFilterChipsSection,
    ]
  );

  const tournamentListEmpty = useMemo(() => {
    if (loading && tournaments.length === 0) {
      return (
        <View style={[styles.listEmptyFill, styles.listEmptyFillSkeleton]}>
          <TournamentsSkeleton />
        </View>
      );
    }
    return (
      <View style={styles.listEmptyFill}>
        <View style={styles.emptyCard}>
          <Ionicons name="trophy-outline" size={48} color={DesignTokens.colors.text.tertiary} />
          <Text className={`text-lg font-semibold mt-3`} style={{ color: DesignTokens.colors.text.secondary }}>
            {hasFilters ? "No tournaments match your filters" : "No tournaments yet"}
          </Text>
          <Text className={`text-sm mt-1 text-center`} style={{ color: DesignTokens.colors.text.tertiary }}>
            {hasFilters ? "Try adjusting your filters" : "Create your first tournament to get started"}
          </Text>
        </View>
      </View>
    );
  }, [loading, tournaments.length, hasFilters]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DesignTokens.colors.background.primary }} edges={["top"]}>
      {/* Header - matches page style */}
      <View style={styles.tournamentHeader}>
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
                placeholder="Search tournaments..."
                placeholderTextColor={DesignTokens.colors.text.tertiary}
                value={filters.filters.search}
                onChangeText={(text) => filters.setFilter("search", text)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={styles.searchBarInput}
                selectionColor={DesignTokens.colors.primary[600]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* List + quick filters in header (scrolls like matches) */}
      <View style={styles.listContainer}>
        <TournamentList
          tournaments={filtered}
          listHeader={tournamentListHeader}
          ListEmptyComponent={tournamentListEmpty}
          onEndReached={loadMore}
          ListFooterComponent={renderFooter}
          edgeToEdgeWhenEmpty={loading && tournaments.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

/** Matches `matches.tsx` filter chips section + labeled rows */
const styles = StyleSheet.create({
  tournamentHeader: {
    backgroundColor: DesignTokens.colors.background.primary,
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
  listEmptyFill: {
    flex: 1,
    minHeight: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  listEmptyFillSkeleton: {
    alignSelf: "stretch",
    width: "100%",
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  emptyCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    borderRadius: DesignTokens.borderRadius["2xl"],
    paddingHorizontal: DesignTokens.spacing[8],
    paddingVertical: DesignTokens.spacing[10],
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
});