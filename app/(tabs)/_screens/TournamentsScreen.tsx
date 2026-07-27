import { axiosInstance } from "@/lib/axiosInstance";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TournamentList from "@/components/TournamentList";
import TournamentsSkeleton from "@/components/skeletons/TournamentsSkeleton";
import { TournamentQuickFilters } from "@/components/tournaments/TournamentQuickFilters";
import { ListEmptyState } from "@/components/ui/ListEmptyState";
import { ListFetchError } from "@/components/ui/ListFetchError";
import { RefreshableListShell } from "@/components/ui/RefreshableListShell";
import { UnifiedSearchBar } from "@/components/ui/UnifiedSearchBar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useTournamentsFilters,
  type TournamentsFilters,
} from "@/hooks/useFilters";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/hooks/useAuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ITEMS_PER_PAGE = 10;
const FILTERS_STORAGE_KEY = "tournaments.feed.filters.v1";

/** Toggle on to preview skeleton UI while editing. Set back to false before shipping. */
const PREVIEW_TOURNAMENTS_SKELETON = false;

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
  const theme = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const filters = useTournamentsFilters(300);

  const goToCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/tournaments/create");
  }, []);

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
        registerBtn: {
          flexGrow: 0,
          flexShrink: 0,
          height: 32,
          paddingHorizontal: 14,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[600],
          alignItems: "center",
          justifyContent: "center",
        },
        registerBtnText: {
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
        listContainer: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        listContainerInner: {
          flex: 1,
        },
        listEmptyFillSkeleton: {
          alignSelf: "stretch",
          width: "100%",
          flexGrow: 1,
          minHeight: 320,
          justifyContent: "flex-start",
          alignItems: "stretch",
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
          const parsed = JSON.parse(raw) as Partial<TournamentsFilters>;
          filters.setFilters({
            search: parsed.search ?? "",
            status: parsed.status ?? "",
            format: parsed.format ?? "",
            sort: parsed.sort ?? "recent",
            datePreset: parsed.datePreset ?? "",
            dateFrom: parsed.dateFrom ?? "",
            dateTo: parsed.dateTo ?? "",
          });
        }
      } catch {
        // ignore
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
    AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters.filters)).catch(
      () => undefined,
    );
  }, [filtersHydrated, filters.filters]);

  const fetchTournaments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setFetchError(null);
        }

        const isMine = filters.filters.status === "mine";
        const params = filters.buildQueryParams({
          limit: ITEMS_PER_PAGE,
          skip: pageNum * ITEMS_PER_PAGE,
        });

        const path = isMine
          ? `/scorer/tournaments?${params.toString()}`
          : `/tournaments?${params.toString()}`;

        const { data } = await axiosInstance.get(path);

        if (append) {
          setTournaments((prev) => [...prev, ...(data.tournaments || [])]);
        } else {
          setTournaments(data.tournaments || []);
        }

        setHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        if (!append) {
          setFetchError(
            filters.filters.status === "mine"
              ? "Sign in to see tournaments you organize or score."
              : "We couldn't load tournaments. Check your connection and try again.",
          );
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters],
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
    [filters.filters],
  );

  const handleQuickFiltersChange = useCallback(
    (updates: Partial<typeof quickFilterValues>) => {
      filters.setFilters(updates);
    },
    [filters],
  );

  useEffect(() => {
    if (!filtersHydrated) return;
    setPage(0);
    fetchTournaments(0, false);
  }, [
    filtersHydrated,
    filters.debouncedSearch,
    filters.filters.status,
    filters.filters.format,
    filters.filters.sort,
    filters.filters.datePreset,
    filters.filters.dateFrom,
    filters.filters.dateTo,
    fetchTournaments,
  ]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTournaments(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchTournaments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setPage(0);
      await fetchTournaments(0, false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTournaments]);

  const hasFilters = filters.hasActiveFilters;

  const tournamentListEmpty = useMemo(() => {
    if (
      PREVIEW_TOURNAMENTS_SKELETON ||
      (loading && tournaments.length === 0 && !fetchError)
    ) {
      return (
        <View style={styles.listEmptyFillSkeleton}>
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
      <ListEmptyState
        icon={
          <Ionicons name="trophy-outline" size={48} color={theme.colors.text.tertiary} />
        }
        title={hasFilters ? "No tournaments found" : "No tournaments yet."}
        subtitle={
          hasFilters
            ? "Try adjusting your filters."
            : "Create a tournament to get the feed moving."
        }
        primaryAction={
          !hasFilters
            ? {
                label: "Register",
                onPress: goToCreate,
              }
            : undefined
        }
        clearFiltersAction={
          hasFilters
            ? { label: "Clear filters", onPress: () => filters.clearAll() }
            : undefined
        }
      />
    );
  }, [
    loading,
    tournaments.length,
    hasFilters,
    fetchError,
    fetchTournaments,
    goToCreate,
    styles.listEmptyFillSkeleton,
    theme.colors.text.tertiary,
    filters,
  ]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && tournaments.length > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>You&apos;ve reached the end</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.hostCta}>
        <Text style={styles.hostCtaText} numberOfLines={1}>
          Want to host a tournament?
        </Text>
        <TouchableOpacity
          onPress={goToCreate}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Register to host a tournament"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.registerBtn}
        >
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <UnifiedSearchBar
          placeholder="Search tournament, organizer or venue"
          value={filters.filters.search}
          onChangeText={(text) => filters.setFilter("search", text)}
        />
        <TournamentQuickFilters
          filters={quickFilterValues}
          onFiltersChange={handleQuickFiltersChange}
          showMine={Boolean(user)}
        />
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listContainerInner}>
          <RefreshableListShell refreshing={refreshing} onRefresh={handleRefresh}>
            {(refreshControl) => (
              <TournamentList
                tournaments={PREVIEW_TOURNAMENTS_SKELETON ? [] : tournaments}
                ListEmptyComponent={tournamentListEmpty}
                onEndReached={loadMore}
                ListFooterComponent={renderFooter}
                edgeToEdgeWhenEmpty={
                  PREVIEW_TOURNAMENTS_SKELETON || (loading && tournaments.length === 0)
                }
                refreshControl={refreshControl}
              />
            )}
          </RefreshableListShell>
        </View>
      </View>
    </SafeAreaView>
  );
}
