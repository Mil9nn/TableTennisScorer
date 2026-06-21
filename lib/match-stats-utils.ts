import { Shot } from "@/types/shot.type";
import type { IndividualMatch } from "@/types/match.type";
import {
  getSetScores,
  getScoringIds,
  gamePointsByTeamIndex,
} from "@/lib/match/singlesClient";

export interface PlayerStatsData {
  name: string;
  strokes: Record<string, number>;
}

const SHOT_TYPE_COLORS: Record<string, string> = {
  forehand_drive: "#E6194B",
  backhand_drive: "#F58231",
  forehand_topspin: "#FFC20E",
  backhand_topspin: "#BFEF45",
  forehand_loop: "#3CB44B",
  backhand_loop: "#42D4F4",
  forehand_smash: "#4363D8",
  backhand_smash: "#911EB4",
  forehand_push: "#F032E6",
  backhand_push: "#FABED4",
  forehand_chop: "#469990",
  backhand_chop: "#9A6324",
  forehand_flick: "#800000",
  backhand_flick: "#808000",
  forehand_block: "#000075",
  backhand_block: "#A9A9A9",
  forehand_drop: "#82CAFF",
  backhand_drop: "#AAFFC3",
  net_point: "#FF6B6B",
  serve_point: "#4ECDC4",
};

export const getShotColor = (shotType: string): string => {
  const normalized = shotType
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/fh\s+/i, "forehand_")
    .replace(/bh\s+/i, "backhand_");
  return SHOT_TYPE_COLORS[normalized] || "#94A3B8";
};

export function computeStats(shots: Shot[]) {
  const shotTypes: Record<string, number> = {};
  (shots || []).forEach((s) => {
    if (!s) return;
    if (s.stroke) {
      shotTypes[s.stroke] = (shotTypes[s.stroke] || 0) + 1;
    }
  });
  return { shotTypes };
}

export function computePlayerStats(shots: Shot[]): Record<string, PlayerStatsData> {
  const playerStats: Record<string, PlayerStatsData> = {};
  (shots || []).forEach((s) => {
    if (!s || !s.player) return;
    const playerId = s.player._id || s.player.toString();
    const playerName = s.player.fullName || s.player.username || "Unknown";
    if (!playerStats[playerId]) {
      playerStats[playerId] = { name: playerName, strokes: {} };
    }
    if (s.stroke) {
      playerStats[playerId].strokes[s.stroke] =
        (playerStats[playerId].strokes[s.stroke] || 0) + 1;
    }
  });
  return playerStats;
}

interface ServeStatsContext {
  matchType?: "singles" | "doubles" | "mixed_doubles";
  participantIds?: string[];
  firstServerId?: string | null;
}

