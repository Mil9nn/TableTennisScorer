import type { Href } from "expo-router";

type MatchCategory = "individual" | "team";

/**
 * Completed matches open Insights (info + analytics).
 * Scheduled / live / other statuses open the details hub (actions).
 */
export function getMatchOpenHref(
  matchId: string,
  status: string | undefined,
  category: MatchCategory = "individual",
): Href {
  const params =
    category === "team"
      ? { id: matchId, category: "team" as const }
      : { id: matchId };

  if (status === "completed") {
    return { pathname: "/match/[id]/stats", params };
  }

  return { pathname: "/match/[id]", params };
}
