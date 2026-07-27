/**
 * useFilters Hook
 *
 * Shared hook for managing filter state with debounced search
 * and query param building for server-side filtering.
 */

import { useState, useEffect, useMemo, useCallback } from "react";

// Generic filter state that can be extended
export interface BaseFilterState {
  search?: string;
  [key: string]: string | undefined;
}

export interface UseFiltersOptions<T extends BaseFilterState> {
  initialFilters: T;
  debounceMs?: number;
}

export interface UseFiltersReturn<T extends BaseFilterState> {
  filters: T;
  debouncedSearch: string;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (updates: Partial<T>) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
  buildQueryParams: (pagination?: { limit: number; skip: number }) => URLSearchParams;
}

/**
 * Hook for managing filter state with debounced search
 *
 * @example
 * ```tsx
 * const { filters, debouncedSearch, setFilter, clearAll, buildQueryParams } = useFilters({
 *   initialFilters: { search: "", status: "all", type: "all" },
 *   debounceMs: 300
 * });
 * ```
 */
export function useFilters<T extends BaseFilterState>({
  initialFilters,
  debounceMs = 300,
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || "");
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.search, debounceMs]);

  // Set a single filter value
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple filter values at once
  const setFilters = useCallback((updates: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear all filters to initial state
  const clearAll = useCallback(() => {
    setFiltersState(initialFilters);
    setDebouncedSearch(initialFilters.search || "");
  }, [initialFilters]);

  // Check if any filters are active (not default/empty)
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initialValue = initialFilters[key as keyof T];
      // Consider "all" as default/inactive
      if (value === "all" && initialValue === "all") return false;
      // Consider empty string as inactive
      if (value === "" && (initialValue === "" || initialValue === undefined)) return false;
      // Compare with initial value
      return value !== initialValue;
    });
  }, [filters, initialFilters]);

  // Build URLSearchParams from current filters
  const buildQueryParams = useCallback(
    (pagination?: { limit: number; skip: number }): URLSearchParams => {
      const params = new URLSearchParams();

      // Add pagination
      if (pagination) {
        params.set("limit", pagination.limit.toString());
        params.set("skip", pagination.skip.toString());
      }

      // Add filters (skip empty and "all" values)
      Object.entries(filters).forEach(([key, value]) => {
        // UI-only: not a query param on the API
        if (key === "datePreset") {
          return;
        }
        // Use debounced search instead of raw search
        if (key === "search") {
          if (debouncedSearch && debouncedSearch.trim()) {
            params.set("search", debouncedSearch.trim());
          }
          return;
        }

        // Handle sort conversion (tournaments + match feeds)
        if (key === "sort") {
          if (value && value !== "all" && value !== "") {
            if (value === "recent" || value === "newest") {
              params.set("sortBy", "createdAt");
              params.set("sortOrder", "desc");
            } else if (value === "oldest") {
              params.set("sortBy", "createdAt");
              params.set("sortOrder", "asc");
            } else if (value === "upcoming") {
              params.set("sortBy", "startDate");
              params.set("sortOrder", "asc");
            } else if (value === "name") {
              params.set("sortBy", "name");
              params.set("sortOrder", "asc");
            } else if (value === "participants") {
              params.set("sortBy", "startDate");
              params.set("sortOrder", "desc");
            } else if (value === "status") {
              params.set("sortBy", "status");
              params.set("sortOrder", "desc");
            } else {
              params.set("sortBy", value);
              params.set("sortOrder", "desc");
            }
          }
          return;
        }

        if (value && value !== "all" && value !== "") {
          // Client-only: not a query param on public list APIs
          if (key === "status" && value === "mine") {
            return;
          }
          params.set(key, value);
        }
      });

      return params;
    },
    [filters, debouncedSearch]
  );

  return {
    filters,
    debouncedSearch,
    setFilter,
    setFilters,
    clearAll,
    hasActiveFilters,
    buildQueryParams,
  };
}

// ============================================
// Pre-configured filter hooks for each page
// ============================================

// Individual Matches filter state
export interface IndividualMatchFilters extends BaseFilterState {
  search: string;
  type: string;
  status: string;
  sort: string;
  /** Tracks quick preset: `""` = any dates, else preset id or `custom`. */
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_INDIVIDUAL_MATCH_FILTERS: IndividualMatchFilters = {
  search: "",
  type: "",
  status: "",
  sort: "newest",
  datePreset: "",
  dateFrom: "",
  dateTo: "",
};

export const useIndividualMatchFilters = (
  debounceMs = 300,
  initialFilters: IndividualMatchFilters = DEFAULT_INDIVIDUAL_MATCH_FILTERS,
) => {
  return useFilters<IndividualMatchFilters>({
    initialFilters,
    debounceMs,
  });
};

// Team Matches filter state
export interface TeamMatchFilters extends BaseFilterState {
  search: string;
  format: string;
  status: string;
  sort: string;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_TEAM_MATCH_FILTERS: TeamMatchFilters = {
  search: "",
  format: "",
  status: "",
  sort: "newest",
  datePreset: "",
  dateFrom: "",
  dateTo: "",
};

export const useTeamMatchFilters = (
  debounceMs = 300,
  initialFilters: TeamMatchFilters = DEFAULT_TEAM_MATCH_FILTERS,
) => {
  return useFilters<TeamMatchFilters>({
    initialFilters,
    debounceMs,
  });
};

// Tournaments filter state
export interface TournamentsFilters extends BaseFilterState {
  search: string;
  status: string;
  format: string;
  sort: string;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

export const useTournamentsFilters = (debounceMs = 300) => {
  return useFilters<TournamentsFilters>({
    initialFilters: {
      search: "",
      status: "",
      format: "",
      sort: "recent",
      datePreset: "",
      dateFrom: "",
      dateTo: "",
    },
    debounceMs,
  });
};

// Leaderboard filter state (individual tab)
export interface LeaderboardFiltersState extends BaseFilterState {
  search: string;
  type: string;
  matchFormat: string;
  gender: string;
  handedness: string;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

export const useLeaderboardFilters = (debounceMs = 300) => {
  return useFilters<LeaderboardFiltersState>({
    initialFilters: {
      search: "",
      type: "",
      matchFormat: "",
      gender: "",
      handedness: "",
      datePreset: "",
      dateFrom: "",
      dateTo: "",
    },
    debounceMs,
  });
};
