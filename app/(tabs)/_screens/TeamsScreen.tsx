import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import TeamsList, { type TeamListItem } from "@/components/TeamsList";
import { TeamQuickFilters } from "@/components/teams/TeamQuickFilters";
import { Icon } from "@/components/ui/Icon";
import { ListEmptyState } from "@/components/ui/ListEmptyState";
import { ListFetchError } from "@/components/ui/ListFetchError";
import { RefreshableListShell } from "@/components/ui/RefreshableListShell";
import { UnifiedSearchBar } from "@/components/ui/UnifiedSearchBar";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { axiosInstance } from "@/lib/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 15;
const FILTERS_STORAGE_KEY = "teams.feed.filters.v2";

/** Toggle on to preview skeleton UI while editing. Set back to false before shipping. */
const PREVIEW_TEAMS_SKELETON = false;

type StoredFilters = {
  search: string;
  openness: string;
  membership: string;
  city: string;
  sort: string;
};

export default function TeamsScreen() {
  const theme = useThemeColors();
  const user = useAuthStore((state) => state.user);

  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openness, setOpenness] = useState("");
  const [membership, setMembership] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("name");

  const isMine = membership === "mine";

  const goToCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/team/create");
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
        createBtn: {
          flexGrow: 0,
          flexShrink: 0,
          height: 32,
          paddingHorizontal: 14,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[600],
          alignItems: "center",
          justifyContent: "center",
        },
        createBtnText: {
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
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<StoredFilters>;
          setSearch(parsed.search ?? "");
          setDebouncedSearch((parsed.search ?? "").trim());
          setOpenness(parsed.openness ?? "");
          setMembership(parsed.membership ?? "");
          setCity(parsed.city ?? "");
          setSort(parsed.sort ?? "name");
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
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    AsyncStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ search, openness, membership, city, sort }),
    ).catch(() => undefined);
  }, [filtersHydrated, search, openness, membership, city, sort]);

  const buildQuery = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("skip", String(pageNum * ITEMS_PER_PAGE));
      params.set("sortBy", sort || "name");
      params.set("sortOrder", sort === "name" ? "asc" : "desc");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (city) params.set("city", city);
      return params;
    },
    [sort, debouncedSearch, city],
  );

  const fetchAllTeams = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else {
          setLoading(true);
          setFetchError(null);
        }

        const params = buildQuery(pageNum);
        const { data } = await axiosInstance.get(`/teams?${params.toString()}`);
        let next: TeamListItem[] = data.teams || [];

        if (openness === "open") {
          next = next.filter((t) => t.allowJoinByCode);
        }

        if (append) setTeams((prev) => [...prev, ...next]);
        else setTeams(next);

        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (err) {
        console.error("Error fetching teams", err);
        if (!append) {
          setFetchError("We couldn't load teams. Check your connection and try again.");
          setTeams([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery, openness],
  );

  const fetchMyTeams = useCallback(async () => {
    if (!user?._id) {
      setTeams([]);
      setHasMore(false);
      setFetchError("Sign in to see teams you captain or play for.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);
    setHasMore(false);

    try {
      const [profileRes, listRes] = await Promise.allSettled([
        axiosInstance.get(`/profile/${user._id}/teams`),
        axiosInstance.get(
          `/teams?limit=50&skip=0&sortBy=createdAt&sortOrder=desc${
            debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""
          }${city ? `&city=${encodeURIComponent(city)}` : ""}`,
        ),
      ]);

      const profileTeams: TeamListItem[] =
        profileRes.status === "fulfilled"
          ? (profileRes.value.data?.teams || profileRes.value.data || []).map(
              (t: any) => ({
                _id: t._id,
                name: t.name,
                logo: t.logo,
                city: t.city,
                playerCount: t.playerCount,
                role: t.role,
              }),
            )
          : [];

      const listTeams: TeamListItem[] =
        listRes.status === "fulfilled" ? listRes.value.data?.teams || [] : [];

      const byId = new Map(listTeams.map((t) => [t._id, t]));
      let merged: TeamListItem[] = profileTeams.map((pt) => {
        const full = byId.get(pt._id);
        return full
          ? { ...full, role: pt.role, playerCount: pt.playerCount ?? full.playerCount }
          : pt;
      });

      for (const t of listTeams) {
        const isCap = t.captain?._id === user._id;
        const isMem = t.playerIds?.includes(user._id);
        if ((isCap || isMem) && !merged.some((m) => m._id === t._id)) {
          merged.push(t);
        }
      }

      if (openness === "open") {
        merged = merged.filter((t) => t.allowJoinByCode === true);
      }
      if (city) {
        merged = merged.filter((t) => t.city === city);
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        merged = merged.filter((t) => t.name.toLowerCase().includes(q));
      }

      setTeams(merged);
    } catch (err) {
      console.error("Error fetching my teams", err);
      setFetchError("We couldn't load your teams. Check your connection and try again.");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id, debouncedSearch, city, openness]);

  const fetchTeams = useCallback(
    async (pageNum: number, append = false) => {
      if (isMine) {
        await fetchMyTeams();
        return;
      }
      await fetchAllTeams(pageNum, append);
    },
    [isMine, fetchMyTeams, fetchAllTeams],
  );

  useEffect(() => {
    if (!filtersHydrated) return;
    setPage(0);
    fetchTeams(0, false);
  }, [
    filtersHydrated,
    debouncedSearch,
    city,
    sort,
    openness,
    membership,
    fetchTeams,
  ]);

  const loadMore = useCallback(() => {
    if (isMine) return;
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAllTeams(nextPage, true);
    }
  }, [isMine, loadingMore, loading, hasMore, page, fetchAllTeams]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setPage(0);
      await fetchTeams(0, false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTeams]);

  const quickFilterValues = useMemo(
    () => ({ openness, membership, city, sort }),
    [openness, membership, city, sort],
  );

  const hasActiveFilters = Boolean(
    search.trim() || openness || membership || city || sort !== "name",
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setOpenness("");
    setMembership("");
    setCity("");
    setSort("name");
  }, []);

  const teamsListEmpty = useMemo(() => {
    if (PREVIEW_TEAMS_SKELETON || (loading && teams.length === 0 && !fetchError)) {
      return (
        <View style={styles.listEmptyFillSkeleton}>
          <TeamListSkeleton />
        </View>
      );
    }
    if (fetchError && teams.length === 0) {
      return (
        <ListFetchError
          message={fetchError}
          onRetry={() => {
            setPage(0);
            fetchTeams(0, false);
          }}
          retrying={loading}
        />
      );
    }
    return (
      <ListEmptyState
        icon={
          <Icon name="users" library="material" size={48} color={theme.colors.text.tertiary} />
        }
        title={
          hasActiveFilters
            ? "No teams found"
            : isMine
              ? "No teams yet."
              : "No teams yet."
        }
        subtitle={
          hasActiveFilters
            ? "No teams match your current filters."
            : isMine
              ? "Create a team or join one with an invite code."
              : "Create a team to get the list moving."
        }
        primaryAction={
          user && !hasActiveFilters
            ? {
                label: "Create",
                onPress: goToCreate,
              }
            : undefined
        }
        clearFiltersAction={
          hasActiveFilters
            ? { label: "Clear filters", onPress: clearFilters }
            : undefined
        }
      />
    );
  }, [
    loading,
    teams.length,
    fetchError,
    fetchTeams,
    hasActiveFilters,
    isMine,
    user,
    goToCreate,
    clearFilters,
    styles.listEmptyFillSkeleton,
    theme.colors.text.tertiary,
  ]);

  const renderFooter = () => {
    if (isMine) return null;
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && teams.length > 0) {
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
          Want to create a team?
        </Text>
        <TouchableOpacity
          onPress={goToCreate}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create a team"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.createBtn}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <UnifiedSearchBar
          placeholder="Search teams, captains or players"
          value={search}
          onChangeText={setSearch}
        />
        <TeamQuickFilters
          filters={quickFilterValues}
          showMine={Boolean(user)}
          onFiltersChange={(updates) => {
            if (updates.openness !== undefined) setOpenness(updates.openness);
            if (updates.membership !== undefined) setMembership(updates.membership);
            if (updates.city !== undefined) setCity(updates.city);
            if (updates.sort !== undefined) setSort(updates.sort);
          }}
        />
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listContainerInner}>
          <RefreshableListShell refreshing={refreshing} onRefresh={handleRefresh}>
            {(refreshControl) => (
              <TeamsList
                teams={PREVIEW_TEAMS_SKELETON ? [] : teams}
                currentUserId={user?._id}
                ListEmptyComponent={teamsListEmpty}
                onEndReached={loadMore}
                ListFooterComponent={renderFooter}
                refreshControl={refreshControl}
              />
            )}
          </RefreshableListShell>
        </View>
      </View>
    </SafeAreaView>
  );
}
