import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(startTime: number, endTime: number) {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatTimeDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(String(hours).padStart(2, "0"));
  parts.push(String(minutes).padStart(2, "0"));
  parts.push(String(seconds).padStart(2, "0"));
  return parts.join(":");
}

export function timeAgo(dateInput: string | Date): string {
  const agoLabel = (count: number, unit: string) =>
    count === 1 ? `1 ${unit} ago` : `${count} ${unit}s ago`;

  try {
    const inputDate = new Date(dateInput);
    if (isNaN(inputDate.getTime())) throw new Error("Invalid date");
    const now = new Date();
    const diffMs = now.getTime() - inputDate.getTime();
    if (diffMs < 0) return "in the future";
    const secondsAgo = Math.floor(diffMs / 1000);
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    if (secondsAgo < 5) return "just now";
    if (secondsAgo < 60) return agoLabel(secondsAgo, "second");
    if (minutesAgo < 60) return agoLabel(minutesAgo, "minute");
    if (hoursAgo < 24) return agoLabel(hoursAgo, "hour");
    if (daysAgo < 30) return agoLabel(daysAgo, "day");
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) return agoLabel(monthsAgo, "month");
    const yearsAgo = Math.floor(monthsAgo / 12);
    return agoLabel(yearsAgo, "year");
  } catch (err) {
    console.error("timeAgo error:", err);
    return "invalid date";
  }
}

export function formatDate(isoString?: string | Date): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatStrokeName(stroke: string): string {
  const parts = stroke.split("_");
  if (parts.length === 2) {
    const side = parts[0] === "forehand" ? "FH" : parts[0] === "backhand" ? "BH" : parts[0];
    const type = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${side} ${type}`;
  }
  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDateShort(dateString?: string | Date | number): string {
  if (dateString == null || dateString === "") return "";
  try {
    const d =
      typeof dateString === "string" || typeof dateString === "number"
        ? new Date(dateString)
        : dateString;
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Match/tournament API dates: ISO strings, `Date`, or `{ $date: ... }` / BSON-style wrappers.
 * Same calendar output as {@link formatDateShort} (tournament list rows).
 */
export function formatApiDateShort(raw: unknown): string {
  if (raw == null || raw === "") return "";
  if (raw instanceof Date) return formatDateShort(raw);
  if (typeof raw === "string" || typeof raw === "number") {
    return formatDateShort(raw);
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (o.$date != null) return formatApiDateShort(o.$date);
    if (typeof (raw as { toISOString?: () => string }).toISOString === "function") {
      try {
        return formatDateShort((raw as Date).toISOString());
      } catch {
        return "";
      }
    }
  }
  try {
    const d = new Date(raw as string | number);
    if (Number.isNaN(d.getTime())) return "";
    return formatDateShort(d);
  } catch {
    return "";
  }
}

/** Compact match-feed dates: Today, Yesterday, 2h ago, 24 May. */
export function formatFeedRelativeDate(raw: unknown): string {
  if (raw == null || raw === "") return "";
  try {
    let d: Date;
    if (raw instanceof Date) {
      d = raw;
    } else if (typeof raw === "string" || typeof raw === "number") {
      d = new Date(raw);
    } else if (typeof raw === "object" && raw !== null) {
      const o = raw as Record<string, unknown>;
      if (o.$date == null) return "";
      return formatFeedRelativeDate(o.$date);
    } else {
      return "";
    }
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round(
      (startOfToday.getTime() - startOfThatDay.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (dayDiff === 0) {
      const minutesAgo = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (minutesAgo < 1) return "Just now";
      if (minutesAgo < 60) return `${minutesAgo}m ago`;
      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 12) return `${hoursAgo}h ago`;
      return "Today";
    }
    if (dayDiff === 1) return "Yesterday";
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff}d ago`;

    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/**
 * Tournament start/end label tuned for sports feeds:
 * Today, Tomorrow, Starts in 5 days, 3 days left, 12 May.
 */
export function formatTournamentScheduleLabel(
  startRaw: unknown,
  opts?: { endRaw?: unknown; status?: string },
): string {
  if (startRaw == null || startRaw === "") return "";
  try {
    const start = startRaw instanceof Date ? startRaw : new Date(startRaw as string | number);
    if (Number.isNaN(start.getTime())) return "";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfEvent = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dayDiff = Math.round(
      (startOfEvent.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (opts?.status === "in_progress" || opts?.status === "ongoing") {
      return "Live now";
    }
    if (opts?.status === "completed") {
      return formatFeedRelativeDate(startRaw) || "Completed";
    }

    if (dayDiff === 0) {
      const ms = start.getTime() - now.getTime();
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        const hours = Math.max(1, Math.round(ms / (60 * 60 * 1000)));
        return hours < 24 ? `Starts in ${hours}h` : "Today";
      }
      return "Today";
    }
    if (dayDiff === 1) return "Tomorrow";
    if (dayDiff > 1 && dayDiff <= 14) return `Starts in ${dayDiff} days`;
    if (dayDiff < 0 && dayDiff >= -7) {
      const left = Math.abs(dayDiff);
      return left === 0 ? "Today" : `${left} day${left === 1 ? "" : "s"} left`;
    }

    return start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/** Elapsed label for live matches, e.g. "14 min". */
export function formatLiveElapsed(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  try {
    const d = raw instanceof Date ? raw : new Date(raw as string | number);
    if (Number.isNaN(d.getTime())) return null;
    const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    if (minutes < 1) return "just started";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  } catch {
    return null;
  }
}

export function formatDateLong(dateString?: string | Date): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Escape special regex characters to prevent ReDoS and injection attacks
 * Use this before passing user input to MongoDB $regex queries
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get initials from a name (first character, uppercase)
 */
export function getInitial(name?: string): string {
  return name?.charAt(0)?.toUpperCase() || "?";
}

/**
 * Get display name (fullName or username fallback)
 */
export function getDisplayName(item: { fullName?: string; username?: string; name?: string }): string {
  return item.fullName || item.username || item.name || "Unknown";
}

/**
 * First whitespace-separated token of a human-readable name (e.g. "Rahul Verma" → "Rahul").
 * Also works for any label where you want the leading word ("Team Alpha" → "Team").
 * Trims input; null/empty/whitespace-only returns `fallback` (default "").
 */
export function getFirstName(displayName?: string | null, fallback = ""): string {
  if (displayName == null) return fallback;
  const t = String(displayName).trim();
  if (!t) return fallback;
  const first = t.split(/\s+/)[0];
  return first || fallback;
}

// If you need image cropping in RN, use expo-image-manipulator:
// import * as ImageManipulator from 'expo-image-manipulator';