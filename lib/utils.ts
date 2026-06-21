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
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    if (hoursAgo < 24) {
      if (hoursAgo === 1) return "1 hour ago";
      else return `${hoursAgo} hours ago`;
    }
    if (daysAgo < 30) return `${daysAgo} days ago`;
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) return `${monthsAgo} months ago`;
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo} years ago`;
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

export function formatDateShort(dateString?: string | Date): string {
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