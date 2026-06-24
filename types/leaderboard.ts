// ============================================
// PLAYER-RELATED TYPES
// ============================================

export interface PlayerData {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

export interface PlayerStats {
  rank: number;
  player: PlayerData;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    currentStreak: number;
    bestStreak: number;
    totalPointsScored: number;
    totalPointsConceded: number;
  };
}

export interface FormatSpecificStats {
  points: {
    totalScored: number;
    totalConceded: number;
    differential: number;
    avgPerSet: number;
    avgConcededPerSet: number;
  };
  serve: {
    totalServes: number;
    pointsWonOnServe: number;
    serveWinPercentage: number;
  };
}

// ============================================
// TEAM-RELATED TYPES
// ============================================

export interface TeamData {
  _id: string;
  name: string;
  logo?: string;
}

export interface TeamPlayerStats {
  player: PlayerData;
  subMatchesWon: number;
  subMatchesPlayed: number;
  winRate: number;
}

export interface TournamentPlayerStats {
  rank: number;
  player: PlayerData;
  stats: {
    tournamentMatchWins: number;
    tournamentMatchLosses: number;
    tournamentsWon: number;
    tournamentsPlayed: number;
    finalsReached: number;
    semiFinalsReached: number;
    tournamentSetDifferential: number;
    totalTournamentPoints: number;
    [key: string]: number;
  };
}

export interface TeamStats {
  rank: number;
  team: TeamData;
  playerStats: TeamPlayerStats[];
  stats: {
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    subMatchesWon: number;
    subMatchesLost: number;
    currentStreak: number;
  };
}

// ============================================
// FILTER TYPES
// ============================================

export type MatchFormat = "singles" | "doubles" | "mixed_doubles";

export interface LeaderboardFilters {
  type?: MatchFormat;
  [key: string]: any;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export type LeaderboardType = "individual" | "teams";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface LeaderboardResponse<T> {
  leaderboard: T[];
  hasMore: boolean;
  total: number;
  pagination?: {
    hasMore: boolean;
    skip: number;
    limit: number;
  };
}
