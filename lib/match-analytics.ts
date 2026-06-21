import type { IndividualGame } from "@/types/match.type";

type SideKey = "side1" | "side2";

export interface MatchAnalytics {
  momentum: {
    longestStreak: Record<SideKey, number>;
  };
  clutch: {
    pointsWon: Record<SideKey, number>;
    deucePointsWon: Record<SideKey, number>;
    totalClutchPoints: number;
    totalDeucePoints: number;
  };
  leadComeback: {
    largestLead: Record<SideKey, number>;
    comebacksWon: Record<SideKey, number>;
    leadChanges: number;
  };
  serveTurn: {
    pointsWonOnServe: Record<SideKey, number>;
    totalServePoints: Record<SideKey, number>;
    turnsWon: Record<SideKey, number>;
    totalTurns: Record<SideKey, number>;
    avgPointsPerTurn: Record<SideKey, number>;
    turnEfficiencyPct: Record<SideKey, number>;
  };
  scoreProgression: Array<{ game: string; side1: number; side2: number }>;
  summary: string[];
}

function normalizeSide(raw: unknown): SideKey | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (raw === 0) return "side1";
    if (raw === 1) return "side2";
  }
  const value = String(raw).trim().toLowerCase();
  if (
    value === "side1" ||
    value === "team1" ||
    value === "left"
  ) {
    return "side1";
  }
  if (
    value === "side2" ||
    value === "team2" ||
    value === "right"
  ) {
    return "side2";
  }
  return null;
}

/** Point winner: player id first (shot.side is often a scoring id, not "side1"). */
function resolvePointWinnerSide(
  shot: Record<string, unknown>,
  sideFromId: (id: string | null) => SideKey | null
): SideKey | null {
  const playerId = normalizeId(shot?.player);
  const fromPlayer = sideFromId(playerId);
  if (fromPlayer) return fromPlayer;

  for (const field of ["side", "winnerSide"] as const) {
    const raw = shot[field];
    if (raw == null) continue;
    const asSide = normalizeSide(raw);
    if (asSide) return asSide;
    const fromScoringId = sideFromId(normalizeId(raw));
    if (fromScoringId) return fromScoringId;
  }
  return null;
}

function normalizeId(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw && "_id" in raw) {
    const id = (raw as { _id?: string })._id;
    return id ? String(id) : null;
  }
  return String(raw);
}

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}

