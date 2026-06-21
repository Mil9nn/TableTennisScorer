import * as Linking from "expo-linking";
import {
  isValidJoinCode,
  normalizeJoinCode,
  parseJoinCodeFromUrl,
} from "@/lib/tournaments/joinLinks";

export { isValidJoinCode, normalizeJoinCode, parseJoinCodeFromUrl };

const APP_SCHEME = "tabletennisscorer";

export function buildAppJoinPath(code: string): string {
  const normalized = normalizeJoinCode(code);
  return `/team/join?code=${encodeURIComponent(normalized)}`;
}

export function buildAppJoinUrl(code: string): string {
  const normalized = normalizeJoinCode(code);
  return Linking.createURL("/team/join", {
    queryParams: { code: normalized },
  });
}

export function buildShareJoinUrl(code: string): string {
  return buildAppJoinUrl(code);
}

export function buildShareMessage(options: {
  teamName: string;
  joinCode: string;
}): string {
  const { teamName, joinCode } = options;
  const normalized = normalizeJoinCode(joinCode);
  const link = buildShareJoinUrl(normalized);

  return [
    `Join "${teamName}" on TTPro`,
    "",
    `Open in the app: ${link}`,
    `Join code: ${normalized}`,
  ].join("\n");
}

export function buildCustomSchemeJoinUrl(code: string): string {
  const normalized = normalizeJoinCode(code);
  return `${APP_SCHEME}://team/join?code=${encodeURIComponent(normalized)}`;
}
