import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";

export type HomeNearMatchEntry =
  | { category: "individual"; match: MatchRow }
  | { category: "team"; match: TeamMatchRow };

/** @deprecated Prefer HomeNearMatchEntry */
export type HomeLiveMatchEntry = HomeNearMatchEntry;

type MatchRow = {
  _id: string;
  matchType?: string;
  status?: string;
  numberOfSets?: number;
  participants?: (
    | { _id?: string; username?: string; fullName?: string; profileImage?: string }
    | string
  )[];
  finalScore?: {
    setsByTeam?: number[];
    setsById?: Record<string, number>;
    setsByPlayerId?: Record<string, number>;
  };
  city?: string;
  venue?: string;
  courtNumber?: number;
  matchDuration?: number;
  startedAt?: string;
  tournament?: { name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

type TeamMatchRow = {
  _id: string;
  status?: string;
  matchFormat?: string;
  winnerTeam?: string;
  team1?: { name?: string; logo?: string; players?: { user?: { _id?: string } | string }[] };
  team2?: { name?: string; logo?: string; players?: { user?: { _id?: string } | string }[] };
  finalScore?: { team1Matches?: number; team2Matches?: number };
  city?: string;
  venue?: string;
  courtNumber?: number;
  matchDuration?: number;
  startedAt?: string;
  tournament?: { name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeLocation(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function matchNearLocation(
  match: { city?: string; venue?: string },
  userLocation?: string | null,
) {
  const needle = normalizeLocation(userLocation);
  if (!needle) return true;
  const hay = `${normalizeLocation(match.city)} ${normalizeLocation(match.venue)}`;
  return hay.includes(needle) || needle.includes(normalizeLocation(match.city));
}

function stampOf(row: { updatedAt?: string; createdAt?: string; startedAt?: string }) {
  return row.updatedAt || row.startedAt || row.createdAt;
}

function toNearEntry(
  match: MatchRow | TeamMatchRow,
  category: "individual" | "team",
): HomeNearMatchEntry | null {
  if (!match._id) return null;
  return category === "individual"
    ? { category: "individual", match: match as MatchRow }
    : { category: "team", match: match as TeamMatchRow };
}

function sortNearMatches(entries: HomeNearMatchEntry[]) {
  const rank = (entry: HomeNearMatchEntry) => {
    const status = entry.match.status;
    if (status === "in_progress") return 0;
    if (status === "scheduled" || status === "ready") return 1;
    return 2;
  };
  return [...entries].sort((a, b) => {
    const byStatus = rank(a) - rank(b);
    if (byStatus !== 0) return byStatus;
    const aStamp = new Date(stampOf(a.match) || 0).getTime();
    const bStamp = new Date(stampOf(b.match) || 0).getTime();
    return bStamp - aStamp;
  });
}

export function useHomeDashboard(enabled: boolean, userLocation?: string | null) {
  const [nearYouMatches, setNearYouMatches] = useState<HomeNearMatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        setNearYouMatches([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      if (options?.silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [liveInd, liveTeam, recentInd, recentTeam] = await Promise.allSettled([
          axiosInstance.get(
            "/matches/individual?status=in_progress&limit=8&skip=0&sortBy=createdAt&sortOrder=desc",
          ),
          axiosInstance.get(
            "/matches/team?status=in_progress&limit=6&skip=0&sortBy=createdAt&sortOrder=desc",
          ),
          axiosInstance.get("/matches/individual?limit=12&skip=0&sortBy=createdAt&sortOrder=desc"),
          axiosInstance.get("/matches/team?limit=8&skip=0&sortBy=createdAt&sortOrder=desc"),
        ]);

        const liveIndMatches: MatchRow[] =
          liveInd.status === "fulfilled" ? (liveInd.value.data?.matches ?? []) : [];
        const liveTeamMatches: TeamMatchRow[] =
          liveTeam.status === "fulfilled" ? (liveTeam.value.data?.matches ?? []) : [];
        const recentMatches: MatchRow[] =
          recentInd.status === "fulfilled" ? (recentInd.value.data?.matches ?? []) : [];
        const recentTeamMatches: TeamMatchRow[] =
          recentTeam.status === "fulfilled" ? (recentTeam.value.data?.matches ?? []) : [];

        const nearPool = [
          ...liveIndMatches.map((match) => toNearEntry(match, "individual")),
          ...liveTeamMatches.map((match) => toNearEntry(match, "team")),
          ...recentMatches.map((match) => toNearEntry(match, "individual")),
          ...recentTeamMatches.map((match) => toNearEntry(match, "team")),
        ].filter((x): x is HomeNearMatchEntry => x != null);

        const deduped = new Map<string, HomeNearMatchEntry>();
        for (const entry of nearPool) {
          const key = `${entry.category}-${entry.match._id}`;
          if (!deduped.has(key)) deduped.set(key, entry);
        }

        const nearFiltered = [...deduped.values()].filter((entry) =>
          matchNearLocation(entry.match, userLocation),
        );
        const nearSource = nearFiltered.length > 0 ? nearFiltered : [...deduped.values()];
        setNearYouMatches(sortNearMatches(nearSource).slice(0, 10));

        if (
          liveInd.status === "rejected" &&
          liveTeam.status === "rejected" &&
          recentInd.status === "rejected" &&
          recentTeam.status === "rejected"
        ) {
          throw new Error("Home feeds failed");
        }
      } catch {
        setError("We couldn't load nearby matches. Check your connection and try again.");
        setNearYouMatches([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, userLocation],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    nearYouMatches,
    liveMatches: nearYouMatches,
    loading,
    refreshing,
    error,
    reload: () => load(),
    refresh: () => load({ silent: true }),
  };
}

/** @deprecated Prefer useHomeDashboard / useHomeFeed */
export function useHomeActivity(enabled: boolean) {
  const dash = useHomeDashboard(enabled);
  return {
    items: [] as never[],
    loading: dash.loading,
    refreshing: dash.refreshing,
    error: dash.error,
    reload: dash.reload,
    refresh: dash.refresh,
  };
}