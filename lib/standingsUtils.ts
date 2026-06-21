/** Normalize standings rows from API/projection to canonical field names. */
export function normalizeStandingRow(row: any) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    played: Number(row.played ?? row.matchesPlayed ?? 0) || 0,
    won: Number(row.won ?? row.wins ?? 0) || 0,
    lost: Number(row.lost ?? row.losses ?? 0) || 0,
    drawn: Number(row.drawn ?? row.draws ?? 0) || 0,
    setsWon: Number(row.setsWon ?? 0) || 0,
    setsLost: Number(row.setsLost ?? 0) || 0,
    setsDiff: Number(row.setsDiff ?? 0) || 0,
    pointsScored: Number(row.pointsScored ?? 0) || 0,
    pointsConceded: Number(row.pointsConceded ?? 0) || 0,
    pointsDiff: Number(row.pointsDiff ?? 0) || 0,
    points: Number(row.points ?? 0) || 0,
    rank: Number(row.rank ?? 0) || 0,
    form: Array.isArray(row.form) ? row.form : [],
    headToHead: row.headToHead ?? {},
  };
}

export function standingRowHasActivity(row: any): boolean {
  const normalized = normalizeStandingRow(row);
  return (
    (normalized.played ?? 0) > 0 ||
    (normalized.won ?? 0) > 0 ||
    (normalized.lost ?? 0) > 0 ||
    (normalized.drawn ?? 0) > 0 ||
    (normalized.points ?? 0) > 0
  );
}
