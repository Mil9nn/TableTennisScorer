import { endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";

/**
 * Presets map to local-calendar ranges; expanded to `dateFrom` / `dateTo` (yyyy-MM-dd)
 * for GET /api/matches/* which filters on `createdAt`.
 */
export type DateRangePresetId =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "this_month"
  /** Manual range from the filter modal (not a quick preset). */
  | "custom";

export type DateRangeQuickPresetId = Exclude<DateRangePresetId, "all" | "custom">;

export const DATE_RANGE_QUICK_PRESETS: readonly {
  id: DateRangeQuickPresetId;
  label: string;
}[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7_days", label: "Last 7 days" },
  { id: "this_month", label: "This month" },
] as const;

const ymd = (d: Date) => format(startOfDay(d), "yyyy-MM-dd");

/**
 * Returns `{ dateFrom, dateTo }` in yyyy-MM-dd, or `null` when `all` (no date filter).
 */
export function getDateRangeForPreset(
  preset: DateRangePresetId,
  now: Date = new Date()
): { dateFrom: string; dateTo: string } | null {
  if (preset === "all" || preset === "custom") {
    return null;
  }

  switch (preset) {
    case "today": {
      const d = startOfDay(now);
      const s = ymd(d);
      return { dateFrom: s, dateTo: s };
    }
    case "yesterday": {
      const d = startOfDay(subDays(now, 1));
      const s = ymd(d);
      return { dateFrom: s, dateTo: s };
    }
    case "last_7_days": {
      const end = startOfDay(now);
      const start = subDays(end, 6);
      return { dateFrom: ymd(start), dateTo: ymd(end) };
    }
    case "this_month": {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return { dateFrom: ymd(start), dateTo: ymd(end) };
    }
    default:
      return null;
  }
}

export function buildDateFilterFromPreset(preset: DateRangePresetId): {
  datePreset: string;
  dateFrom: string;
  dateTo: string;
} {
  if (preset === "all") {
    return { datePreset: "", dateFrom: "", dateTo: "" };
  }
  const range = getDateRangeForPreset(preset);
  if (!range) {
    return { datePreset: "", dateFrom: "", dateTo: "" };
  }
  return {
    datePreset: preset,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
  };
}
