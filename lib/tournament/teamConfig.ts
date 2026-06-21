export type TeamSubMatchType = "singles" | "doubles";

export interface TeamCustomSubMatchConfig {
  matchNumber: number;
  matchType: TeamSubMatchType;
}

export const DEFAULT_CUSTOM_SUB_MATCHES: TeamCustomSubMatchConfig[] = [
  { matchNumber: 1, matchType: "singles" },
  { matchNumber: 2, matchType: "singles" },
  { matchNumber: 3, matchType: "singles" },
  { matchNumber: 4, matchType: "singles" },
  { matchNumber: 5, matchType: "singles" },
];

export function formatTeamMatchFormatLabel(matchFormat?: string): string {
  switch (matchFormat) {
    case "five_singles":
      return "5 singles (Swaythling)";
    case "single_double_single":
      return "Single–double–single";
    case "custom":
      return "Custom";
    default:
      return matchFormat?.replace(/_/g, " ") || "N/A";
  }
}

export function formatCustomRubbersSummary(
  customSubMatches?: TeamCustomSubMatchConfig[]
): string {
  if (!customSubMatches?.length) return "Not configured";
  const singles = customSubMatches.filter((m) => m.matchType === "singles").length;
  const doubles = customSubMatches.filter((m) => m.matchType === "doubles").length;
  const parts: string[] = [];
  if (singles) parts.push(`${singles} singles`);
  if (doubles) parts.push(`${doubles} doubles`);
  return `${customSubMatches.length} rubbers (${parts.join(", ")})`;
}
