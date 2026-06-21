export function hasInsightsData(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const graphs = (data as { graphs?: { matchPoints?: unknown[]; serveAccuracy?: unknown[] } })
    .graphs;

  const matchPoints = graphs?.matchPoints;
  const serveAccuracy = graphs?.serveAccuracy;

  return (
    (Array.isArray(matchPoints) && matchPoints.length > 0) ||
    (Array.isArray(serveAccuracy) && serveAccuracy.length > 0)
  );
}

export function hasShotsData(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const payload = data as {
    allShots?: unknown[];
    shotDistribution?: unknown[];
    heatmapGrid?: unknown;
  };

  if (Array.isArray(payload.allShots) && payload.allShots.length > 0) {
    return true;
  }

  if (Array.isArray(payload.shotDistribution) && payload.shotDistribution.length > 0) {
    return true;
  }

  if (Array.isArray(payload.heatmapGrid)) {
    return payload.heatmapGrid.some(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => {
          if (typeof cell === "number") return cell > 0;
          if (cell && typeof cell === "object" && "count" in cell) {
            return Number((cell as { count?: number }).count) > 0;
          }
          return false;
        }),
    );
  }

  return false;
}
