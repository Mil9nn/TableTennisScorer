export function subMatchHeadToHeadIds(subMatch: {
  playerTeam1?: unknown;
  playerTeam2?: unknown;
}): [string, string] | null {
  const raw1 = subMatch.playerTeam1;
  const raw2 = subMatch.playerTeam2;
  const p1 = Array.isArray(raw1) ? raw1[0] : raw1;
  const p2 = Array.isArray(raw2) ? raw2[0] : raw2;
  const id1 = (p1 as { _id?: string })?._id?.toString();
  const id2 = (p2 as { _id?: string })?._id?.toString();
  return id1 && id2 ? [id1, id2] : null;
}
