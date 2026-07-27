import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";

export function asMatchId(raw: unknown): string {
  return normalizeMatchIdParam(raw);
}

export function displayParticipantName(
  p: { username?: string; fullName?: string } | undefined,
  fallback: string,
) {
  return p?.username || p?.fullName || fallback;
}

export function formatMatchTypeLabel(matchType?: string) {
  const raw = matchType?.replace(/_/g, " ") || "match";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function getIndividualSetScore(match: any) {
  if (Array.isArray(match?.finalScore?.setsByTeam) && match.finalScore.setsByTeam.length >= 2) {
    return {
      side1: Number(match.finalScore.setsByTeam[0] ?? 0),
      side2: Number(match.finalScore.setsByTeam[1] ?? 0),
    };
  }

  const participants = Array.isArray(match?.participants) ? match.participants : [];
  const isDoubles = match?.matchType !== "singles";
  const idOf = (p: any) => asMatchId(typeof p === "string" ? p : p?._id);

  const side1Ids = isDoubles
    ? [idOf(participants?.[0]), idOf(participants?.[1])]
    : [idOf(participants?.[0])];
  const side2Ids = isDoubles
    ? [idOf(participants?.[2]), idOf(participants?.[3])]
    : [idOf(participants?.[1])];

  const setsById = match?.finalScore?.setsByPlayerId || match?.finalScore?.setsById || {};
  const readSideSets = (ids: (string | undefined)[]) => {
    for (const id of ids) {
      if (!id) continue;
      const value = setsById?.[id];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  return {
    side1: readSideSets(side1Ids),
    side2: readSideSets(side2Ids),
  };
}

export function getIndividualWinnerFlags(match: any) {
  const participants = Array.isArray(match?.participants) ? match.participants : [];
  const isDoubles = match?.matchType !== "singles";
  const idOf = (p: any) => asMatchId(typeof p === "string" ? p : p?._id);
  const winnerId = asMatchId(match?.winnerId || match?.winnerPlayerId || match?.winner || "");

  const side1Ids = isDoubles
    ? [idOf(participants?.[0]), idOf(participants?.[1])]
    : [idOf(participants?.[0])];
  const side2Ids = isDoubles
    ? [idOf(participants?.[2]), idOf(participants?.[3])]
    : [idOf(participants?.[1])];

  return {
    side1Won: side1Ids.filter(Boolean).map(String).includes(winnerId),
    side2Won: side2Ids.filter(Boolean).map(String).includes(winnerId),
  };
}

export function formatTeamFormatLabel(format?: string) {
  if (format === "five_singles") return "Swaythling";
  if (format === "single_double_single") return "S-D-S";
  if (format === "custom") return "Custom";
  return format?.replace(/_/g, " ") || "Team match";
}

export function teamFormatIcon(
  format?: string,
): "team" | "swaythling" | "sds" | "custom" {
  if (format === "five_singles") return "swaythling";
  if (format === "single_double_single") return "sds";
  if (format === "custom") return "custom";
  return "team";
}
