import { useMemo } from "react";
import type {
  IndividualGame,
  IndividualMatch,
  InitialServerConfig,
  Match,
  Participant,
  SubMatch,
  TeamMatch,
} from "@/types/match.type";
import type { Shot } from "@/types/shot.type";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import {
  computeStats,
  computePlayerStats,
  computeServeStats,
  detectAchievements,
  formatStrokeName,
  generatePerformanceInsights,
} from "@/lib/match-stats-utils";
import { computeMatchAnalytics } from "@/lib/match-analytics";
import {
  getScoringIds,
  getSetScores,
  gamePointsByTeamIndex,
} from "@/lib/match/singlesClient";
import { subMatchHeadToHeadIds } from "@/lib/match-stats/subMatchHeadToHead";

export type MatchStatsKind = "individual" | "team";

export interface TeamSubMatchDetail {
  index: number;
  matchNumber: number;
  player1Label: string;
  player2Label: string;
  team1Sets: number;
  team2Sets: number;
  winnerSide: SubMatch["winnerSide"];
  games: IndividualGame[];
  participants: Participant[];
  scoringIds: [string, string] | null;
  serverConfig?: InitialServerConfig | null;
}

export interface MatchStatsData {
  kind: MatchStatsKind;
  matchId: string;
  isSimpleTracking: boolean;
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  side1AvatarUri?: string;
  side2AvatarUri?: string;
  winnerSide?: string | null;
  games: IndividualGame[];
  participants: Participant[];
  scoringIds: [string, string] | null;
  serverConfig?: InitialServerConfig | null;
  finalScoreForShotFeed: { side1Sets: number; side2Sets: number };
  shots: Shot[];
  analytics: ReturnType<typeof computeMatchAnalytics>;
  insights: ReturnType<typeof generatePerformanceInsights>;
  achievements: ReturnType<typeof detectAchievements>;
  serveData: { player: string; Serve: number; Receive: number; ServeTotal: number; ReceiveTotal: number }[];
  strokeData: { name: string; value: number }[];
  playerPieData: {
    playerId: string;
    playerName: string;
    data: { name: string; value: number }[];
  }[];
  gameProgressionData: Array<{ game: string; [key: string]: string | number }>;
  subMatchDetails?: TeamSubMatchDetail[];
  category: "individual" | "team";
}

function flattenShots(games: IndividualGame[]) {
  return games.flatMap((g) => g.shots || []);
}

function formatParticipantLabel(p: Participant | string | undefined, fallback: string): string {
  if (!p || typeof p === "string") return fallback;
  return p.fullName || p.username || fallback;
}

function formatSideLabel(
  players: (Participant | string | undefined)[],
  fallback: string
): string {
  const labels = players
    .map((p, i) => formatParticipantLabel(p as Participant, `P${i + 1}`))
    .filter(Boolean);
  return labels.length > 0 ? labels.join(" & ") : fallback;
}

function buildServeData(
  participants: Participant[],
  serveStats: Record<
    string,
    {
      servePoints: number;
      receivePoints: number;
      totalServes: number;
      totalReceives: number;
    }
  >
) {
  const participantServeData = participants.map((p, index) => {
    const pid = p?._id?.toString?.();
    const s = pid ? serveStats[pid] : undefined;
    return {
      player: p?.fullName || p?.username || `Player ${index + 1}`,
      Serve: s?.servePoints ?? 0,
      Receive: s?.receivePoints ?? 0,
      ServeTotal: s?.totalServes ?? 0,
      ReceiveTotal: s?.totalReceives ?? 0,
    };
  });
  const unknownServeData = Object.entries(serveStats)
    .filter(([playerId]) => !participants.some((p) => p?._id?.toString?.() === playerId))
    .map(([playerId, s]) => ({
      player: `Player ${playerId.slice(-4)}`,
      Serve: s.servePoints,
      Receive: s.receivePoints,
      ServeTotal: s.totalServes,
      ReceiveTotal: s.totalReceives,
    }));
  return [...participantServeData, ...unknownServeData];
}

function buildPlayerPieData(
  playerStats: ReturnType<typeof computePlayerStats>,
  isSimpleTracking: boolean
) {
  if (isSimpleTracking) return [];
  return Object.entries(playerStats)
    .map(([playerId, stats]) => ({
      playerId,
      playerName: stats.name,
      data: Object.entries(stats.strokes)
        .map(([stroke, count]) => ({
          name: formatStrokeName(stroke),
          value: count,
        }))
        .filter((item) => item.value > 0),
    }))
    .filter((player) => {
      const name = (player.playerName || "").trim().toLowerCase();
      const hasValidName =
        !!name && name !== "unknown" && name !== "player" && !name.startsWith("unknown");
      const totalShots = player.data.reduce((sum, item) => sum + item.value, 0);
      return hasValidName && totalShots > 0;
    });
}

