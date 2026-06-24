import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  PlayerStats,
  TeamStats,
  LeaderboardType,
  LeaderboardFilters,
} from "@/types/leaderboard";

const ITEMS_PER_PAGE = 50;

interface UseLeaderboardOptions {
  filters?: Partial<LeaderboardFilters>;
}

interface UseLeaderboardReturn {
  leaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  fetchMore: () => void;
}

export function useLeaderboard(
  activeTab: LeaderboardType,
  options?: UseLeaderboardOptions
): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const buildQueryParams = useCallback(
    (skip: number, filters?: Partial<LeaderboardFilters>) => {
      const params = new URLSearchParams();

      // For Individual tab, add type filter if provided (not "all")
      if (activeTab === "individual" && filters?.type && filters.type !== ("all" as typeof filters.type)) {
        params.append("type", filters.type);
      }

      // Pagination
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("skip", skip.toString());

      // Add filters if provided
      if (filters) {
        if (filters.gender) params.append("gender", filters.gender);
        if (filters.handedness) params.append("handedness", filters.handedness);
        if (filters.timeRange) params.append("timeRange", filters.timeRange);
        if (filters.matchFormat) params.append("matchFormat", filters.matchFormat);
      }

      return params.toString();
    },
    [activeTab]
  );

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0);
      }

      const skip = pageNum * ITEMS_PER_PAGE;

      if (activeTab === "teams") {
        const { data } = await axiosInstance.get(
          `/leaderboard/teams?limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );
        if (append) {
          setTeamLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setTeamLeaderboard(data.leaderboard || []);
        }
        setHasMore(data.pagination?.hasMore || false);
      } else {
        // Use filtered endpoint for individual leaderboard
        const queryParams = buildQueryParams(skip, options?.filters);
        const { data } = await axiosInstance.get(
          `/leaderboard/filtered?${queryParams}`
        );
        if (append) {
          setLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setLeaderboard(data.leaderboard || []);
        }
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      if (activeTab === "teams") {
        if (!append) setTeamLeaderboard([]);
      } else {
        if (!append) setLeaderboard([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, options?.filters, buildQueryParams]);

  useEffect(() => {
    // Reset state when tab changes
    setLeaderboard([]);
    setTeamLeaderboard([]);
    setPage(0);
    setHasMore(true);
    fetchData(0, false);
  }, [activeTab, fetchData]);

  const fetchMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, loading, hasMore, page, fetchData]);

  return { 
    leaderboard, 
    teamLeaderboard, 
    loading, 
    loadingMore, 
    hasMore, 
    fetchMore 
  };
}

