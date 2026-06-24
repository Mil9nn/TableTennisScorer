import type { IndividualGame, IndividualMatch, Participant } from "@/types/match.type";

function toId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    const obj = raw as { $oid?: unknown; _id?: unknown };
    if (obj.$oid != null) return String(obj.$oid);
    if (obj._id != null) return toId(obj._id);
  }
  return String(raw);
}

/** Left / right scoring player ids (singles: P0 vs P1; doubles: side1 main vs side2 main for aggregate UI). */
export function getScoringIds(match: IndividualMatch): [string, string] | null {
  const teams = match.teams as { players: Participant[] }[] | undefined;
  if (teams && teams.length === 2) {
    const t0 = toId(teams[0]?.players?.[0]?._id);
    const t1 = toId(teams[1]?.players?.[0]?._id);
    if (t0 && t1) return [t0, t1];
  }
  const left = toId(match.participants?.[0]?._id);
  const right =
    match.matchType === "singles"
      ? toId(match.participants?.[1]?._id)
      : toId(match.participants?.[2]?._id);
  if (left && right) return [left, right];
  return null;
}

type GameScoreFields = Pick<
  IndividualGame,
  "scoresByTeam" | "scoresById" | "team1Score" | "team2Score"
> & {
  scores?: Record<string, number>;
  scoresByPlayerId?: Record<string, number>;
};

/**
 * Point totals for team index 0 and 1 (left / right in UI).
 * Prefers per-player maps (source of truth after score/undo API), then decorated
 * team1/team2 fields, then scoresByTeam (can be stale on partial socket updates).
 */
export function gamePointsByTeamIndex(
  game: GameScoreFields,
  leftPlayerId?: string | null,
  rightPlayerId?: string | null
): [number, number] {
  const by =
    game.scoresById ??
    (game as { scores?: Record<string, number> }).scores ??
    (game as { scoresByPlayerId?: Record<string, number> }).scoresByPlayerId;
  if (by && typeof by === "object" && !Array.isArray(by) && leftPlayerId && rightPlayerId) {
    const hasMappedPoints =
      Object.prototype.hasOwnProperty.call(by, leftPlayerId) ||
      Object.prototype.hasOwnProperty.call(by, rightPlayerId);
    if (hasMappedPoints) {
      return [Number(by[leftPlayerId] ?? 0), Number(by[rightPlayerId] ?? 0)];
    }
  }
  if (game.team1Score != null || game.team2Score != null) {
    return [Number(game.team1Score ?? 0), Number(game.team2Score ?? 0)];
  }
  if (Array.isArray(game.scoresByTeam) && game.scoresByTeam.length >= 2) {
    return [Number(game.scoresByTeam[0] ?? 0), Number(game.scoresByTeam[1] ?? 0)];
  }
  if (by && typeof by === "object" && !Array.isArray(by)) {
    const vals = Object.values(by).map((n) => Number(n));
    if (vals.length >= 2) return [vals[0], vals[1]];
  }
  return [0, 0];
}

/** Point totals aligned to getScoringIds order (p0 = left, p1 = right). */
export function singlesGamePointScores(
  game: IndividualGame,
  p0: string,
  p1: string
): { team0: number; team1: number } {
  const [a, b] = gamePointsByTeamIndex(game, p0, p1);
  return { team0: a, team1: b };
}

function isIndividualGameComplete(game: IndividualGame): boolean {
  const g = game as IndividualGame & {
    status?: string;
    completed?: boolean;
    winnerId?: unknown;
    winnerSide?: string | null;
  };
  return Boolean(
    g.completed ||
      g.winnerSide ||
      g.winnerId ||
      g.status === "completed"
  );
}

/**
 * Resolve the game document used for live point totals.
 * Avoids reading 0-0 when match.currentGame points at a not-yet-created next game.
 */
export function resolveActiveIndividualGame(
  match: IndividualMatch,
  preferredGameNumber?: number
): { game: IndividualGame | undefined; gameNumber: number } {
  const games = match.games || [];
  const preferred = preferredGameNumber ?? match.currentGame ?? 1;

  if (!games.length) {
    return { game: undefined, gameNumber: preferred };
  }

  const atPreferred = games.find((g) => g.gameNumber === preferred);
  if (atPreferred && !isIndividualGameComplete(atPreferred)) {
    return { game: atPreferred, gameNumber: preferred };
  }

  const inProgress = games.filter((g) => !isIndividualGameComplete(g));
  if (inProgress.length > 0) {
    const latest = inProgress.reduce((a, b) =>
      (a.gameNumber ?? 0) >= (b.gameNumber ?? 0) ? a : b
    );
    return { game: latest, gameNumber: latest.gameNumber ?? preferred };
  }

  if (atPreferred) {
    return { game: atPreferred, gameNumber: preferred };
  }

  const last = games[games.length - 1];
  return {
    game: last,
    gameNumber: last?.gameNumber ?? preferred,
  };
}

export function getSetScores(match: IndividualMatch): [number, number] {
  const fs = match.finalScore;
  if (fs?.setsByTeam && fs.setsByTeam.length >= 2) {
    return [Number(fs.setsByTeam[0] ?? 0), Number(fs.setsByTeam[1] ?? 0)];
  }
  const legacySets = fs as { side1Sets?: number; side2Sets?: number } | undefined;
  if (legacySets?.side1Sets != null || legacySets?.side2Sets != null) {
    return [Number(legacySets.side1Sets ?? 0), Number(legacySets.side2Sets ?? 0)];
  }
  if (fs?.setsById) {
    const ids = getScoringIds(match);
    if (ids) {
      const hasMappedSets =
        Object.prototype.hasOwnProperty.call(fs.setsById, ids[0]) ||
        Object.prototype.hasOwnProperty.call(fs.setsById, ids[1]);
      if (hasMappedSets) {
        return [Number(fs.setsById[ids[0]] ?? 0), Number(fs.setsById[ids[1]] ?? 0)];
      }
    }
  }

  // Final fallback: derive set score from completed game winners.
  let side1Sets = 0;
  let side2Sets = 0;
  const ids = getScoringIds(match);
  for (const g of match.games || []) {
    if (typeof g?.winnerTeamIndex === "number") {
      if (g.winnerTeamIndex === 0) side1Sets += 1;
      if (g.winnerTeamIndex === 1) side2Sets += 1;
      continue;
    }

    const winnerId = toId((g as any)?.winnerId ?? (g as any)?.winner);
    if (winnerId && ids) {
      if (winnerId === ids[0]) side1Sets += 1;
      if (winnerId === ids[1]) side2Sets += 1;
      continue;
    }

    if ((g as any)?.winnerSide === "side1") side1Sets += 1;
    if ((g as any)?.winnerSide === "side2") side2Sets += 1;
  }
  return [side1Sets, side2Sets];
}
