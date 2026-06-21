import type { Router } from "expo-router";

export function buildTournamentReturnTo(
  tournamentId: string,
  tab: string = "schedule",
): string {
  return `/tournaments/${tournamentId}?tab=${tab}`;
}

export function buildTournamentMatchHref(options: {
  matchId: string;
  category: "individual" | "team";
  tournamentId: string;
  returnTab?: string;
}): { pathname: "/match/[id]"; params: Record<string, string> } {
  const returnTab = options.returnTab ?? "schedule";
  const returnTo = encodeURIComponent(
    buildTournamentReturnTo(options.tournamentId, returnTab),
  );

  return {
    pathname: "/match/[id]",
    params: {
      id: options.matchId,
      category: options.category,
      returnTab,
      returnTo,
    },
  };
}

export function navigateToTournamentMatch(
  router: Router,
  options: {
    matchId: string;
    category: "individual" | "team";
    tournamentId: string;
    returnTab?: string;
  },
): void {
  router.push(buildTournamentMatchHref(options) as any);
}

function navigateToRoute(router: Router, target: string): void {
  if (typeof (router as any).dismissTo === "function") {
    (router as any).dismissTo(target);
    return;
  }

  router.replace(target as any);
}

export function navigateBackToMatches(router: Router): void {
  navigateToRoute(router, "/matches");
}

export function navigateBackToTournament(
  router: Router,
  options?: {
    returnTo?: string | string[];
    tournamentId?: string;
    tab?: string;
  },
): void {
  const rawReturnTo = Array.isArray(options?.returnTo)
    ? options?.returnTo[0]
    : options?.returnTo;

  let target = "/matches";
  if (typeof rawReturnTo === "string" && rawReturnTo.trim()) {
    target = decodeURIComponent(rawReturnTo);
  } else if (options?.tournamentId) {
    target = buildTournamentReturnTo(
      options.tournamentId,
      options.tab ?? "schedule",
    );
  }

  navigateToRoute(router, target);
}