function buildIndividualStats(match: IndividualMatch, matchId: string): MatchStatsData {
  const isSingles = match.matchType === "singles";
  const isDoubles =
    match.matchType === "doubles" || match.matchType === "mixed_doubles";
  const participants = match.participants || [];
  const isSimpleTracking = (match as { shotTrackingMode?: string }).shotTrackingMode === "simple";

  const side1Name = isSingles
    ? formatParticipantLabel(participants[0], "Player 1")
    : isDoubles
      ? formatSideLabel([participants[0], participants[1]], "Side 1")
      : "Player 1";

  const side2Name = isSingles
    ? formatParticipantLabel(participants[1], "Player 2")
    : isDoubles
      ? formatSideLabel([participants[2], participants[3]], "Side 2")
      : "Player 2";

  const games = match.games || [];
  const shots = flattenShots(games);
  const firstServerId = (() => {
    const firstServer = match.serverConfig?.firstServer;
    if (firstServer === "side1") return participants[0]?._id?.toString?.() ?? null;
    if (firstServer === "side2") return participants[1]?._id?.toString?.() ?? null;
    return null;
  })();

  const { shotTypes } = computeStats(shots);
  const playerStats = computePlayerStats(shots);
  const serveStats = computeServeStats(games, match.matchCategory, {
    matchType: match.matchType,
    participantIds: participants.map((p) => p?._id?.toString?.()).filter(Boolean) as string[],
    firstServerId,
  });

  const scoringIds = getScoringIds(match);
  const [setsWonSide1, setsWonSide2] = getSetScores(match);

  const analytics = computeMatchAnalytics(games, side1Name, side2Name, {
    side1MemberIds: isDoubles
      ? [participants[0]?._id?.toString?.(), participants[1]?._id?.toString?.()].filter(
          Boolean
        ) as string[]
      : scoringIds?.[0]
        ? [scoringIds[0]]
        : [participants[0]?._id?.toString?.()].filter(Boolean) as string[],
    side2MemberIds: isDoubles
      ? [participants[2]?._id?.toString?.(), participants[3]?._id?.toString?.()].filter(
          Boolean
        ) as string[]
      : scoringIds?.[1]
        ? [scoringIds[1]]
        : [participants[1]?._id?.toString?.()].filter(Boolean) as string[],
  });

  const gameProgressionData = games.map((game, idx) => {
    const [a, b] = gamePointsByTeamIndex(
      game,
      scoringIds?.[0] ?? null,
      scoringIds?.[1] ?? null
    );
    return {
      game: `G${idx + 1}`,
      [side1Name]: a,
      [side2Name]: b,
    };
  });

  const insights = generatePerformanceInsights(
    shotTypes,
    serveStats,
    shots.length,
    participants.map((p) => p.fullName || p.username)
  );

  return {
    kind: "individual",
    matchId,
    category: "individual",
    isSimpleTracking,
    side1Name,
    side2Name,
    side1Sets: setsWonSide1,
    side2Sets: setsWonSide2,
    side1AvatarUri: participants[0]?.profileImage,
    side2AvatarUri: participants[1]?.profileImage,
    winnerSide: match.winnerSide ?? undefined,
    games,
    participants,
    scoringIds,
    serverConfig: match.serverConfig,
    finalScoreForShotFeed: {
      side1Sets: setsWonSide1,
      side2Sets: setsWonSide2,
    },
    shots,
    analytics,
    insights,
    achievements: detectAchievements(games, match),
    serveData: buildServeData(participants, serveStats),
    strokeData: Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    })),
    playerPieData: buildPlayerPieData(playerStats, isSimpleTracking),
    gameProgressionData,
  };
}

function resolveSubMatchPlayers(subMatch: SubMatch): {
  player1Label: string;
  player2Label: string;
  participants: Participant[];
} {
  const team1Players = Array.isArray(subMatch.playerTeam1)
    ? subMatch.playerTeam1
    : subMatch.playerTeam1
      ? [subMatch.playerTeam1 as Participant]
      : [];
  const team2Players = Array.isArray(subMatch.playerTeam2)
    ? subMatch.playerTeam2
    : subMatch.playerTeam2
      ? [subMatch.playerTeam2 as Participant]
      : [];

  const player1Label = Array.isArray(subMatch.playerTeam1)
    ? subMatch.playerTeam1
        .map((p) => formatParticipantLabel(p as Participant, "TBD"))
        .join(" & ")
    : formatParticipantLabel(subMatch.playerTeam1 as Participant, "TBD");

  const player2Label = Array.isArray(subMatch.playerTeam2)
    ? subMatch.playerTeam2
        .map((p) => formatParticipantLabel(p as Participant, "TBD"))
        .join(" & ")
    : formatParticipantLabel(subMatch.playerTeam2 as Participant, "TBD");

  const participants = [...team1Players, ...team2Players].filter(
    (p): p is Participant => p != null && typeof p === "object" && "username" in p
  );

  return { player1Label, player2Label, participants };
}

