import type {
  IndividualGame,
  Match,
  Participant,
} from "@/types/match.type";
import type { Shot } from "@/types/shot.type";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import type { MatchStatsData, TeamSubMatchDetail } from "@/hooks/useMatchStatsData";
import {
  computeMatchAnalytics,
  type MatchAnalytics,
} from "@/lib/match-analytics";
import {
  computePlayerStats,
  computeServeStats,
  detectAchievements,
  formatStrokeName,
} from "@/lib/match-stats-utils";
import { gamePointsByTeamIndex } from "@/lib/match/singlesClient";
import {
  formatMatchDate,
  formatGeneratedTimestamp,
  formatSeconds,
  landingZoneColumn,
  lookupSeed,
  shortMatchId,
} from "./formatters";
import type {
  ErrorsWinnersBlock,
  GameScoreRow,
  GameTimeline,
  MatchPdfPayload,
  MatchPdfSectionFlags,
  PlayerInfo,
  PointTimelineEntry,
  RubberSection,
  ShotAnalysisBlock,
  StatsBlock,
} from "./types";

type SideKey = "side1" | "side2";

interface MatchExportMeta {
  roundName?: string;
  groupId?: string;
  isThirdPlaceMatch?: boolean;
  startedAt?: string | Date;
  city?: string;
  venue?: string;
  matchDuration?: number;
  status?: string;
  shotTrackingMode?: "detailed" | "simple";
  scorer?: Participant | string;
  tournament?: {
    _id?: string;
    name?: string;
    customBranding?: { logo?: string };
    seeding?: Array<{
      participant?: string | { _id?: string };
      seedNumber?: number;
    }>;
  } | null;
}

function asId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw && "_id" in raw) {
    return String((raw as { _id?: string })._id ?? "");
  }
  return String(raw);
}

function resolveScorerName(scorer?: Participant | string): string | undefined {
  if (!scorer) return undefined;
  if (typeof scorer === "string") return undefined;
  return scorer.fullName || scorer.username;
}

