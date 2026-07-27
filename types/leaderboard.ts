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