function buildTeamStats(match: TeamMatch, matchId: string): MatchStatsData {
  const isSimpleTracking = (match as { shotTrackingMode?: string }).shotTrackingMode === "simple";
  const team1Name = match.team1?.name || "Team 1";
  const team2Name = match.team2?.name || "Team 2";
  const team1Players = match.team1?.players?.map((p) => p.user) || [];
  const team2Players = match.team2?.players?.map((p) => p.user) || [];
  const participants = [...team1Players, ...team2Players];

  const games = match.subMatches?.flatMap((sm) => sm.games || []) || [];
  const shots = flattenShots(games);
  const { shotTypes } = computeStats(shots);
  const playerStats = computePlayerStats(shots);
  const serveStats = computeServeStats(games, match.matchCategory);

  const analytics = computeMatchAnalytics(games, team1Name, team2Name, {
    side1MemberIds: team1Players.map((p) => p?._id?.toString?.() || "").filter(Boolean),
    side2MemberIds: team2Players.map((p) => p?._id?.toString?.() || "").filter(Boolean),
  });

  const subMatchDetails: TeamSubMatchDetail[] =
    match.subMatches?.map((subMatch, index) => {
      const { player1Label, player2Label, participants: smParticipants } =
        resolveSubMatchPlayers(subMatch);
      return {
        index,
        matchNumber: subMatch.matchNumber,
        player1Label,
        player2Label,
        team1Sets: subMatch.finalScore?.team1Sets || 0,
        team2Sets: subMatch.finalScore?.team2Sets || 0,
        winnerSide: subMatch.winnerSide,
        games: subMatch.games || [],
        participants: smParticipants,
        scoringIds: subMatchHeadToHeadIds(subMatch),
        serverConfig: subMatch.serverConfig,
      };
    }) || [];

  const gameProgressionData =
    match.subMatches?.map((sm, idx) => ({
      game: `M${idx + 1}`,
      [team1Name]: sm.finalScore?.team1Sets || 0,
      [team2Name]: sm.finalScore?.team2Sets || 0,
    })) || [];

  const insights = generatePerformanceInsights(
    shotTypes,
    serveStats,
    shots.length,
    participants.map((p) => p?.fullName || p?.username || "")
  );

  return {
    kind: "team",
    matchId,
    category: "team",
    isSimpleTracking,
    side1Name: team1Name,
    side2Name: team2Name,
    side1Sets: match.finalScore?.team1Matches ?? 0,
    side2Sets: match.finalScore?.team2Matches ?? 0,
    side1AvatarUri: team1Players[0]?.profileImage,
    side2AvatarUri: team2Players[0]?.profileImage,
    winnerSide: match.winnerTeam ?? undefined,
    games,
    participants,
    scoringIds: null,
    serverConfig: match.serverConfig,
    finalScoreForShotFeed: {
      side1Sets: match.finalScore?.team1Matches ?? 0,
      side2Sets: match.finalScore?.team2Matches ?? 0,
    },
    shots,
    analytics,
    insights,
    achievements: detectAchievements(games, {
      _id: match._id,
      matchCategory: "individual",
      matchType: "singles",
      numberOfSets: 0,
      participants,
      status: match.status,
      currentGame: 1,
      games,
      finalScore: {
        setsByTeam: [
          match.finalScore?.team1Matches ?? 0,
          match.finalScore?.team2Matches ?? 0,
        ],
      },
    } as IndividualMatch),
    serveData: buildServeData(participants, serveStats),
    strokeData: Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    })),
    playerPieData: buildPlayerPieData(playerStats, isSimpleTracking),
    gameProgressionData,
    subMatchDetails,
  };
}

export function computeMatchStatsData(
  match: Match,
  matchId: string
): MatchStatsData | null {
  if (isIndividualMatch(match)) return buildIndividualStats(match, matchId);
  if (isTeamMatch(match)) return buildTeamStats(match, matchId);
  return null;
}

export function useMatchStatsData(
  match: Match | null,
  matchId: string | undefined
): MatchStatsData | null {
  return useMemo(() => {
    if (!match || !matchId) return null;
    return computeMatchStatsData(match, matchId);
  }, [match, matchId]);
}
