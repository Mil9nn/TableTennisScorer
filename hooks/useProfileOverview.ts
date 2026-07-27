import { fetchProfileOverview } from "@/lib/profile/api";
import { useCallback, useEffect, useState } from "react";

export type ProfileOverviewData = {
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  currentWinStreak: number;
  bestWinStreak: number;
  serveAccuracy: number;
  avgPointsPerMatch: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  setsWon: number;
  setsLost: number;
  recentForm: Array<"win" | "loss">;
  teamsCount: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  runnerUpCount: number;
  bestFinishLabel: string | null;
  showShots: boolean;
};

const emptyOverview: ProfileOverviewData = {
  wins: 0,
  losses: 0,
  totalMatches: 0,
  winRate: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  serveAccuracy: 0,
  avgPointsPerMatch: 0,
  totalPointsScored: 0,
  totalPointsConceded: 0,
  setsWon: 0,
  setsLost: 0,
  recentForm: [],
  teamsCount: 0,
  tournamentsPlayed: 0,
  tournamentsWon: 0,
  runnerUpCount: 0,
  bestFinishLabel: null,
  showShots: false,
};

export function useProfileOverview(userId: string) {
  const [data, setData] = useState<ProfileOverviewData>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);

    const res = await fetchProfileOverview(userId);
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load profile");
    }

    const payload = res.data;
    const career = payload.career;
    const counts = payload.counts;

    const wins = Number(career.wins ?? 0);
    const losses = Number(career.losses ?? 0);
    const totalMatches = Number(career.totalMatches ?? wins + losses);

    setData({
      wins,
      losses,
      totalMatches,
      winRate: Number(career.winRate ?? 0),
      currentWinStreak: Number(career.currentWinStreak ?? 0),
      bestWinStreak: Number(career.bestWinStreak ?? 0),
      serveAccuracy: Number(career.serveAccuracy ?? 0),
      avgPointsPerMatch: Number(career.avgPointsPerMatch ?? 0),
      totalPointsScored: Number(career.totalPointsScored ?? 0),
      totalPointsConceded: Number(career.totalPointsConceded ?? 0),
      setsWon: Number(career.setsWon ?? 0),
      setsLost: Number(career.setsLost ?? 0),
      recentForm: Array.isArray(payload.recentForm) ? payload.recentForm : [],
      teamsCount: Number(counts.teams ?? 0),
      tournamentsPlayed: Number(counts.tournamentsPlayed ?? 0),
      tournamentsWon: Number(counts.tournamentsWon ?? 0),
      runnerUpCount: Number(counts.runnerUpCount ?? 0),
      bestFinishLabel: payload.bestFinishLabel ?? null,
      showShots: Boolean(payload.flags?.hasShots),
    });
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load profile"),
      )
      .finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { data, loading, error, refresh };
}
