import { useCallback, useEffect, useState } from "react";
import type { Href } from "expo-router";
import { axiosInstance } from "@/lib/axiosInstance";
import { timeAgo } from "@/lib/utils";

export type HomeActivityKind = "match" | "team_match" | "tournament";

export type HomeActivityItem = {
  id: string;
  kind: HomeActivityKind;
  title: string;
  subtitle: string;
  timeLabel: string;
  isLive: boolean;
  status: string;
  href: Href;
  isUserRelated: boolean;
};

type MatchRow = {
  _id: string;
  matchType?: string;
  status?: string;
  participants?: ({ _id?: string; username?: string; fullName?: string } | string)[];
  createdAt?: string;
  updatedAt?: string;
};

type TeamMatchRow = {
  _id: string;
  status?: string;
  matchFormat?: string;
  team1?: { name?: string; players?: { user?: { _id?: string } | string }[] };
  team2?: { name?: string; players?: { user?: { _id?: string } | string }[] };
  createdAt?: string;
  updatedAt?: string;
};

type TournamentRow = {
  _id: string;
  name?: string;
  status?: string;
  city?: string;
  startDate?: string;
  updatedAt?: string;
  organizer?: { _id?: string } | string;
  participants?: ({ _id?: string } | string)[];
};

function asId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && "_id" in (raw as object)) {
    return asId((raw as { _id?: unknown })._id);
  }
  return String(raw);
}

function participantLabel(
  p: { username?: string; fullName?: string } | undefined,
  fallback: string,
) {
  return p?.fullName?.trim() || p?.username?.trim() || fallback;
}

function isUserInIndividualMatch(match: MatchRow, userId?: string): boolean {
  if (!userId) return false;
  return (match.participants ?? []).some((p) => asId(typeof p === "string" ? p : p?._id) === userId);
}

function isUserInTeamMatch(match: TeamMatchRow, userId?: string): boolean {
  if (!userId) return false;
  const players = [...(match.team1?.players ?? []), ...(match.team2?.players ?? [])];
  return players.some((p) => asId(p?.user) === userId);
}

function isUserInTournament(tournament: TournamentRow, userId?: string): boolean {
  if (!userId) return false;
  if (asId(tournament.organizer) === userId) return true;
  return (tournament.participants ?? []).some((p) => asId(typeof p === "string" ? p : p?._id) === userId);
}

function formatTeamFormatLabel(format?: string) {
  if (format === "five_singles") return "Swaythling";
  if (format === "single_double_single") return "S-D-S";
  if (format === "custom") return "Custom";
  return format?.replace(/_/g, " ") || "Team match";
}

