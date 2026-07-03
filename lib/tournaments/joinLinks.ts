import * as Linking from "expo-linking";
import { getWebOrigin } from "@/lib/appOrigin";
const JOIN_CODE_REGEX = /^[A-Z0-9]{6}$/;
const APP_SCHEME = "tabletennisscorer";

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_REGEX.test(normalizeJoinCode(code));
}

/** Parse join code from deep links, web URLs, or raw scanned text. */
export function parseJoinCodeFromUrl(url: string): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (isValidJoinCode(trimmed)) {
    return normalizeJoinCode(trimmed);
  }

  try {
    const parsed = Linking.parse(trimmed);
    const queryCode =
      typeof parsed.queryParams?.code === "string"
        ? parsed.queryParams.code
        : Array.isArray(parsed.queryParams?.code)
          ? parsed.queryParams.code[0]
          : undefined;

    if (queryCode && isValidJoinCode(queryCode)) {
      return normalizeJoinCode(queryCode);
    }

    const path = parsed.path ?? "";
    const pathMatch = path.match(/(?:^|\/)join(?:\/|$)/i);
    if (pathMatch) {
      const segments = path.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && isValidJoinCode(last)) {
        return normalizeJoinCode(last);
      }
    }
  } catch {
    // Fall through to regex extraction
  }

  const codeMatch = trimmed.match(/[?&]code=([A-Za-z0-9]{6})/i);
  if (codeMatch?.[1] && isValidJoinCode(codeMatch[1])) {
    return normalizeJoinCode(codeMatch[1]);
  }

  const looseMatch = trimmed.match(/\b([A-Z0-9]{6})\b/i);
  if (looseMatch?.[1] && isValidJoinCode(looseMatch[1])) {
    return normalizeJoinCode(looseMatch[1]);
  }

  return null;
}

/** In-app route opened when user taps the invite link (with app installed). */
export function buildAppJoinPath(code: string): string {
  const normalized = normalizeJoinCode(code);
  return `/tournaments/join?code=${encodeURIComponent(normalized)}`;
}

/** Deep link / Expo URL for QR codes, share sheet, and clipboard. */
export function buildAppJoinUrl(code: string): string {
  const normalized = normalizeJoinCode(code);
  return Linking.createURL("/tournaments/join", {
    queryParams: { code: normalized },
  });
}

/** @deprecated Use {@link buildAppJoinUrl} in the native app. */
export function buildWebJoinUrl(code: string): string {
  const normalized = normalizeJoinCode(code);
  return `${getWebOrigin()}/tournaments/join?code=${encodeURIComponent(normalized)}`;
}

/** Primary invite URL for the native app (opens TTPro directly). */
export function buildShareJoinUrl(code: string): string {
  return buildAppJoinUrl(code);
}

export function buildShareMessage(options: {
  tournamentName: string;
  joinCode: string;
}): string {
  const { tournamentName, joinCode } = options;
  const normalized = normalizeJoinCode(joinCode);
  const link = buildShareJoinUrl(normalized);

  return [
    `Join "${tournamentName}" on TTPro`,
    "",
    `Open in the app: ${link}`,
    `Join code: ${normalized}`,
  ].join("\n");
}

/** Custom scheme URL (stable for QR when not using Expo dev URLs). */
export function buildCustomSchemeJoinUrl(code: string): string {
  const normalized = normalizeJoinCode(code);
  return `${APP_SCHEME}://tournaments/join?code=${encodeURIComponent(normalized)}`;
}
