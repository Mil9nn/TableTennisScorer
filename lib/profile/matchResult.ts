import type { ProfileMatchHistoryItem } from "@/lib/profile/types";

const toId = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

function isCompletedMatch(match: ProfileMatchHistoryItem) {
  return !match.status || match.status === "completed";
}

function resultFromSets(
  match: ProfileMatchHistoryItem,
  userId: string,
): "win" | "loss" | null {
  const setsById = match.finalScore?.setsById;
  const participants = match.participants;
  if (!setsById || !participants?.length) return null;

  const userParticipant = participants.find((p) => toId(p._id) === userId);
  if (!userParticipant) return null;

  const userKey = toId(userParticipant._id);
  const userSets = setsById[userKey] ?? setsById[userParticipant._id];
  if (userSets == null) return null;

  const opponent = participants.find((p) => toId(p._id) !== userId);
  if (!opponent) return null;

  const opponentKey = toId(opponent._id);
  const opponentSets =
    setsById[opponentKey] ?? setsById[opponent._id];
  if (opponentSets == null || userSets === opponentSets) return null;

  return userSets > opponentSets ? "win" : "loss";
}

export function getProfileMatchResult(
  match: ProfileMatchHistoryItem,
  userId: string,
): "win" | "loss" | null {
  if (!isCompletedMatch(match)) return null;

  const normalizedUserId = toId(userId);
  const winnerId = toId(match.winnerId);
  if (winnerId) {
    return winnerId === normalizedUserId ? "win" : "loss";
  }

  const winnerSide = (match as { winnerSide?: "side1" | "side2" }).winnerSide;
  const userIndex = match.participants?.findIndex(
    (p) => toId(p._id) === normalizedUserId,
  );
  if (winnerSide && userIndex != null && userIndex >= 0 && userIndex < 2) {
    const userSide = userIndex === 0 ? "side1" : "side2";
    return winnerSide === userSide ? "win" : "loss";
  }

  if (match.winnerTeamIndex != null && userIndex != null && userIndex >= 0) {
    const userTeamIndex = userIndex < 2 ? 0 : 1;
    return match.winnerTeamIndex === userTeamIndex ? "win" : "loss";
  }

  return resultFromSets(match, normalizedUserId);
}

export function isProfileMatchWin(
  match: ProfileMatchHistoryItem,
  userId: string,
): boolean | null {
  const result = getProfileMatchResult(match, userId);
  if (result === "win") return true;
  if (result === "loss") return false;
  return null;
}

export function isParticipantWinner(
  match: ProfileMatchHistoryItem,
  participantId: string,
): boolean {
  const winnerId = toId(match.winnerId);
  if (winnerId) return winnerId === toId(participantId);

  const winnerSide = (match as { winnerSide?: "side1" | "side2" }).winnerSide;
  const index = match.participants?.findIndex(
    (p) => toId(p._id) === toId(participantId),
  );
  if (winnerSide && index != null && index >= 0 && index < 2) {
    const side = index === 0 ? "side1" : "side2";
    return winnerSide === side;
  }

  const setsById = match.finalScore?.setsById;
  if (!setsById || !match.participants?.length) return false;

  const participant = match.participants.find(
    (p) => toId(p._id) === toId(participantId),
  );
  if (!participant) return false;

  const participantSets =
    setsById[toId(participant._id)] ?? setsById[participant._id];
  if (participantSets == null) return false;

  const opponentSets = match.participants
    .filter((p) => toId(p._id) !== toId(participantId))
    .map((p) => setsById[toId(p._id)] ?? setsById[p._id])
    .find((sets) => sets != null);

  return opponentSets != null && participantSets > opponentSets;
}