function formatStatusLabel(status: string, isLive: boolean) {
  if (isLive) return "Live";
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Finished";
  if (status === "cancelled") return "Cancelled";
  if (status === "active") return "Active";
  if (!status) return "Update";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function matchToActivity(match: MatchRow, userId?: string): HomeActivityItem | null {
  const id = match._id;
  if (!id) return null;

  const p = match.participants ?? [];
  const participants = p.map((entry) =>
    typeof entry === "string" ? { _id: entry } : entry,
  );
  const isDoubles = match.matchType === "doubles";
  const side1 = isDoubles
    ? `${participantLabel(participants[0], "Player 1")} & ${participantLabel(participants[1], "Player 2")}`
    : participantLabel(participants[0], "Player 1");
  const side2 = isDoubles
    ? `${participantLabel(participants[2], "Player 3")} & ${participantLabel(participants[3], "Player 4")}`
    : participantLabel(participants[1], "Player 2");

  const typeLabel =
    match.matchType === "doubles"
      ? "Doubles"
      : match.matchType === "singles"
        ? "Singles"
        : "Match";

  const status = match.status ?? "";
  const isLive = status === "in_progress";
  const statusLabel = formatStatusLabel(status, isLive);
  const stamp = match.updatedAt || match.createdAt;

  return {
    id: `match-${id}`,
    kind: "match",
    title: `${side1} vs ${side2}`,
    subtitle: `${typeLabel} · ${statusLabel}`,
    timeLabel: stamp ? timeAgo(stamp) : "",
    isLive,
    status,
    href: { pathname: "/match/[id]", params: { id } },
    isUserRelated: isUserInIndividualMatch(match, userId),
  };
}

function teamMatchToActivity(match: TeamMatchRow, userId?: string): HomeActivityItem | null {
  const id = match._id;
  if (!id) return null;

  const team1 = match.team1?.name?.trim() || "Team 1";
  const team2 = match.team2?.name?.trim() || "Team 2";
  const status = match.status ?? "";
  const isLive = status === "in_progress";
  const statusLabel = formatStatusLabel(status, isLive);
  const stamp = match.updatedAt || match.createdAt;

  return {
    id: `team-${id}`,
    kind: "team_match",
    title: `${team1} vs ${team2}`,
    subtitle: `${formatTeamFormatLabel(match.matchFormat)} · ${statusLabel}`,
    timeLabel: stamp ? timeAgo(stamp) : "",
    isLive,
    status,
    href: { pathname: "/match/[id]", params: { id, category: "team" } },
    isUserRelated: isUserInTeamMatch(match, userId),
  };
}

function tournamentToActivity(t: TournamentRow, userId?: string): HomeActivityItem | null {
  const id = t._id;
  if (!id) return null;

  const status = t.status ?? "";
  const isLive = status === "active";
  const statusLabel = formatStatusLabel(status, isLive);
  const location = t.city?.trim();
  const stamp = t.updatedAt || t.startDate;

  return {
    id: `tournament-${id}`,
    kind: "tournament",
    title: t.name?.trim() || "Tournament",
    subtitle: location ? `${statusLabel} · ${location}` : statusLabel,
    timeLabel: stamp ? timeAgo(stamp) : "",
    isLive,
    status,
    href: { pathname: "/tournaments/[id]", params: { id } },
    isUserRelated: isUserInTournament(t, userId),
  };
}

function sortByRecency(items: HomeActivityItem[], rows: { id: string; stamp?: string }[]) {
  const stampById = new Map(rows.map((r) => [r.id, r.stamp ? new Date(r.stamp).getTime() : 0]));
  return [...items].sort(
    (a, b) => (stampById.get(b.id) ?? 0) - (stampById.get(a.id) ?? 0),
  );
}

function prioritizeUserItems(items: HomeActivityItem[], limit: number) {
  const userItems = items.filter((item) => item.isUserRelated);
  const otherItems = items.filter((item) => !item.isUserRelated);
  const merged: HomeActivityItem[] = [];
  const seen = new Set<string>();

  for (const item of [...userItems, ...otherItems]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function useHomeActivity(enabled: boolean, userId?: string) {
  const [items, setItems] = useState<HomeActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [matchesResult, teamMatchesResult, tournamentsResult] = await Promise.allSettled([
          axiosInstance.get("/matches/individual?limit=12&skip=0&sortBy=createdAt&sortOrder=desc"),
          axiosInstance.get("/matches/team?limit=8&skip=0&sortBy=createdAt&sortOrder=desc"),
          axiosInstance.get("/tournaments?limit=8&skip=0&sortBy=createdAt&sortOrder=desc"),
        ]);

        const matches: MatchRow[] =
          matchesResult.status === "fulfilled" ? (matchesResult.value.data?.matches ?? []) : [];
        const teamMatches: TeamMatchRow[] =
          teamMatchesResult.status === "fulfilled" ? (teamMatchesResult.value.data?.matches ?? []) : [];
        const tournaments: TournamentRow[] =
          tournamentsResult.status === "fulfilled" ? (tournamentsResult.value.data?.tournaments ?? []) : [];

        if (
          matchesResult.status === "rejected" &&
          teamMatchesResult.status === "rejected" &&
          tournamentsResult.status === "rejected"
        ) {
          throw new Error("All activity feeds failed");
        }

        const matchActivities = matches
          .map((match) => matchToActivity(match, userId))
          .filter((x): x is HomeActivityItem => x != null);
        const teamActivities = teamMatches
          .map((match) => teamMatchToActivity(match, userId))
          .filter((x): x is HomeActivityItem => x != null);
        const tournamentActivities = tournaments
          .map((tournament) => tournamentToActivity(tournament, userId))
          .filter((x): x is HomeActivityItem => x != null);

        const merged = [...matchActivities, ...teamActivities, ...tournamentActivities];
        const stamps = [
          ...matches.map((m) => ({
            id: `match-${m._id}`,
            stamp: m.updatedAt || m.createdAt,
          })),
          ...teamMatches.map((m) => ({
            id: `team-${m._id}`,
            stamp: m.updatedAt || m.createdAt,
          })),
          ...tournaments.map((t) => ({
            id: `tournament-${t._id}`,
            stamp: t.updatedAt || t.startDate,
          })),
        ];

        setItems(prioritizeUserItems(sortByRecency(merged, stamps), 10));
      } catch {
        setError("We couldn't load recent activity. Check your connection and try again.");
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    loading,
    refreshing,
    error,
    reload: () => load(),
    refresh: () => load({ silent: true }),
  };
}
