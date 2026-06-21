export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatSeconds(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  if (minutes === 0) return `${secs}s`;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

export function formatMatchDate(raw?: string | Date | null): string {
  if (!raw) return "—";
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatGeneratedTimestamp(date = new Date()): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortMatchId(matchId: string): string {
  const id = matchId.trim();
  if (id.length <= 8) return id;
  return id.slice(-8).toUpperCase();
}

export function buildPdfFilename(matchId: string, date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10);
  return `TTPro_Match_${shortMatchId(matchId)}_${datePart}.pdf`;
}

export function lookupSeed(
  participantId: string | undefined,
  seeding?: Array<{ participant?: string | { _id?: string }; seedNumber?: number }>
): number | undefined {
  if (!participantId || !seeding?.length) return undefined;
  const entry = seeding.find((s) => {
    const pid =
      typeof s.participant === "string"
        ? s.participant
        : s.participant?._id?.toString?.();
    return pid === participantId;
  });
  return entry?.seedNumber;
}

export function landingZoneColumn(landingX?: number | null): "left" | "mid" | "right" | null {
  if (landingX == null || Number.isNaN(landingX)) return null;
  if (landingX < 33.33) return "left";
  if (landingX < 66.67) return "mid";
  return "right";
}
