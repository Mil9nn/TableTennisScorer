import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import {
  navigateBackToMatches,
  navigateBackToTournament,
} from "@/lib/match/tournamentNavigation";

/** True when scoring UI should treat the match as finished (ignores stale local status). */
export function isActiveScoringComplete(
  match: { status?: string },
  localStatus: string,
): boolean {
  if (match.status === "completed") return true;
  if (match.status === "scheduled") return false;
  return localStatus === "completed";
}

function resolveTournamentId(tournament: unknown): string | undefined {
  if (!tournament) return undefined;
  if (typeof tournament === "string") return tournament;
  if (typeof tournament === "object") {
    const value = tournament as { _id?: unknown; id?: unknown };
    const id = value._id ?? value.id;
    if (id != null) return String(id);
  }
  return undefined;
}

/**
 * After a match is completed on the score screen, navigate away:
 * - Tournament match → tournament schedule (or returnTo)
 * - Friendly match → matches tab
 *
 * Uses persisted match status only — not local scoring-store status, which can
 * stay "completed" from the previous match until setInitialMatch runs.
 */
export function useTournamentMatchCompletionRedirect(
  match: { _id?: string; status?: string; tournament?: unknown } | null | undefined,
): void {
  const router = useRouter();
  const { id: routeMatchIdParam, returnTo, returnTab } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
    returnTab?: string | string[];
  }>();
  const routeMatchId = normalizeMatchIdParam(routeMatchIdParam);
  const redirectedRef = useRef(false);

  useEffect(() => {
    redirectedRef.current = false;
  }, [routeMatchId]);

  useEffect(() => {
    if (redirectedRef.current || !match?._id) return;
    if (match.status !== "completed") return;

    const storeMatchId = normalizeMatchIdParam(match._id);
    if (routeMatchId && storeMatchId && routeMatchId !== storeMatchId) {
      return;
    }

    redirectedRef.current = true;

    const tournamentId = resolveTournamentId(match.tournament);
    const hasReturnTo =
      (typeof returnTo === "string" && returnTo.trim().length > 0) ||
      (Array.isArray(returnTo) && returnTo[0]?.trim().length > 0);

    if (tournamentId || hasReturnTo) {
      const tab = Array.isArray(returnTab) ? returnTab[0] : returnTab;
      navigateBackToTournament(router, {
        returnTo,
        tournamentId,
        tab: tab ?? "schedule",
      });
      return;
    }

    navigateBackToMatches(router);
  }, [match?._id, match?.status, match?.tournament, routeMatchId, returnTab, returnTo, router]);
}
