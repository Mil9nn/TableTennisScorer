import { axiosInstance } from "@/lib/axiosInstance";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TournamentList from "@/components/TournamentList";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";
import { TournamentQuickFilters } from "@/components/tournaments/TournamentQuickFilters";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListFetchError } from "@/components/ui/ListFetchError";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTournamentsFilters } from "@/hooks/useFilters";
import { DesignTokens } from "@/constants/designTokens";

const ITEMS_PER_PAGE = 10;
const SEARCH_ICON_COLOR = DesignTokens.colors.info;

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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const filters = useTournamentsFilters(300);
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchTournaments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setFetchError(null);
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
        if (!append) {
          setFetchError("We couldn't load tournaments. Check your connection and try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  const quickFilterValues = useMemo(
    () => ({
      format: filters.filters.format,
      status: filters.filters.status,
      sort: filters.filters.sort,
      datePreset: filters.filters.datePreset,
      dateFrom: filters.filters.dateFrom,
      dateTo: filters.filters.dateTo,
    }),
    [filters.filters]
  );

  const handleQuickFiltersChange = useCallback(
    (updates: Partial<typeof quickFilterValues>) => {
      filters.setFilters(updates);
    },
    [filters]
  );

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

  const filtered = useMemo(() => tournaments, [tournaments]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={DesignTokens.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading more tournaments...</Text>
        </View>
      );
    }
    if (!hasMore && tournaments.length > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>You've reached the end</Text>
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

  const tournamentListEmpty = useMemo(() => {
    if (loading && tournaments.length === 0 && !fetchError) {
      return (
        <View style={[styles.listEmptyFill, styles.listEmptyFillSkeleton]}>
          <TournamentsSkeleton />
        </View>
      );
    }
    if (fetchError && tournaments.length === 0) {
      return (
        <ListFetchError
          message={fetchError}
          onRetry={() => {
            setPage(0);
            fetchTournaments(0, false);
          }}
          retrying={loading}
        />
      );
    }
    return (
      <View style={styles.listEmptyFill}>
        <View style={styles.emptyCard}>
          <Ionicons name="trophy-outline" size={48} color={DesignTokens.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>
            {hasFilters ? "No tournaments match your filters" : "No tournaments yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {hasFilters ? "Try adjusting your filters" : "Create your first tournament to get started"}
          </Text>
          {!hasFilters ? (
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push("/tournaments/create")}
              style={styles.emptyCta}
            >
              Create tournament
            </Button>
          ) : null}
        </View>
      </View>
    );
  }, [loading, tournaments.length, hasFilters, fetchError, fetchTournaments]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerContainer}>
        <View style={styles.pageTitleRow}>
          <View style={styles.pageTitleBlock}>
            <Text style={styles.pageTitle}>Tournaments</Text>
            <Text style={styles.pageSubtitle}>Leagues, knockouts, and hybrid events</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/tournaments/create");
            }}
            style={styles.headerCreateButton}
            accessibilityLabel="Create tournament"
          >
            <Icon name="plus" library="material" size={20} color={DesignTokens.colors.primary[600]} />
          </Pressable>
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

        <TournamentQuickFilters
          filters={quickFilterValues}
          onFiltersChange={handleQuickFiltersChange}
        />
      </View>

      <View style={styles.listContainer}>
        <TournamentList
          tournaments={filtered}
          listHeader={undefined}
          ListEmptyComponent={tournamentListEmpty}
          onEndReached={loadMore}
          ListFooterComponent={renderFooter}
          edgeToEdgeWhenEmpty={loading && tournaments.length === 0}
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
  },
  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[3],
  },
  pageTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  pageSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: 2,
  },
  headerCreateButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
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
  listContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.tertiary,
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
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: DesignTokens.spacing[4],
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  noMoreContainer: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[4],
  },
  noMoreText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
});