function resolveRoundLabel(meta: MatchExportMeta): string | undefined {
  const parts: string[] = [];
  if (meta.isThirdPlaceMatch) parts.push("Third Place");
  if (meta.roundName) parts.push(meta.roundName);
  if (meta.groupId) parts.push(`Group ${meta.groupId}`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function gameWinnerSide(
  game: IndividualGame,
  leftId: string | null,
  rightId: string | null
): SideKey | undefined {
  if (typeof game.winnerTeamIndex === "number") {
    return game.winnerTeamIndex === 0 ? "side1" : "side2";
  }
  const [a, b] = gamePointsByTeamIndex(game, leftId, rightId);
  if (a > b) return "side1";
  if (b > a) return "side2";
  return undefined;
}

function buildGameRows(
  games: IndividualGame[],
  scoringIds: [string, string] | null,
  sequentialNumbers = false
): { rows: GameScoreRow[]; side1Wins: number; side2Wins: number } {
  const leftId = scoringIds?.[0] ?? null;
  const rightId = scoringIds?.[1] ?? null;
  let side1Wins = 0;
  let side2Wins = 0;

  const rows = games.map((game, idx) => {
    const [s1, s2] = gamePointsByTeamIndex(game, leftId, rightId);
    const winner = gameWinnerSide(game, leftId, rightId);
    if (winner === "side1") side1Wins += 1;
    if (winner === "side2") side2Wins += 1;
    return {
      gameNumber: sequentialNumbers ? idx + 1 : game.gameNumber ?? idx + 1,
      side1Score: s1,
      side2Score: s2,
      duration: formatSeconds(game.duration),
      winnerSide: winner,
    };
  });

  return { rows, side1Wins, side2Wins };
}

function buildMemberIdMap(
  side1MemberIds: string[],
  side2MemberIds: string[]
): (playerId: string | null) => SideKey | null {
  const side1Set = new Set(side1MemberIds.filter(Boolean));
  const side2Set = new Set(side2MemberIds.filter(Boolean));
  return (playerId) => {
    if (!playerId) return null;
    if (side1Set.has(playerId)) return "side1";
    if (side2Set.has(playerId)) return "side2";
    return null;
  };
}

function resolvePointSide(
  shot: Shot,
  sideFromId: (id: string | null) => SideKey | null
): SideKey | null {
  const playerId = asId(shot.player);
  const fromPlayer = sideFromId(playerId);
  if (fromPlayer) return fromPlayer;

  const rawSide = shot.side;
  if (rawSide === "side1" || rawSide === "side2") return rawSide;
  return sideFromId(asId(rawSide));
}

function detectStreakNotes(
  streakSide: SideKey | null,
  streakLen: number,
  side1Label: string,
  side2Label: string
): string | null {
  if (!streakSide || streakLen < 3) return null;
  const name = streakSide === "side1" ? side1Label : side2Label;
  return `${name}: ${streakLen}-0 run`;
}

function buildGameTimeline(
  games: IndividualGame[],
  side1Label: string,
  side2Label: string,
  side1MemberIds: string[],
  side2MemberIds: string[]
): GameTimeline[] {
  const sideFromId = buildMemberIdMap(side1MemberIds, side2MemberIds);
  const timelines: GameTimeline[] = [];

  for (const game of games) {
    const shots = [...(game.shots || [])].sort(
      (a, b) => (a.shotNumber ?? 0) - (b.shotNumber ?? 0)
    );
    if (shots.length === 0) continue;

    let s1 = 0;
    let s2 = 0;
    let streakSide: SideKey | null = null;
    let streakLen = 0;
    const streakNotes: string[] = [];
    const points: PointTimelineEntry[] = [];

    for (const shot of shots) {
      const winner = resolvePointSide(shot, sideFromId);
      if (winner === "side1") s1 += 1;
      else if (winner === "side2") s2 += 1;

      if (winner === streakSide) {
        streakLen += 1;
      } else {
        const note = detectStreakNotes(streakSide, streakLen, side1Label, side2Label);
        if (note) streakNotes.push(note);
        streakSide = winner;
        streakLen = winner ? 1 : 0;
      }

      const scorerLabel =
        winner === "side1" ? side1Label : winner === "side2" ? side2Label : "—";
      const stroke = shot.stroke ? formatStrokeName(shot.stroke) : undefined;

      points.push({
        pointNumber: points.length + 1,
        scorerLabel,
        scoreAfter: `${s1}-${s2}`,
        stroke,
        streakHighlight: streakLen >= 5 && winner != null,
      });
    }

    const finalNote = detectStreakNotes(streakSide, streakLen, side1Label, side2Label);
    if (finalNote) streakNotes.push(finalNote);

    timelines.push({
      gameNumber: game.gameNumber,
      points,
      streakNotes,
    });
  }

  return timelines;
}

function hasDetailedShots(games: IndividualGame[]): boolean {
  return games.some((g) =>
    (g.shots || []).some(
      (s) => s.stroke != null || s.landingX != null || s.originX != null
    )
  );
}

function buildStatsBlock(
  games: IndividualGame[],
  analytics: MatchAnalytics,
  side1Name: string,
  side2Name: string,
  serveStats: ReturnType<typeof computeServeStats>,
  side1MemberIds: string[],
  side2MemberIds: string[]
): StatsBlock {
  const sumSide = (ids: string[], field: "servePoints" | "receivePoints" | "totalServes" | "totalReceives") =>
    ids.reduce((acc, id) => acc + (serveStats[id]?.[field] ?? 0), 0);

  return {
    side1Name,
    side2Name,
    servePointsWon: [
      sumSide(side1MemberIds, "servePoints"),
      sumSide(side2MemberIds, "servePoints"),
    ],
    receivePointsWon: [
      sumSide(side1MemberIds, "receivePoints"),
      sumSide(side2MemberIds, "receivePoints"),
    ],
    serveTotals: [
      sumSide(side1MemberIds, "totalServes"),
      sumSide(side2MemberIds, "totalServes"),
    ],
    receiveTotals: [
      sumSide(side1MemberIds, "totalReceives"),
      sumSide(side2MemberIds, "totalReceives"),
    ],
    longestStreak: [
      analytics.momentum.longestStreak.side1,
      analytics.momentum.longestStreak.side2,
    ],
    clutchPointsWon: [
      analytics.clutch.pointsWon.side1,
      analytics.clutch.pointsWon.side2,
    ],
    deucePointsWon: [
      analytics.clutch.deucePointsWon.side1,
      analytics.clutch.deucePointsWon.side2,
    ],
  };
}

function buildErrorsWinners(
  games: IndividualGame[],
  side1MemberIds: string[],
  side2MemberIds: string[]
): ErrorsWinnersBlock | undefined {
  const sideFromId = buildMemberIdMap(side1MemberIds, side2MemberIds);
  const result: ErrorsWinnersBlock = {
    side1: { winners: 0, errors: 0 },
    side2: { winners: 0, errors: 0 },
  };
  let hasData = false;

  for (const game of games) {
    for (const shot of game.shots || []) {
      const side = resolvePointSide(shot as Shot, sideFromId);
      if (!side) continue;
      hasData = true;
      if (shot.stroke === "net_point") {
        result[side].errors += 1;
      } else {
        result[side].winners += 1;
      }
    }
  }

  return hasData ? result : undefined;
}

function buildShotAnalysis(
  games: IndividualGame[],
  participants: Participant[]
): ShotAnalysisBlock[] | undefined {
  const shots = games.flatMap((g) => g.shots || []);
  if (!hasDetailedShots(games)) return undefined;

  const playerStats = computePlayerStats(shots);
  const blocks: ShotAnalysisBlock[] = [];

  for (const participant of participants) {
    const pid = participant._id?.toString?.();
    if (!pid) continue;
    const stats = playerStats[pid];
    if (!stats) continue;

    const strokes = Object.entries(stats.strokes)
      .filter(([, count]) => count > 0)
      .map(([stroke, count]) => ({ name: formatStrokeName(stroke), count }))
      .sort((a, b) => b.count - a.count);

    const zones = { left: 0, mid: 0, right: 0 };
    let zoneCount = 0;
    for (const shot of shots) {
      if (asId(shot.player) !== pid) continue;
      const col = landingZoneColumn(shot.landingX);
      if (!col) continue;
      zones[col] += 1;
      zoneCount += 1;
    }

    if (strokes.length === 0 && zoneCount === 0) continue;

    blocks.push({
      playerName: stats.name || participant.fullName || participant.username,
      strokes,
      zones,
    });
  }

  return blocks.length > 0 ? blocks : undefined;
}

function buildSectionFlags(
  isSimpleTracking: boolean,
  games: IndividualGame[],
  options: {
    roundLabel?: string;
    seeds?: boolean;
    analyticsSummary?: string[];
    achievements?: unknown[];
    stats?: StatsBlock;
    errorsVsWinners?: ErrorsWinnersBlock;
    shotAnalysis?: ShotAnalysisBlock[];
    timeline?: GameTimeline[];
  }
): MatchPdfSectionFlags {
  const hasShots = games.some((g) => (g.shots?.length ?? 0) > 0);
  const detailed = !isSimpleTracking && hasDetailedShots(games);

  return {
    roundInfo: !!options.roundLabel,
    seeds: !!options.seeds,
    timeline: hasShots && (options.timeline?.length ?? 0) > 0,
    stats: detailed && !!options.stats,
    errorsVsWinners: detailed && !!options.errorsVsWinners,
    shotAnalysis: detailed && !!options.shotAnalysis?.length,
    matchTimeline: (options.analyticsSummary?.length ?? 0) > 0,
    achievements: (options.achievements?.length ?? 0) > 0,
  };
}

function buildRubberSection(
  rubber: TeamSubMatchDetail,
  isSimpleTracking: boolean,
  side1TeamName: string,
  side2TeamName: string
): RubberSection {
  const side1MemberIds =
    rubber.scoringIds?.[0] != null ? [rubber.scoringIds[0]] : [];
  const side2MemberIds =
    rubber.scoringIds?.[1] != null ? [rubber.scoringIds[1]] : [];

  const { rows, side1Wins, side2Wins } = buildGameRows(
    rubber.games,
    rubber.scoringIds,
    true
  );

  const analytics = computeMatchAnalytics(
    rubber.games,
    rubber.player1Label,
    rubber.player2Label,
    { side1MemberIds, side2MemberIds }
  );

  const serveStats = computeServeStats(rubber.games, "individual");
  const timeline = buildGameTimeline(
    rubber.games,
    rubber.player1Label,
    rubber.player2Label,
    side1MemberIds,
    side2MemberIds
  );
  const stats = !isSimpleTracking
    ? buildStatsBlock(
        rubber.games,
        analytics,
        rubber.player1Label,
        rubber.player2Label,
        serveStats,
        side1MemberIds,
        side2MemberIds
      )
    : undefined;
  const errorsVsWinners = !isSimpleTracking
    ? buildErrorsWinners(rubber.games, side1MemberIds, side2MemberIds)
    : undefined;
  const shotAnalysis = !isSimpleTracking
    ? buildShotAnalysis(rubber.games, rubber.participants)
    : undefined;

  const sections = buildSectionFlags(isSimpleTracking, rubber.games, {
    timeline,
    stats,
    errorsVsWinners,
    shotAnalysis,
    analyticsSummary: analytics.summary,
  });

  return {
    title: `Rubber ${rubber.matchNumber}: ${rubber.player1Label} vs ${rubber.player2Label}`,
    side1Name: rubber.player1Label,
    side2Name: rubber.player2Label,
    side1Sets: rubber.team1Sets,
    side2Sets: rubber.team2Sets,
    winnerSide: rubber.winnerSide,
    games: rows,
    side1GamesWon: side1Wins,
    side2GamesWon: side2Wins,
    sections,
    timeline: sections.timeline ? timeline : undefined,
    stats: sections.stats ? stats : undefined,
    errorsVsWinners: sections.errorsVsWinners ? errorsVsWinners : undefined,
    shotAnalysis: sections.shotAnalysis ? shotAnalysis : undefined,
    matchTimeline: sections.matchTimeline ? analytics.summary : undefined,
  };
}

export function buildMatchPdfPayload(
  match: Match,
  statsData: MatchStatsData
): MatchPdfPayload {
  const meta = match as Match & MatchExportMeta;
  const isTournament = !!meta.tournament?._id || !!meta.tournament?.name;
  const roundLabel = resolveRoundLabel(meta);
  const tournamentSeeding = meta.tournament?.seeding;

  const side1MemberIds =
    statsData.scoringIds?.[0] != null
      ? [statsData.scoringIds[0]]
      : statsData.participants.slice(0, 1).map((p) => p._id?.toString?.() || "");
  const side2MemberIds =
    statsData.scoringIds?.[1] != null
      ? [statsData.scoringIds[1]]
      : statsData.participants.slice(1, 2).map((p) => p._id?.toString?.() || "");

  const { rows, side1Wins, side2Wins } = buildGameRows(
    statsData.games,
    statsData.scoringIds,
    statsData.kind === "team"
  );

  const timeline = buildGameTimeline(
    statsData.games,
    statsData.side1Name,
    statsData.side2Name,
    side1MemberIds.filter(Boolean),
    side2MemberIds.filter(Boolean)
  );

  const serveStats = computeServeStats(
    statsData.games,
    statsData.category,
    isIndividualMatch(match)
      ? {
          matchType: match.matchType,
          participantIds: statsData.participants
            .map((p) => p._id?.toString?.())
            .filter(Boolean) as string[],
        }
      : undefined
  );

  const stats = !statsData.isSimpleTracking
    ? buildStatsBlock(
        statsData.games,
        statsData.analytics,
        statsData.side1Name,
        statsData.side2Name,
        serveStats,
        side1MemberIds.filter(Boolean),
        side2MemberIds.filter(Boolean)
      )
    : undefined;

  const errorsVsWinners = !statsData.isSimpleTracking
    ? buildErrorsWinners(
        statsData.games,
        side1MemberIds.filter(Boolean),
        side2MemberIds.filter(Boolean)
      )
    : undefined;

  const shotAnalysis = !statsData.isSimpleTracking
    ? buildShotAnalysis(statsData.games, statsData.participants)
    : undefined;

  const p1Seed = lookupSeed(side1MemberIds[0], tournamentSeeding);
  const p2Seed = lookupSeed(side2MemberIds[0], tournamentSeeding);
  const hasSeeds = p1Seed != null || p2Seed != null;

  const side1Winner =
    statsData.side1Sets > statsData.side2Sets ||
    statsData.winnerSide === "side1" ||
    statsData.winnerSide === "team1";
  const side2Winner =
    statsData.side2Sets > statsData.side1Sets ||
    statsData.winnerSide === "side2" ||
    statsData.winnerSide === "team2";

  const side1: PlayerInfo = {
    name: statsData.side1Name,
    seed: p1Seed,
    location: (statsData.participants[0] as Participant & { location?: string })
      ?.location,
    isWinner: side1Winner && !side2Winner,
  };

  const side2: PlayerInfo = {
    name: statsData.side2Name,
    seed: p2Seed,
    location: (
      statsData.participants[
        statsData.participants.length >= 4 ? 2 : 1
      ] as Participant & { location?: string }
    )?.location,
    isWinner: side2Winner && !side1Winner,
  };

  const sections = buildSectionFlags(statsData.isSimpleTracking, statsData.games, {
    roundLabel,
    seeds: hasSeeds,
    timeline,
    stats,
    errorsVsWinners,
    shotAnalysis,
    analyticsSummary: statsData.analytics.summary,
    achievements: statsData.achievements,
  });

  let side1LogoUrl: string | undefined;
  let side2LogoUrl: string | undefined;
  if (isTeamMatch(match)) {
    side1LogoUrl = match.team1?.logo;
    side2LogoUrl = match.team2?.logo;
  }

  const rubbers =
    statsData.kind === "team" && statsData.subMatchDetails?.length
      ? statsData.subMatchDetails.map((rubber) =>
          buildRubberSection(
            rubber,
            statsData.isSimpleTracking,
            statsData.side1Name,
            statsData.side2Name
          )
        )
      : undefined;

  return {
    matchId: statsData.matchId,
    shortMatchId: shortMatchId(statsData.matchId),
    matchType: isTournament ? "tournament" : "friendly",
    tournamentName: meta.tournament?.name,
    tournamentLogoUrl: meta.tournament?.customBranding?.logo,
    roundLabel,
    matchDate: formatMatchDate(meta.startedAt ?? meta.createdAt ?? match.createdAt),
    venue: meta.venue,
    city: meta.city,
    side1,
    side2,
    side1Name: statsData.side1Name,
    side2Name: statsData.side2Name,
    side1Sets: statsData.side1Sets,
    side2Sets: statsData.side2Sets,
    side1LogoUrl,
    side2LogoUrl,
    games: rows,
    side1GamesWon: side1Wins,
    side2GamesWon: side2Wins,
    totalMatchDuration: formatSeconds(meta.matchDuration),
    scorerName: resolveScorerName(meta.scorer),
    generatedAt: formatGeneratedTimestamp(),
    isTeamTie: statsData.kind === "team",
    isRecorded: meta.status === "completed" && isTournament,
    sections,
    timeline: sections.timeline ? timeline : undefined,
    stats: sections.stats ? stats : undefined,
    errorsVsWinners: sections.errorsVsWinners ? errorsVsWinners : undefined,
    shotAnalysis: sections.shotAnalysis ? shotAnalysis : undefined,
    matchTimeline: sections.matchTimeline ? statsData.analytics.summary : undefined,
    achievements: sections.achievements
      ? statsData.achievements.map((a) => ({
          title: a.title,
          description: a.description,
        }))
      : undefined,
    rubbers,
  };
}