export function computeServeStats(
  games: any[],
  matchCategory: string,
  context?: ServeStatsContext
) {
  const serveStats: Record<
    string,
    {
      servePoints: number;
      receivePoints: number;
      totalServes: number;
      totalReceives: number;
    }
  > = {};

  const extractId = (value: any): string | null => {
    if (!value) return null;
    const objectIdBufferToHex = (raw: any): string | null => {
      const data = raw?.buffer?.data;
      if (!Array.isArray(data) || data.length !== 12) return null;
      try {
        return data
          .map((b: number) => Number(b).toString(16).padStart(2, "0"))
          .join("");
      } catch {
        return null;
      }
    };

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed && trimmed !== "[object Object]" ? trimmed : null;
    }
    if (typeof value !== "object") return null;

    const maybeId =
      value._id ??
      value.id ??
      value.playerId ??
      value.userId ??
      value.$oid ??
      value.user ??
      value.player ??
      value.server ??
      null;

    if (typeof maybeId === "string") {
      const trimmed = maybeId.trim();
      return trimmed && trimmed !== "[object Object]" ? trimmed : null;
    }
    if (maybeId && typeof maybeId === "object") {
      const nested = extractId(maybeId);
      if (nested) return nested;
      const nestedBufferHex = objectIdBufferToHex(maybeId);
      if (nestedBufferHex) return nestedBufferHex;
    }
    const directBufferHex = objectIdBufferToHex(value);
    if (directBufferHex) return directBufferHex;
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") return asString;
    }
    return null;
  };

  const getSinglesServerForPoint = (
    gameIndex: number,
    pointIndex: number
  ): string | null => {
    const ids = context?.participantIds || [];
    if (ids.length < 2) return null;
    const p0 = ids[0];
    const p1 = ids[1];
    const first =
      context?.firstServerId && ids.includes(context.firstServerId)
        ? context.firstServerId
        : p0;
    const gameNumber = gameIndex + 1;
    const gameFirst = gameNumber % 2 === 0 ? (first === p0 ? p1 : p0) : first;
    const other = gameFirst === p0 ? p1 : p0;
    const totalPointsBeforeThisPoint = pointIndex;
    const deuce = totalPointsBeforeThisPoint >= 20;
    if (deuce) {
      return totalPointsBeforeThisPoint % 2 === 0 ? gameFirst : other;
    }
    return Math.floor(totalPointsBeforeThisPoint / 2) % 2 === 0 ? gameFirst : other;
  };

  (games || []).forEach((g, gameIndex) => {
    (g.shots || []).forEach((shot: any, pointIndex: number) => {
      const participantIds = context?.participantIds || [];
      const sideToParticipantId = (side: unknown): string | null => {
        if (side === "side1" || side === "team1") return participantIds[0] ?? null;
        if (side === "side2" || side === "team2") return participantIds[1] ?? null;
        if (typeof side === "string" && participantIds.includes(side)) return side;
        return null;
      };

      const pointWinnerId =
        extractId(shot.player) ||
        sideToParticipantId(shot.side) ||
        null;
      let serverId = extractId(shot.server);
      if (!serverId && context?.matchType === "singles") {
        serverId = getSinglesServerForPoint(gameIndex, pointIndex);
      }

      if (!pointWinnerId || !serverId) return;

      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
          totalReceives: 0,
        };
      }
      if (!serveStats[pointWinnerId]) {
        serveStats[pointWinnerId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
          totalReceives: 0,
        };
      }

      serveStats[serverId].totalServes += 1;
      const isServerWinner = pointWinnerId === serverId;
      for (const pid of participantIds) {
        if (pid && pid !== serverId && serveStats[pid]) {
          serveStats[pid].totalReceives += 1;
        }
      }

      if (isServerWinner) {
        serveStats[serverId].servePoints += 1;
      } else {
        serveStats[pointWinnerId].receivePoints += 1;
      }
    });
  });

  return serveStats;
}