export function computeMatchAnalytics(
  games: IndividualGame[],
  side1Name: string,
  side2Name: string,
  options?: {
    side1MemberIds?: string[];
    side2MemberIds?: string[];
  }
): MatchAnalytics {
  const side1IdSet = new Set(
    (options?.side1MemberIds || []).map((id) => id?.trim()).filter(Boolean)
  );
  const side2IdSet = new Set(
    (options?.side2MemberIds || []).map((id) => id?.trim()).filter(Boolean)
  );

  const sideFromId = (id: string | null): SideKey | null => {
    if (!id) return null;
    if (side1IdSet.has(id)) return "side1";
    if (side2IdSet.has(id)) return "side2";
    return null;
  };
  let lastWinner: SideKey | null = null;
  let currentStreak = 0;
  let leadChanges = 0;

  const longestStreak: Record<SideKey, number> = { side1: 0, side2: 0 };
  const clutchPointsWon: Record<SideKey, number> = { side1: 0, side2: 0 };
  const deucePointsWon: Record<SideKey, number> = { side1: 0, side2: 0 };
  const largestLead: Record<SideKey, number> = { side1: 0, side2: 0 };
  const comebacksWon: Record<SideKey, number> = { side1: 0, side2: 0 };
  const pointsWonOnServe: Record<SideKey, number> = { side1: 0, side2: 0 };
  const totalServePoints: Record<SideKey, number> = { side1: 0, side2: 0 };
  const turnsWon: Record<SideKey, number> = { side1: 0, side2: 0 };
  const totalTurns: Record<SideKey, number> = { side1: 0, side2: 0 };

  const scoreProgression: Array<{ game: string; side1: number; side2: number }> = [];

  let totalClutchPoints = 0;
  let totalDeucePoints = 0;
  let pointIndex = 1;
  let prevDiff = 0;

  for (let gameIndex = 0; gameIndex < (games || []).length; gameIndex += 1) {
    const game = games[gameIndex];
    const shots = game?.shots || [];
    let gameSide1 = 0;
    let gameSide2 = 0;
    let minDiffForSide1 = 0;
    let minDiffForSide2 = 0;

    let currentServer: SideKey | null = null;
    let currentTurnPoints = 0;
    let currentTurnServerWon = 0;

    for (let shotIndex = 0; shotIndex < shots.length; shotIndex += 1) {
      const shot = shots[shotIndex] as Record<string, unknown>;
      const winnerSide = resolvePointWinnerSide(shot, sideFromId);
      if (!winnerSide) continue;
      const playerId = normalizeId(shot?.player);

      const isClutchPoint = gameSide1 >= 9 || gameSide2 >= 9;
      const isDeucePoint = gameSide1 >= 10 && gameSide2 >= 10;

      if (isClutchPoint) {
        totalClutchPoints += 1;
        clutchPointsWon[winnerSide] += 1;
      }
      if (isDeucePoint) {
        totalDeucePoints += 1;
        deucePointsWon[winnerSide] += 1;
      }

      if (winnerSide === "side1") gameSide1 += 1;
      else gameSide2 += 1;

      const serverId = normalizeId(shot?.server);
      const serverSide =
        normalizeSide(shot?.server?.side) ||
        normalizeSide(shot?.serverSide) ||
        normalizeSide(serverId) ||
        sideFromId(serverId);
      const effectiveServerSide = serverSide || sideFromId(playerId);

      if (effectiveServerSide) {
        totalServePoints[effectiveServerSide] += 1;
        if (winnerSide === effectiveServerSide) {
          pointsWonOnServe[effectiveServerSide] += 1;
        }

        if (currentServer !== effectiveServerSide) {
          if (currentServer) {
            totalTurns[currentServer] += 1;
            turnsWon[currentServer] += currentTurnServerWon;
          }
          currentServer = effectiveServerSide;
          currentTurnPoints = 0;
          currentTurnServerWon = 0;
        }

        currentTurnPoints += 1;
        if (winnerSide === effectiveServerSide) currentTurnServerWon += 1;
      }

      if (winnerSide === lastWinner) currentStreak += 1;
      else {
        currentStreak = 1;
        lastWinner = winnerSide;
      }
      if (currentStreak > longestStreak[winnerSide]) {
        longestStreak[winnerSide] = currentStreak;
      }

      const diff = gameSide1 - gameSide2;
      if (diff > largestLead.side1) largestLead.side1 = diff;
      if (-diff > largestLead.side2) largestLead.side2 = -diff;

      if ((prevDiff > 0 && diff < 0) || (prevDiff < 0 && diff > 0)) {
        leadChanges += 1;
      }
      if (diff < minDiffForSide1) minDiffForSide1 = diff;
      if (diff > minDiffForSide2) minDiffForSide2 = diff;
      prevDiff = diff;

      scoreProgression.push({
        game: `P${pointIndex}`,
        side1: gameSide1,
        side2: gameSide2,
      });
      pointIndex += 1;
    }

    if (currentServer) {
      totalTurns[currentServer] += 1;
      turnsWon[currentServer] += currentTurnServerWon;
    }

    const gameWinnerSide =
      normalizeSide((game as any)?.winnerSide) ||
      (gameSide1 > gameSide2 ? "side1" : gameSide2 > gameSide1 ? "side2" : null);

    if (gameWinnerSide === "side1" && minDiffForSide1 <= -2) comebacksWon.side1 += 1;
    if (gameWinnerSide === "side2" && minDiffForSide2 >= 2) comebacksWon.side2 += 1;

    // Streaks and lead swings are per-game; do not carry across games/submatches.
    lastWinner = null;
    currentStreak = 0;
    prevDiff = 0;
  }

  const avgPointsPerTurn: Record<SideKey, number> = {
    side1: totalTurns.side1 > 0 ? round(pointsWonOnServe.side1 / totalTurns.side1) : 0,
    side2: totalTurns.side2 > 0 ? round(pointsWonOnServe.side2 / totalTurns.side2) : 0,
  };

  const turnEfficiencyPct: Record<SideKey, number> = {
    side1:
      totalServePoints.side1 > 0
        ? round((pointsWonOnServe.side1 / totalServePoints.side1) * 100)
        : 0,
    side2:
      totalServePoints.side2 > 0
        ? round((pointsWonOnServe.side2 / totalServePoints.side2) * 100)
        : 0,
  };

  const summary = buildSummary({
    side1Name,
    side2Name,
    longestStreak,
    clutchPointsWon,
    totalClutchPoints,
    turnEfficiencyPct,
    largestLead,
    comebacksWon,
  });

  return {
    momentum: { longestStreak },
    clutch: {
      pointsWon: clutchPointsWon,
      deucePointsWon,
      totalClutchPoints,
      totalDeucePoints,
    },
    leadComeback: { largestLead, comebacksWon, leadChanges },
    serveTurn: {
      pointsWonOnServe,
      totalServePoints,
      turnsWon,
      totalTurns,
      avgPointsPerTurn,
      turnEfficiencyPct,
    },
    scoreProgression,
    summary,
  };
}

