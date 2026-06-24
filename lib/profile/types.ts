import { MatchStatus } from "@/types/match.type";

export type ApiSuccess = { success: true };
export type ApiFailure = { success: false; error?: string; message?: string };

export type ProfileMatchHistoryItem = {
  _id: string;
  matchCategory?: "individual" | "team";
  matchType?: string;
  createdAt?: string;
  participants?: Array<{
    _id: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  }>;
  finalScore?: {
    setsById?: Record<string, number>;
    setsByTeam?: number[];
  };
  winnerId?: string;
  winnerSide?: "side1" | "side2";
  winnerTeamIndex?: number;
  winnerTeamId?: string; // For team matches
  status?: MatchStatus;
  matchFormat?: string;
  teams?: unknown;
  teamLogo?: string;
  city?: string;
  matchDuration?: number;
};

export type ProfileMatchHistoryResponse =
  | (ApiSuccess & { matches: ProfileMatchHistoryItem[] })
  | ApiFailure;

export type HeadToHeadRow = {
  opponent: {
    _id: string;
    fullName?: string;
    username?: string;
    profileImage?: string;
  };
  wins: number;
  losses: number;
  total: number;
  winRate: number;
};

export type HeadToHeadListResponse =
  | (ApiSuccess & { headToHead: HeadToHeadRow[] })
  | ApiFailure;

export type HeadToHeadOpponentMatch = {
  _id: string;
  matchId?: string;
  date?: string;
  matchType?: string;
  result?: "win" | "loss";
  score?: unknown;
  tournament?: { name?: string; format?: string } | null;
};

export type HeadToHeadOpponentResponse =
  | (ApiSuccess & {
      matches: HeadToHeadOpponentMatch[];
      summary: { wins: number; losses: number; total: number; winRate: number };
    })
  | ApiFailure;

export type PlayerStatsResponse =
  | (ApiSuccess & { data: any })
  | ApiFailure;

export type TeamsResponse =
  | (ApiSuccess & {
      teams: Array<{
        _id: string;
        name: string;
        logo?: string;
        city?: string;
        role?: string;
        playerCount?: number;
      }>;
    })
  | ApiFailure;

export type TeamStatsResponse =
  | (ApiSuccess & {
      teamStats: {
        total?: number;
        byFormat?: Record<string, unknown>;
        wins?: number;
        losses?: number;
        subMatchesPlayed?: number;
        subMatchesWon?: number;
      };
    })
  | ApiFailure;

export type TournamentStatsResponse =
  | (ApiSuccess & { stats: any })
  | ApiFailure;

export type InsightsResponse =
  | (ApiSuccess & { data: any })
  | ApiFailure;

export type ShotsAnalysisResponse =
  | (ApiSuccess & { data: any })
  | ApiFailure;

