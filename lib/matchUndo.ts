import type { PlayerKey } from "@/types/match.type";

/** When detailed shot history exists, prefer it; otherwise infer from running score (simple mode). */
export function inferIndividualUndoSide(
  side1Score: number,
  side2Score: number,
  lastShotSide: PlayerKey | undefined,
  hasShots: boolean
): "side1" | "side2" {
  if (hasShots && (lastShotSide === "side1" || lastShotSide === "side2")) {
    return lastShotSide;
  }
  if (side1Score > side2Score) return "side1";
  if (side2Score > side1Score) return "side2";
  return "side2";
}

export function inferTeamUndoSide(
  team1Score: number,
  team2Score: number,
  lastShotSide: PlayerKey | undefined,
  hasShots: boolean
): "team1" | "team2" {
  const normalized: "team1" | "team2" | undefined =
    lastShotSide === "side1"
      ? "team1"
      : lastShotSide === "side2"
        ? "team2"
        : lastShotSide === "team1" || lastShotSide === "team2"
          ? lastShotSide
          : undefined;

  if (hasShots && (normalized === "team1" || normalized === "team2")) {
    return normalized;
  }
  if (team1Score > team2Score) return "team1";
  if (team2Score > team1Score) return "team2";
  return "team2";
}
