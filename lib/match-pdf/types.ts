export interface MatchPdfSectionFlags {
  roundInfo: boolean;
  seeds: boolean;
  timeline: boolean;
  stats: boolean;
  errorsVsWinners: boolean;
  shotAnalysis: boolean;
  matchTimeline: boolean;
  achievements: boolean;
}

export interface PlayerInfo {
  name: string;
  seed?: number;
  location?: string;
  isWinner: boolean;
}

export interface GameScoreRow {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  duration?: string;
  winnerSide?: "side1" | "side2";
}

export interface PointTimelineEntry {
  pointNumber: number;
  scorerLabel: string;
  scoreAfter: string;
  stroke?: string;
  streakHighlight?: boolean;
}

export interface GameTimeline {
  gameNumber: number;
  points: PointTimelineEntry[];
  streakNotes: string[];
}

export interface StatsBlock {
  side1Name: string;
  side2Name: string;
  servePointsWon: [number, number];
  receivePointsWon: [number, number];
  serveTotals: [number, number];
  receiveTotals: [number, number];
  longestStreak: [number, number];
  clutchPointsWon: [number, number];
  deucePointsWon: [number, number];
}

export interface ErrorsWinnersBlock {
  side1: { winners: number; errors: number };
  side2: { winners: number; errors: number };
}

export interface ShotAnalysisBlock {
  playerName: string;
  strokes: { name: string; count: number }[];
  zones: { left: number; mid: number; right: number };
}

export interface RubberSection {
  title: string;
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  winnerSide?: "side1" | "side2" | "team1" | "team2" | null;
  games: GameScoreRow[];
  side1GamesWon: number;
  side2GamesWon: number;
  sections: MatchPdfSectionFlags;
  timeline?: GameTimeline[];
  stats?: StatsBlock;
  errorsVsWinners?: ErrorsWinnersBlock;
  shotAnalysis?: ShotAnalysisBlock[];
  matchTimeline?: string[];
}

export interface MatchPdfPayload {
  matchId: string;
  shortMatchId: string;
  matchType: "friendly" | "tournament";
  tournamentName?: string;
  tournamentLogoUrl?: string;
  roundLabel?: string;
  matchDate: string;
  venue?: string;
  city?: string;
  side1: PlayerInfo;
  side2: PlayerInfo;
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  side1LogoUrl?: string;
  side2LogoUrl?: string;
  games: GameScoreRow[];
  side1GamesWon: number;
  side2GamesWon: number;
  totalMatchDuration?: string;
  scorerName?: string;
  generatedAt: string;
  isTeamTie: boolean;
  isRecorded: boolean;
  sections: MatchPdfSectionFlags;
  timeline?: GameTimeline[];
  stats?: StatsBlock;
  errorsVsWinners?: ErrorsWinnersBlock;
  shotAnalysis?: ShotAnalysisBlock[];
  matchTimeline?: string[];
  achievements?: { title: string; description: string }[];
  rubbers?: RubberSection[];
}
