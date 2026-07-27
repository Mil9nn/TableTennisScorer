import type { ImageSourcePropType } from "react-native";

export type HomeChallenge = {
  id: string;
  /** Big headline number, e.g. "8" */
  count: string;
  /** Short challenge name under the count */
  title: string;
  /** One-line goal copy */
  subtitle: string;
  /** Accent for the card face */
  accent: string;
  accentSoft: string;
  /** Reward badge name shown as denotion on the card */
  badgeName: string;
  /** Short reward blurb for the challenges page */
  reward: string;
  /** Circular denotion badge artwork */
  badgeImage: ImageSourcePropType;
};

/**
 * Table-tennis equivalents of CricHeroes challenge cards
 * (8 Dot Balls / 10 Sixes / 3 Maiden → TT skill goals + denotion badges).
 */
export const HOME_CHALLENGES: HomeChallenge[] = [
  {
    id: "clean-winners",
    count: "8",
    title: "Clean Winners",
    subtitle: "Win 8 points with unreturnable attacks",
    accent: "#0F766E",
    accentSoft: "#CCFBF1",
    badgeName: "Clean Strike",
    reward: "Unlock the Clean Strike denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-clean-winners.png"),
  },
  {
    id: "smash-points",
    count: "10",
    title: "Smash Points",
    subtitle: "Land 10 successful smash winners",
    accent: "#B45309",
    accentSoft: "#FEF3C7",
    badgeName: "Smash Ace",
    reward: "Unlock the Smash Ace denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-smash-points.png"),
  },
  {
    id: "love-games",
    count: "3",
    title: "Love Games",
    subtitle: "Close 3 games without conceding a point",
    accent: "#1D4ED8",
    accentSoft: "#DBEAFE",
    badgeName: "Love Lock",
    reward: "Unlock the Love Lock denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-love-games.png"),
  },
  {
    id: "deuce-saves",
    count: "5",
    title: "Deuce Wins",
    subtitle: "Come through 5 deuce games",
    accent: "#7C3AED",
    accentSoft: "#EDE9FE",
    badgeName: "Clutch Edge",
    reward: "Unlock the Clutch Edge denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-deuce-wins.png"),
  },
  {
    id: "point-streak",
    count: "7",
    title: "Point Streak",
    subtitle: "String together a 7-point run",
    accent: "#BE123C",
    accentSoft: "#FFE4E6",
    badgeName: "Hot Streak",
    reward: "Unlock the Hot Streak denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-point-streak.png"),
  },
  {
    id: "shutout-sets",
    count: "2",
    title: "Shutout Sets",
    subtitle: "Take 2 sets without dropping a game",
    accent: "#047857",
    accentSoft: "#D1FAE5",
    badgeName: "Shutout Seal",
    reward: "Unlock the Shutout Seal denotion badge",
    badgeImage: require("@/assets/images/challenges/badge-shutout-sets.png"),
  },
];
