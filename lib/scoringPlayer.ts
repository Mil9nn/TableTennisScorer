import type {
  IndividualMatch,
  Participant,
  PlayerKey,
  SubMatch,
} from "@/types/match.type";

function participantId(p: Participant | string | undefined): string {
  if (p == null) return "";
  return typeof p === "string" ? p : String(p._id);
}

/** Resolve which player's scoringId to use when only a side was tapped (doubles column). */
export function resolveIndividualScoringPlayerId(
  match: IndividualMatch,
  side: PlayerKey,
  playerId: string | undefined,
  currentServer: string | null
): string | undefined {
  if (playerId) return playerId;
  const p = match.participants || [];
  if (match.matchType === "singles") {
    return side === "side1" ? String(p[0]?._id) : String(p[1]?._id);
  }
  const srv = currentServer || "";
  if (side === "side1") {
    if (srv === "side1_main") return String(p[0]?._id);
    if (srv === "side1_partner") return String(p[1]?._id);
    return String(p[0]?._id);
  }
  if (srv === "side2_main") return String(p[2]?._id);
  if (srv === "side2_partner") return String(p[3]?._id);
  return String(p[2]?._id);
}

/** Resolve scoring player id for team sub-matches when only a side was tapped (doubles). */
export function resolveTeamScoringPlayerId(
  subMatch: SubMatch,
  side: "team1" | "team2",
  playerId: string | undefined,
  currentServer: string | null
): string | undefined {
  if (playerId) return playerId;

  const t1 = Array.isArray(subMatch.playerTeam1)
    ? subMatch.playerTeam1
    : subMatch.playerTeam1
      ? [subMatch.playerTeam1]
      : [];
  const t2 = Array.isArray(subMatch.playerTeam2)
    ? subMatch.playerTeam2
    : subMatch.playerTeam2
      ? [subMatch.playerTeam2]
      : [];

  if (subMatch.matchType === "doubles") {
    const srv = currentServer || "";
    if (side === "team1") {
      if (srv === "team1_main") return participantId(t1[0]);
      if (srv === "team1_partner") return participantId(t1[1]);
      return participantId(t1[0]);
    }
    if (srv === "team2_main") return participantId(t2[0]);
    if (srv === "team2_partner") return participantId(t2[1]);
    return participantId(t2[0]);
  }

  return side === "team1" ? participantId(t1[0]) : participantId(t2[0]);
}
