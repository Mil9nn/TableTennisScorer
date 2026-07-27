export type ProfileAchievementId =
  | "champion"
  | "runner-up"
  | "streak-10"
  | "streak-5"
  | "hot"
  | "matches-100"
  | "matches-50"
  | "matches-10"
  | "wins-50"
  | "wins-25"
  | "points-500";

export type ProfileAchievement = {
  id: ProfileAchievementId;
  title: string;
  subtitle?: string;
};

type DeriveInput = {
  totalMatches: number;
  totalWins: number;
  bestWinStreak: number;
  currentWinStreak: number;
  tournamentsWon: number;
  runnerUpCount: number;
  totalPointsScored: number;
};

export function deriveProfileAchievements(input: DeriveInput): ProfileAchievement[] {
  const items: ProfileAchievement[] = [];

  if (input.tournamentsWon > 0) {
    items.push({
      id: "champion",
      title: input.tournamentsWon === 1 ? "Champion" : `${input.tournamentsWon}× Champion`,
      subtitle: "Tournament titles",
    });
  }

  if (input.runnerUpCount > 0) {
    items.push({
      id: "runner-up",
      title: input.runnerUpCount === 1 ? "Runner-up" : `${input.runnerUpCount}× Runner-up`,
      subtitle: "Final appearances",
    });
  }

  if (input.bestWinStreak >= 10) {
    items.push({
      id: "streak-10",
      title: "Win Streak",
      subtitle: "Career best",
    });
  } else if (input.bestWinStreak >= 5) {
    items.push({
      id: "streak-5",
      title: "Win Streak",
      subtitle: "Career best",
    });
  }

  if (input.currentWinStreak >= 3) {
    items.push({
      id: "hot",
      title: "On fire",
      subtitle: "Current winning streak",
    });
  }

  if (input.totalMatches >= 100) {
    items.push({
      id: "matches-100",
      title: "100 Matches Played",
    });
  } else if (input.totalMatches >= 50) {
    items.push({
      id: "matches-50",
      title: "50 Matches Played",
    });
  } else if (input.totalMatches >= 10) {
    items.push({
      id: "matches-10",
      title: "10 Matches Played",
    });
  }

  if (input.totalWins >= 50) {
    items.push({
      id: "wins-50",
      title: "50 Wins",
    });
  } else if (input.totalWins >= 25) {
    items.push({
      id: "wins-25",
      title: "25 Wins",
    });
  }

  if (input.totalPointsScored >= 500) {
    items.push({
      id: "points-500",
      title: "500 Points",
      subtitle: "Career points scored",
    });
  }

  return items.slice(0, 6);
}