function buildSummary(input: {
  side1Name: string;
  side2Name: string;
  longestStreak: Record<SideKey, number>;
  clutchPointsWon: Record<SideKey, number>;
  totalClutchPoints: number;
  turnEfficiencyPct: Record<SideKey, number>;
  largestLead: Record<SideKey, number>;
  comebacksWon: Record<SideKey, number>;
}): string[] {
  const {
    side1Name,
    side2Name,
    longestStreak,
    clutchPointsWon,
    totalClutchPoints,
    turnEfficiencyPct,
    largestLead,
    comebacksWon,
  } = input;

  const leaderByStreak =
    longestStreak.side1 > longestStreak.side2
      ? side1Name
      : longestStreak.side2 > longestStreak.side1
        ? side2Name
        : null;
  const leaderByClutch =
    clutchPointsWon.side1 > clutchPointsWon.side2
      ? side1Name
      : clutchPointsWon.side2 > clutchPointsWon.side1
        ? side2Name
        : null;
  const leaderByServe =
    turnEfficiencyPct.side1 > turnEfficiencyPct.side2
      ? side1Name
      : turnEfficiencyPct.side2 > turnEfficiencyPct.side1
        ? side2Name
        : null;

  const line1Parts: string[] = [];
  if (leaderByServe) {
    const pct =
      leaderByServe === side1Name
        ? turnEfficiencyPct.side1
        : turnEfficiencyPct.side2;
    line1Parts.push(`${leaderByServe} was stronger on serve (${pct}% serve efficiency)`);
  }
  if (leaderByClutch && totalClutchPoints > 0) {
    const clutchWon =
      leaderByClutch === side1Name
        ? clutchPointsWon.side1
        : clutchPointsWon.side2;
    line1Parts.push(`${leaderByClutch} converted more clutch points (${clutchWon})`);
  }

  const line2Parts: string[] = [];
  if (leaderByStreak) {
    const streak =
      leaderByStreak === side1Name
        ? longestStreak.side1
        : longestStreak.side2;
    line2Parts.push(`${leaderByStreak} built the best momentum run (${streak} straight points)`);
  }

  const totalComebacks = comebacksWon.side1 + comebacksWon.side2;
  if (totalComebacks > 0) {
    line2Parts.push(`the match featured ${totalComebacks} comeback game${totalComebacks > 1 ? "s" : ""}`);
  } else {
    const biggerLead =
      largestLead.side1 >= largestLead.side2 ? side1Name : side2Name;
    const margin = Math.max(largestLead.side1, largestLead.side2);
    line2Parts.push(`${biggerLead} held the biggest in-game lead (${margin} points)`);
  }

  const line1 =
    line1Parts.length > 0
      ? `${line1Parts.join(" and ")}.`
      : `Both players were closely matched on serve and clutch points.`;
  const line2 =
    line2Parts.length > 0
      ? `${line2Parts.join(", ")}.`
      : `Momentum swings were balanced throughout the match.`;

  return [line1, line2];
}
