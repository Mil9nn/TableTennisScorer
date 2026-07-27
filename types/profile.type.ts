export interface ProfileStatsSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface ProfileUserSummary {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  profileImage?: string;
  handedness?: string;
  location?: string;
  gender?: string;
  createdAt?: string;
  shotTrackingMode?: string;
}

export interface ProfileHomePayload {
  user: ProfileUserSummary;
  stats: ProfileStatsSummary;
}

export interface DetailedStatsPayload {
  recentMatches: any[];
  headToHeadRecords: any[];
  shotStats: any;
  performance?: any;
  tournamentStats?: any;
  activityStats?: any;
}

export interface InsightsPayload {
  stats?: any;
  graphs?: any;
  insights?: any;
}

export interface ShotsAnalysisPayload {
  shotDistribution?: any[];
  serveTypeDistribution?: any[];
  heatmapData?: any[];
  allShots?: any[];
  opponentShots?: any[];
  offensiveTargeting?: any;
  defensiveTargeting?: any;
}

export interface TournamentStatsPayload {
  overview?: any;
  recentTournaments?: any[];
}

export interface ActivityPayload {
  monthlyActivity: Array<{ month: string; count: number }>;
}
