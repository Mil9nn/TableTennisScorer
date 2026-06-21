import type { SubMatch, TeamInfo, TeamMatch } from "@/types/match.type";

function mapLikeToRecord(raw: unknown): Record<string, number> {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (Array.isArray(raw)) return Object.fromEntries(raw as [string, number][]);
  if (typeof raw === "object" && typeof (raw as Map<string, number>).entries === "function") {
    try {
      return Object.fromEntries(Array.from((raw as Map<string, number>).entries()));
    } catch {
      // fall through
    }
  }
  if (typeof raw === "object") return Object.fromEntries(Object.entries(raw as object));
  return {};
}

/** Best-of-N games for a team rubber (sub-match). */
export function rubberBestOf(
  subMatch: SubMatch | null | undefined,
  match?: TeamMatch | null
): number {
  if (!subMatch) {
    return (
      match?.numberOfSetsPerSubMatch ??
      (match as { numberOfGamesPerRubber?: number } | undefined)?.numberOfGamesPerRubber ??
      3
    );
  }
  return (
    subMatch.numberOfSets ??
    (subMatch as { numberOfGames?: number }).numberOfGames ??
    match?.numberOfSetsPerSubMatch ??
    (match as { numberOfGamesPerRubber?: number } | undefined)?.numberOfGamesPerRubber ??
    3
  );
}

export function readRubberSetCounts(
  subMatch: SubMatch | null | undefined,
  team1Id?: string,
  team2Id?: string
): { team1Sets: number; team2Sets: number } {
  const fs = subMatch?.finalScore as
    | {
        team1Sets?: number;
        team2Sets?: number;
        team1Games?: number;
        team2Games?: number;
        scoresByTeamId?: unknown;
      }
    | undefined;
  if (!fs) return { team1Sets: 0, team2Sets: 0 };

  if (fs.team1Sets != null || fs.team2Sets != null) {
    return {
      team1Sets: Number(fs.team1Sets ?? 0),
      team2Sets: Number(fs.team2Sets ?? 0),
    };
  }
  if (fs.team1Games != null || fs.team2Games != null) {
    return {
      team1Sets: Number(fs.team1Games ?? 0),
      team2Sets: Number(fs.team2Games ?? 0),
    };
  }

  const map = mapLikeToRecord(fs.scoresByTeamId);
  if (team1Id && team2Id && Object.keys(map).length > 0) {
    return {
      team1Sets: Number(map[team1Id] ?? 0),
      team2Sets: Number(map[team2Id] ?? 0),
    };
  }

  return { team1Sets: 0, team2Sets: 0 };
}

export function isRubberComplete(
  subMatch: SubMatch | null | undefined,
  match?: TeamMatch | null
): boolean {
  if (!subMatch) return false;
  if (subMatch.status === "completed") return true;

  const bestOf = rubberBestOf(subMatch, match);
  const gamesToWin = Math.ceil(bestOf / 2);
  const { team1Sets, team2Sets } = readRubberSetCounts(
    subMatch,
    match?.team1?._id,
    match?.team2?._id
  );
  return team1Sets >= gamesToWin || team2Sets >= gamesToWin;
}

/** Team logo, or first roster player's profile image. */
export function teamDisplayImageSrc(team?: TeamInfo | null): string | undefined {
  if (!team) return undefined;
  if (team.logo) return team.logo;
  const p = team.players?.[0];
  if (!p) return undefined;
  const user = (p as { user?: { profileImage?: string } }).user;
  return user?.profileImage ?? (p as { profileImage?: string }).profileImage;
}
