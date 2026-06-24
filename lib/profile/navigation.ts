import type { Href } from "expo-router";

export type ProfileSection =
  | "match-history"
  | "head-to-head"
  | "stats"
  | "teams"
  | "tournaments"
  | "insights"
  | "shots";

export function profilePath(userId: string, section?: ProfileSection): Href {
  const safeUserId = encodeURIComponent(userId);
  return section
    ? `/profile/${safeUserId}/${encodeURIComponent(section)}`
    : `/profile/${safeUserId}`;
}

export function headToHeadOpponentPath(
  userId: string,
  opponentId: string,
): Href {
  return `/profile/${encodeURIComponent(userId)}/head-to-head/${encodeURIComponent(opponentId)}`;
}