export function formatStrokeName(stroke: string): string {
  const parts = stroke.split("_");
  if (parts.length === 2) {
    const side = parts[0] === "forehand" ? "FH" : parts[0] === "backhand" ? "BH" : parts[0];
    const type = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${side} ${type}`;
  }
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Achievement detection
export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export function detectAchievements(games: any[], match: IndividualMatch): Achievement[] {
  const achievements: Achievement[] = [];

  if (!games || games.length === 0) return achievements;

  const ids = getScoringIds(match);
  const [side1Sets, side2Sets] = getSetScores(match);
  const totalGames = games.length;

  const pointDiff = (game: any) => {
    const [a, b] = gamePointsByTeamIndex(game, ids?.[0] ?? null, ids?.[1] ?? null);
    return Math.abs(a - b);
  };

  const gameWinnerSide = (game: any): "side1" | "side2" => {
    if (typeof game?.winnerTeamIndex === "number") {
      return game.winnerTeamIndex === 0 ? "side1" : "side2";
    }
    const [a, b] = gamePointsByTeamIndex(game, ids?.[0] ?? null, ids?.[1] ?? null);
    return a >= b ? "side1" : "side2";
  };

  // Perfect Victory - Won all games
  if (side1Sets === totalGames || side2Sets === totalGames) {
    achievements.push({
      id: "perfect-game",
      icon: "🏆",
      title: "Perfect Victory",
      description: "Won the match without dropping a single game",
    });
  }

  // Epic Comeback - Lost first 2 games but won match
  if (games.length >= 3) {
    const game1Winner = gameWinnerSide(games[0]);
    const game2Winner = gameWinnerSide(games[1]);

    const winner = side1Sets > side2Sets ? "side1" : "side2";

    if (
      game1Winner !== winner &&
      game2Winner !== winner &&
      ((winner === "side1" && side1Sets > side2Sets) ||
        (winner === "side2" && side2Sets > side1Sets))
    ) {
      achievements.push({
        id: "comeback",
        icon: "🔥",
        title: "Epic Comeback",
        description: "Won the match after losing the first two games",
      });
    }
  }

  // Clean Sweep - Won all games by 5+ points
  const allGamesWonBy5Plus = games.every((game: any) => pointDiff(game) >= 5);

  if (
    allGamesWonBy5Plus &&
    games.length >= 3 &&
    (side1Sets === totalGames || side2Sets === totalGames)
  ) {
    achievements.push({
      id: "clean-sweep",
      icon: "💪",
      title: "Dominant Performance",
      description: "Won every game by 5 or more points",
    });
  }

  // Close Match - Every game decided by 3 or fewer points
  const allGamesClose = games.every((game: any) => pointDiff(game) <= 3);

  if (allGamesClose && games.length >= 3) {
    achievements.push({
      id: "close-match",
      icon: "⚔️",
      title: "Nail Biter",
      description: "Every game was decided by 3 points or fewer",
    });
  }

  return achievements;
}

// Insight generation
export interface Insight {
  type: "success" | "info" | "warning" | "highlight";
  headline: string;
  description: string;
  metric?: { label: string; value: string | number };
}

export function generatePerformanceInsights(
  shotTypes: Record<string, number>,
  serveStats: Record<string, any>,
  totalShots: number,
  playerNames: string[]
): Insight[] {
  const insights: Insight[] = [];

  // Dominant shot type
  const sortedShots = Object.entries(shotTypes).sort((a, b) => b[1] - a[1]);
  if (sortedShots.length > 0 && sortedShots[0][1] > totalShots * 0.2) {
    const [shotType, count] = sortedShots[0];
    const percentage = Math.round((count / totalShots) * 100);

    insights.push({
      type: "success",
      headline: `${formatStrokeName(shotType)} Dominance`,
      description: `This shot type accounted for ${percentage}% of all shots played, making it the most frequently used technique in the match.`,
      metric: { label: "Usage Rate", value: `${percentage}%` },
    });
  }

  // Serve performance
  const serveStatsArray = Object.entries(serveStats);
  if (serveStatsArray.length > 0) {
    const bestServer = serveStatsArray.reduce((best, current) => {
      const currentRate =
        current[1].totalServes > 0
          ? current[1].servePoints / current[1].totalServes
          : 0;
      const bestRate =
        best[1].totalServes > 0 ? best[1].servePoints / best[1].totalServes : 0;
      return currentRate > bestRate ? current : best;
    });

    if (bestServer[1].totalServes > 0) {
      const winRate = Math.round(
        (bestServer[1].servePoints / bestServer[1].totalServes) * 100
      );
      if (winRate >= 60) {
        insights.push({
          type: "highlight",
          headline: "Strong Service Game",
          description: `The server won ${winRate}% of service points, demonstrating excellent serve effectiveness and control.`,
          metric: { label: "Serve Win Rate", value: `${winRate}%` },
        });
      }
    }
  }

  // Shot variety
  const uniqueShotTypes = Object.keys(shotTypes).length;
  if (uniqueShotTypes >= 8) {
    insights.push({
      type: "info",
      headline: "Diverse Shot Selection",
      description: `The match featured ${uniqueShotTypes} different shot types, showcasing tactical variety and adaptability.`,
    });
  }

  return insights;
}

